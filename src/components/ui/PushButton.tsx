'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { subscribeToPush, savePushSubscription, unsubscribeFromPush, getPushStatus } from '@/lib/push-web';

type Status = 'loading' | 'unsupported' | 'supported' | 'granted' | 'denied';

interface Props {
  /** Compact kleine knop (voor in sidebar/topbar) of grote knop (instellingen) */
  variant?: 'compact' | 'full';
}

export default function PushButton({ variant = 'full' }: Props) {
  const [status,  setStatus]  = useState<Status>('loading');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const sb = createClient();

  useEffect(() => {
    setStatus(getPushStatus() as Status);
  }, []);

  async function inschrijven() {
    setLoading(true);
    setMessage('');
    try {
      const sub = await subscribeToPush();
      if (!sub) {
        setStatus('denied');
        setMessage('Toestemming geweigerd of niet ondersteund.');
        return;
      }

      const { data: { user } } = await sb.auth.getUser();
      if (user) await savePushSubscription(sub, user.id);

      setStatus('granted');
      setMessage('✅ Push notificaties ingeschakeld!');
    } catch (err) {
      setMessage('Fout: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function uitschrijven() {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setStatus('supported');
      setMessage('Push notificaties uitgeschakeld.');
    } catch {
      setMessage('Kon niet uitschrijven.');
    } finally {
      setLoading(false);
    }
  }

  async function testNotificatie() {
    setLoading(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const resp = await fetch('/api/push/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId: user.id,
          title:  '🔔 Test notificatie',
          body:   'Push notificaties werken correct op Household!',
          url:    '/home',
          tag:    'test',
        }),
      });
      const data = await resp.json();
      setMessage(data.verzonden > 0 ? `✅ Testbericht verstuurd!` : `⚠️ ${data.reason || data.error || 'Geen tokens'}`);
    } catch (err) {
      setMessage('Fout: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Compact variant (kleine knop) ─────────────────────── */
  if (variant === 'compact') {
    if (status === 'loading' || status === 'unsupported') return null;
    return (
      <button
        onClick={status === 'granted' ? uitschrijven : inschrijven}
        disabled={loading}
        data-tip={status === 'granted' ? 'Notificaties aan — klik om uit te zetten' : 'Schakel push notificaties in'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: status === 'granted' ? '#22C55E' : '#9CA3AF',
          padding: 4, display: 'flex', alignItems: 'center',
        }}
      >
        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> :
         status === 'granted' ? <BellRing size={18}/> : <Bell size={18}/>}
      </button>
    );
  }

  /* ── Full variant (instellingen pagina) ─────────────────── */
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36' }}>Browser push notificaties</p>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {status === 'unsupported' && 'Niet ondersteund in deze browser'}
            {status === 'granted'     && 'Actief — je ontvangt meldingen'}
            {status === 'denied'      && 'Geblokkeerd — wijzig in browserinstellingen'}
            {status === 'supported'   && 'Uitgeschakeld — klik om in te schakelen'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status indicator */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'granted' ? '#22C55E' : status === 'denied' ? '#EF4444' : '#D1D5DB' }}/>

          {status === 'granted' && (
            <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={uitschrijven} disabled={loading}>
              <BellOff size={14}/> Uitschakelen
            </button>
          )}
          {(status === 'supported') && (
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={inschrijven} disabled={loading}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Bell size={14}/>}
              Inschakelen
            </button>
          )}
          {status === 'denied' && (
            <span className="badge badge-red">Geblokkeerd</span>
          )}
        </div>
      </div>

      {/* Test knop (alleen als ingeschakeld) */}
      {status === 'granted' && (
        <button className="btn-ghost" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={testNotificatie} disabled={loading}>
          <BellRing size={14}/> Test notificatie sturen
        </button>
      )}

      {/* Feedback bericht */}
      {message && (
        <p style={{ fontSize: 12, color: message.startsWith('✅') ? '#16A34A' : '#6B7280', marginTop: 8 }}>
          {message}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
