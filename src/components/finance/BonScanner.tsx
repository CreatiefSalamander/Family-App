'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Check, RefreshCw } from 'lucide-react';

interface BonResultaat {
  winkel: string;
  datum: string;
  bedrag: number;
  categorie: string;
}

interface Props {
  onToevoegen: (data: BonResultaat) => void;
  onSluiten:   () => void;
}

export default function BonScanner({ onToevoegen, onSluiten }: Props) {
  const [preview,  setPreview]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [resultaat, setResult]  = useState<BonResultaat | null>(null);
  const [error,    setError]    = useState('');
  const inputRef   = useRef<HTMLInputElement>(null);
  const uploadRef  = useRef<HTMLInputElement>(null);

  function resetState() {
    setPreview(null); setResult(null); setError('');
  }

  async function verwerkAfbeelding(file: File) {
    setError(''); setResult(null);
    const reader = new FileReader();
    reader.onload = async e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      const mediaType = file.type as 'image/jpeg' | 'image/png';

      setLoading(true);
      try {
        const resp = await fetch('/api/bon-scanner', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ base64, mediaType }),
        });
        const data = await resp.json();
        if (data.error) { setError(data.error); }
        else setResult(data);
      } catch (err) {
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

  const fmtEuro = (n: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={e => e.target === e.currentTarget && onSluiten()}>
      <div className="card" style={{ width: 420, padding: 28 }}>
        <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize: 18, fontWeight: 700, color: '#1A1F36', marginBottom: 20 }}>
          📸 Bon scannen
        </h3>

        {/* Upload knoppen */}
        {!preview && !loading && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button onClick={() => inputRef.current?.click()}
              className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Camera size={16} /> Camera
            </button>
            <button onClick={() => uploadRef.current?.click()}
              className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              <Upload size={16} /> Upload foto
            </button>
            {/* Camera input (mobile) */}
            <input ref={inputRef}  type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display:'none' }} />
            {/* Upload input */}
            <input ref={uploadRef} type="file" accept="image/*"                     onChange={onFileChange} style={{ display:'none' }} />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Bon preview" style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'contain', background: '#F3F4F6' }} />
            <button onClick={resetState} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* Laden */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', color: '#6B7280' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#0179FE' }} />
            <p style={{ fontSize: 13 }}>Claude analyseert de bon...</p>
          </div>
        )}

        {/* Fout */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#DC2626' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Resultaat */}
        {resultaat && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> Bon herkend!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Winkel',    value: resultaat.winkel },
                { label: 'Datum',     value: resultaat.datum },
                { label: 'Bedrag',    value: fmtEuro(resultaat.bedrag) },
                { label: 'Categorie', value: resultaat.categorie },
              ].map(r => (
                <div key={r.label}>
                  <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>{r.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36', marginTop: 2 }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acties */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onSluiten}>Annuleren</button>
          {resultaat && (
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => { onToevoegen(resultaat); onSluiten(); }}>
              <Check size={15} /> Voeg toe
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
