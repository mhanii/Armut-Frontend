#!/usr/bin/env bash
# Sign-up email verification: no session until the emailed code is entered;
# wrong codes are counted, a resend replaces the old code.
# Usage: verify-email.sh <base-url> <mail-log>
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

# Newest 6-digit code mailed to $1 (empty if none yet).
code_for() { mail_to "$1" | grep -o 'verification code is: [0-9]*' | head -1 | grep -o '[0-9]*$'; }
wait_code() { # $1 email, $2 previous code (wait until it differs)
  for i in $(seq 1 40); do C=$(code_for "$1"); [ -n "$C" ] && [ "$C" != "${2:-}" ] && { echo "$C"; return 0; }; sleep 0.2; done; return 1; }

STAMP=$(date +%s%N | cut -c1-13)
EM="verify$STAMP@example.com"; PW="secret$STAMP"
SIGNUP="{\"name\":\"Verify Tester\",\"email\":\"$EM\",\"password\":\"$PW\"}"

echo "== signing up does not sign you in =="
R=$(curl -s -w '\n%{http_code}' -X POST "${J[@]}" -d "$SIGNUP" $B/auth/signup)
chk "signup answers 202" "$(echo "$R" | tail -1)" "202"
chk "no token issued" "$(echo "$R" | head -1 | jqp '"token" in d')" "False"
CODE=$(wait_code "$EM"); chk "code email delivered" "$([ -n "$CODE" ] && echo yes)" "yes"
chk "code is six digits" "$(echo "$CODE" | grep -cE '^[0-9]{6}$')" "1"
chk "subject carries the code" "$(mail_to "$EM" | grep -c "Subject: $CODE is your")" "1"
chk "login refused before verifying" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"password\":\"$PW\"}" $B/auth/login)" "403"
chk "unknown address and wrong password stay 401" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"password\":\"nope-$STAMP\"}" $B/auth/login)" "401"

echo "== wrong and malformed codes =="
WRONG=$([ "$CODE" = "000000" ] && echo 111111 || echo 000000)
chk "wrong code rejected" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"code\":\"$WRONG\"}" $B/auth/verify)" "400"
chk "malformed code rejected" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"code\":\"12ab\"}" $B/auth/verify)" "422"
chk "right code, wrong email rejected" "$(code -X POST "${J[@]}" -d "{\"email\":\"other$STAMP@example.com\",\"code\":\"$CODE\"}" $B/auth/verify)" "400"

echo "== resend replaces the code =="
sleep 2.5
curl -s -X POST "${J[@]}" -d "{\"email\":\"$EM\"}" $B/auth/resend >/dev/null
NEW=$(wait_code "$EM" "$CODE"); chk "second code delivered" "$([ -n "$NEW" ] && echo yes)" "yes"
chk "resend answers the same for unknown address" "$(curl -s -X POST "${J[@]}" -d "{\"email\":\"ghost$STAMP@example.com\"}" $B/auth/resend | jqp 'd["ok"]')" "True"
chk "old code no longer works" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"code\":\"$CODE\"}" $B/auth/verify)" "400"

echo "== the right code =="
S=$(curl -s -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"code\":\"$NEW\"}" $B/auth/verify)
chk "verify signs the customer in" "$(echo "$S" | jqp 'len(d["token"])>20')" "True"
chk "code is single use" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"code\":\"$NEW\"}" $B/auth/verify)" "400"
chk "login works now" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"password\":\"$PW\"}" $B/auth/login)" "200"
chk "signing up again is a conflict" "$(code -X POST "${J[@]}" -d "$SIGNUP" $B/auth/signup)" "409"
wait_mail "$EM" "Welcome"; chk "welcome email follows verification" "$?" "0"

echo "== too many wrong guesses burn the code =="
EM2="burn$STAMP@example.com"
curl -s -X POST "${J[@]}" -d "{\"name\":\"Burn Tester\",\"email\":\"$EM2\",\"password\":\"$PW\"}" $B/auth/signup >/dev/null
C2=$(wait_code "$EM2"); W2=$([ "$C2" = "000000" ] && echo 111111 || echo 000000)
for i in 1 2 3 4 5; do curl -s -o /dev/null -X POST "${J[@]}" -d "{\"email\":\"$EM2\",\"code\":\"$W2\"}" $B/auth/verify; done
chk "correct code refused after five misses" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM2\",\"code\":\"$C2\"}" $B/auth/verify)" "400"

echo "== an unconfirmed address can be claimed by its real owner =="
EM3="claim$STAMP@example.com"
curl -s -X POST "${J[@]}" -d "{\"name\":\"Squatter\",\"email\":\"$EM3\",\"password\":\"squat-$STAMP\"}" $B/auth/signup >/dev/null
C3=$(wait_code "$EM3"); sleep 2.5
chk "second signup for same address allowed" "$(code -X POST "${J[@]}" -d "{\"name\":\"Real Owner\",\"email\":\"$EM3\",\"password\":\"mine-$STAMP\"}" $B/auth/signup)" "202"
C3B=$(wait_code "$EM3" "$C3")
curl -s -o /dev/null -X POST "${J[@]}" -d "{\"email\":\"$EM3\",\"code\":\"$C3B\"}" $B/auth/verify
chk "squatter's password does not work" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM3\",\"password\":\"squat-$STAMP\"}" $B/auth/login)" "401"
chk "owner's password works" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM3\",\"password\":\"mine-$STAMP\"}" $B/auth/login)" "200"

echo "== a password reset also proves the address =="
EM4="resetv$STAMP@example.com"
curl -s -X POST "${J[@]}" -d "{\"name\":\"Reset Verify\",\"email\":\"$EM4\",\"password\":\"$PW\"}" $B/auth/signup >/dev/null
curl -s -X POST "${J[@]}" -d "{\"email\":\"$EM4\"}" $B/auth/forgot >/dev/null
wait_mail "$EM4" "reset-password?token="
TOK=$(mail_to "$EM4" | grep -o 'token=[A-Za-z0-9_-]*' | head -1 | cut -d= -f2)
chk "reset signs in" "$(code -X POST "${J[@]}" -d "{\"token\":\"$TOK\",\"password\":\"fresh-$STAMP\"}" $B/auth/reset)" "200"
chk "and the account is now verified" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM4\",\"password\":\"fresh-$STAMP\"}" $B/auth/login)" "200"

echo "== changing a password while signed in =="
TK=$(echo "$S" | jqp 'd["token"]'); A=(-H "Authorization: Bearer $TK")
chk "wrong current password refused" "$(code -X PUT "${J[@]}" "${A[@]}" -d '{"current":"nope-nope","password":"brandnew123"}' $B/auth/password)" "403"
chk "short new password refused" "$(code -X PUT "${J[@]}" "${A[@]}" -d "{\"current\":\"$PW\",\"password\":\"abc\"}" $B/auth/password)" "422"
chk "change succeeds" "$(code -X PUT "${J[@]}" "${A[@]}" -d "{\"current\":\"$PW\",\"password\":\"brandnew123\"}" $B/auth/password)" "200"
chk "new password logs in" "$(code -X POST "${J[@]}" -d "{\"email\":\"$EM\",\"password\":\"brandnew123\"}" $B/auth/login)" "200"
chk "needs a session" "$(code -X PUT "${J[@]}" -d '{"current":"a","password":"brandnew123"}' $B/auth/password)" "401"

echo "passed: $pass  failed: $fail"
[ $fail -eq 0 ]
