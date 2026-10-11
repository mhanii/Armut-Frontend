'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useStore } from './StoreProvider.jsx';
import { checkSignup, ok, MIN_PASSWORD } from '@/lib/validate.js';

export function SignupView() {
  const { signup, user, hydrated } = useStore();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [problems, setProblems] = React.useState({});
  const nameRef = React.useRef(null);
  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  // Already signed in: this form can only create a second session, so send
  // them where the signed-in version of this page lives. Skipped while a
  // submit is in flight — a successful one navigates on its own.
  const router = useRouter();
  React.useEffect(() => {
    if (hydrated && user && !busy) router.replace('/account');
  }, [hydrated, user, busy, router]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    // Everything the browser can tell, told at once. Previously each of these
    // was a separate request that reported one problem and stopped, so three
    // mistakes meant three round trips to discover them one at a time.
    const found = checkSignup({ name, email, password });
    setProblems(found);
    if (!ok(found)) {
      setError(null);
      (found.name ? nameRef : found.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setError(null); setBusy(true);
    try { await signup({ name: name.trim(), email: email.trim(), password }); }
    catch (err) {
      // The server knows one thing the browser cannot: whether this address is
      // already registered. That belongs on the email field, not in a banner
      // the reader has to connect to a field themselves.
      if (err.status === 409) {
        setProblems({ email: err.message || 'An account with that email already exists.' });
        emailRef.current?.focus();
      } else {
        setError(err.message || 'Could not create your account.');
      }
      setBusy(false);
    }
  };

  return (
    <div className="container auth">
      <div className="auth__head">
        <p className="eyebrow">Join Armut</p>
        <h1 className="display-2">Create your account</h1>
      </div>
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <Input
          label="Full name" type="text" autoComplete="name" required
          placeholder="Ada Lovelace" ref={nameRef} error={problems.name}
          value={name} onChange={e => setName(e.target.value)}
        />
        <Input
          label="Email" type="email" autoComplete="email" required
          placeholder="you@example.com" ref={emailRef} error={problems.email}
          value={email} onChange={e => setEmail(e.target.value)}
        />
        {/* The requirement is a hint, not a placeholder — a placeholder
            disappears the moment you start typing, which is exactly when you
            need to know how long the password has to be. */}
        <Input
          label="Password" type="password" autoComplete="new-password" required
          minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`}
          ref={passwordRef} error={problems.password}
          value={password} onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="auth__alt">
        Already have an account? <Link href="/login" className="link-btn">Sign in</Link>
      </p>
    </div>
  );
}
