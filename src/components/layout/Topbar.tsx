'use client';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getGreeting } from '@/lib/utils';

export default function Topbar({ naam }: { naam?: string }) {
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: nl });
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-7 flex-shrink-0">
      <div>
        <h1 className="font-display text-xl font-semibold text-gray-900">{getGreeting()}{naam ? `, ${naam}` : ''}</h1>
        <p className="text-xs text-gray-400 capitalize">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <Bell size={18} />
        </button>
        <div className="w-9 h-9 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold">
          {(naam || 'AA').slice(0,2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
