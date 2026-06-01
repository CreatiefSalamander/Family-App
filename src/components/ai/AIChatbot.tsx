'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { callClaude, AI_TOOLS } from '@/lib/ai/claude';
import { buildSystemPrompt, AI_PERSONALITIES } from '@/lib/ai/personalities';
import { fmt } from '@/lib/utils';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import type { AIPersonality } from '@/types';

interface ChatMsg { role: 'user' | 'ai'; text: string; time: string; }
type ApiMsg = { role: string; content: unknown };

const SUGGESTIONS = [
  'Hoeveel gaf ik uit deze maand?',
  'Hoe staat mijn budget?',
  'Voeg €50 boodschappen toe',
  'Geef me een financieel overzicht',
];

export default function AIChatbot({ naam = 'Abdul' }: { naam?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{
    role: 'ai',
    text: `Hoi ${naam}! 👋 Ik ben Family AI. Ik kan je helpen met je uitgaven analyseren, transacties toevoegen en je budget bewaken. Wat kan ik voor je doen?`,
    time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [history, setHistory] = useState<ApiMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [persoonlijkheid] = useState<AIPersonality>('vriend');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sb = createClient();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  function addMsg(role: 'user' | 'ai', text: string) {
    const time = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    setMsgs(prev => [...prev, { role, text, time }]);
  }

  async function runTool(name: string, toolInput: Record<string, unknown>): Promise<unknown> {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { error: 'Niet ingelogd' };

    const now = new Date();
    const m = toolInput.month !== undefined ? (toolInput.month as number) - 1 : now.getMonth();
    const y = (toolInput.year as number) || now.getFullYear();

    if (name === 'get_transactions') {
      const { data } = await sb.from('transactions').select('*').eq('user_id', user.id)
        .order('date', { ascending: false }).limit((toolInput.limit as number) || 30);
      return { transactions: data?.map(t => ({ date: t.date, amount: t.amount, type: t.type, description: t.description, category: t.category })), count: data?.length || 0 };
    }

    if (name === 'add_transaction') {
      const amount = toolInput.amount as number;
      const tx = {
        user_id: user.id,
        amount: Math.abs(amount),
        type: amount > 0 ? 'income' : 'expense',
        description: toolInput.description as string,
        category: toolInput.category as string,
        date: (toolInput.date as string) || now.toISOString().split('T')[0],
        source: 'AI',
        status: 'OK',
        is_zakelijk: (toolInput.is_zakelijk as boolean) || false,
      };
      const { data } = await sb.from('transactions').insert(tx).select().single();
      return { success: true, transaction: data };
    }

    if (name === 'get_budget_status') {
      const [{ data: txData }, { data: budData }] = await Promise.all([
        sb.from('transactions').select('*').eq('user_id', user.id),
        sb.from('budgets').select('*').eq('user_id', user.id),
      ]);
      const mTx = (txData || []).filter((t: Record<string, unknown>) => {
        const d = new Date(t.date as string);
        return d.getMonth() === m && d.getFullYear() === y && t.type === 'expense';
      });
      return (budData || []).map((b: Record<string, unknown>) => {
        const sp = mTx.filter((t: Record<string, unknown>) => t.category === b.category)
          .reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0);
        return { categorie: b.category, budget: b.monthly_limit, besteed: sp, resterend: (b.monthly_limit as number) - sp, procent: Math.round((sp / (b.monthly_limit as number)) * 100) };
      });
    }

    if (name === 'get_summary') {
      const { data: txData } = await sb.from('transactions').select('*').eq('user_id', user.id);
      const mTx = (txData || []).filter((t: Record<string, unknown>) => {
        const d = new Date(t.date as string);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const inc = mTx.filter((t: Record<string, unknown>) => t.type === 'income').reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0);
      const exp = mTx.filter((t: Record<string, unknown>) => t.type === 'expense').reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0);
      const byCat: Record<string, number> = {};
      mTx.filter((t: Record<string, unknown>) => t.type === 'expense').forEach((t: Record<string, unknown>) => {
        const cat = t.category as string;
        byCat[cat] = (byCat[cat] || 0) + (t.amount as number);
      });
      return { maand: now.toLocaleString('nl-NL', { month: 'long', year: 'numeric' }), inkomsten: fmt(inc), uitgaven: fmt(exp), netto: fmt(inc - exp), per_categorie: byCat, aantal: mTx.length };
    }

    return { error: 'Onbekende tool: ' + name };
  }

  async function processAI(apiMsgs: ApiMsg[]) {
    const k = localStorage.getItem('claude_api_key');
    if (!k) {
      addMsg('ai', 'Stel eerst een Claude API key in via Instellingen → Claude AI.');
      return;
    }

    const ctx = { totaalSaldo: 0, inkomsten: 0, uitgaven: 0, schulden: 0, netto: 0 };
    const sysPrompt = buildSystemPrompt(naam, persoonlijkheid, ctx);

    let resp = await callClaude(k, sysPrompt, apiMsgs as Parameters<typeof callClaude>[2], AI_TOOLS);
    let msgs2 = [...apiMsgs];

    while (resp?.stop_reason === 'tool_use') {
      const tu = resp.content?.find((c: Record<string, unknown>) => c.type === 'tool_use') as Record<string, unknown>;
      if (!tu) break;
      const result = await runTool(tu.name as string, tu.input as Record<string, unknown>);
      msgs2 = [
        ...msgs2,
        { role: 'assistant', content: resp.content },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) }] },
      ];
      setHistory(msgs2);
      resp = await callClaude(k, sysPrompt, msgs2 as Parameters<typeof callClaude>[2], AI_TOOLS);
    }

    const text = resp?.content?.find((c: Record<string, unknown>) => c.type === 'text')?.text as string || 'Geen antwoord ontvangen.';
    setHistory(h => [...h, { role: 'assistant', content: text }]);
    addMsg('ai', text);

    // Sla op in Supabase
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from('ai_gesprekken').insert([
        { user_id: user.id, rol: 'user', bericht: apiMsgs[apiMsgs.length - 1].content as string, pagina: window.location.pathname },
        { user_id: user.id, rol: 'assistant', bericht: text, pagina: window.location.pathname },
      ]);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || typing) return;
    setInput('');
    addMsg('user', text);
    setTyping(true);
    const newHistory: ApiMsg[] = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    try {
      await processAI(newHistory);
    } catch (e: unknown) {
      addMsg('ai', 'Er ging iets mis: ' + (e instanceof Error ? e.message : 'Onbekende fout'));
    }
    setTyping(false);
  }

  const personality = AI_PERSONALITIES[persoonlijkheid];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#0179FE,#4893FF)', boxShadow: '0 4px 20px rgba(1,121,254,.45)', animation: 'aiPulse 2.5s ease-in-out infinite' }}
        title="Family AI"
      >
        {open ? <X size={22} className="text-white" /> : <Bot size={24} className="text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden"
          style={{ width: 380, height: 520, boxShadow: '0 20px 60px rgba(0,0,0,.15)', animation: 'chatSlideIn .2s ease' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-white">
            <div className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Family AI</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                {personality.emoji} {personality.naam}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full gradient-blue flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div className="max-w-[82%]">
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user'
                      ? 'gradient-blue text-white'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                    style={{ borderRadius: m.role === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px' }}
                  >
                    {m.text.split('\n').map((line, j) => <span key={j}>{line}{j < m.text.split('\n').length - 1 && <br />}</span>)}
                  </div>
                  <p className={`text-[10px] text-gray-300 mt-1 ${m.role === 'user' ? 'text-right' : ''}`}>{m.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full gradient-blue flex-shrink-0 flex items-center justify-center">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                      style={{ animation: `typingBounce 1.2s infinite ${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions (first time only) */}
          {msgs.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:border-[#0179FE] hover:text-[#0179FE] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-100">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Stel een vraag..."
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2 text-sm resize-none focus:outline-none focus:border-[#0179FE] transition-colors"
              style={{ maxHeight: 80 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="w-10 h-10 rounded-xl gradient-blue text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:opacity-90 transition-all active:scale-95"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aiPulse { 0%,100% { box-shadow:0 4px 20px rgba(1,121,254,.45); } 50% { box-shadow:0 4px 30px rgba(1,121,254,.7); } }
        @keyframes chatSlideIn { from { opacity:0; transform:translateY(10px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes typingBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
      `}</style>
    </>
  );
}
