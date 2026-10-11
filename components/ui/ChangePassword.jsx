'use client';
import React from 'react';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { MIN_PASSWORD } from '@/lib/validate.js';

// Shared by the shop account page and both consoles. `onChange(current, next)`
// does the request and throws on failure; this owns the form and its messages.
export function ChangePassword({ onChange, flash, headingId = 'pw-head' }) {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [problems, setProblems] = React.useState({});
  const refs = { current: React.useRef(null), next: React.useRef(null), confirm: React.useRef(null) };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const found = {};
    if (!current) found.current = 'Enter your current password.';
    else if (next.length < MIN_PASSWORD) found.next = `Use at least ${MIN_PASSWORD} characters.`;
    else if (next === current) found.next = 'Choose a password different from the current one.';
    else if (confirm !== next) found.confirm = 'The two passwords do not match.';
    setProblems(found);
    const first = ['current', 'next', 'confirm'].find(k => found[k]);
    if (first) { refs[first].current?.focus(); return; }
    setError(null); setBusy(true);
    try {
      await onChange(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      flash && flash('Password updated');
    } catch (err) {
      if (err.code === 'wrong_password') { setProblems({ current: err.message }); refs.current.current?.focus(); }
      else setError(err.message || 'Could not change your password.');
    }
    setBusy(false);
  };

  return (
    <form className="stack" onSubmit={submit} noValidate aria-labelledby={headingId}>
      <h2 className="pdp__fact-label" id={headingId}>Change password</h2>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <Input label="Current password" type="password" autoComplete="current-password" required
        ref={refs.current} error={problems.current} value={current} onChange={e => setCurrent(e.target.value)} />
      <Input label="New password" type="password" autoComplete="new-password" required
        minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`}
        ref={refs.next} error={problems.next} value={next} onChange={e => setNext(e.target.value)} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" required
        ref={refs.confirm} error={problems.confirm} value={confirm} onChange={e => setConfirm(e.target.value)} />
      <div><Button type="submit" variant="dark" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button></div>
    </form>
  );
}
