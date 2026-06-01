import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function fmt(n: number): string {
  return '€' + Math.abs(n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function fmtDate(d: string): string {
  return format(new Date(d), 'd MMM yyyy', { locale: nl });
}

export function fmtMonth(d: Date): string {
  return format(d, 'MMMM yyyy', { locale: nl });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond';
}
