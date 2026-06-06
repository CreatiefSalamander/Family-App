'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [onthoudMe, setOnthoudMe] = useState(true);
  const router = useRouter();
  const sb = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profiel } = await sb.from('profielen').select('onboarding_voltooid').eq('id', data.user.id).single();
      router.push(profiel?.onboarding_voltooid === false ? '/onboarding' : '/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inloggen mislukt';
      setError(msg.includes('Invalid') || msg.includes('credentials') ? 'E-mail of wachtwoord klopt niet.' : msg);
      setLoading(false);
    }
  }

  const bullets = [
    'Automatische CSV import van Rabobank en ING',
    'Schulden en doelen altijd bij de hand',
    'AI-assistent voor persoonlijk financieel advies',
    'Crypto, reizen en kasboek in één app',
  ];

  return (
    /* Horizon auth layout: wit formulier links + sky-blue panel rechts */
    <main style={{ display:'flex', minHeight:'100vh', width:'100%', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Linker kant: formulier ────────────────────────────── */}
      <section style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'48px 24px', backgroundColor:'#fff', overflowY:'auto',
      }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(90deg,#0179FE,#4893FF)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:'#fff', fontFamily:"'IBM Plex Serif',serif", fontWeight:700, fontSize:18 }}>€</span>
            </div>
            <span style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:22, fontWeight:700, color:'#00214F' }}>
              Household
            </span>
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:28, fontWeight:600, color:'#101828', marginBottom:6, lineHeight:1.25 }}>
            Welkom terug
          </h1>
          <p style={{ fontSize:15, color:'#475467', marginBottom:28 }}>
            Voer je gegevens in om in te loggen
          </p>

          {/* Foutmelding */}
          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:20 }}>
              {error}
            </div>
          )}

          {/* Formulier */}
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:18 }}>

            {/* E-mail */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#344054' }}>E-mailadres</label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jouw@email.com"
                required
                style={{ fontSize:16 /* voorkomt iOS zoom */ }}
              />
            </div>

            {/* Wachtwoord */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#344054' }}>Wachtwoord</label>
              <div style={{ position:'relative' }}>
                <input
                  className="input-field"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight:44, fontSize:16 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:15, lineHeight:1 }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Onthoud mij + wachtwoord vergeten */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'#475467', cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={onthoudMe}
                  onChange={e => setOnthoudMe(e.target.checked)}
                  style={{ accentColor:'#0179FE', width:16, height:16 }}
                />
                Onthoud mij
              </label>
              <a href="#" style={{ fontSize:13, color:'#0179FE', textDecoration:'none', fontWeight:500 }}>
                Wachtwoord vergeten?
              </a>
            </div>

            {/* Inlogknop — form-btn klasse uit globals.css */}
            <button
              type="submit"
              disabled={loading}
              className="form-btn"
              style={{ padding:'13px 20px', fontSize:15, fontWeight:600, marginTop:4 }}
            >
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </button>
          </form>

          {/* Registreer link */}
          <p style={{ textAlign:'center', fontSize:13, color:'#475467', marginTop:24 }}>
            Nog geen account?{' '}
            <a href="/register" style={{ color:'#0179FE', fontWeight:600, textDecoration:'none' }}>
              Registreer hier
            </a>
          </p>
        </div>
      </section>

      {/* ── Rechter kant: sky-blue panel — verborgen op mobiel via .auth-asset ── */}
      <div className="auth-asset" style={{ position:'relative' }}>
        {/* Decoratieve blobs */}
        <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(1,121,254,.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:-40, width:240, height:240, borderRadius:'50%', background:'rgba(1,121,254,.05)', pointerEvents:'none' }} />

        {/* Content */}
        <div style={{ position:'relative', zIndex:1, padding:'0 52px', maxWidth:480 }}>
          <h2 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:30, fontWeight:700, color:'#00214F', marginBottom:10, lineHeight:1.25 }}>
            Jouw financiën,<br/>altijd inzichtelijk
          </h2>
          <p style={{ fontSize:15, color:'#475467', marginBottom:36, lineHeight:1.6 }}>
            Alles op één plek — veilig, persoonlijk en overzichtelijk
          </p>

          {bullets.map((text, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:18, alignItems:'flex-start' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(1,121,254,.12)', border:'1px solid rgba(1,121,254,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                <span style={{ color:'#0179FE', fontSize:12, fontWeight:700 }}>✓</span>
              </div>
              <p style={{ fontSize:14, color:'#344054', lineHeight:1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
