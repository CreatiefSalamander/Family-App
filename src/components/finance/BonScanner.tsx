'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Check, RefreshCw, X, Sparkles } from 'lucide-react';

interface BonResultaat {
  winkel: string;
  datum: string;
  bedrag: number;
  categorie: string;
}

interface Props {
  onToevoegen: (data: BonResultaat) => Promise<void> | void;
  onSluiten:   () => void;
}

export default function BonScanner({ onToevoegen, onSluiten }: Props) {
  const [preview,   setPreview]  = useState<string | null>(null);
  const [loading,   setLoading]  = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [resultaat, setResult]   = useState<BonResultaat | null>(null);
  const [error,     setError]    = useState('');
  const [opgeslagen, setOpgeslagen] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setPreview(null); setResult(null); setError(''); setOpgeslagen(false);
  }

  async function verwerkAfbeelding(file: File) {
    setError(''); setResult(null); setOpgeslagen(false);
    const reader = new FileReader();
    reader.onload = async e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64    = dataUrl.split(',')[1];
      const mediaType = file.type as 'image/jpeg' | 'image/png';
      setLoading(true);
      try {
        const resp = await fetch('/api/bon-scanner', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ base64, mediaType }),
        });
        const data = await resp.json();
        if (data.error) setError(data.error);
        else setResult(data);
      } catch {
        setError('Verbindingsfout bij analyse.');
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) verwerkAfbeelding(file);
    e.target.value = '';
  }

  /* ── Sla bon op — FIX: await zodat setTx werkt voor modal sluit ── */
  async function handleOpslaan() {
    if (!resultaat) return;
    setSaving(true);
    try {
      await onToevoegen(resultaat);   // ← was niet awaited, zorgde voor bug
      setOpgeslagen(true);
      setTimeout(() => onSluiten(), 800); // korte bevestiging tonen
    } catch {
      setError('Opslaan mislukt — probeer opnieuw.');
      setSaving(false);
    }
  }

  const fmtEuro = (n: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <>
      {/* ── Overlay ── */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, backdropFilter: 'blur(4px)' }}
        onClick={e => e.target === e.currentTarget && !saving && onSluiten()}
      />

      {/* ── Bottom sheet op mobiel, centered modal op desktop ── */}
      <div style={{
        position: 'fixed', zIndex: 101,
        /* Mobiel: vaste onderkant, full-width */
        bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 40px rgba(0,0,0,.2)',
        animation: 'sheetUp .3s cubic-bezier(.16,1,.3,1)',
      }}
      /* Desktop: centered card via media query override — zie <style> onderaan */
      className="bon-sheet"
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0179FE,#4893FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize: 16, fontWeight: 700, color: '#1A1F36', margin: 0 }}>
                Bon scannen
              </h3>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>AI leest je kassabon uit</p>
            </div>
          </div>
          <button onClick={onSluiten} disabled={saving} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
            <X size={16} />
          </button>
        </div>

        {/* Upload knoppen — alleen als nog geen preview */}
        {!preview && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <button onClick={() => inputRef.current?.click()} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '20px 12px', borderRadius: 14, border: '2px dashed #0179FE',
              background: 'rgba(1,121,254,.04)', cursor: 'pointer', color: '#0179FE',
            }}>
              <Camera size={24} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Camera</span>
            </button>
            <button onClick={() => uploadRef.current?.click()} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '20px 12px', borderRadius: 14, border: '2px dashed #E5E7EB',
              background: '#F9FAFB', cursor: 'pointer', color: '#6B7280',
            }}>
              <Upload size={24} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Upload foto</span>
            </button>
            <input ref={inputRef}  type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
            <input ref={uploadRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          </div>
        )}

        {/* Preview afbeelding */}
        {preview && (
          <div style={{ position: 'relative', marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Bon preview" style={{ width: '100%', borderRadius: 12, maxHeight: 180, objectFit: 'contain', background: '#F3F4F6' }} />
            {!loading && !saving && (
              <button onClick={resetState} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        )}

        {/* Analyse bezig */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(1,121,254,.06)', borderRadius: 12, marginBottom: 14 }}>
            <Loader2 size={18} color="#0179FE" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0179FE', margin: 0 }}>Claude analyseert de bon...</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>Dit duurt enkele seconden</p>
            </div>
          </div>
        )}

        {/* Foutmelding */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Resultaat kaart */}
        {resultaat && !opgeslagen && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={13} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Bon herkend!</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Winkel',    value: resultaat.winkel },
                { label: 'Datum',     value: resultaat.datum },
                { label: 'Bedrag',    value: fmtEuro(resultaat.bedrag) },
                { label: 'Categorie', value: resultaat.categorie },
              ].map(r => (
                <div key={r.label}>
                  <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 2px' }}>{r.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36', margin: 0 }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opgeslagen bevestiging */}
        {opgeslagen && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={26} color="#fff" strokeWidth={3} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#16A34A', margin: 0 }}>Transactie opgeslagen!</p>
          </div>
        )}

        {/* Actieknoppen */}
        {!opgeslagen && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onSluiten}
              disabled={saving}
              style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}
            >
              Annuleren
            </button>
            {resultaat && (
              <button
                onClick={handleOpslaan}
                disabled={saving}
                style={{
                  flex: 2, padding: '13px 16px', borderRadius: 12, border: 'none',
                  background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#0179FE,#4893FF)',
                  fontSize: 14, fontWeight: 700, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: saving ? 'none' : '0 4px 14px rgba(1,121,254,.35)',
                }}
              >
                {saving
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Opslaan...</>
                  : <><Check size={16} /> Voeg toe aan transacties</>
                }
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes sheetUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Desktop: centered modal ipv bottom sheet */
        @media (min-width: 768px) {
          .bon-sheet {
            bottom: auto !important;
            left: 50% !important;
            right: auto !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 440px !important;
            border-radius: 20px !important;
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
