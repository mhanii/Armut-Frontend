// Checks the browser can make without asking the server.
//
// Sign-up validated entirely server-side, one rule at a time: an empty form
// cost a request to be told the name was missing, a bad email cost another,
// a short password a third. Each mistake was a round trip that revealed
// exactly one problem — and the browser knew all three before the first one
// was sent.
//
// These run first and report everything at once. The server still runs its
// own: this is a convenience, never the authority, and the things only the
// server can know — whether an email is already registered, whether a
// password is right — stay with it.

// Deliberately the same shape the API uses, so the two cannot disagree about
// what an address is. Anything stricter rejects addresses that are legal.
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD = 6;

export function checkSignup({ name, email, password }) {
  const out = {};
  if (!String(name || '').trim()) out.name = 'Enter your full name.';
  if (!EMAIL.test(String(email || '').trim())) out.email = 'Enter a valid email address.';
  if (String(password || '').length < MIN_PASSWORD) out.password = `Use at least ${MIN_PASSWORD} characters.`;
  return out;
}

export function checkSignin({ email, password }) {
  const out = {};
  if (!EMAIL.test(String(email || '').trim())) out.email = 'Enter a valid email address.';
  // Not the length rule: an existing account may predate it, and telling
  // someone their own password is too short when it is merely wrong would be
  // both confusing and a hint worth withholding.
  if (!String(password || '')) out.password = 'Enter your password.';
  return out;
}

// True when nothing is wrong.
export const ok = (problems) => Object.keys(problems).length === 0;
