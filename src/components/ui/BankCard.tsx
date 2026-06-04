import Image from 'next/image';
import Link from 'next/link';
import type { Rekening } from '@/types';

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

const GRAD: Record<string, string> = {
  blue:   'linear-gradient(111deg, #0747b6 0%, #2265d8 33%, #2f91fa 100%)',
  teal:   'linear-gradient(111deg, #01797A 0%, #2693A0 33%, #489399 100%)',
  purple: 'linear-gradient(111deg, #4A20AA 0%, #6172F3 33%, #A855F7 100%)',
  green:  'linear-gradient(111deg, #027A48 0%, #059669 33%, #34D399 100%)',
};

interface Props {
  rekening: Rekening;
  naam: string;
  showBalance?: boolean;
}

export default function BankCard({ rekening, naam, showBalance = true }: Props) {
  return (
    <div className="flex flex-col">
      <Link href="/rekeningen" className="bank-card" style={{
        background: GRAD[rekening.color_gradient] ?? GRAD.blue,
        display: 'block', textDecoration: 'none',
      }}>
        <div className="bank-card_content">

          {/* Naam + saldo */}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
              {rekening.name}
            </h1>
            {showBalance && (
              <p style={{
                fontFamily: "'IBM Plex Serif', serif",
                fontWeight: 700, color: '#ffffff',
                fontSize: 20, marginTop: 4,
              }}>
                {fmtEuro(rekening.balance)}
              </p>
            )}
          </div>

          {/* Kaarthouder + nummer */}
          <article style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h1 style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{naam}</h1>
              <h2 style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>●● / ●●</h2>
            </div>
            <p style={{
              fontSize: 14, fontWeight: 600,
              letterSpacing: '1.1px', color: '#ffffff',
            }}>
              •••• •••• ••••{' '}
              <span style={{ fontSize: 16 }}>
                {rekening.account_number_masked?.slice(-4) ?? '••••'}
              </span>
            </p>
          </article>

        </div>

        {/* Betaalichonen rechtsonder */}
        <div className="bank-card_icon">
          <Image src="/icons/Paypass.svg" width={20} height={24} alt="pay" />
          <Image src="/icons/mastercard.svg" width={45} height={32} alt="mastercard" />
        </div>

        {/* Streepjespatroon */}
        <Image
          src="/icons/Lines.svg"
          alt="lines"
          width={316}
          height={190}
          style={{
            position: 'absolute', top: 0, right: 0,
            opacity: 0.25, pointerEvents: 'none',
          }}
        />

      </Link>
    </div>
  );
}
