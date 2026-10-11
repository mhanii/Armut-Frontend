'use client';
import React from 'react';
import { ArmutConfig, CAN_OVERRIDE } from '@/lib/config.js';

// Dev tool: floating pill (bottom-right) to switch between mock fixtures and a
// live API. It renders nothing in a production build unless
// NEXT_PUBLIC_ENABLE_API_SWITCH=true, so it never ships to real shoppers.
export function EnvSwitch() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [mode, setMode] = React.useState('mock');
  const [url, setUrl] = React.useState('');
  React.useEffect(() => { setMounted(true); setMode(ArmutConfig.mode); setUrl(ArmutConfig.baseUrl); }, []);
  if (!CAN_OVERRIDE || !mounted) return null;

  const live = mode === 'live';
  const dot = live ? '#5ad18a' : '#e8b45a';
  const apply = () => {
    if (mode === 'live' && !url.trim()) return;
    ArmutConfig.apply(mode, url);
  };

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 99999, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: 12 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: 'none', borderRadius: 999, background: '#1d1915', color: '#f5efe6', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.25)', font: 'inherit' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />API: {live ? 'Live' : 'Mock'}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, bottom: 44, width: 280, padding: 16, background: '#1d1915', color: '#f5efe6', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,.35)' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10, color: '#b8ac9c' }}>Data source</p>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
            <input type="radio" name="aes-mode" value="mock" checked={!live} onChange={() => setMode('mock')} /> Mock data (built-in)
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, cursor: 'pointer' }}>
            <input type="radio" name="aes-mode" value="live" checked={live} onChange={() => setMode('live')} /> Live API
          </label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.yourdomain.com" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1px solid #3d362e', background: '#2a251f', color: '#f5efe6', font: 'inherit', marginBottom: 12 }} />
          <button type="button" onClick={apply} style={{ width: '100%', padding: '8px 0', border: 'none', borderRadius: 8, background: '#bd7a50', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>Apply &amp; reload</button>
          <button type="button" onClick={() => ArmutConfig.reset()} style={{ width: '100%', marginTop: 8, padding: '6px 0', border: '1px solid #3d362e', borderRadius: 8, background: 'transparent', color: '#b8ac9c', font: 'inherit', cursor: 'pointer' }}>Reset to build default{ArmutConfig.envUrl ? ' (live)' : ' (mock)'}</button>
        </div>
      )}
    </div>
  );
}
