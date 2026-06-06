'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/* Wachtwoord sterkte check */
function checkPassword(pw: string): { ok: boolean; msg: string } {
  if (pw.length < 8)            return { ok: false, msg: 'Minimaal 8 tekens vereist' };
  if (!/[A-Z]/.test(pw))       return { ok: false, msg: 'Minimaal één hoofdletter vereist' };
  if (!/[0-9]/.test(pw))       return { ok: false, msg: 'Minimaal één cijfer vereist' };
  return { ok: true, msg: '' };
}

/* Sanitize input — verwijder HTML tags */
function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    voornaam: '', achternaam: '', email: '', password: '', password2: '',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState({ ok: false, msg: '' });
  const sb = createClient();

  function setField(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'password') setPwStrength(v ? checkPassword(v) : { ok: false, msg: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    /* Validaties */
    const voornaam  = sanitize(form.voornaam);
    const achternaam = sanitize(form.achternaam);

    if (!voornaam || !achternaam)
      return setError('Voornaam en achternaam zijn verplicht.');

    if (!form.email.includes('@'))
      return setError('Voer een geldig e-mailadres in.');

    const pwCheck = checkPassword(form.password);
    if (!pwCheck.ok)
      return setError(pwCheck.msg);

    if (form.password !== form.password2)
      return setError('Wachtwoorden komen niet overeen.');

    setLoading(true);

    /* Supabase registratie — wachtwoord wordt automatisch gehasht */
    const { data, error: signUpError } = await sb.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: { voornaam, achternaam }, // opgeslagen in auth.users metadata
      },
    });

    if (signUpError) {
      setLoading(false);
      const msg = signUpError.message;
      if (msg.includes('already registered'))
        return setError('Dit e-mailadres is al geregistreerd. Probeer in te loggen.');
      return setError(msg);
    }

    /* Sla profiel op — ALLEEN data die we ook bewaren */
    if (data.user) {
      await sb.from('profielen').upsert({
        id:               data.user.id,
        voornaam,
        achternaam,
        taal:             'nl',
        onboarding_voltooid: false,
      });
    }

    setLoading(false);
    setSuccess(`Account aangemaakt! Controleer je inbox voor de bevestigingslink.`);
  }

  /* Wachtwoord sterkte balk */
  const pwLen = form.password.length;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasNum   = /[0-9]/.test(form.password);
  const strength = pwLen === 0 ? 0 : pwLen >= 8 && hasUpper && hasNum ? 3 : pwLen >= 6 ? 2 : 1;
  const strengthColor = ['#E5E7EB','#EF4444','#F59E0B','#22C55E'][strength];
  const strengthLabel = ['','Zwak','Matig','Sterk'][strength];

  const s = {
    wrap:      { display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter',system-ui,sans-serif" } as const,
    left:      { flex:1, display:'flex', flexDirection:'column' as const, justifyContent:'center', padding:'0 clamp(24px,6vw,52px)', background:'#fff', overflowY:'auto' as const },
    // right wordt afgehandeld via .auth-asset class (sky-blue, verborgen op mobiel)
    logo:      { display:'flex', alignItems:'center', gap:10, marginBottom:36 },
    logoIcon:  { width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0179FE,#4893FF)', display:'flex', alignItems:'center', justifyContent:'center' },
    logoText:  { fontFamily:"'IBM Plex Serif',serif", fontSize:20, fontWeight:700, color:'#1A1F36' },
    heading:   { fontFamily:"'IBM Plex Serif',serif", fontSize:26, fontWeight:700, color:'#1A1F36', marginBottom:4, letterSpacing:-0.5 },
    sub:       { fontSize:13, color:'#6B7280', marginBottom:24 },
    errBox:    { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:16 },
    okBox:     { background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:8, padding:'12px 14px', color:'#16A34A', fontSize:13, marginBottom:16 },
    label:     { display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 } as const,
    grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
    // Right side — sky-blue Horizon kleuren (donker tekst ipv wit)
    blob1:     { position:'absolute' as const, top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(1,121,254,.08)' },
    blob2:     { position:'absolute' as const, bottom:-80, left:-60, width:280, height:280, borderRadius:'50%', background:'rgba(1,121,254,.05)' },
    rightContent: { position:'relative' as const, zIndex:1, maxWidth:360, textAlign:'center' as const },
    rightH:    { fontFamily:"'IBM Plex Serif',serif", fontSize:26, fontWeight:700, color:'#00214F', marginBottom:10, lineHeight:1.3 },
    rightSub:  { fontSize:14, color:'#475467', marginBottom:36 },
    bullet:    { display:'flex', alignItems:'flex-start', gap:12, marginBottom:16, textAlign:'left' as const },
    bulletIcon: { width:22, height:22, borderRadius:'50%', background:'rgba(1,121,254,.12)', border:'1px solid rgba(1,121,254,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 },
    bulletText: { fontSize:14, color:'#344054', lineHeight:1.5 },
  };

  const bullets = [
    'Wachtwoord veilig versleuteld via Supabase Auth',
    'Geen adresgegevens opgeslagen — alleen naam',
    'Email-verificatie vereist voor activering',
    'Jouw data blijft privé en lokaal bewaard',
  ];

  return (
    <div style={s.wrap}>

      {/* ── Linker kant: formulier ──────────────────────── */}
      <div style={s.left}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:18, fontFamily:"'IBM Plex Serif',serif" }}>€</span>
          </div>
          <span style={s.logoText}>Household</span>
        </div>

        <h1 style={s.heading}>Account aanmaken</h1>
        <p style={s.sub}>Maak je persoonlijke finance account aan</p>

        {error   && <div style={s.errBox}>⚠️ {error}</div>}
        {success && (
          <div style={s.okBox}>
            <p style={{ fontWeight:700, marginBottom:4 }}>✅ Account aangemaakt!</p>
            <p>Controleer je inbox voor de bevestigingslink. Klik op de link om je account te activeren.</p>
            <a href="/login" style={{ color:'#16A34A', fontWeight:600, display:'block', marginTop:8 }}>
              → Ga naar inloggen
            </a>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Naam */}
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Voornaam</label>
                <input className="input-field" type="text" value={form.voornaam}
                  onChange={e => setField('voornaam', e.target.value)}
                  placeholder="Voornaam" required autoComplete="given-name" />
              </div>
              <div>
                <label style={s.label}>Achternaam</label>
                <input className="input-field" type="text" value={form.achternaam}
                  onChange={e => setField('achternaam', e.target.value)}
                  placeholder="Achternaam" required autoComplete="family-name" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={s.label}>E-mailadres</label>
              <input className="input-field" type="email" value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="jouw@email.com" required autoComplete="email" />
            </div>

            {/* Wachtwoord */}
            <div>
              <label style={s.label}>Wachtwoord</label>
              <input className="input-field" type="password" value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder="Min. 8 tekens, 1 hoofdletter, 1 cijfer"
                required autoComplete="new-password" />
              {/* Sterkte balk */}
              {form.password && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<=strength?strengthColor:'#E5E7EB', transition:'background .2s' }}/>
                    ))}
                  </div>
                  <p style={{ fontSize:11, color:strengthColor, fontWeight:600 }}>
                    {strengthLabel} {pwStrength.msg && `— ${pwStrength.msg}`}
                  </p>
                </div>
              )}
            </div>

            {/* Bevestig wachtwoord */}
            <div>
              <label style={s.label}>Bevestig wachtwoord</label>
              <input className="input-field" type="password" value={form.password2}
                onChange={e => setField('password2', e.target.value)}
                placeholder="Herhaal wachtwoord"
                required autoComplete="new-password" />
              {form.password2 && form.password !== form.password2 && (
                <p style={{ fontSize:11, color:'#EF4444', marginTop:4, fontWeight:600 }}>
                  ✗ Wachtwoorden komen niet overeen
                </p>
              )}
              {form.password2 && form.password === form.password2 && form.password && (
                <p style={{ fontSize:11, color:'#22C55E', marginTop:4, fontWeight:600 }}>
                  ✓ Wachtwoorden komen overeen
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                background:'linear-gradient(135deg,#0179FE,#4893FF)',
                color:'#fff', border:'none', borderRadius:8,
                padding:'13px 20px', fontSize:15, fontWeight:600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', opacity: loading ? .65 : 1,
                boxShadow:'0 2px 8px rgba(1,121,254,.3)',
                marginTop:4,
              }}>
              {loading ? 'Account aanmaken...' : 'Account aanmaken →'}
            </button>

          </form>
        )}

        <p style={{ textAlign:'center', fontSize:13, color:'#6B7280', marginTop:20 }}>
          Al een account?{' '}
          <a href="/login" style={{ color:'#0179FE', fontWeight:600, textDecoration:'none' }}>
            Inloggen
          </a>
        </p>
      </div>

      {/* ── Rechter kant: sky-blue Horizon panel — verborgen op mobiel via .auth-asset ── */}
      <div className="auth-asset" style={{ position:'relative' }}>
        <div style={s.blob1} />
        <div style={s.blob2} />
        <div style={s.rightContent}>
          <h2 style={s.rightH}>Jouw financiën,<br />veilig en privé</h2>
          <p style={s.rightSub}>Household slaat alleen op wat nodig is</p>
          {bullets.map((text, i) => (
            <div key={i} style={s.bullet}>
              <div style={s.bulletIcon}>
                <span style={{ color:'#0179FE', fontSize:12, fontWeight:700 }}>✓</span>
              </div>
              <p style={s.bulletText}>{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
