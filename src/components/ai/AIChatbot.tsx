'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { callClaude, AI_TOOLS } from '@/lib/ai/claude';
import { buildSystemPrompt } from '@/lib/ai/personalities';
import { fmt } from '@/lib/utils';
import { Bot, X, Send } from 'lucide-react';
import type { AIPersonality } from '@/types';

interface Msg { role: 'user'|'assistant'|'tool'; content: unknown; tool_use_id?: string; }

const SUGGESTIONS = ['Hoeveel gaf ik uit deze maand?','Analyseer mijn uitgaven','Voeg €50 boodschappen toe vandaag','Hoe sta ik er financieel voor?'];

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role:'user'|'ai'; text:string; time:string }[]>([
    { role:'ai', text:'Hoi! Ik ben Family AI. Hoe kan ik je helpen?', time: new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}) }
  ]);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sb = createClient();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);

  function addMsg(role: 'user'|'ai', text: string) {
    const time = new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
    setMsgs(prev => [...prev, { role, text, time }]);
  }

  async function runTool(name: string, input: Record<string,unknown>) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { error: 'Niet ingelogd' };
    const now = new Date();
    const m = (input.month as number ?? now.getMonth()+1) - 1;
    const y = (input.year as number) || now.getFullYear();

    if (name === 'get_transactions') {
      let q = sb.from('transactions').select('*').eq('user_id', user.id);
      const { data } = await q.order('date',{ascending:false}).limit((input.limit as number)||20);
      return { transactions: data?.map(t => ({date:t.date,amount:t.amount,type:t.type,description:t.description,category:t.category})), count:data?.length };
    }
    if (name === 'add_transaction') {
      const tx = { user_id: user.id, amount:input.amount, type:(input.amount as number)>0?'income':'expense', description:input.description, category:input.category, date:(input.date as string)||now.toISOString().split('T')[0], source:'AI', status:'OK', is_zakelijk:input.is_zakelijk||false };
      const { data } = await sb.from('transactions').insert(tx).select().single();
      return { success: true, transaction: data };
    }
    if (name === 'get_budget_status') {
      const [{ data: tx }, { data: bud }] = await Promise.all([
        sb.from('transactions').select('*').eq('user_id', user.id),
        sb.from('budgets').select('*').eq('user_id', user.id),
      ]);
      const mTx = (tx||[]).filter((t:Record<string,unknown>) => { const d=new Date(t.date as string); return d.getMonth()===m&&d.getFullYear()===y&&t.type==='expense'; });
      return (bud||[]).map((b:Record<string,unknown>) => {
        const sp = mTx.filter((t:Record<string,unknown>)=>t.category===b.category).reduce((s:number,t:Record<string,unknown>)=>s+(t.amount as number),0);
        return { category:b.category, budget:b.monthly_limit, spent:sp, remaining:(b.monthly_limit as number)-sp };
      });
    }
    if (name === 'get_summary') {
      const { data: tx } = await sb.from('transactions').select('*').eq('user_id', user.id);
      const mTx = (tx||[]).filter((t:Record<string,unknown>) => { const d=new Date(t.date as string); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
      const inc = mTx.filter((t:Record<string,unknown>)=>t.type==='income').reduce((s:number,t:Record<string,unknown>)=>s+(t.amount as number),0);
      const exp = mTx.filter((t:Record<string,unknown>)=>t.type==='expense').reduce((s:number,t:Record<string,unknown>)=>s+(t.amount as number),0);
      return { month:now.toLocaleString('nl-NL',{month:'long',year:'numeric'}), income:inc, expenses:exp, net:inc-exp, count:mTx.length };
    }
    return { error: 'Onbekende tool' };
  }

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setInput('');
    addMsg('user', text);
    setTyping(true);

    const k = localStorage.getItem('claude_api_key');
    if (!k) { setTyping(false); addMsg('ai', 'Stel eerst een Claude API key in via Instellingen → Claude AI.'); return; }

    const newHistory: Msg[] = [...history, { role:'user', content:text }];
    setHistory(newHistory);

    try {
      let msgs = [...newHistory];
      let resp = await callClaude(k, buildSystemPrompt('Abdul','vriend',{totaalSaldo:0,inkomsten:0,uitgaven:0,schulden:0,netto:0}), msgs as Parameters<typeof callClaude>[2]);

      while (resp.stop_reason === 'tool_use') {
        const tu = resp.content.find((c:Record<string,unknown>) => c.type==='tool_use');
        if (!tu) break;
        const result = await runTool(tu.name as string, tu.input as Record<string,unknown>);
        msgs = [...msgs, {role:'assistant',content:resp.content}, {role:'user',content:[{type:'tool_result',tool_use_id:tu.id,content:JSON.stringify(result)}]}];
        setHistory(msgs);
        resp = await callClaude(k, buildSystemPrompt('Abdul','vriend',{totaalSaldo:0,inkomsten:0,uitgaven:0,schulden:0,netto:0}), msgs as Parameters<typeof callClaude>[2]);
      }

      const text2 = resp.content?.find((c:Record<string,unknown>)=>c.type==='text')?.text as string || 'Geen antwoord';
      setHistory(h => [...h, {role:'assistant',content:text2}]);
      addMsg('ai', text2);
    } catch(e: unknown) {
      addMsg('ai', 'Fout: ' + (e instanceof Error ? e.message : 'Onbekend'));
    }
    setTyping(false);
  }

  return (
    <>
      <button onClick={()=>setOpen(o=>!o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-blue text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        style={{animation:'pulse 2s infinite', boxShadow:'0 4px 20px rgba(1,121,254,.5)'}}>
        <Bot size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{animation:'scaleIn .2s ease'}}>
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center"><Bot size={16} className="text-white"/></div>
            <div><p className="text-sm font-bold">Family AI</p><p className="text-xs text-green-500">● Online</p></div>
            <button onClick={()=>setOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m,i) => (
              <div key={i} className={\`flex gap-2 \${m.role==='user'?'flex-row-reverse':''}\`}>
                {m.role==='ai' && <div className="w-7 h-7 rounded-full gradient-blue flex-shrink-0 flex items-center justify-center"><Bot size={14} className="text-white"/></div>}
                <div>
                  <div className={\`px-4 py-2.5 rounded-xl text-sm \${m.role==='user'?'gradient-blue text-white':'bg-gray-100 text-gray-800'}\`} style={{borderRadius: m.role==='ai'?'4px 12px 12px 12px':'12px 4px 12px 12px'}}>
                    {m.text}
                  </div>
                  <p className={\`text-xs text-gray-300 mt-1 \${m.role==='user'?'text-right':''}\`}>{m.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full gradient-blue flex-shrink-0 flex items-center justify-center"><Bot size={14} className="text-white"/></div>
                <div className="bg-gray-100 rounded-xl px-4 py-3 flex gap-1.5">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full" style={{animation:\`bounce 1.2s infinite \${i*.2}s\`}} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {msgs.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => <button key={s} onClick={()=>sendMessage(s)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">{s}</button>)}
            </div>
          )}

          <div className="flex gap-2 p-3 border-t border-gray-100">
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);}}}
              placeholder="Stel een vraag..." rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 max-h-24" />
            <button onClick={()=>sendMessage(input)} disabled={!input.trim()||typing}
              className="w-10 h-10 gradient-blue text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 hover:opacity-90 transition">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes pulse { 0%,100%{box-shadow:0 4px 20px rgba(1,121,254,.5)} 50%{box-shadow:0 4px 30px rgba(1,121,254,.8)} }
      `}</style>
    </>
  );
}
