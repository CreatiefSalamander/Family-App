'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function LocatiePage() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [asked, setAsked] = useState(false);

  function requestLocation() {
    setAsked(true);
    if (!navigator.geolocation) { setError('Locatie niet beschikbaar in deze browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError('Locatie toegang geweigerd. Sta toe in je browser.'),
      { timeout: 10000 }
    );
  }

  const mapsUrl = pos
    ? `https://www.google.com/maps/embed/v1/search?key=&q=supermarkt+tankstation&center=${pos.lat},${pos.lng}&zoom=14`
    : '';

  return (
    <div className="px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
          <MapPin size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Locatie</h1>
          <p className="text-sm text-gray-400">Dichtstbijzijnde supermarkten en tankstations</p>
        </div>
      </div>

      {!asked ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-5">
            <Navigation size={28} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">Locatie gebruiken</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Family-App gebruikt je locatie om dichtstbijzijnde supermarkten, tankstations
            en geldautomaten te tonen.
          </p>
          <button onClick={requestLocation} className="btn-primary px-8 py-3">
            Locatie toestaan
          </button>
        </div>
      ) : error ? (
        <div className="card p-8 text-center max-w-md mx-auto">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button onClick={requestLocation} className="btn-primary px-6 py-2.5 text-sm">Opnieuw proberen</button>
        </div>
      ) : !pos ? (
        <div className="card p-12 text-center">
          <div className="w-10 h-10 border-4 border-[#0179FE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Locatie ophalen...</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Supermarkten', emoji: '🛒', desc: 'AH, Jumbo, Lidl' },
              { label: 'Tankstations', emoji: '⛽', desc: 'Shell, BP, Tango' },
              { label: 'Geldautomaten', emoji: '💳', desc: 'ING, Rabobank, ABN' },
            ].map(item => (
              <div key={item.label} className="card p-5 text-center hover:border-[#0179FE] cursor-pointer transition-colors card-hover">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Kaart in de buurt</h3>
              <p className="text-xs text-gray-400">{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</p>
            </div>
            <div className="bg-gray-100 h-72 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={32} className="text-[#0179FE] mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Locatie gevonden</p>
                <p className="text-xs text-gray-400 mt-1">Verbind een Google Maps API key voor de kaart</p>
                <a href={`https://maps.google.com/?q=supermarkt&near=${pos.lat},${pos.lng}`}
                  target="_blank" rel="noreferrer"
                  className="mt-3 inline-block text-xs text-[#0179FE] hover:underline font-medium">
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
