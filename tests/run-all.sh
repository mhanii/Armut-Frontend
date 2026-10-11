#!/usr/bin/env bash
# Run every suite against a throwaway database and a local SMTP sink.
# Usage:  ./tests/run-all.sh            (starts its own API on :4111)
#         BASE=https://api.example.com ./tests/run-all.sh   (test a deployment;
#                                       skips the suites that need to restart it)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$HERE/../backend"
BASE="${BASE:-}"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
total_fail=0
run() { echo; echo "═══ $1 ═══"; shift; bash "$@"; [ $? -eq 0 ] || total_fail=$((total_fail+1)); }
runpy() { echo; echo "═══ $1 ═══"; shift; python3 "$@"; [ $? -eq 0 ] || total_fail=$((total_fail+1)); }

if [ -z "$BASE" ]; then
  # Pick free ports so a stray process from an earlier run cannot make the
  # suites read the wrong mail log (a silent bind failure looked like a bug).
  free_port() {
    python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()"
  }
  API_PORT=$(free_port); SMTP_PORT_T=$(free_port)
  echo "Starting a throwaway API on :$API_PORT (SMTP sink on :$SMTP_PORT_T) …"
  ( cd "$BACKEND" && DATA_DIR="$TMP/data" node src/seed.js >/dev/null 2>&1 )

  node "$HERE/smtp-sink.js" "$SMTP_PORT_T" "$TMP/mail.log" >"$TMP/sink.log" 2>&1 &
  SINK_PID=$!
  for i in $(seq 1 40); do grep -q "sink listening" "$TMP/sink.log" 2>/dev/null && break; sleep 0.1; done
  if ! kill -0 "$SINK_PID" 2>/dev/null || ! grep -q "sink listening" "$TMP/sink.log" 2>/dev/null; then
    echo "FATAL: the SMTP sink could not start — email assertions would silently pass or read a stale log."
    cat "$TMP/sink.log" 2>/dev/null
    exit 1
  fi

  # UPLOAD_DIR too, or the upload tests write real files into backend/uploads/.
  ( cd "$BACKEND" && DATA_DIR="$TMP/data" UPLOAD_DIR="$TMP/uploads" PORT="$API_PORT" \
      SMTP_HOST=127.0.0.1 SMTP_PORT="$SMTP_PORT_T" MAIL_FROM='Armut <no-reply@test>' \
      ADMIN_NOTIFY_EMAILS='ops@test' STORE_URL='http://store.test' node src/server.js >"$TMP/api.log" 2>&1 & )
  for i in $(seq 1 40); do curl -sf "http://localhost:$API_PORT/health" >/dev/null 2>&1 && break; sleep 0.25; done
  if ! curl -sf "http://localhost:$API_PORT/health" >/dev/null 2>&1; then
    echo "FATAL: the API did not come up."; cat "$TMP/api.log" 2>/dev/null; exit 1
  fi
  BASE="http://localhost:$API_PORT"
  STARTED=1
fi

echo "Testing $BASE"
# Structural only here (--no-net): whether a third-party URL is still alive
# is not something a suite should fail on when the network is down. The full
# sweep, including liveness, is: python3 tests/images-audit.py --live
runpy "catalogue imagery"  "$HERE/images-audit.py" --no-net
run "storefront"          "$HERE/store.sh" "$BASE"
run "vendor + admin"      "$HERE/consoles.sh" "$BASE"
# Email assertions need the local sink; against a remote BASE there is none.
if [ -n "${STARTED:-}" ]; then
  run "end-to-end lifecycle" "$HERE/e2e.sh" "$BASE" "$TMP/mail.log"
  run "password reset" "$HERE/password-reset.sh" "$BASE" "$TMP/mail.log"
  run "email resilience" "$HERE/mail-resilience.sh"
else
  echo; echo "(email suites skipped — they need a local SMTP sink)"
  run "end-to-end lifecycle" "$HERE/e2e.sh" "$BASE"
  run "password reset" "$HERE/password-reset.sh" "$BASE"
fi

if [ -n "${STARTED:-}" ]; then
  kill "$SINK_PID" 2>/dev/null
  P=$(ss -lntp 2>/dev/null | grep ":$API_PORT" | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -1)
  [ -n "$P" ] && kill "$P" 2>/dev/null
fi

echo; echo "═══════════════════════════════"
[ "$total_fail" = "0" ] && echo "ALL SUITES PASSED" || echo "$total_fail SUITE(S) FAILED"
exit "$total_fail"
