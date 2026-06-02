'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AI_TOOLS } from '@/lib/ai/claude';
import { buildSystemPrompt, AI_PERSONALITIES } from '@/lib/ai/personalities';
import { fmt } from '@/lib/utils';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import type { AIPersonality } from '@/types';

interface ChatMsg  { role:'user'|'ai'; text:string; time:string; }
type ApiMsg = { role:string; content:unknown };

const SUGGESTIONS = [
  '💰 Hoeveel gaf ik uit deze maand?',
  '📊 Geef me een financieel overzicht',
  '✈️ Zoek vlucht naar Yerevan',
  '🌤️ Wat is het weer in Amsterdam?',
  '🛒 Zoek goedkoopste olijfolie prijs',
  '₿ Hoe staat mijn crypto portfolio?',
  '📊 Ga naar schulden pagina',
];

/* Extra tools voor navigatie en nieuwe API's */
const EXTRA_TOOLS = [
  {
    name:'navigate_to', description:'Navigeer naar een pagina in de app',
    input_schema:{ type:'object', properties:{ pagina:{ type:'string', enum:['home','transacties','rekeningen','begroting','schulden','doelen','zakelijk','jaaroverzicht','import','crypto','reizen','prijsradar','locatie','instellingen'] }, reden:{ type:'string' } }, required:['pagina'] },
  },
  {
    name:'zoek_product', description:'Zoek de beste prijs voor een product via Google Shopping',
    input_schema:{ type:'object', properties:{ product:{ type:'string' } }, required:['product'] },
  },
  {
    name:'get_weer', description:'Haal het weer op voor een stad',
    input_schema:{ type:'object', properties:{ stad:{ type:'string' } }, required:['stad'] },
  },
  {
    name:'zoek_vlucht', description:'Zoek vluchten van A naar B en geef links',
    input_schema:{ type:'object', properties:{ van:{ type:'string' }, naar:{ type:'string' }, datum:{ type:'string' } }, required:['van','naar'] },
  },
  {
    name:'get_crypto', description:'Haal mijn Bitvavo crypto portfolio op',
    input_schema:{ type:'object', properties:{} },
  },
];

