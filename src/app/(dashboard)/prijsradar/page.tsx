'use client';
import { useState } from 'react';
import { Search, Star } from 'lucide-react';

export default function PrijsradarPage() {
  const [query, setQuery] = useState('');
  return (
    <div className="px-7 py-6">
      <h1 className="font-display text-2xl font-bold mb-2">Prijsradar</h1>
      <p className="text-gray-500 text-sm mb-6">Vergelijk prijzen bij Nederlandse winkels</p>
      <div className="card p-6 mb-6">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek een product, bijv. melk, iPhone 15, bankstel..."
            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <p className="text-xs text-gray-400 mt-3">Verbind een SerpAPI sleutel via Instellingen voor live prijsresultaten</p>
      </div>
      <div className="card p-12 text-center text-gray-400">
        <Star size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="font-semibold text-gray-600">Prijsradar klaar voor gebruik</p>
        <p className="text-sm mt-1">Voer een product in om prijzen te vergelijken</p>
      </div>
    </div>
  );
}
