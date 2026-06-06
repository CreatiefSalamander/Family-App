'use client';

import DoughnutChart from './DoughnutChart';
import AnimatedCounter from './AnimatedCounter';
import type { Rekening } from '@/types';

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

interface Props {
  rekeningen: Rekening[];
  totaalSaldo: number;
  loading?: boolean;
}

export default function TotalBalanceBox({ rekeningen, totaalSaldo, loading }: Props) {
  return (
    <section className="total-balance">

      {/* Donut chart — links */}
      <div className="total-balance-chart">
        <DoughnutChart rekeningen={rekeningen} />
      </div>

      {/* Tekst — rechts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <h2 style={{
          fontSize: 18, fontWeight: 700, color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
        }}>
          {rekeningen.length} Rekening{rekeningen.length !== 1 ? 'en' : ''}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{
            fontSize: 14, fontWeight: 500,
            color: 'rgba(255,255,255,0.75)',
          }}>
            Totaal Huidig Saldo
          </p>

          <p style={{
            fontFamily: "'IBM Plex Serif', serif",
            fontSize: 30, fontWeight: 700,
            color: '#ffffff', lineHeight: 1,
          }}>
            {loading ? '—' : <AnimatedCounter amount={totaalSaldo} />}
          </p>
        </div>

        {/* Per rekening mini lijst */}
        {rekeningen.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rekeningen.slice(0, 3).map((r, i) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: ['#0747b6', '#2265d8', '#2f91fa'][i] ?? '#2f91fa',
                  }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {r.name}
                  </span>
                </div>
                <span style={{
                  fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 700, color: '#ffffff',
                }}>
                  {fmtEuro(r.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
