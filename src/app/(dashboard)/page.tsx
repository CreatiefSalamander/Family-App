'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RightPanel from '@/components/layout/RightPanel';
import { fmt, fmtDate, getGreeting } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Activity, ArrowUpRight } from 'lucide-react';
import type { Transactie, Rekening, Budget, Schuld, Doel } from '@/types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const CAT_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  Boodschappen: { bg: '#EEF2FF', color: '#6366F1', emoji: '🛒' },
  Eten:         { bg: '#FFFBEB', color: '#F59E0B', emoji: '🍔' },
  Transport:    { bg: '#EFF6FF', color: '#3B82F6', emoji: '🚗' },
  Wonen:        { bg: '#F0FDF4', color: '#22C55E', emoji: '🏠' },
  Gezondheid:   { bg: '#FDF2F8', color: '#EC4899', emoji: '💊' },
  Salaris:      { bg: '#F0FDF4', color: '#059669', emoji: '💰' },
  Inkomen:      { bg: '#F0FDF4', color: '#059669', emoji: '💰' },
  Zakelijk:     { bg: '#EFF6FF', color: '#0179FE', emoji: '💼' },
  default:      { bg: '#F9FAFB', color: '#6B7280', emoji: '📄' },
};

export default function DashboardPage() {
  const [tx, setTx]   = useState<Transactie[]>([]);
  const [rek, setRek] = useState<Rekening[]>([]);
  const [bud, setBud] = useState<Budget[]>([]);
  const [sch, setSch] = useState<Schuld[]>([]);
  const [doel, setDoel] = useState<Doel[]>([]);
  const [naam, setNaam] = useState('Abdul');
  const [loading, setLoading] = useState(true);
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [{ data: t }, { data: r }, { data: b }, { data: s }, { data: d }, { data: p }] =
        await Promise.all([
          sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
          sb.from('accounts').select('*').eq('user_id', user.id),
          sb.from('budgets').select('*').eq('user_id', user.id),
          sb.from('schulden').select('*').eq('user_id', user.id),
          sb.from('goals').select('*').eq('user_id', user.id),
          sb.from('profielen').select('voornaam').eq('id', user.id).single(),
        ]);
      setTx((t || []) as unknown as Transactie[]);
      setRek((r || []) as unknown as Rekening[]);
      setBud((b || []) as unknown as Budget[]);
      setSch((s || []) as unknown as Schuld[]);
      setDoel((d || []) as unknown as Doel[]);
      if (p?.voornaam) setNaam(p.voornaam);
      setLoading(false);
    }
    load();
  }, []);

  const now = new Date();
  const mTx = tx.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = inc - exp;
  const bal = tx.reduce((s, t) => s + (t.type === 'income' ? 1 : -1) * t.amount, 0);
  const today = format(now, "EEEE d MMMM yyyy", { locale: nl });

  const kpis = [
    { label: 'Totaal saldo',      value: bal, icon: Wallet,       color: 'text-[#0179FE]', border: 'border-l-[#0179FE]', bg: '#EFF6FF' },
    { label: 'Inkomsten (maand)', value: inc, icon: TrendingUp,   color: 'text-green-600', border: 'border-l-green-500', bg: '#F0FDF4' },
    { label: 'Uitgaven (maand)',  value: exp, icon: TrendingDown, color: 'text-red-500',   border: 'border-l-red-400',   bg: '#FEF2F2' },
    { label: 'Netto (maand)',     value: net, icon: Activity,     color: net >= 0 ? 'text-green-600' : 'text-red-500', border: net >= 0 ? 'border-l-green-500' : 'border-l-red-400', bg: net >= 0 ? '#F0FDF4' : '#FEF2F2' },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {/* Topbar */}
          <div className="hidden md:flex items-center justify-between mb-7">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {getGreeting()}, {naam}
              </h1>
              <p className="text-gray-400 text-sm capitalize mt-0.5">{today}</p>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {kpis.map(({ label, value, icon: Icon, color, border, bg }) => (
              <div key={label} className={`card card-hover p-5 border-l-4 ${border} cursor-default`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={15} className={color} />
                  </div>
                </div>
                <p className={`font-mono text-xl font-bold ${color}`}>
                  {loading ? '—' : fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Recente transacties */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-base">Recente transacties</h2>
              <a href="/transacties" className="flex items-center gap-1 text-sm text-[#0179FE] font-medium hover:underline">
                Alles bekijken <ArrowUpRight size={14} />
              </a>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : tx.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">📊</p>
                <p className="font-semibold text-gray-600 mb-1">Nog geen transacties</p>
                <p className="text-sm text-gray-400">Ga naar Transacties om te beginnen</p>
              </div>
            ) : (
              <div>
                {tx.slice(0, 8).map(t => {
                  const style = CAT_STYLE[t.category] || CAT_STYLE.default;
                  return (
                    <div key={t.id} className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-xl cursor-pointer transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: style.bg }}>
                        {style.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{t.description}</p>
                        <p className="text-xs text-gray-400">{t.category} · {fmtDate(t.date)}</p>
                      </div>
                      <p className={`font-mono text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — desktop only */}
      <div className="hidden lg:block">
        <RightPanel rekeningen={rek} budgetten={bud} schulden={sch} doelen={doel} transacties={tx} />
      </div>
    </div>
  );
}
