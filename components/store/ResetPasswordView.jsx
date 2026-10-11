'use client';
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { MIN_PASSWORD } from '@/lib/validate.js';
import { useStore } from './StoreProvider.jsx';

export function ResetPasswordView() {
  const { resetPassword } = useStore();
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [problems, setProblems] = React.useState({});
  const pwRef = React.useRef(null);
  const confirmRef = React.useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const found = {};
    if (password.length < MIN_PASSWORD) found.password = `Use at least ${MIN_PASSWORD} characters.`;
    else if (confirm !== password) found.confirm = 'The two passwords do not match.';
    setProblems(found);
    if (found.password) { pwRef.current?.focus(); return; }
    if (found.confirm) { confirmRef.current?.focus(); return; }
    setError(null); setBusy(true);
    try { await resetPassword(token, password); }
    catch (err) { setError(err.message || 'Could not reset your password.'); setBusy(false); }
  };

  return (
    <div className="container auth">
      <div className="auth__head">
        <p className="eyebrow">Account recovery</p>
        <h1 className="display-2">Choose a new password</h1>
      </div>
      {!token ? (
        <div className="auth__form" role="alert">
          <p>This page needs the link from your reset email. Links work once and expire after an hour.</p>
          <Link href="/forgot-password" className="btn btn--block">Send a new link</Link>
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          {error && (
            <div className="alert alert--error" role="alert">
              {error} <Link href="/forgot-password" className="link-btn">Request a new link</Link>
            </div>
          )}
          <Input
            label="New password" type="password" autoComplete="new-password" required
            minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`}
            ref={pwRef} error={problems.password}
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <Input
            label="Confirm new password" type="password" autoComplete="new-password" required
            ref={confirmRef} error={problems.confirm}
            value={confirm} onChange={e => setConfirm(e.target.value)}
          />
          <Button type="submit" variant="dark" fullWidth size="lg" disabled={busy}>
            {busy ? 'Saving…' : 'Save and sign in'}
          </Button>
        </form>
      )}
    </div>
  );
}
