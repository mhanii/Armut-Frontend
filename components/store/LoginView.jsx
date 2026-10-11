'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input.jsx';
import { checkSignin, ok } from '@/lib/validate.js';
import { Button } from '@/components/ui/Button.jsx';
import { useStore } from './StoreProvider.jsx';

export function LoginView() {
  const { login, user, hydrated } = useStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [problems, setProblems] = React.useState({});
  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  // Already signed in: this form can only create a second session, so send
  // them where the signed-in version of this page lives. Skipped while a
  // submit is in flight — a successful one navigates on its own.
  const router = useRouter();
  React.useEffect(() => {
    if (hydrated && user && !busy) router.replace('/account');
  }, [hydrated, user, busy, router]);

  // The form's onSubmit is the only entry point. Previously the submit button
  // also carried onClick={submit}, so a click fired it twice — and the `busy`
  // guard read a stale closure, so both calls went through. On signup that
  // meant the account was created and the duplicate then failed with 409.
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
    try { await login(email.trim(), password); }
    catch (err) {
      // Right password, but the address was never confirmed: the server has
      // just emailed a fresh code, so go and enter it.
      if (err.status === 403 && err.code === 'email_unverified') { router.push('/verify-email?email=' + encodeURIComponent(email.trim()) + '&sent=1'); return; }
      setProblems({}); setError(err.message || 'Sign in failed.'); setBusy(false);
    }
  };

  return (
    <div className="container auth">
      <div className="auth__head">
        <p className="eyebrow">Welcome back</p>
        <h1 className="display-2">Sign in to Armut</h1>
      </div>
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <Input
          label="Email" type="email" autoComplete="email" required
          placeholder="you@example.com" ref={emailRef} error={problems.email}
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <Input
          label="Password" type="password" autoComplete="current-password" required
          ref={passwordRef} error={problems.password}
          value={password} onChange={e => setPassword(e.target.value)}
        />
        <p className="auth__forgot"><Link href="/forgot-password" className="link-btn">Forgot password?</Link></p>
        <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="auth__alt">
        New to Armut? <Link href="/signup" className="link-btn">Create an account</Link>
      </p>
      {/* Vendor and staff accounts live in their own consoles and are not in
          the customer table, so signing in here with one returns "Incorrect
          email or password" — accurate, but it reads as a broken account.
          Saying where those accounts sign in costs nothing and removes the
          dead end. */}
      <p className="auth__alt auth__alt--quiet">
        Selling on Armut? <Link href="/vendor" className="link-btn">Go to the vendor portal</Link>
      </p>
    </div>
  );
}
