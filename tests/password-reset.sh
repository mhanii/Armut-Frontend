#!/usr/bin/env bash
# Forgotten password, end to end: request a link, read it out of the captured
# email, use it once, and prove it cannot be used again.
# Usage: password-reset.sh <base-url> <mail-log>
set -u
B=${1:-http://localhost:4111}/api/v1
MAILLOG=${2:-}
jqp() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
pass=0; fail=0
chk() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ok   $1"; else fail=$((fail+1)); echo "  FAIL $1: expected [$3] got [$2]"; fi }
J=(-H 'Content-Type: application/json')
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

# Last message sent to $1, decoded (the sink stores raw, often quoted-printable, MIME).
mail_to() {
  python3 - "$MAILLOG" "$1" <<'PY'
import sys, email
from email import policy
raw = open(sys.argv[1], encoding='utf-8', errors='replace').read()
msgs = [m for m in raw.split('===MESSAGE===\n')[1:]]
want = sys.argv[2].lower()
for m in reversed(msgs):
    msg = email.message_from_string(m, policy=policy.default)
    if want in str(msg.get('To', '')).lower():
        body = msg.get_body(preferencelist=('plain',))
        print('Subject: ' + str(msg['Subject']))
        print(body.get_content() if body else '')
        break
PY
}
wait_mail() { for i in $(seq 1 30); do mail_to "$1" | grep -q "$2" && return 0; sleep 0.2; done; return 1; }

STAMP=$(date +%s%N | cut -c1-13)
EM="reset$STAMP@example.com"; OLD="oldpass$STAMP"; NEW="newpass$STAMP"

echo "== signup sends a welcome email =="
curl -s -X POST "${J[@]}" -d "{\"name\":\"Reset Tester\",\"email\":\"$EM\",\"password\":\"$OLD\"}" $B/auth/signup >/dev/null
if [ -n "$MAILLOG" ]; then wait_mail "$EM" "Welcome"; chk "welcome email delivered" "$?" "0"; fi

echo "== forgot password =="
R=$(curl -s -X POST "${J[@]}" -d "{\"email\":\"$EM\"}" $B/auth/forgot)
KNOWN=$(echo "$R" | jqp 'd["message"]')
UNKNOWN=$(curl -s -X POST "${J[@]}" -d "{\"email\":\"nobody$STAMP@example.com\"}" $B/auth/forgot | jqp 'd["message"]')
chk "same answer for known and unknown addresses" "$([ "$KNOWN" = "$UNKNOWN" ] && echo same)" "same"
chk "malformed email rejected" "$(code -X POST "${J[@]}" -d '{"email":"nope"}' $B/auth/forgot)" "422"
chk "garbage token rejected" "$(code -X POST "${J[@]}" -d '{"token":"not-a-token","password":"whatever123"}' $B/auth/reset)" "400"

if [ -z "$MAILLOG" ]; then echo "(no mail log — skipping the link round trip)"; echo "passed: $pass  failed: $fail"; [ $fail -eq 0 ]; exit; fi

wait_mail "$EM" "reset-password?token="; chk "reset email delivered" "$?" "0"
LINK=$(mail_to "$EM" | grep -o 'http[^ ]*reset-password?token=[A-Za-z0-9_-]*' | head -1)
TOKEN=${LINK##*token=}
chk "link points at the storefront" "$(echo "$LINK" | grep -c '^http://store.test/reset-password')" "1"
chk "token has real entropy" "$([ ${#TOKEN} -ge 40 ] && echo yes)" "yes"

chk "short new password refused" "$(code -X POST "${J[@]}" -d "{\"token\":\"$TOKEN\",\"password\":\"abc\"}" $B/auth/reset)" "422"
S=$(curl -s -X POST "${J[@]}" -d "{\"token\":\"$TOKEN\",\"password\":\"$NEW\"}" $B/auth/reset)
chk "reset signs the customer in" "$(echo "$S" | jqp 'len(d["token"])>20')" "True"
chk "link works only once" "$(code -X POST "${J[@]}" -d "{\"token\":\"$TOKEN\",\"password\":\"another$STAMP\"}" $B/auth/reset)" "400"
chk "old password no longer works" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"password\":\"$OLD\"}" $B/auth/login)" "401"
chk "new password works" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"password\":\"$NEW\"}" $B/auth/login)" "200"
wait_mail "$EM" "password was changed"; chk "password-changed notice delivered" "$?" "0"

echo "== a newer request retires the older link =="
curl -s -X POST "${J[@]}" -d "{\"email\":\"$EM\"}" $B/auth/forgot >/dev/null
wait_mail "$EM" "Reset your"; T1=$(mail_to "$EM" | grep -o 'token=[A-Za-z0-9_-]*' | head -1 | cut -d= -f2)
curl -s -X POST "${J[@]}" -d "{\"email\":\"$EM\"}" $B/auth/forgot >/dev/null
for i in $(seq 1 30); do T2=$(mail_to "$EM" | grep -o 'token=[A-Za-z0-9_-]*' | head -1 | cut -d= -f2); [ "$T2" != "$T1" ] && break; sleep 0.2; done
chk "first link dead after second request" "$(code -X POST "${J[@]}" -d "{\"token\":\"$T1\",\"password\":\"x$NEW\"}" $B/auth/reset)" "400"
chk "second link works" "$(code -X POST "${J[@]}" -d "{\"token\":\"$T2\",\"password\":\"x$NEW\"}" $B/auth/reset)" "200"

echo "passed: $pass  failed: $fail"
[ $fail -eq 0 ]
