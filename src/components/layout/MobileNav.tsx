'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  { href:'/jaaroverzicht', icon:BarChart2,    label:'Jaaro..'     },
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
  { icon:Camera,   label:'Bon scannen',   href:'/transacties?bon=1' },
  { icon:FileText, label:'Transactie',    href:'/transacties?nieuw=1' },
  { icon:Wallet,   label:'Kasboek',       href:'/kasboek' },
  { icon:Target,   label:'Storting doel', href:'/doelen' },
];

export default function MobileNav() {
  const path   = usePathname();
  const router = useRouter();
  const [snelOpen, setSnelOpen] = useState(false);
  const [meerOpen, setMeerOpen] = useState(false);

  return (
    <>
      {/* ── Overlay bij snelle acties / meer menu ──────── */}
      {(snelOpen || meerOpen) && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:48, backdropFilter:'blur(4px)' }}
          onClick={() => { setSnelOpen(false); setMeerOpen(false); }}
        />
      )}

      {/* ── Snelle acties sheet ──────────────────────────── */}
      {snelOpen && (
        <div style={{
          position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)',
          background:'#1A2234', borderRadius:20, padding:20, zIndex:49,
          width:'calc(100vw - 48px)', maxWidth:400,
          boxShadow:'0 -8px 40px rgba(0,0,0,.4)',
          animation:'slideUp .25s ease',
        }}>
          <p style={{ fontSize:12, color:'#6B7280', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>
            SNELLE ACTIE
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {SNEL_ACTIES.map(a => (
              <Link key={a.label} href={a.href} onClick={() => setSnelOpen(false)} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,.1)' }}>
                  <a.icon size={22} color="#E5E7EB"/>
                </div>
                <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Meer paginas sheet ───────────────────────────── */}
      {meerOpen && (
        <div style={{
          position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)',
          background:'#1A2234', borderRadius:20, padding:20, zIndex:49,
          width:'calc(100vw - 48px)', maxWidth:400,
          boxShadow:'0 -8px 40px rgba(0,0,0,.4)',
          animation:'slideUp .25s ease',
          maxHeight:'70vh', overflowY:'auto',
        }}>
          <p style={{ fontSize:12, color:'#6B7280', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>
            ALLE PAGINA&apos;S
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {MEER_ITEMS.map(item => {
              const active = path === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMeerOpen(false)} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{
                    width:52, height:52, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
                    background: active ? 'linear-gradient(135deg,#0179FE,#4893FF)' : 'rgba(255,255,255,.08)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,.1)',
                  }}>
                    <item.icon size={22} color={active ? '#fff' : '#9CA3AF'}/>
                  </div>
                  <span style={{ fontSize:10, color: active ? '#60A5FA' : '#9CA3AF', fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Floating action bar ──────────────────────────── */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 16, left: 16, right: 16,
        height: 64,
        background: '#111827',
        borderRadius: 24,
        zIndex: 50,
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 8px 32px rgba(0,0,0,.35)',
        border: '1px solid rgba(255,255,255,.08)',
      }}>
        {/* Links: Home + Transacties + Begroting */}
        {MAIN_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:3, padding:'6px 4px', textDecoration:'none',
              color: active ? '#60A5FA' : '#6B7280', transition:'color .15s', minHeight:52,
            }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8}/>
              <span style={{ fontSize:9, fontWeight: active ? 700 : 500, fontFamily:"'Inter',sans-serif", letterSpacing:'.01em' }}>{label}</span>
            </Link>
          );
        })}

        {/* Midden: + FAB */}
        <button onClick={() => { setSnelOpen(!snelOpen); setMeerOpen(false); }} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:3, padding:'6px 4px', border:'none', cursor:'pointer', background:'transparent',
        }}>
          <div style={{
            width:46, height:46, borderRadius:16, border:'none',
            background: snelOpen ? '#EF4444' : 'linear-gradient(135deg,#0179FE,#4893FF)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 16px rgba(1,121,254,.4)', transition:'all .2s',
            marginBottom:2,
          }}>
            {snelOpen ? <X size={22} color="white"/> : <Plus size={24} color="white"/>}
          </div>
        </button>

        {/* Meer menu */}
        <button onClick={() => { setMeerOpen(!meerOpen); setSnelOpen(false); }} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:3, padding:'6px 4px', border:'none', cursor:'pointer', background:'transparent',
          color: meerOpen ? '#60A5FA' : '#6B7280',
        }}>
          {meerOpen ? <X size={22}/> : <MoreHorizontal size={22} strokeWidth={1.8}/>}
          <span style={{ fontSize:9, fontWeight:500, fontFamily:"'Inter',sans-serif" }}>Meer</span>
        </button>
      </nav>

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateX(-50%) translateY(20px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
