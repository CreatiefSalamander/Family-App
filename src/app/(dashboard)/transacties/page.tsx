'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt, fmtDate } from '@/lib/utils';
import { Plus, Search, X } from 'lucide-react';
import type { Transactie } from '@/types';

const CATS = ['Boodschappen','Eten','Transport','Wonen','Gezondheid','Vrije tijd','Kleding','Abonnementen','Zakelijk','Salaris','Inkomen','Overig'];

export default function TransactiesPage() {
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const [filtered, setFiltered] = useState<Transactie[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Boodschappen',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });
  const sb = createClient();
  const PER_PAGE = 20;

  useEffect(() => { load(); }, []);
  useEffect(() => { filter(); }, [transacties, search, type, cat]);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setTransacties((data || []) as unknown as Transactie[]);
  }

  function filter() {
    let fl = [...transacties];
    if (search) fl = fl.filter(t =>
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(search.toLowerCase())
    );
    if (type !== 'all') fl = fl.filter(t => t.type === type);
    if (cat !== 'all') fl = fl.filter(t => t.category === cat);
    setFiltered(fl);
    setPage(1);
  }

  async function addTx() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.amount) return;
    const tx = {
      user_id: user.id,
      amount: parseFloat(form.amount),
      type: form.type,
      description: form.description,
      category: form.category,
      date: form.date,
      source: 'Handmatig',
      status: 'OK',
      is_zakelijk: false,
    };
    const { data } = await sb.from('transactions').insert(tx).select().single();
    if (data) { setTransacties(prev => [data as unknown as Transactie, ...prev]); setShowAdd(false); }
  }

  const inc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Transacties</h1>
          <p className="text-sm text-gray-400">{filtered.length} transacties</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 gradient-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
        >
          <Plus size={16} /> Toevoegen
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoeken..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        >
          <option value="all">Alle types</option>
          <option value="income">Inkomsten</option>
          <option value="expense">Uitgaven</option>
        </select>
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        >
          <option value="all">Alle categorieën</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        {(search || type !== 'all' || cat !== 'all') && (
          <button
            onClick={() => { setSearch(''); setType('all'); setCat('all'); }}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0.5 bg-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="bg-white p-4">
          <p className="text-xs text-gray-400 mb-1">Inkomsten</p>
          <p className="font-mono text-lg font-bold text-green-600">{fmt(inc)}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-gray-400 mb-1">Uitgaven</p>
          <p className="font-mono text-lg font-bold text-red-500">{fmt(exp)}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-gray-400 mb-1">Netto</p>
          <p className={`font-mono text-lg font-bold ${inc - exp >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {fmt(inc - exp)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_120px_100px_100px] gap-2 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Naam</span>
          <span>Bedrag</span>
          <span>Datum</span>
          <span>Categorie</span>
          <span>Status</span>
        </div>
        {paged.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p>Geen transacties gevonden</p>
          </div>
        ) : paged.map(t => (
          <div
            key={t.id}
            className="grid grid-cols-[2fr_1fr_120px_100px_100px] gap-2 px-5 py-3.5 border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer items-center"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                {t.type === 'income' ? '💰' : '🧾'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{t.description}</p>
                <p className="text-xs text-gray-400">{t.category}</p>
              </div>
            </div>
            <div className={`font-mono text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </div>
            <div className="text-xs text-gray-500">{fmtDate(t.date)}</div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{t.category}</span>
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">Verwerkt</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-400">Pagina {page} van {totalPages}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ←
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Transactie toevoegen</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${form.type === 'expense' ? 'bg-white text-red-500 shadow' : 'text-gray-400'}`}
              >
                ↓ Uitgave
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, type: 'income' }))}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${form.type === 'income' ? 'bg-white text-green-600 shadow' : 'text-gray-400'}`}
              >
                ↑ Inkomst
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Bedrag"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-2xl font-mono font-bold focus:outline-none focus:border-blue-400"
              />
              <input
                type="text"
                placeholder="Omschrijving"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              >
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={addTx} className="flex-1 gradient-blue text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90">
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
