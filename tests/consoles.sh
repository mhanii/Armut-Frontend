#!/usr/bin/env bash
# Smoke test of the vendor + admin console APIs.
set -u
B=${1:-http://localhost:4111}/api/v1
jqp() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
pass=0; fail=0
chk() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ok   $1"; else fail=$((fail+1)); echo "  FAIL $1: expected [$3] got [$2]"; fi }

echo "== vendor auth =="
VT=$(curl -s -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d '{"email":"hello@bosphoruswood.com","password":"vendor123"}' | jqp 'd["token"]')
chk "vendor login" "$([ ${#VT} -gt 20 ] && echo yes)" "yes"
VA=(-H "Authorization: Bearer $VT" -H 'Content-Type: application/json')
chk "customer token rejected on vendor route" "$(curl -s -o /dev/null -w '%{http_code}' $B/vendor/dashboard)" "401"

echo "== vendor sees the shipping address =="
D=$(curl -s "${VA[@]}" $B/vendor/dashboard)
chk "dashboard has orders" "$(echo "$D" | jqp 'len(d["orders"])>0')" "True"
chk "order carries an address" "$(echo "$D" | jqp 'all("address" in o for o in d["orders"])')" "True"
chk "order carries a delivery method" "$(echo "$D" | jqp 'all("deliveryMethod" in o for o in d["orders"])')" "True"
NEWEST=$(echo "$D" | jqp 'd["orders"][0]["address"] or ""')
chk "newest order address is populated" "$([ -n "$NEWEST" ] && echo yes)" "yes"

echo "== vendor products =="
P=$(curl -s -X POST "${VA[@]}" -d '{"name":"Smoke Shelf","category":"Storage","price":123.45,"discount":0,"stock":4,"status":"Active","description":"test","photos":["https://example.com/a.jpg"],"colors":[]}' $B/vendor/products)
PID=$(echo "$P" | jqp 'd["id"]')
chk "created" "$(echo "$P" | jqp 'd["name"]')" "Smoke Shelf"
chk "appears in the storefront catalog" "$(curl -s $B/catalog | jqp 'len([p for p in d["products"] if p["id"]=='"$PID"'])')" "1"
chk "updated" "$(curl -s -X PUT "${VA[@]}" -d '{"name":"Smoke Shelf II","category":"Storage","price":150,"discount":10,"stock":4,"status":"Active","photos":["https://example.com/a.jpg"],"colors":[]}' $B/vendor/products/$PID | jqp 'd["price"]')" "150"
chk "zero stock forces Out of stock" "$(curl -s -X PUT "${VA[@]}" -d '{"name":"Smoke Shelf II","category":"Storage","price":150,"stock":0,"status":"Active","photos":["https://example.com/a.jpg"],"colors":[]}' $B/vendor/products/$PID | jqp 'd["status"]')" "Out of stock"
chk "price 0 rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${VA[@]}" -d '{"name":"Free","price":0,"stock":1}' $B/vendor/products)" "422"
chk "cannot touch another vendor's product" "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "${VA[@]}" $B/vendor/products/1)" "404"
chk "deleted" "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "${VA[@]}" $B/vendor/products/$PID)" "204"

echo "== vendor store profile =="
chk "duplicate email rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${VA[@]}" -d '{"name":"Bosphorus Woodworks","email":"studio@armutmodern.com"}' $B/vendor/store)" "409"
chk "invalid email rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${VA[@]}" -d '{"name":"Bosphorus Woodworks","email":"nope"}' $B/vendor/store)" "422"
chk "own email is fine" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${VA[@]}" -d '{"name":"Bosphorus Woodworks","email":"hello@bosphoruswood.com","phone":"+90 212 555 0198"}' $B/vendor/store)" "200"

echo "== admin =="
AT=$(curl -s -X POST $B/admin/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@armut.com","password":"admin123"}' | jqp 'd["token"]')
chk "admin login" "$([ ${#AT} -gt 20 ] && echo yes)" "yes"
AA=(-H "Authorization: Bearer $AT" -H 'Content-Type: application/json')
chk "vendor token rejected on admin route" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VT" $B/admin/overview)" "401"
O=$(curl -s "${AA[@]}" $B/admin/overview)
chk "overview orders carry an address" "$(echo "$O" | jqp 'all("address" in o for o in d["orders"])')" "True"
chk "overview has vendors/products/clients" "$(echo "$O" | jqp 'all(k in d for k in ("vendors","products","clients"))')" "True"
chk "vendor status change" "$(curl -s -X PATCH "${AA[@]}" -d '{"status":"Suspended"}' $B/admin/vendors/2 | jqp 'd["status"]')" "Suspended"
chk "suspended vendor cannot log in" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d '{"email":"hello@bosphoruswood.com","password":"vendor123"}')" "403"
chk "restore" "$(curl -s -X PATCH "${AA[@]}" -d '{"status":"Active"}' $B/admin/vendors/2 | jqp 'd["status"]')" "Active"
chk "invalid status rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${AA[@]}" -d '{"status":"Banana"}' $B/admin/vendors/2)" "422"
chk "content round-trip" "$(curl -s -X PUT "${AA[@]}" -d '{"categories":[{"name":"Living Room"},{"name":"Bedroom"},{"name":"Dining"},{"name":"Storage"}]}' $B/admin/content | jqp 'len(d["categories"])')" "4"
chk "blank room name rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${AA[@]}" -d '{"categories":[{"name":""}]}' $B/admin/content)" "422"

echo; echo "passed: $pass  failed: $fail"
[ "$fail" = "0" ]