export default function AIChatbot({ naam = '' }: { naam?: string }) {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<ChatMsg[]>([]);
  const [history, setHistory] = useState<ApiMsg[]>([]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [unread, setUnread]   = useState(0);
  const [persoonlijkheid]     = useState<AIPersonality>('vriend');
  const endRef    = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const sb        = createClient();
  const router    = useRouter();
  const personality = AI_PERSONALITIES[persoonlijkheid];

  /* scroll naar beneden */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);

  /* laad laatste 10 berichten uit Supabase bij openen */
  useEffect(() => {
    if (!open) return;
    setUnread(0);
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setMsgs([{ role:'ai', text:`Hoi${naam ? ` ${naam}` : ''}! 👋 Ik ben Family AI. Stel me een vraag over je financiën.`, time:now() }]);
        return;
      }
      const { data } = await sb.from('ai_gesprekken').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10);
      if (!data || data.length===0) {
        setMsgs([{ role:'ai', text:`Hoi${naam ? ` ${naam}` : ''}! 👋 Ik ben Family AI. Ik herinner me al onze gesprekken. Wat wil je weten?`, time:now() }]);
        return;
      }
      const sorted = [...data].reverse();
      const loaded: ChatMsg[] = sorted.map(r=>({ role:r.rol==='user'?'user':'ai', text:r.bericht, time:new Date(r.created_at).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}) }));
      const histLoaded: ApiMsg[] = sorted.map(r=>({ role:r.rol==='user'?'user':'assistant', content:r.bericht }));
      setMsgs(loaded);
      setHistory(histLoaded);
    })();
  }, [open]);

  function now() { return new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}); }

  function addMsg(role:'user'|'ai', text:string) {
    setMsgs(prev=>[...prev,{ role, text, time:now() }]);
    if (role==='ai' && !open) setUnread(u=>u+1);
  }

  async function runTool(name:string, input:Record<string,unknown>):Promise<unknown> {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { error:'Niet ingelogd' };
    const n=new Date(); const m=input.month!==undefined?(input.month as number)-1:n.getMonth(); const y=(input.year as number)||n.getFullYear();

    if (name==='get_transactions') {
      const { data } = await sb.from('transactions').select('*').eq('user_id',user.id).order('date',{ascending:false}).limit((input.limit as number)||30);
      return { transactions:data?.map(t=>({date:t.date,amount:t.amount,type:t.type,description:t.description,category:t.category})), count:data?.length||0 };
    }
    if (name==='add_transaction') {
      const amount=input.amount as number;
      const { data } = await sb.from('transactions').insert({ user_id:user.id, amount:Math.abs(amount), type:amount>0?'income':'expense', description:input.description as string, category:input.category as string, date:(input.date as string)||n.toISOString().split('T')[0], source:'AI', status:'OK', is_zakelijk:(input.is_zakelijk as boolean)||false, type_soort:amount>0?'Inkomst':'Uitgave' }).select().single();
      return { success:true, transaction:data };
    }
    if (name==='get_budget_status') {
      const [{ data:txD },{ data:bD }] = await Promise.all([sb.from('transactions').select('*').eq('user_id',user.id), sb.from('budgets').select('*').eq('user_id',user.id)]);
      const mTx=(txD||[]).filter((t:Record<string,unknown>)=>{ const d=new Date(t.date as string); return d.getMonth()===m&&d.getFullYear()===y&&t.type==='expense'; });
      return (bD||[]).map((b:Record<string,unknown>)=>{ const sp=mTx.filter((t:Record<string,unknown>)=>t.category===b.category).reduce((s:number,t:Record<string,unknown>)=>s+(t.amount as number),0); return {categorie:b.category,budget:b.monthly_limit,besteed:sp,resterend:(b.monthly_limit as number)-sp,procent:Math.round((sp/(b.monthly_limit as number))*100)}; });
    }
    if (name==='get_summary') {
      const { data:txD } = await sb.from('transactions').select('*').eq('user_id',user.id);
      const mTx=(txD||[]).filter((t:Record<string,unknown>)=>{ const d=new Date(t.date as string); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); });
      const inc=mTx.filter((t:Record<string,unknown>)=>t.type==='income').reduce((s:number,t:Record<string,unknown>)=>s+(t.amount as number),0);
      const exp=mTx.filter((t:Record<string,unknown>)=>t.type==='expense').reduce((s:number,t:Record<string,unknown>)=>s+(t.amount as number),0);
      const byCat:Record<string,number>={};
      mTx.filter((t:Record<string,unknown>)=>t.type==='expense').forEach((t:Record<string,unknown>)=>{ const cat=t.category as string; byCat[cat]=(byCat[cat]||0)+(t.amount as number); });
      return { maand:n.toLocaleString('nl-NL',{month:'long',year:'numeric'}), inkomsten:fmt(inc), uitgaven:fmt(exp), netto:fmt(inc-exp), per_categorie:byCat, aantal:mTx.length };
    }
    /* ── Nieuwe tools ─────────────────────────── */
    if (name==='navigate_to') {
      const pagina = input.pagina as string;
      setTimeout(()=>{ router.push('/'+pagina); setOpen(false); }, 800);
      return { success:true, actie:`Navigeren naar /${pagina}` };
    }
    if (name==='zoek_product') {
      const resp = await fetch('/api/zoek-prijs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ product: input.product }) });
      const data = await resp.json();
      return data.error ? { error:data.error } : { resultaten: data.resultaten?.slice(0,3) };
    }
    if (name==='get_weer') {
      const resp = await fetch('/api/weer', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ stad: input.stad }) });
      const data = await resp.json();
      return data.error ? { error:data.error } : { stad:data.stad, temp:data.temp, beschrijving:data.beschrijving };
    }
    if (name==='zoek_vlucht') {
      const { van, naar, datum } = input as { van:string; naar:string; datum?:string };
      const d = datum ?? new Date(Date.now()+7*864e5).toISOString().split('T')[0];
      const googleUrl = `https://www.google.com/flights?hl=nl#flt=${encodeURIComponent(van)}.${encodeURIComponent(naar)}.${d};c:EUR;e:1;sd:1;t:f`;
      const kiwiUrl   = `https://www.kiwi.com/nl/search/results/${encodeURIComponent(van)}/${encodeURIComponent(naar)}/${d}/no-return`;
      return { google_flights:googleUrl, kiwi:kiwiUrl, boodschap:`Vluchten van ${van} naar ${naar} op ${d}` };
    }
    if (name==='get_crypto') {
      const resp = await fetch('/api/bitvavo');
      const data = await resp.json();
      return data.error ? { error:data.error } : { totaal:data.totaal, top3:data.coins?.slice(0,3) };
    }
    return { error:'Onbekende tool: '+name };
  }

  /* ── Server-side API call (ANTHROPIC_API_KEY staat in Netlify env) ── */
  async function callServer(messages: ApiMsg[], system: string): Promise<Record<string,unknown>> {
    const allTools = [...AI_TOOLS, ...EXTRA_TOOLS];
    const resp = await fetch('/api/ai-chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages, tools: allTools, system }),
    });
    if (!resp.ok) throw new Error(`AI API fout: ${resp.status}`);
    return resp.json();
  }

  async function processAI(apiMsgs:ApiMsg[]) {
    const ctx = { totaalSaldo:0, inkomsten:0, uitgaven:0, schulden:0, netto:0 };
    const sys = buildSystemPrompt(naam, persoonlijkheid, ctx);

    let resp = await callServer(apiMsgs, sys);
    let msgs2 = [...apiMsgs];

    /* Tool-use loop */
    while(resp?.stop_reason === 'tool_use') {
      const tu = (resp.content as Record<string,unknown>[])
        ?.find((c) => c.type === 'tool_use') as Record<string,unknown>;
      if (!tu) break;
      const result = await runTool(tu.name as string, tu.input as Record<string,unknown>);
      msgs2 = [
        ...msgs2,
        { role:'assistant', content: resp.content },
        { role:'user', content: [{ type:'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) }] },
      ];
      setHistory(msgs2);
      resp = await callServer(msgs2, sys);
    }

    const textItem = (resp.content as Record<string,unknown>[])?.find(c => c.type === 'text');
    const text = (textItem?.text as string) || 'Geen antwoord ontvangen.';
    setHistory(h => [...h, { role:'assistant', content: text }]);
    addMsg('ai', text);

    /* Sla gesprek op in Supabase */
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from('ai_gesprekken').insert([
        { user_id:user.id, rol:'user',      bericht: apiMsgs[apiMsgs.length-1].content as string, pagina: window.location.pathname },
        { user_id:user.id, rol:'assistant', bericht: text, pagina: window.location.pathname },
      ]);
    }
  }

  async function sendMessage(text:string) {
    if (!text.trim()||typing) return;
    setInput('');
    addMsg('user',text);
    setTyping(true);
    const newHist:ApiMsg[]=[...history,{role:'user',content:text}];
    setHistory(newHist);
    try { await processAI(newHist); } catch(e:unknown) { addMsg('ai','Er ging iets mis: '+(e instanceof Error?e.message:'Onbekende fout')); }
    setTyping(false);
  }

  return (
    <>
      {/* Zwevende knop */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:50 }}>
        {/* Pulse ring */}
        <div style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'rgba(1,121,254,.3)', animation:'pulse-ring 2s ease infinite' }}/>
        <button onClick={()=>setOpen(o=>!o)} style={{
          position:'relative', width:56, height:56, borderRadius:'50%',
          background:'linear-gradient(135deg,#0179FE,#4893FF)',
          border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(1,121,254,.45)',
          transition:'transform .2s',
        }}
          onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.1)')}
          onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
          title="Family AI">
          {open ? <X size={22} color="white"/> : <Bot size={24} color="white"/>}
        </button>
        {unread>0 && !open && (
          <div style={{ position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%', background:'#EF4444', color:'white', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{unread}</div>
        )}
      </div>

      {/* Chat venster */}
      {open && (
        <div style={{
          position:'fixed', bottom:92, right:24, zIndex:50,
          width:380, height:520, background:'white',
          borderRadius:20, overflow:'hidden',
          boxShadow:'0 20px 60px rgba(0,0,0,.2)',
          display:'flex', flexDirection:'column',
          animation:'chatSlideIn .25s cubic-bezier(.34,1.56,.64,1)',
        }}>
          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#0179FE,#4893FF)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bot size={20} color="white"/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:700, color:'white' }}>Family AI</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.8)' }}>
                {personality.emoji} {personality.naam} · <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', display:'inline-block' }}/> Online</span>
              </p>
            </div>
            <button onClick={()=>setOpen(false)} style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:8, padding:'4px 8px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
              <ChevronDown size={14}/> Minimaliseer
            </button>
          </div>

          {/* Berichten */}
          <div className="no-scrollbar" style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            {msgs.map((m,i)=>(
              <div key={i} style={{ display:'flex', gap:8, flexDirection:m.role==='user'?'row-reverse':'row', alignItems:'flex-end' }}>
                {m.role==='ai' && (
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#0179FE,#4893FF)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bot size={13} color="white"/>
                  </div>
                )}
                <div style={{ maxWidth:'82%' }}>
                  <div style={{
                    padding:'10px 13px', fontSize:13, lineHeight:1.5,
                    borderRadius: m.role==='ai'?'4px 14px 14px 14px':'14px 4px 14px 14px',
                    background: m.role==='user'?'linear-gradient(135deg,#0179FE,#4893FF)':'#F3F4F6',
                    color: m.role==='user'?'white':'#1A1F36',
                  }}>
                    {m.text.split('\n').map((line,j)=><span key={j}>{line}{j<m.text.split('\n').length-1&&<br/>}</span>)}
                  </div>
                  <p style={{ fontSize:10, color:'#9CA3AF', marginTop:3, textAlign:m.role==='user'?'right':'left' }}>{m.time}</p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#0179FE,#4893FF)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Bot size={13} color="white"/>
                </div>
                <div style={{ background:'#F3F4F6', borderRadius:'4px 14px 14px 14px', padding:'10px 14px', display:'flex', gap:5, alignItems:'center' }}>
                  {[0,1,2].map(i=>(<div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#9CA3AF', animation:`typingBounce 1.2s infinite ${i*.2}s` }}/>))}
                </div>
              </div>
            )}

            <div ref={endRef}/>
          </div>

          {/* Suggestie chips */}
          {msgs.length===0 && (
            <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6 }}>
              {SUGGESTIONS.map(s=>(
                <button key={s} onClick={()=>sendMessage(s)} style={{ fontSize:12, padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:20, background:'white', cursor:'pointer', color:'#374151', transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#0179FE';e.currentTarget.style.color='#0179FE';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#374151';}}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input balk */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid #F3F4F6', display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);} }}
              placeholder="Stel een vraag... (Enter = verstuur)"
              rows={1}
              style={{ flex:1, border:'1.5px solid #E5E7EB', borderRadius:12, padding:'10px 14px', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', maxHeight:80, transition:'border-color .2s' }}
              onFocus={e=>(e.target.style.borderColor='#0179FE')}
              onBlur={e=>(e.target.style.borderColor='#E5E7EB')}
            />
            <button onClick={()=>sendMessage(input)} disabled={!input.trim()||typing} style={{
              width:40, height:40, borderRadius:12, flexShrink:0, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#0179FE,#4893FF)', color:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              opacity:!input.trim()||typing?.6:1, transition:'opacity .2s',
            }}>
              <Send size={16}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
