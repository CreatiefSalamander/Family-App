'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, UserPlus, Check, Target, PieChart, TrendingDown } from 'lucide-react';

interface Koppeling {
  id: string;
  eigenaar_id: string;
  partner_id: string | null;
  gedeeld_budget: boolean;
  gedeelde_doelen: boolean;
  gedeelde_schulden: boolean;
  status: string;
}
interface Profiel { id:string; voornaam:string; achternaam:string; }

export default function GezinPage() {
  const [koppeling,  setKoppeling]  = useState<Koppeling | null>(null);
  const [mijnProfiel, setMijnen]    = useState<Profiel | null>(null);
  const [partnerProfiel, setPartner] = useState<Profiel | null>(null);
  const [partnerEmail, setEmail]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const [{ data: profiel }, { data: k }] = await Promise.all([
        sb.from('profielen').select('id,voornaam,achternaam').eq('id', user.id).single(),
        sb.from('gezin_koppelingen').select('*').or(`eigenaar_id.eq.${user.id},partner_id.eq.${user.id}`).single(),
      ]);

      setMijnen(profiel as Profiel);
      if (k) {
        setKoppeling(k as Koppeling);
        const partnerId = k.eigenaar_id === user.id ? k.partner_id : k.eigenaar_id;
        if (partnerId) {
          const { data: pp } = await sb.from('profielen').select('id,voornaam,achternaam').eq('id', partnerId).single();
          setPartner(pp as Profiel);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function stuurUitnodiging() {
    setError(''); setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: partner } = await sb.from('profielen').select('id').eq('id',
      // Zoek op email via auth admin is niet mogelijk met anon key
      // Simpele aanpak: toon instructie
      'dummy'
    ).single();

    // Maak koppeling aan met status 'Uitnodiging verstuurd'
    const { data, error: err } = await sb.from('gezin_koppelingen').insert({
      eigenaar_id: user.id,
      status: 'Uitnodiging verstuurd',
      gedeeld_budget: true, gedeelde_doelen: true, gedeelde_schulden: false,
    }).select().single();

    if (err) setError('Kon koppeling niet aanmaken.');
    else {
      setKoppeling(data as Koppeling);
      setSuccess(`Uitnodiging aangemaakt! Deel deze code met je partner: ${data.id.slice(0,8).toUpperCase()}`);
    }
    setSaving(false);
  }

  async function updateInstellingen(veld: keyof Koppeling, waarde: boolean) {
    if (!koppeling) return;
    await sb.from('gezin_koppelingen').update({ [veld]: waarde }).eq('id', koppeling.id);
    setKoppeling(prev => prev ? { ...prev, [veld]: waarde } : prev);
  }

  const naam = (p: Profiel | null) => p ? `${p.voornaam} ${p.achternaam}`.trim() : 'Onbekend';

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">👨‍👩‍👧 Gezin & Partner</h1>
        <p className="header-box-subtext">Deel financiën met je partner</p>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:80, borderRadius:12 }}/>)}
        </div>
      ) : (
        <>
          {/* Mijn gezin */}
          <div className="card" style={{ padding:24, marginBottom:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:16 }}>Mijn gezin</h3>
            <div style={{ display:'flex', gap:20, alignItems:'center' }}>
              {/* Jij */}
              <div style={{ textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#0179FE,#4893FF)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', color:'white', fontSize:20, fontWeight:700 }}>
                  {mijnProfiel?.voornaam?.[0]?.toUpperCase() ?? 'J'}
                </div>
                <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{naam(mijnProfiel)}</p>
                <span className="badge badge-blue" style={{ marginTop:4 }}>Jij</span>
              </div>

              {koppeling && (
                <>
                  <div style={{ flex:1, height:2, background:'linear-gradient(90deg,#0179FE,#4893FF)', borderRadius:1 }}/>
                  {/* Partner */}
                  <div style={{ textAlign:'center' }}>
                    <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#6172F3,#A855F7)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', color:'white', fontSize:20, fontWeight:700 }}>
                      {partnerProfiel ? partnerProfiel.voornaam[0].toUpperCase() : '?'}
                    </div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{naam(partnerProfiel)}</p>
                    <span className={`badge ${koppeling.status==='Gekoppeld'?'badge-green':'badge-amber'}`} style={{ marginTop:4 }}>{koppeling.status}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {success && <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:10, padding:'12px 16px', marginBottom:16 }}><p style={{ fontSize:13, color:'#16A34A', fontWeight:600 }}>{success}</p></div>}
          {error   && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 16px', marginBottom:16 }}><p style={{ fontSize:13, color:'#DC2626' }}>⚠️ {error}</p></div>}

          {/* Partner uitnodigen */}
          {!koppeling && (
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}><UserPlus size={16} style={{ display:'inline', marginRight:6 }}/>Partner uitnodigen</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:16 }}>
                Maak een koppeling aan en deel de code met je partner. Zij kunnen inloggen en de code invoeren om verbinding te maken.
              </p>
              <button className="btn-primary" style={{ width:'auto' }} onClick={stuurUitnodiging} disabled={saving}>
                {saving ? 'Aanmaken...' : '🔗 Maak koppeling aan'}
              </button>
            </div>
          )}

          {/* Gedeelde data instellingen */}
          {koppeling && (
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:16 }}>Gedeelde data</h3>
              {[
                { label:'Budgetten delen',      icon:PieChart,     veld:'gedeeld_budget',    waarde:koppeling.gedeeld_budget    },
                { label:'Doelen delen',         icon:Target,       veld:'gedeelde_doelen',   waarde:koppeling.gedeelde_doelen   },
                { label:'Schulden zichtbaar',   icon:TrendingDown, veld:'gedeelde_schulden', waarde:koppeling.gedeelde_schulden },
              ].map(({ label, icon:Icon, veld, waarde }) => (
                <div key={veld} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #F3F4F6' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Icon size={16} color="#6B7280"/>
                    <p style={{ fontSize:13, fontWeight:500, color:'#1A1F36' }}>{label}</p>
                  </div>
                  <button onClick={() => updateInstellingen(veld as keyof Koppeling, !waarde)} style={{
                    width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', transition:'background .2s', position:'relative',
                    background: waarde ? 'linear-gradient(90deg,#0179FE,#4893FF)' : '#E5E7EB',
                  }}>
                    <span style={{ position:'absolute', top:2, left: waarde?'22px':'2px', width:20, height:20, borderRadius:'50%', background:'white', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info als geen partner */}
          {!koppeling && (
            <div className="card" style={{ padding:24, background:'#EFF6FF', border:'none' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#0179FE', marginBottom:8 }}>💡 Hoe werkt het?</p>
              <ol style={{ fontSize:13, color:'#1D4ED8', paddingLeft:16, lineHeight:2 }}>
                <li>Maak een koppeling aan</li>
                <li>Deel de koppelcode met je partner</li>
                <li>Je partner logt in en voert de code in</li>
                <li>Jullie gedeelde doelen en budgetten zijn zichtbaar</li>
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
