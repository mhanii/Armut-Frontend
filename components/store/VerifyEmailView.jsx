'use client';
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { api } from '@/lib/api.js';
import { useStore } from './StoreProvider.jsx';

const COOLDOWN = 30; // seconds between resends; the server enforces its own

export function VerifyEmailView() {
  const { verifyEmail } = useStore();
  const email = useSearchParams().get('email') || '';
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [wait, setWait] = React.useState(COOLDOWN);
  const codeRef = React.useRef(null);

  React.useEffect(() => { codeRef.current?.focus(); }, []);
  React.useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) { setError('Enter the 6-digit code from the email.'); codeRef.current?.focus(); return; }
    setError(null); setNotice(null); setBusy(true);
    try { await verifyEmail(email, digits); }
    catch (err) { setError(err.message || 'Could not verify your email.'); setBusy(false); codeRef.current?.focus(); }
  };

  const resend = async () => {
    if (wait > 0) return;
    setError(null); setNotice(null);
    try { await api.store.resendCode(email); setNotice('A new code is on its way.'); setCode(''); }
    catch (err) { setError(err.message || 'Could not send a new code.'); }
    setWait(COOLDOWN);
  };

  if (!email) {
    return (
      <div className="container auth">
        <div className="auth__head"><h1 className="display-2">Confirm your email</h1></div>
        <div className="auth__form" role="alert">
          <p>Start from the sign-up page so we know where to send the code.</p>
          <Link href="/signup" className="btn btn--block">Create an account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth">
      <div className="auth__head">
        <p className="eyebrow">One last step</p>
        <h1 className="display-2">Confirm your email</h1>
        <p className="auth__lede">We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.</p>
      </div>
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        {notice && <div className="alert" role="status">{notice}</div>}
        <Input
          label="Verification code" type="text" inputMode="numeric" autoComplete="one-time-code"
          maxLength={9} placeholder="123456" ref={codeRef} required
          value={code} onChange={e => setCode(e.target.value)}
        />
        <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
          {busy ? 'Checking…' : 'Confirm and continue'}
        </Button>
      </form>
      <p className="auth__alt">
        Nothing there? Check spam, then{' '}
        <button type="button" className="link-btn" onClick={resend} disabled={wait > 0}>
          {wait > 0 ? `resend the code in ${wait}s` : 'resend the code'}
        </button>.
      </p>
      <p className="auth__alt auth__alt--quiet">
        Wrong address? <Link href="/signup" className="link-btn">Start over</Link>
      </p>
    </div>
  );
}
