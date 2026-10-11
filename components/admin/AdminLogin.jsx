'use client';
import React from 'react';
import { Input } from '@/components/ui/Input.jsx';
import { checkSignin, ok } from '@/lib/validate.js';
import { Button } from '@/components/ui/Button.jsx';

export function AdminLogin({ onLogin, notice }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  // Why the last session ended (expired, suspended), shown until they try again.
  const [error, setError] = React.useState(notice || null);
  const [problems, setProblems] = React.useState({});
  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    // A malformed address cannot be a real account, and sign-in is rate
    // limited to ten attempts per quarter hour — so a typo should not cost
    // one of them, or a round trip, to be told something obvious.
    const found = checkSignin({ email, password });
    setProblems(found);
    if (!ok(found)) {
      setError(null);
      (found.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setError(null); setBusy(true);
    try { await onLogin(email.trim(), password); }
    catch (err) { setProblems({}); setError(err.message || 'Sign in failed.'); setBusy(false); }
  };

  return (
    <main className="console-auth" id="main" tabIndex={-1}>
      <div className="console-auth__inner">
        <div className="console-auth__brand">
          <span className="console-auth__wordmark">Armut</span>
          <p className="eyebrow" style={{ marginTop: 'var(--space-2)' }}>Admin console</p>
        </div>
        <form className="auth__form" onSubmit={submit} noValidate>
          <div className="stack stack--sm">
            <h1 className="display-3">Sign in</h1>
            <p className="meta">Marketplace oversight and site content.</p>
          </div>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <Input label="Work email" type="email" autoComplete="email" required
            placeholder="you@armut.com" ref={emailRef} error={problems.email}
            value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" required ref={passwordRef} error={problems.password}
            value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="auth__alt auth__alt--quiet">
          <a className="link-btn" href="/">Back to the storefront</a>
        </p>
      </div>
    </main>
  );
}
