'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ArrowLeftRight, PieChart, Plus, X,
  Camera, FileText, Wallet, Target, MoreHorizontal,
  TrendingDown, Briefcase, BarChart2, Search,
  MapPin, Settings, Upload, Bitcoin, Plane, Users,
} from 'lucide-react';

const MAIN_ITEMS = [
  { href:'/home',        icon:Home,           label:'Home'        },
  { href:'/transacties', icon:ArrowLeftRight, label:'Transacties' },
  { href:'/begroting',   icon:PieChart,       label:'Begroting'   },
];

const MEER_ITEMS = [
  { href:'/schulden',      icon:TrendingDown, label:'Schulden'    },
  { href:'/doelen',        icon:Target,       label:'Doelen'      },
  { href:'/zakelijk',      icon:Briefcase,    label:'Zakelijk'    },
  { href:'/jaaroverzicht', icon:BarChart2,    label:'Jaaroverzicht'},
  { href:'/crypto',        icon:Bitcoin,      label:'Crypto'      },
  { href:'/reizen',        icon:Plane,        label:'Reizen'      },
  { href:'/prijsradar',    icon:Search,       label:'Prijsradar'  },
  { href:'/locatie',       icon:MapPin,       label:'Locatie'     },
  { href:'/gezin',         icon:Users,        label:'Gezin'       },
  { href:'/import',        icon:Upload,       label:'Import'      },
  { href:'/kasboek',       icon:Wallet,       label:'Kasboek'     },
  { href:'/rekeningen',    icon:Wallet,       label:'Rekeningen'  },
  { href:'/instellingen',  icon:Settings,     label:'Instellingen'},
];

const SNEL_ACTIES = [
  { icon:Camera,   label:'Bon scannen',   href:'/transacties?bon=1',  color:'#0179FE' },
  { icon:FileText, label:'Transactie',    href:'/transacties?nieuw=1', color:'#8B5CF6' },
  { icon:Wallet,   label:'Kasboek',       href:'/kasboek',             color:'#22C55E' },
  { icon:Target,   label:'Doel storting', href:'/doelen',              color:'#F59E0B' },
];

