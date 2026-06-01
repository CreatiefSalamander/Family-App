'use client';

import { useState, useEffect } from 'react';
import { useLang } from '@/lib/lang-context';
import { MapPin, Navigation, Store, Coffee, Fuel, Building2 } from 'lucide-react';

interface Place { naam: string; type: string; afstand: string; icoon: typeof Store; kleur: string; }

const MOCK_PLACES: Place[] = [
  { naam:'Albert Heijn Osdorp', type:'Supermarkt', afstand:'0.4 km', icoon:Store, kleur:'#22C55E' },
  { naam:'ING Bank',            type:'Bank',       afstand:'0.7 km', icoon:Building2, kleur:'#F59E0B' },
  { naam:'Shell Tankstation',   type:'Benzine',    afstand:'1.2 km', icoon:Fuel, kleur:'#EF4444' },
  { naam:'Starbucks',           type:'Koffie',     afstand:'1.5 km', icoon:Coffee, kleur:'#92400E' },
  { naam:'Lidl',                type:'Supermarkt', afstand:'1.8 km', icoon:Store, kleur:'#0179FE' },
];

export default function LocatiePage() {
  const { t } = useLang();
  const [status, setStatus] = useState<'idle'|'loading'|'granted'|'denied'>('idle');
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null);

  function requestLocation() {
    setStatus('loading');
    navigator.geolocation?.getCurrentPosition(
      pos => { setCoords({ lat:pos.coords.latitude, lng:pos.coords.longitude }); setStatus('granted'); },
      ()   => setStatus('denied'),
    );
  }

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">{t.location.title}</h1>
        <p className="header-box-subtext">{t.location.subtitle}</p>
      </div>

      {status === 'idle' && (
        <div className="card" style={{ padding:48, textAlign:'center', marginBottom:24 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <MapPin size={36} color="#0179FE"/>
          </div>
          <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:20, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>
            Locatietoegang nodig
          </h3>
          <p style={{ fontSize:14, color:'#6B7280', marginBottom:24 }}>
            Geef toegang tot je locatie om winkels en diensten in de buurt te zien.
          </p>
          <button className="btn-primary" style={{ width:'auto' }} onClick={requestLocation}>
            <Navigation size={16}/> {t.location.allow}
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <p style={{ fontSize:36, marginBottom:12 }}>📍</p>
          <p style={{ color:'#6B7280' }}>Locatie ophalen...</p>
        </div>
      )}

      {status === 'denied' && (
        <div className="card" style={{ padding:24, background:'#FEF2F2', border:'none' }}>
          <p style={{ fontWeight:600, color:'#DC2626' }}>Locatietoegang geweigerd</p>
          <p style={{ fontSize:13, color:'#EF4444', marginTop:4 }}>Geef locatietoegang via je browserinstellingen.</p>
        </div>
      )}

      {status === 'granted' && coords && (
        <>
          <div className="card" style={{ padding:16, marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Navigation size={20} color="#22C55E"/>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>Locatie gevonden</p>
              <p style={{ fontSize:11, color:'#9CA3AF' }}>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
            </div>
            <span className="badge badge-green" style={{ marginLeft:'auto' }}>Live</span>
          </div>

          {/* Map placeholder */}
          <div className="card" style={{ height:280, marginBottom:24, overflow:'hidden', position:'relative' }}>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.01},${coords.lat-0.01},${coords.lng+0.01},${coords.lat+0.01}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
              style={{ width:'100%', height:'100%', border:'none' }}
              title="Kaart"
            />
          </div>

          {/* Dichtsbijzijnde plekken */}
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>{t.location.nearby}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {MOCK_PLACES.map((p,i)=>(
              <div key={i} className="card card-hover" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:p.kleur+'20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <p.icoon size={20} color={p.kleur}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{p.naam}</p>
                  <p style={{ fontSize:11, color:'#9CA3AF' }}>{p.type}</p>
                </div>
                <span className="badge badge-gray">{p.afstand}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
