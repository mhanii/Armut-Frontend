#!/usr/bin/env bash
# Checkout must survive every SMTP failure mode: an order that has been
# committed can never be reported to the customer as failed.
set -u
cd "$(dirname "$0")" >/dev/null
BACKEND=${BACKEND:-/home/hani/armut-frontend/backend}
DATA=${DATA:-$(mktemp -d)}
pass=0; fail=0
PORT_T=$(python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()")
cd "$BACKEND"
[ -f "$DATA/armut.db" ] || DATA_DIR="$DATA" node src/seed.js >/dev/null 2>&1

try() {
  local label="$1"; shift
  local P=$(ss -lntp 2>/dev/null | grep ":$PORT_T" | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -1); [ -n "$P" ] && kill $P; sleep 0.8
  (env DATA_DIR="$DATA" UPLOAD_DIR="$DATA/uploads" PORT="$PORT_T" "$@" node src/server.js >/dev/null 2>&1 &)
  # Wait properly: without a delay these 40 attempts burn through in
  # milliseconds and the suite starts testing before the API is listening.
  for i in $(seq 1 60); do curl -sf http://localhost:$PORT_T/health >/dev/null 2>&1 && break; sleep 0.25; done
  if ! curl -sf http://localhost:$PORT_T/health >/dev/null 2>&1; then
    fail=$((fail+1)); echo "  FAIL $label → API never came up"; return
  fi
  local B=http://localhost:$PORT_T/api/v1
  local TOK=$(curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d '{"email":"ada@example.com","password":"client123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])' 2>/dev/null)
  local ID=$(curl -s -H "Authorization: Bearer $TOK" $B/addresses | python3 -c 'import sys,json;print(json.load(sys.stdin)["addresses"][0]["id"])' 2>/dev/null)
  if [ -z "$TOK" ] || [ -z "$ID" ]; then
    fail=$((fail+1)); echo "  FAIL $label → could not sign in / load an address (setup, not the assertion)"; return
  fi
  local CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d "{\"items\":[{\"productId\":1,\"qty\":1}],\"addressId\":$ID}" $B/orders)
  if [ "$CODE" = "200" ]; then pass=$((pass+1)); echo "  ok   order placed despite: $label"; else fail=$((fail+1)); echo "  FAIL $label → HTTP $CODE"; fi
}

try "no SMTP configured"         SMTP_HOST=
try "unreachable SMTP host"      SMTP_HOST=127.0.0.1 SMTP_PORT=9 MAIL_FROM=a@b.c ADMIN_NOTIFY_EMAILS=ops@x.test
try "non-numeric SMTP port"      SMTP_HOST=smtp.invalid SMTP_PORT=not-a-number MAIL_FROM=a@b.c ADMIN_NOTIFY_EMAILS=ops@x.test
try "unresolvable SMTP host"     SMTP_HOST=nope.invalid.example SMTP_PORT=587 MAIL_FROM=a@b.c ADMIN_NOTIFY_EMAILS=ops@x.test
try "no admin recipients"        SMTP_HOST=127.0.0.1 SMTP_PORT=9 MAIL_FROM=a@b.c ADMIN_NOTIFY_EMAILS=

P=$(ss -lntp 2>/dev/null | grep ":$PORT_T" | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -1); [ -n "$P" ] && kill $P
echo; echo "passed: $pass  failed: $fail"
[ "$fail" = "0" ]