export default function MobileNav() {
  const path = usePathname();
  const [snelOpen, setSnelOpen] = useState(false);
  const [meerOpen, setMeerOpen] = useState(false);

  const sluitAlles = () => { setSnelOpen(false); setMeerOpen(false); };

  return (
    <>
      {/* ── Dimoverlay ─────────────────────────────────────── */}
      {(snelOpen || meerOpen) && (
        <div
          onClick={sluitAlles}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:48, backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)' }}
        />
      )}

      {/* ── Snelle acties sheet ─────────────────────────────── */}
      {snelOpen && (
        <div style={{
          position:'fixed', bottom:88, left:12, right:12, zIndex:49,
          background:'rgba(17,24,39,.96)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,.1)',
          borderRadius:20, padding:'16px 16px 18px',
          boxShadow:'0 -4px 40px rgba(0,0,0,.5)',
          animation:'sheetUp .28s cubic-bezier(.16,1,.3,1)',
        }}>
          {/* Handle */}
          <div style={{ width:32, height:4, borderRadius:2, background:'rgba(255,255,255,.15)', margin:'0 auto 14px' }} />
          <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>
            SNELLE ACTIE
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {SNEL_ACTIES.map(a => (
              <Link key={a.label} href={a.href} onClick={sluitAlles} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:7 }}>
                <div style={{
                  width:54, height:54, borderRadius:18,
                  background:`rgba(${hexToRgb(a.color)},.12)`,
                  border:`1px solid rgba(${hexToRgb(a.color)},.25)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <a.icon size={22} color={a.color} strokeWidth={2}/>
                </div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,.6)', fontWeight:600, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Meer pagina's sheet ──────────────────────────────── */}
      {meerOpen && (
        <div style={{
          position:'fixed', bottom:88, left:12, right:12, zIndex:49,
          background:'rgba(17,24,39,.96)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,.1)',
          borderRadius:20, padding:'16px 16px 18px',
          boxShadow:'0 -4px 40px rgba(0,0,0,.5)',
          animation:'sheetUp .28s cubic-bezier(.16,1,.3,1)',
          maxHeight:'72vh', overflowY:'auto',
        }}>
          <div style={{ width:32, height:4, borderRadius:2, background:'rgba(255,255,255,.15)', margin:'0 auto 14px' }} />
          <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>
            ALLE PAGINA&apos;S
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {MEER_ITEMS.map(item => {
              const active = path === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={sluitAlles}
                  style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:7 }}>
                  <div style={{
                    width:54, height:54, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center',
                    background: active ? 'linear-gradient(135deg,#0179FE,#4893FF)' : 'rgba(255,255,255,.07)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,.08)',
                    boxShadow: active ? '0 4px 14px rgba(1,121,254,.35)' : 'none',
                    transition:'all .2s',
                  }}>
                    <item.icon size={20} color={active ? '#fff' : 'rgba(255,255,255,.5)'} strokeWidth={active ? 2.5 : 1.8}/>
                  </div>
                  <span style={{ fontSize:9.5, color: active ? '#60A5FA' : 'rgba(255,255,255,.45)', fontWeight: active ? 700 : 500, textAlign:'center', lineHeight:1.3 }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom navigation bar ───────────────────────────── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:50,
          paddingBottom:'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Glassmorphism pill */}
        <div style={{
          margin:'0 12px 10px',
          height:62,
          background:'rgba(17,24,39,.88)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          borderRadius:22,
          border:'1px solid rgba(255,255,255,.1)',
          boxShadow:'0 8px 32px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.06) inset',
          display:'flex', alignItems:'center',
        }}>

          {/* Hoofd-items links */}
          {MAIN_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = path === href || path.startsWith(href + '/');
            return (
              <Link key={href} href={href} style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:3, padding:'8px 4px', textDecoration:'none', position:'relative',
                color: active ? '#60A5FA' : 'rgba(255,255,255,.4)',
                transition:'color .18s',
              }}>
                {/* Actieve indicatordot bovenaan — zoals reference */}
                {active && (
                  <div style={{
                    position:'absolute', top:6, left:'50%', transform:'translateX(-50%)',
                    width:4, height:4, borderRadius:'50%',
                    background:'linear-gradient(135deg,#0179FE,#60A5FA)',
                    boxShadow:'0 0 6px rgba(1,121,254,.8)',
                  }} />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ marginTop: active ? 4 : 0 }}/>
                <span style={{ fontSize:9.5, fontWeight: active ? 700 : 500, fontFamily:"'Inter',sans-serif", letterSpacing:'.01em' }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* FAB — snelle acties */}
          <button
            onClick={() => { setSnelOpen(v => !v); setMeerOpen(false); }}
            style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:3, padding:'4px', border:'none', cursor:'pointer', background:'transparent',
            }}
          >
            <div style={{
              width:44, height:44, borderRadius:15,
              background: snelOpen ? 'rgba(239,68,68,.9)' : 'linear-gradient(135deg,#0179FE,#4893FF)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: snelOpen ? '0 4px 14px rgba(239,68,68,.4)' : '0 4px 16px rgba(1,121,254,.45)',
              transition:'all .22s cubic-bezier(.34,1.56,.64,1)',
              transform: snelOpen ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
            }}>
              {snelOpen ? <X size={20} color="#fff" strokeWidth={2.5}/> : <Plus size={22} color="#fff" strokeWidth={2.5}/>}
            </div>
          </button>

          {/* Meer menu */}
          <button
            onClick={() => { setMeerOpen(v => !v); setSnelOpen(false); }}
            style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:3, padding:'8px 4px', border:'none', cursor:'pointer', background:'transparent',
              color: meerOpen ? '#60A5FA' : 'rgba(255,255,255,.4)',
              position:'relative', transition:'color .18s',
            }}
          >
            {meerOpen && (
              <div style={{
                position:'absolute', top:6, left:'50%', transform:'translateX(-50%)',
                width:4, height:4, borderRadius:'50%',
                background:'linear-gradient(135deg,#0179FE,#60A5FA)',
                boxShadow:'0 0 6px rgba(1,121,254,.8)',
              }} />
            )}
            {meerOpen
              ? <X size={20} strokeWidth={2.5} style={{ marginTop: 4 }}/>
              : <MoreHorizontal size={20} strokeWidth={1.8}/>
            }
            <span style={{ fontSize:9.5, fontWeight: meerOpen ? 700 : 500, fontFamily:"'Inter',sans-serif" }}>Meer</span>
          </button>

        </div>
      </nav>

      <style>{`
        @keyframes sheetUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  );
}

/* Helper: hex kleur naar r,g,b getallen (voor rgba()) */
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}
