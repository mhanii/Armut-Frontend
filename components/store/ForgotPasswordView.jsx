'use client';
import React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { api } from '@/lib/api.js';
import { EMAIL } from '@/lib/validate.js';

export function ForgotPasswordView() {
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [problem, setProblem] = React.useState(null);
  const [sent, setSent] = React.useState(null);
  const emailRef = React.useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL.test(email.trim())) { setProblem('Enter a valid email address.'); emailRef.current?.focus(); return; }
    setProblem(null); setError(null); setBusy(true);
    try { const r = await api.store.forgotPassword(email.trim()); setSent(r.message); }
    catch (err) { setError(err.message || 'Could not send the reset link.'); }
    setBusy(false);
  };

  return (
    <div className="container auth">
      <div className="auth__head">
        <p className="eyebrow">Account recovery</p>
        <h1 className="display-2">Reset your password</h1>
        <p className="auth__lede">Enter the email you signed up with and we&rsquo;ll send a link to choose a new one.</p>
      </div>
      {sent ? (
        <div className="auth__form" role="status">
          <p><strong>Check your inbox.</strong> {sent}</p>
          <p className="meta">The link expires in an hour. Nothing there? Check spam, or try again with a different address.</p>
          <Button variant="outline" fullWidth onClick={() => setSent(null)}>Use a different email</Button>
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <Input
            label="Email" type="email" autoComplete="email" required
            placeholder="you@example.com" ref={emailRef} error={problem}
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <p className="auth__alt">
        Remembered it? <Link href="/login" className="link-btn">Back to sign in</Link>
      </p>
    </div>
  );
}
