#!/usr/bin/env bash
# End-to-end smoke test of the Armut store API against a running server.
set -u
B=${1:-http://localhost:4111}/api/v1
jqp() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
pass=0; fail=0
chk() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ok   $1"; else fail=$((fail+1)); echo "  FAIL $1: expected [$3] got [$2]"; fi }

EM="smoke$(date +%s)@example.com"
echo "== signup =="
S=$(curl -s -X POST $B/auth/signup -H 'Content-Type: application/json' -d "{\"name\":\"Smoke Tester\",\"email\":\"$EM\",\"password\":\"secret123\"}")
TOK=$(echo "$S" | jqp 'd["token"]'); chk "signup returns token" "$([ ${#TOK} -gt 20 ] && echo yes)" "yes"
AUTH=(-H "Authorization: Bearer $TOK" -H 'Content-Type: application/json')

echo "== duplicate signup rejected =="
chk "409 conflict" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/signup -H 'Content-Type: application/json' -d "{\"name\":\"X\",\"email\":\"$EM\",\"password\":\"secret123\"}")" "409"

echo "== login =="
chk "login 200" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$EM\",\"password\":\"secret123\"}")" "200"
chk "bad password 401" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$EM\",\"password\":\"wrongpass\"}")" "401"

echo "== addresses =="
chk "empty list" "$(curl -s "${AUTH[@]}" $B/addresses | jqp 'len(d["addresses"])')" "0"
A1=$(curl -s -X POST "${AUTH[@]}" -d '{"title":"Home","street":"Bagdat Cd. 120","district":"Kadikoy, Istanbul"}' $B/addresses)
ID1=$(echo "$A1" | jqp 'd["address"]["id"]')
chk "first address is default" "$(echo "$A1" | jqp 'd["address"]["isDefault"]')" "True"
chk "line composed" "$(echo "$A1" | jqp 'd["address"]["line"]')" "Bagdat Cd. 120, Kadikoy, Istanbul"
ID2=$(curl -s -X POST "${AUTH[@]}" -d '{"title":"Office","street":"Levent Mah. 45","district":"Besiktas, Istanbul"}' $B/addresses | jqp 'd["address"]["id"]')
chk "second not default" "$(curl -s "${AUTH[@]}" $B/addresses | jqp '[a["isDefault"] for a in d["addresses"] if a["id"]=='"$ID2"'][0]')" "False"
U=$(curl -s -X PUT "${AUTH[@]}" -d '{"title":"Office HQ","street":"Levent Mah. 47","district":"Besiktas, Istanbul","isDefault":true}' $B/addresses/$ID2)
chk "update renames" "$(echo "$U" | jqp 'd["address"]["title"]')" "Office HQ"
chk "default moved" "$(curl -s "${AUTH[@]}" $B/addresses | jqp '[a["isDefault"] for a in d["addresses"] if a["id"]=='"$ID1"'][0]')" "False"
chk "blank label rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" -d '{"title":"","street":"x","district":"y"}' $B/addresses)" "422"
chk "no token rejected" "$(curl -s -o /dev/null -w '%{http_code}' $B/addresses)" "401"
chk "other users address hidden" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${AUTH[@]}" -d '{"title":"a","street":"b","district":"c"}' $B/addresses/999999)" "404"

echo "== orders =="
STOCK_BEFORE=$(curl -s $B/products/1 | jqp 'd["stock"]')
O=$(curl -s -X POST "${AUTH[@]}" -d "{\"items\":[{\"productId\":1,\"qty\":2}],\"addressId\":$ID2,\"deliveryMethod\":\"express\"}" $B/orders)
chk "order created" "$(echo "$O" | jqp 'd["status"]')" "Processing"
chk "address stored on order" "$(echo "$O" | jqp 'd["address"]')" "Office HQ — Levent Mah. 47, Besiktas, Istanbul"
chk "express delivery in total" "$(echo "$O" | jqp 'round(d["total"] - 2*799.99*0.88, 2)')" "90.0"
chk "history has the order" "$(curl -s "${AUTH[@]}" $B/orders | jqp 'd["orders"][0]["address"]')" "Office HQ — Levent Mah. 47, Besiktas, Istanbul"
chk "history items" "$(curl -s "${AUTH[@]}" $B/orders | jqp 'd["orders"][0]["items"][0]["qty"]')" "2"
chk "missing address 422" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" -d '{"items":[{"productId":1,"qty":1}]}' $B/orders)" "422"
chk "empty cart 422" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" -d "{\"items\":[],\"addressId\":$ID2}" $B/orders)" "422"
chk "out-of-stock 422" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" -d "{\"items\":[{\"productId\":3,\"qty\":1}],\"addressId\":$ID2}" $B/orders)" "422"
chk "hidden (flagged) product 422" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" -d "{\"items\":[{\"productId\":5,\"qty\":1}],\"addressId\":$ID2}" $B/orders)" "422"
chk "stock decremented by the ordered qty" "$(( STOCK_BEFORE - $(curl -s $B/products/1 | jqp 'd["stock"]') ))" "2"
chk "malformed json 400" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" -d '{"items":' $B/orders)" "400"

echo "== delete address =="
chk "delete ok" "$(curl -s -X DELETE "${AUTH[@]}" $B/addresses/$ID2 | jqp 'len(d["addresses"])')" "1"
chk "default inherited" "$(curl -s "${AUTH[@]}" $B/addresses | jqp 'd["addresses"][0]["isDefault"]')" "True"

echo; echo "passed: $pass  failed: $fail"
[ "$fail" = "0" ]
