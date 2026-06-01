'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sb = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profiel } = await sb.from('profielen').select('onboarding_voltooid').eq('id', data.user.id).single();
      router.push(profiel?.onboarding_voltooid === false ? '/onboarding' : '/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inloggen mislukt';
      setError(msg.includes('Invalid') || msg.includes('credentials') ? 'E-mail of wachtwoord klopt niet.' : msg);
      setLoading(false);
    }
  }

  const s = {
    wrap: { display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter', system-ui, sans-serif" },
    left: { width:'40%', display:'flex', flexDirection:'column' as const, justifyContent:'center', padding:'0 56px', background:'#fff', overflowY:'auto' as const },
    right: { flex:1, background:'#111827', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', padding:'48px', position:'relative' as const, overflow:'hidden' },
    logo: { display:'flex', alignItems:'center', gap:10, marginBottom:40 },
    logoIcon: { width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0179FE,#4893FF)', display:'flex', alignItems:'center', justifyContent:'center' },
    logoText: { fontFamily:"'IBM Plex Serif', serif", fontSize:21, fontWeight:700, color:'#1A1F36' },
    heading: { fontFamily:"'IBM Plex Serif', serif", fontSize:30, fontWeight:700, color:'#1A1F36', marginBottom:6, letterSpacing:-0.5 },
    sub: { fontSize:14, color:'#6B7280', marginBottom:28 },
    errBox: { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:16 },
    label: { display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 },
    input: { width:'100%', border:'1.5px solid #E5E7EB', borderRadius:8, padding:'11px 14px', fontSize:14, fontFamily:'inherit', color:'#1A1F36', outline:'none', background:'white', boxSizing:'border-box' as const },
    inputWrap: { position:'relative' as const },
    eyeBtn: { position:'absolute' as const, right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:16 },
    btn: { width:'100%', background:'linear-gradient(135deg,#0179FE,#4893FF)', color:'#fff', border:'none', borderRadius:8, padding:'13px 20px', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(1,121,254,.3)', marginTop:4 },
    switchText: { textAlign:'center' as const, fontSize:13, color:'#6B7280', marginTop:20 },
    link: { color:'#0179FE', fontWeight:600, cursor:'pointer', textDecoration:'none' },
    // Right side
    blob1: { position:'absolute' as const, top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(1,121,254,.12)' },
    blob2: { position:'absolute' as const, bottom:-80, left:-40, width:320, height:320, borderRadius:'50%', background:'rgba(1,121,254,.07)' },
    rightContent: { position:'relative' as const, zIndex:1, maxWidth:340 },
    rightHeading: { fontFamily:"'IBM Plex Serif', serif", fontSize:26, fontWeight:700, color:'#fff', marginBottom:8, lineHeight:1.3 },
    rightSub: { fontSize:14, color:'rgba(255,255,255,.55)', marginBottom:40 },
    bullet: { display:'flex', alignItems:'flex-start', gap:12, marginBottom:18 },
    bulletIcon: { width:22, height:22, borderRadius:'50%', background:'rgba(34,197,94,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
    bulletText: { fontSize:14, color:'rgba(255,255,255,.8)', lineHeight:1.5 },
  };

  const bullets = [
    'Automatische CSV import van Rabobank en ING',
    'Schulden en doelen altijd bij de hand',
    'AI-assistent voor persoonlijk financieel advies',
  ];

  return (
    <div style={s.wrap}>
      {/* LEFT: formulier */}
      <div style={s.left}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <span style={{color:'#fff', fontWeight:700, fontSize:18, fontFamily:"'IBM Plex Serif',serif"}}>€</span>
          </div>
          <span style={s.logoText}>Family-App</span>
        </div>

        <h1 style={s.heading}>Welkom terug</h1>
        <p style={s.sub}>Log in om je financieel dashboard te bekijken</p>

        {error && <div style={s.errBox}>{error}</div>}

        <form onSubmit={handleLogin} style={{width:'100%'}}>
          <div style={{marginBottom:18}}>
            <label style={s.label}>E-mailadres</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jouw@email.com" required style={s.input}
              onFocus={e => (e.target.style.borderColor='#0179FE')}
              onBlur={e => (e.target.style.borderColor='#E5E7EB')}
            />
          </div>
          <div style={{marginBottom:20}}>
            <label style={s.label}>Wachtwoord</label>
            <div style={s.inputWrap}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{...s.input, paddingRight:44}}
                onFocus={e => (e.target.style.borderColor='#0179FE')}
                onBlur={e => (e.target.style.borderColor='#E5E7EB')}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} style={s.eyeBtn}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{...s.btn, opacity: loading ? 0.65 : 1}}>
            {loading ? 'Bezig...' : 'Inloggen →'}
          </button>
        </form>

        <p style={s.switchText}>
          Nog geen account?{' '}
          <a href="/register" style={s.link}>Registreer hier</a>
        </p>
      </div>

      {/* RIGHT: visueel */}
      <div style={s.right}>
        <div style={s.blob1} />
        <div style={s.blob2} />
        <div style={s.rightContent}>
          <h2 style={s.rightHeading}>Jouw financiën,<br />altijd inzichtelijk</h2>
          <p style={s.rightSub}>Alles op één plek, veilig en persoonlijk</p>
          {bullets.map((text, i) => (
            <div key={i} style={s.bullet}>
              <div style={s.bulletIcon}>
                <span style={{color:'#22C55E', fontSize:12, fontWeight:700}}>✓</span>
              </div>
              <p style={s.bulletText}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
