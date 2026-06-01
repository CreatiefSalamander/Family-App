'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt, fmtDate } from '@/lib/utils';
import { Plus, Upload, Search, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { parseRabobankCSV, parseINGCSV, detecteerBank } from '@/lib/bank/csv-parser';
import { categoriseerTransactie } from '@/lib/bank/categorisatie';
import type { Transactie } from '@/types';

const CATS = ['Boodschappen','Eten','Transport','Wonen','Gezondheid','Vrije tijd','Kleding','Abonnementen','Zakelijk','Salaris','Inkomen','Overig'];

interface ImportResult { nieuw: number; dubbel: number; intern: number; fout: number; }

export default function TransactiesPage() {
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const [filtered, setFiltered] = useState<Transactie[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', category: 'Boodschappen', date: new Date().toISOString().split('T')[0], type: 'expense' });
  const fileRef = useRef<HTMLInputElement>(null);
  const sb = createClient();
  const PER_PAGE = 20;

  useEffect(() => { load(); }, []);
  useEffect(() => { filter(); }, [transacties, search, typeFilter, catFilter]);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setTransacties((data || []) as unknown as Transactie[]);
  }

  function filter() {
    let fl = [...transacties];
    if (search) fl = fl.filter(t => (t.description || '').toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') fl = fl.filter(t => t.type === typeFilter);
    if (catFilter !== 'all') fl = fl.filter(t => t.category === catFilter);
    setFiltered(fl); setPage(1);
  }

  async function addTx() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.amount) return;
    const tx = { user_id: user.id, amount: parseFloat(form.amount), type: form.type, description: form.description || form.category, category: form.category, date: form.date, source: 'Handmatig', status: 'OK', is_zakelijk: false };
    const { data } = await sb.from('transactions').insert(tx).select().single();
    if (data) { setTransacties(prev => [data as unknown as Transactie, ...prev]); setShowAdd(false); setForm(f => ({ ...f, amount: '', description: '' })); }
  }

  async function handleCSV(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0]?.split(/[;,]/).map(h => h.trim()) || [];
      const bank = detecteerBank(headers);
      const ruwe = bank === 'ING' ? parseINGCSV(text) : parseRabobankCSV(text);

      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const { data: regels } = await sb.from('categorie_regels').select('*').eq('user_id', user.id);
      const { data: existing } = await sb.from('transactions').select('date, amount, description').eq('user_id', user.id);

      let nieuw = 0, dubbel = 0, intern = 0, fout = 0;
      const toInsert = [];

      for (const r of ruwe) {
        if (!r.datum || isNaN(r.bedrag)) { fout++; continue; }
        const cat = categoriseerTransactie(r.tegenpartij, r.omschrijving, r.tegenrekIBAN, regels || []);
        if (cat.soort === 'Intern') { intern++; continue; }
        const isDupe = (existing || []).some((e: Record<string, unknown>) =>
          e.date === r.datum && Math.abs(e.amount as number - Math.abs(r.bedrag)) < 0.01
        );
        if (isDupe) { dubbel++; continue; }
        toInsert.push({
          user_id: user.id,
          amount: Math.abs(r.bedrag),
          type: r.bedrag >= 0 ? 'income' : 'expense',
          description: r.omschrijving || r.tegenpartij || 'Transactie',
          category: cat.categorie,
          date: r.datum,
          source: r.bron,
          status: cat.status,
          tegenpartij: r.tegenpartij,
          saldo_na: r.saldo || null,
          is_zakelijk: cat.type === 'Zakelijk',
        });
        nieuw++;
      }

      if (toInsert.length > 0) {
        await sb.from('transactions').insert(toInsert);
      }

      setImportResult({ nieuw, dubbel, intern, fout });
      if (nieuw > 0) await load();
    } catch (e) {
      console.error(e);
      setImportResult({ nieuw: 0, dubbel: 0, intern: 0, fout: 1 });
    }
    setImporting(false);
  }

  const inc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  return (
    <div className="px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Transacties</h1>
          <p className="text-sm text-gray-400">{filtered.length} transacties</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(s => !s)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 bg-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Upload size={15} /> CSV import
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={15} /> Toevoegen
          </button>
        </div>
      </div>

      {/* CSV Import zone */}
      {showImport && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Upload size={16} />CSV Import</h3>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSV(f); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-[#0179FE] bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            {importing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-[#0179FE] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Importeren...</p>
              </div>
            ) : importResult ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={28} className="text-green-500" />
                <div className="flex gap-4 text-sm mt-1">
                  <span className="text-green-600 font-semibold">✓ {importResult.nieuw} nieuw</span>
                  <span className="text-gray-400">{importResult.dubbel} dubbel</span>
                  <span className="text-blue-500">{importResult.intern} intern</span>
                  {importResult.fout > 0 && <span className="text-red-500">{importResult.fout} fout</span>}
                </div>
                <button onClick={e => { e.stopPropagation(); setImportResult(null); }} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Nieuw bestand</button>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">Sleep CSV hier of klik om te uploaden</p>
                <p className="text-xs text-gray-400 mt-1">Rabobank en ING worden automatisch herkend</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoeken..."
            className="input-field pl-9 py-2 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
          <option value="all">Alle types</option>
          <option value="income">Inkomsten</option>
          <option value="expense">Uitgaven</option>
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
          <option value="all">Alle categorieën</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        {(search || typeFilter !== 'all' || catFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setTypeFilter('all'); setCatFilter('all'); }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="bg-white p-4"><p className="text-xs text-gray-400 mb-1">Inkomsten</p><p className="font-mono text-lg font-bold text-green-600">{fmt(inc)}</p></div>
        <div className="bg-white p-4"><p className="text-xs text-gray-400 mb-1">Uitgaven</p><p className="font-mono text-lg font-bold text-red-500">{fmt(exp)}</p></div>
        <div className="bg-white p-4"><p className="text-xs text-gray-400 mb-1">Netto</p><p className={`font-mono text-lg font-bold ${inc - exp >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(inc - exp)}</p></div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_120px_100px] gap-2 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span>Naam</span><span>Bedrag</span><span>Datum</span><span>Categorie</span>
        </div>
        {paged.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-medium text-gray-600">Geen transacties gevonden</p>
            <p className="text-sm mt-1">Pas de filters aan of voeg een transactie toe</p>
          </div>
        ) : paged.map(t => (
          <div key={t.id} className="grid grid-cols-[2fr_1fr_120px_100px] gap-2 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-blue-50/20 cursor-pointer items-center transition-colors">
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
            <div><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#0179FE]">{t.category}</span></div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-400">Pagina {page} van {totalPages} ({filtered.length} totaal)</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">Transactie toevoegen</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
              <button onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                ↓ Uitgave
              </button>
              <button onClick={() => setForm(f => ({ ...f, type: 'income' }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                ↑ Inkomst
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Bedrag (€)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00" className="input-field text-2xl font-mono font-bold" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Omschrijving</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Bijv. Albert Heijn, Salaris..." className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Categorie</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Datum</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors">Annuleren</button>
              <button onClick={addTx} className="flex-1 btn-primary rounded-xl py-2.5">Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
