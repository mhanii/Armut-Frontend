'use client';
import React from 'react';
import { Input } from '@/components/ui/Input.jsx';
import { checkSignin, ok } from '@/lib/validate.js';
import { Button } from '@/components/ui/Button.jsx';

export function VendorLogin({ onLogin, notice }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  // Why the last session ended (expired, suspended), shown until they try again.
  const [error, setError] = React.useState(notice || null);
  const [problems, setProblems] = React.useState({});
  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  // onSubmit only — the button previously also carried onClick={submit}, which
  // ran the handler twice on every click.
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
          <p className="eyebrow" style={{ marginTop: 'var(--space-2)' }}>Vendor portal</p>
        </div>
        <form className="auth__form" onSubmit={submit} noValidate>
          <div className="stack stack--sm">
            <h1 className="display-3">Sign in to your store</h1>
            <p className="meta">Manage your listings, orders and store profile.</p>
          </div>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <Input label="Email" type="email" autoComplete="email" required
            placeholder="studio@armutmodern.com" ref={emailRef} error={problems.email}
            value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" required ref={passwordRef} error={problems.password}
            value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        {/* Vendors are invited by an admin — there is no self-signup — so this
            points at a real inbox rather than being a span styled like a link
            that did nothing when clicked. */}
        <p className="auth__alt">
          Want to sell on Armut?{' '}
          <a className="link-btn" href="mailto:hello@armut.com?subject=Vendor%20application">Apply to become a vendor</a>
        </p>
        <p className="auth__alt auth__alt--quiet">
          Shopping instead? <a className="link-btn" href="/login">Customer sign in</a>
        </p>
      </div>
    </main>
  );
}
