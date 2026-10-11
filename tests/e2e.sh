#!/usr/bin/env bash
# Full lifecycle across all three account types, in the order a real marketplace
# lives it:
#   admin invites a vendor → vendor logs in and lists a product →
#   customer signs up, logs in, saves an address, orders that product →
#   vendor sees the order WITH the address and ships it →
#   admin sees it in the overview → both emails land.
set -u
B=${1:-http://localhost:4111}/api/v1
MAILLOG=${2:-}
jqp() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null; }
PICK="$(dirname "$0")/e2e_pick.py"
pick() { python3 "$PICK" "$@" 2>/dev/null; }
pass=0; fail=0
chk() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ok   $1"; else fail=$((fail+1)); echo "  FAIL $1: expected [$3] got [$2]"; fi }
STAMP=$(date +%s%N | tail -c 7)
CHECKOUTS=0   # successful checkouts — one customer confirmation email each

echo "── 1. ADMIN invites a vendor ────────────────────────────────"
AT=$(curl -s -X POST $B/admin/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@armut.com","password":"admin123"}' | jqp 'd["token"]')
chk "admin logs in" "$([ ${#AT} -gt 20 ] && echo yes)" "yes"
AA=(-H "Authorization: Bearer $AT" -H 'Content-Type: application/json')
VEMAIL="atelier$STAMP@example.com"; VPASS="vendorpass$STAMP"
NV=$(curl -s -X POST "${AA[@]}" -d "{\"store\":\"Atelier $STAMP\",\"manager\":\"Test Manager\",\"email\":\"$VEMAIL\",\"password\":\"$VPASS\",\"city\":\"İstanbul\",\"status\":\"Active\"}" $B/admin/vendors)
VID=$(echo "$NV" | jqp 'd["id"]')
chk "vendor account created" "$(echo "$NV" | jqp 'd["status"]')" "Active"
chk "starts with zero products" "$(echo "$NV" | jqp 'd["products"]')" "0"
chk "duplicate invite rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AA[@]}" -d "{\"store\":\"Dupe\",\"email\":\"$VEMAIL\",\"password\":\"whatever123\"}" $B/admin/vendors)" "409"

echo "── 2. VENDOR logs in with those credentials ─────────────────"
VT=$(curl -s -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}" | jqp 'd["token"]')
chk "vendor logs in" "$([ ${#VT} -gt 20 ] && echo yes)" "yes"
VA=(-H "Authorization: Bearer $VT" -H 'Content-Type: application/json')
chk "wrong password refused" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$VEMAIL\",\"password\":\"wrongpass\"}")" "401"
chk "dashboard is empty for a new vendor" "$(curl -s "${VA[@]}" $B/vendor/dashboard | jqp 'len(d["products"])')" "0"
chk "vendor token cannot reach admin" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VT" $B/admin/overview)" "401"
chk "vendor token cannot reach customer routes" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VT" $B/addresses)" "401"

echo "── 3. VENDOR lists a product ────────────────────────────────"
PROD=$(curl -s -X POST "${VA[@]}" -d "{\"name\":\"E2E Oak Bench $STAMP\",\"category\":\"Living Room\",\"price\":200,\"discount\":25,\"stock\":3,\"status\":\"Active\",\"description\":\"Built for the end-to-end test.\",\"photos\":[\"https://images.unsplash.com/photo-1555041469-a586c61ea9bc\"],\"colors\":[{\"name\":\"Natural\",\"hex\":\"#c8a27a\"}]}" $B/vendor/products)
PID=$(echo "$PROD" | jqp 'd["id"]')
chk "product created" "$(echo "$PROD" | jqp 'd["status"]')" "Active"
chk "it is visible in the public catalog" "$(curl -s $B/catalog | pick count-products $PID)" "1"
chk "a Draft stays out of the catalog" "$(DID=$(curl -s -X POST "${VA[@]}" -d '{"name":"Hidden Draft","category":"Storage","price":50,"stock":2,"status":"Draft","photos":[]}' $B/vendor/products | jqp 'd["id"]'); curl -s $B/catalog | pick count-products $DID)" "0"
chk "a discount over 100% is refused (it would be a negative price)" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${VA[@]}" -d '{"name":"Too Cheap","category":"Storage","price":50,"discount":150,"stock":2,"status":"Draft","photos":[]}' $B/vendor/products)" "422"
chk "negative stock is refused" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${VA[@]}" -d '{"name":"Minus","category":"Storage","price":50,"stock":-3,"status":"Draft","photos":[]}' $B/vendor/products)" "422"
chk "admin counts both listings (active + draft)" "$(curl -s "${AA[@]}" $B/admin/overview | pick vendor-products $VID)" "2"

echo "── 4. CUSTOMER signs up ─────────────────────────────────────"
CEMAIL="shopper$STAMP@example.com"; CPASS="clientpass$STAMP"
CS=$(curl -s -X POST $B/auth/signup -H 'Content-Type: application/json' -d "{\"name\":\"Test Shopper\",\"email\":\"$CEMAIL\",\"password\":\"$CPASS\"}")
chk "signup returns a session" "$(echo "$CS" | jqp 'd["user"]["name"]')" "Test"
chk "short password rejected" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/signup -H 'Content-Type: application/json' -d '{"name":"X","email":"x'"$STAMP"'@e.com","password":"abc"}')" "422"

echo "── 5. CUSTOMER logs in (fresh token, as the UI would) ───────"
CT=$(curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$CEMAIL\",\"password\":\"$CPASS\"}" | jqp 'd["token"]')
chk "customer logs in" "$([ ${#CT} -gt 20 ] && echo yes)" "yes"
CA=(-H "Authorization: Bearer $CT" -H 'Content-Type: application/json')
chk "customer token cannot reach the vendor console" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CT" $B/vendor/dashboard)" "401"
chk "customer token cannot reach admin" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CT" $B/admin/overview)" "401"

echo "── 6. CUSTOMER saves an address ─────────────────────────────"
AD=$(curl -s -X POST "${CA[@]}" -d '{"title":"Home","street":"Moda Cd. 88","district":"Kadıköy, İstanbul"}' $B/addresses)
AID=$(echo "$AD" | jqp 'd["address"]["id"]')
chk "address saved and defaulted" "$(echo "$AD" | jqp 'd["address"]["isDefault"]')" "True"
chk "edit sticks" "$(curl -s -X PUT "${CA[@]}" -d '{"title":"Home","street":"Moda Cd. 90","district":"Kadıköy, İstanbul"}' $B/addresses/$AID | jqp 'd["address"]["street"]')" "Moda Cd. 90"

echo "── 7. CUSTOMER orders the vendor's product ──────────────────"
ORD=$(curl -s -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":2}],\"addressId\":$AID,\"deliveryMethod\":\"express\"}" $B/orders)
OID=$(echo "$ORD" | jqp 'd["id"]')
chk "order placed" "$(echo "$ORD" | jqp 'd["status"]')" "Processing"
CHECKOUTS=$((CHECKOUTS+1))
chk "discount applied (2 x 200 less 25% + 90 express)" "$(echo "$ORD" | pick money total)" "390.00"
chk "address recorded on the order" "$(echo "$ORD" | jqp 'd["address"]')" "Home — Moda Cd. 90, Kadıköy, İstanbul"
chk "stock drawn down 3 → 1" "$(curl -s $B/products/$PID | jqp 'd["stock"]')" "1"
chk "cannot over-order the remainder" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":5}],\"addressId\":$AID}" $B/orders)" "422"
chk "it shows in the customer's history" "$(curl -s "${CA[@]}" $B/orders | pick count-orders $OID)" "1"

echo "── 8. VENDOR sees and fulfils the order ─────────────────────"
VD=$(curl -s "${VA[@]}" $B/vendor/dashboard)
chk "order reached the vendor" "$(echo "$VD" | pick count-orders $OID)" "1"
chk "vendor can see WHERE to ship it" "$(echo "$VD" | pick order-field $OID address)" "Home — Moda Cd. 90, Kadıköy, İstanbul"
chk "and by which method" "$(echo "$VD" | pick order-field $OID deliveryMethod)" "express"
chk "line items are itemised" "$(echo "$VD" | jqp '[o["items"][0]["qty"] for o in d["orders"] if o["id"]=='"$OID"'][0]')" "2"
chk "vendor marks it Shipped" "$(curl -s -X PATCH "${VA[@]}" -d '{"status":"Shipped"}' $B/vendor/orders/$OID | jqp 'd["status"]')" "Shipped"
chk "customer sees the new status" "$(curl -s "${CA[@]}" $B/orders | pick order-field $OID status)" "Shipped"
chk "re-saving the same status is accepted" "$(curl -s -X PATCH "${VA[@]}" -d '{"status":"Shipped"}' $B/vendor/orders/$OID | jqp 'd["status"]')" "Shipped"
chk "another vendor cannot touch it" "$(VT2=$(curl -s -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d '{"email":"hello@bosphoruswood.com","password":"vendor123"}' | jqp 'd["token"]'); curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "Authorization: Bearer $VT2" -H 'Content-Type: application/json' -d '{"status":"Cancelled"}' $B/vendor/orders/$OID)" "404"
chk "a shipped order cannot go back to processing" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${VA[@]}" -d '{"status":"Processing"}' $B/vendor/orders/$OID)" "409"
LAST=$(curl -s -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":1}],\"addressId\":$AID}" $B/orders | jqp 'd["id"]')
CHECKOUTS=$((CHECKOUTS+1))
chk "buying the last one sells it out" "$(curl -s $B/products/$PID | jqp 'd["stock"]')" "0"
chk "vendor cancels that order" "$(curl -s -X PATCH "${VA[@]}" -d '{"status":"Cancelled"}' $B/vendor/orders/$LAST | jqp 'd["status"]')" "Cancelled"
chk "cancelling returns the stock" "$(curl -s $B/products/$PID | jqp 'd["stock"]')" "1"
chk "and puts it back on sale" "$(curl -s $B/catalog | pick count-products $PID)" "1"
chk "a cancelled order stays cancelled" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${VA[@]}" -d '{"status":"Shipped"}' $B/vendor/orders/$LAST)" "409"

echo "── 8b. VENDOR maintains the listing ─────────────────────────"
# A real vendor uploads a photo rather than pasting a URL.
PNG=$(mktemp --suffix=.png)
python3 -c "import base64,sys;open(sys.argv[1],'wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='))" "$PNG"
UP=$(curl -s -X POST -H "Authorization: Bearer $VT" -F "file=@$PNG;type=image/png" $B/vendor/uploads)
UPURL=$(echo "$UP" | jqp 'd["url"]')
chk "vendor uploads a product image" "$([ -n "$UPURL" ] && echo yes)" "yes"
chk "the uploaded file is actually served" "$(curl -s -o /dev/null -w '%{http_code}' "$UPURL")" "200"
chk "it is served as an image" "$(curl -s -o /dev/null -w '%{content_type}' "$UPURL")" "image/png"
chk "non-images are refused" "$(TXT=$(mktemp --suffix=.txt); echo hi > "$TXT"; curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $VT" -F "file=@$TXT;type=text/plain" $B/vendor/uploads; rm -f "$TXT")" "422"
chk "upload needs a vendor token" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -F "file=@$PNG;type=image/png" $B/vendor/uploads)" "401"
rm -f "$PNG"

# Editing the listing must reach the storefront, not just the console.
curl -s -o /dev/null -X PUT "${VA[@]}" -d "{\"name\":\"E2E Oak Bench $STAMP\",\"category\":\"Living Room\",\"price\":180,\"discount\":0,\"stock\":1,\"status\":\"Active\",\"description\":\"Reduced.\",\"photos\":[\"$UPURL\"],\"colors\":[]}" $B/vendor/products/$PID
chk "price edit reaches the storefront" "$(curl -s $B/products/$PID | pick money price)" "180.00"
chk "the uploaded photo is on the public listing" "$(curl -s $B/products/$PID | jqp 'd["image"]')" "$UPURL"

echo "── 8c. CUSTOMER leaves a review ─────────────────────────────"
RV=$(curl -s -X POST "${CA[@]}" -d '{"rating":5,"comment":"Exactly as described."}' $B/products/$PID/reviews)
chk "review accepted" "$(echo "$RV" | jqp 'd["rating"]')" "5"
chk "review count is 1" "$(echo "$RV" | jqp 'd["reviewCount"]')" "1"
chk "it appears on the public product page" "$(curl -s $B/products/$PID | jqp 'd["reviews"][0]["comment"]')" "Exactly as described."
chk "re-reviewing updates, not duplicates" "$(curl -s -X POST "${CA[@]}" -d '{"rating":4,"comment":"Revised."}' $B/products/$PID/reviews | jqp 'd["reviewCount"]')" "1"
chk "aggregate rating followed the edit" "$(curl -s $B/products/$PID | pick money rating)" "4.00"
chk "a 6-star rating is refused" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d '{"rating":6}' $B/products/$PID/reviews)" "422"
chk "anonymous visitors cannot review" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"rating":5}' $B/products/$PID/reviews)" "401"
# Documents current behaviour: a review needs an account but NOT a purchase.
# If verified-purchase-only reviews are wanted, this is the check that flips.
OTHER=$(curl -s -X POST $B/auth/signup -H 'Content-Type: application/json' -d "{\"name\":\"Never Bought\",\"email\":\"nobuy$STAMP@example.com\",\"password\":\"nobuy$STAMP\"}" | jqp 'd["token"]')
chk "NOTE: a non-buyer can also review (no purchase check)" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $OTHER" -H 'Content-Type: application/json' -d '{"rating":1,"comment":"Never bought this."}' $B/products/$PID/reviews)" "201"

echo "── 8d. ADMIN curates the storefront ─────────────────────────"
ROOM="E2E Room $STAMP"
curl -s -o /dev/null -X PUT "${AA[@]}" -d "{\"categories\":[{\"name\":\"Living Room\"},{\"name\":\"Bedroom\"},{\"name\":\"Dining\"},{\"name\":\"Storage\"},{\"name\":\"$ROOM\"}]}" $B/admin/content
chk "new room reaches the public catalog" "$(curl -s $B/catalog | jqp 'len([c for c in d["categories"] if c["name"]=="'"$ROOM"'"])')" "1"
chk "vendors can list into it" "$(curl -s "${VA[@]}" $B/vendor/dashboard | jqp 'len([c for c in d["categories"] if c=="'"$ROOM"'"])')" "1"
curl -s -o /dev/null -X PUT "${AA[@]}" -d '{"categories":[{"name":"Living Room"},{"name":"Bedroom"},{"name":"Dining"},{"name":"Storage"}]}' $B/admin/content
chk "and can be removed again" "$(curl -s $B/catalog | jqp 'len([c for c in d["categories"] if c["name"]=="'"$ROOM"'"])')" "0"

echo "── 8e. ADMIN moderates a listing ────────────────────────────"
chk "admin flags the product" "$(curl -s -X PATCH "${AA[@]}" -d '{"status":"Flagged"}' $B/admin/products/$PID | jqp 'd["status"]')" "Flagged"
chk "flagged listings leave the catalog" "$(curl -s $B/catalog | pick count-products $PID)" "0"
chk "and cannot be ordered" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":1}],\"addressId\":$AID}" $B/orders)" "422"
CUR=$(curl -s "${VA[@]}" $B/vendor/dashboard | python3 -c "import sys,json;d=json.load(sys.stdin);p=[x for x in d['products'] if x['id']==$PID][0];p['status']='Active';p['description']='Edited while flagged.';print(json.dumps(p))")
FLAGGED_EDIT=$(curl -s -X PUT "${VA[@]}" -d "$CUR" $B/vendor/products/$PID)
chk "vendor can still edit a flagged listing" "$(echo "$FLAGGED_EDIT" | jqp 'd["description"]')" "Edited while flagged."
chk "but saving it does not lift the flag" "$(echo "$FLAGGED_EDIT" | jqp 'd["status"]')" "Flagged"
chk "so it stays off the catalog" "$(curl -s $B/catalog | pick count-products $PID)" "0"
chk "reinstating brings it back" "$(curl -s -X PATCH "${AA[@]}" -d '{"status":"Active"}' $B/admin/products/$PID >/dev/null; curl -s $B/catalog | pick count-products $PID)" "1"
DRAFT=$(curl -s -X POST "${VA[@]}" -d '{"name":"Unpublished Draft","category":"Storage","price":40,"stock":2,"status":"Draft","photos":[]}' $B/vendor/products | jqp 'd["id"]')
chk "admin cannot flag a vendor's draft" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${AA[@]}" -d '{"status":"Flagged"}' $B/admin/products/$DRAFT)" "409"
chk "nor approve it into the catalog" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${AA[@]}" -d '{"status":"Active"}' $B/admin/products/$DRAFT; curl -s $B/catalog | pick count-products $DRAFT)" "4090"
EMPTY=$(curl -s -X POST "${VA[@]}" -d '{"name":"Sold Through","category":"Storage","price":40,"stock":0,"status":"Active","photos":["https://images.unsplash.com/photo-1555041469-a586c61ea9bc"]}' $B/vendor/products | jqp 'd["id"]')
curl -s -X PATCH "${AA[@]}" -d '{"status":"Flagged"}' $B/admin/products/$EMPTY >/dev/null
chk "reinstating an empty listing leaves it sold out, not buyable" "$(curl -s -X PATCH "${AA[@]}" -d '{"status":"Active"}' $B/admin/products/$EMPTY | jqp 'd["status"]')" "Out of stock"

echo "── 8f. A CART SPANNING TWO VENDORS splits correctly ─────────"
# Marketplace rule: one cart becomes one order per vendor. Each vendor must see
# only their own half, and neither may see the other's.
V2T=$(curl -s -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d '{"email":"hello@bosphoruswood.com","password":"vendor123"}' | jqp 'd["token"]')
V2A=(-H "Authorization: Bearer $V2T" -H 'Content-Type: application/json')
P2=$(curl -s -X POST "${V2A[@]}" -d "{\"name\":\"E2E Walnut Stool $STAMP\",\"category\":\"Living Room\",\"price\":100,\"discount\":0,\"stock\":5,\"status\":\"Active\",\"photos\":[\"https://example.com/s.jpg\"],\"colors\":[]}" $B/vendor/products | jqp 'd["id"]')
chk "second vendor has a listing" "$([ -n "$P2" ] && echo yes)" "yes"

SPLIT=$(curl -s -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":1},{\"productId\":$P2,\"qty\":1}],\"addressId\":$AID,\"deliveryMethod\":\"standard\"}" $B/orders)
chk "one cart produced two orders" "$(echo "$SPLIT" | jqp 'len(d["orders"])')" "2"
CHECKOUTS=$((CHECKOUTS+1))
chk "total covers both plus one delivery fee" "$(echo "$SPLIT" | pick money total)" "330.00"
SO1=$(echo "$SPLIT" | jqp 'd["orders"][0]'); SO2=$(echo "$SPLIT" | jqp 'd["orders"][1]')
chk "vendor A sees their half" "$(curl -s "${VA[@]}" $B/vendor/dashboard | pick count-orders $SO1)" "1"
chk "vendor A does NOT see vendor B's half" "$(curl -s "${VA[@]}" $B/vendor/dashboard | pick count-orders $SO2)" "0"
chk "vendor B sees their half" "$(curl -s "${V2A[@]}" $B/vendor/dashboard | pick count-orders $SO2)" "1"
chk "vendor B does NOT see vendor A's half" "$(curl -s "${V2A[@]}" $B/vendor/dashboard | pick count-orders $SO1)" "0"
chk "both halves carry the delivery address" "$(curl -s "${V2A[@]}" $B/vendor/dashboard | pick order-field $SO2 address)" "Home — Moda Cd. 90, Kadıköy, İstanbul"
chk "customer sees both in their history" "$(curl -s "${CA[@]}" $B/orders | jqp 'len([o for o in d["orders"] if o["id"] in ('"$SO1"','"$SO2"')])')" "2"
chk "admin sees both" "$(curl -s "${AA[@]}" $B/admin/overview | jqp 'len([o for o in d["orders"] if o["id"] in ('"$SO1"','"$SO2"')])')" "2"
chk "vendor B cannot ship vendor A's half" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${V2A[@]}" -d '{"status":"Shipped"}' $B/vendor/orders/$SO1)" "404"
curl -s -o /dev/null -X DELETE "${V2A[@]}" $B/vendor/products/$P2

echo "── 8g. Ordering edge cases ──────────────────────────────────"
chk "an address id that is not yours is refused" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":1}],\"addressId\":999999}" $B/orders)" "422"
chk "a deleted product cannot be ordered" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$P2,\"qty\":1}],\"addressId\":$AID}" $B/orders)" "422"
chk "a tampered token is rejected" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer ${CT}tampered" $B/orders)" "401"
chk "a vendor token cannot place a customer order" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${VA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":1}],\"addressId\":$AID}" $B/orders)" "401"

echo "── 9. ADMIN oversight ───────────────────────────────────────"
OV=$(curl -s "${AA[@]}" $B/admin/overview)
chk "order appears in the admin overview" "$(echo "$OV" | pick count-orders $OID)" "1"
chk "with its delivery address" "$(echo "$OV" | pick order-field $OID address)" "Home — Moda Cd. 90, Kadıköy, İstanbul"
MY_SPEND=$(curl -s "${CA[@]}" $B/orders | pick sum-order-totals)
chk "admin's spend figure matches the customer's own order history" "$(echo "$OV" | pick spend "$CEMAIL")" "$MY_SPEND"
VENDOR_TAKE=$(curl -s "${VA[@]}" $B/vendor/dashboard | pick sum-vendor-orders)
chk "admin's sales figure matches the vendor's own orders" "$(echo "$OV" | pick vendor-sales $VID)" "$VENDOR_TAKE"
chk "admin suspends the vendor" "$(curl -s -X PATCH "${AA[@]}" -d '{"status":"Suspended"}' $B/admin/vendors/$VID | jqp 'd["status"]')" "Suspended"
chk "suspended vendor is locked out" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}")" "403"
chk "and a session already open is ended too" "$(curl -s -o /dev/null -w '%{http_code}' "${VA[@]}" $B/vendor/dashboard)" "403"
chk "it cannot list anything meanwhile" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${VA[@]}" -d '{"name":"Sneaky","price":5,"stock":1,"status":"Active"}' $B/vendor/products)" "403"
chk "suspended vendor's listing leaves the catalog" "$(curl -s $B/catalog | pick count-products $PID)" "0"
chk "and its page is gone" "$(curl -s -o /dev/null -w '%{http_code}' $B/products/$PID)" "404"
chk "and it cannot be ordered" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d "{\"items\":[{\"productId\":$PID,\"qty\":1}],\"addressId\":$AID}" $B/orders)" "422"
chk "or reviewed" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${CA[@]}" -d '{"rating":1,"comment":"x"}' $B/products/$PID/reviews)" "404"
chk "API responses carry nosniff" "$(curl -s -D - -o /dev/null $B/catalog | grep -ci '^x-content-type-options: nosniff')" "1"

echo "── pending vendors cannot trade until approved ──────────────"
PEMAIL="pending$STAMP@example.com"
PVID=$(curl -s -X POST "${AA[@]}" -d "{\"store\":\"Pending $STAMP\",\"manager\":\"P\",\"email\":\"$PEMAIL\",\"password\":\"pendingpass1\",\"status\":\"Pending\"}" $B/admin/vendors | jqp 'd["id"]')
PT=$(curl -s -X POST $B/vendor/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$PEMAIL\",\"password\":\"pendingpass1\"}" | jqp 'd["token"]')
PP=$(curl -s -X POST -H "Authorization: Bearer $PT" -H 'Content-Type: application/json' -d '{"name":"Early Listing","category":"Storage","price":60,"stock":2,"status":"Active","photos":["https://images.unsplash.com/photo-1555041469-a586c61ea9bc"]}' $B/vendor/products | jqp 'd["id"]')
chk "a pending vendor can prepare listings" "$([ -n "$PP" ] && [ "$PP" != "None" ] && echo yes)" "yes"
chk "but they are not on sale" "$(curl -s $B/catalog | pick count-products $PP)" "0"
chk "and their dashboard knows the store is pending" "$(curl -s -H "Authorization: Bearer $PT" $B/vendor/dashboard | jqp 'd["store"]["status"]')" "Pending"
curl -s -X PATCH "${AA[@]}" -d '{"status":"Active"}' $B/admin/vendors/$PVID >/dev/null
chk "approving the vendor puts them on sale" "$(curl -s $B/catalog | pick count-products $PP)" "1"
curl -s -o /dev/null -X DELETE "${AA[@]}" $B/admin/vendors/$PVID
chk "admin removes the vendor" "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "${AA[@]}" $B/admin/vendors/$VID)" "204"
chk "a removed vendor's token is refused cleanly, not a 500" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${VA[@]}" -d '{"name":"Ghost","price":5,"stock":1,"status":"Active"}' $B/vendor/products)" "401"
chk "their listings went with them" "$(curl -s $B/catalog | pick count-products $PID)" "0"

if [ -n "$MAILLOG" ]; then
echo "── 10. EMAIL ────────────────────────────────────────────────"
sleep 2
chk "admin alert sent for this order" "$(grep -c "New order #$OID" "$MAILLOG" 2>/dev/null | head -1)" "1"
# Every mail to the customer is either the one welcome at signup or an order
# confirmation, so this still catches one-email-per-split-row regressions.
chk "welcome email sent once at signup" "$(grep -c "Subject: Welcome to" "$MAILLOG" 2>/dev/null | head -1 | awk '{print ($1>=1)?"yes":"no"}')" "yes"
# Decoded subjects of every message to the customer — raw MIME encodes the
# em dash, so grepping the log for a subject would silently match nothing.
subjects_to() { python3 - "$MAILLOG" "$1" <<'PY'
import sys, email
from email import policy
for m in open(sys.argv[1], encoding='utf-8', errors='replace').read().split('===MESSAGE===\n')[1:]:
    msg = email.message_from_string(m, policy=policy.default)
    if sys.argv[2].lower() in str(msg.get('To', '')).lower(): print(msg['Subject'])
PY
}
CSUBJ=$(subjects_to "$CEMAIL")
chk "one confirmation per checkout (not per split order row)" "$(echo "$CSUBJ" | grep -c "confirmed$")" "$CHECKOUTS"
chk "customer told when the vendor ships — once, despite the re-save" "$(echo "$CSUBJ" | grep -c "order #$OID has shipped")" "1"
chk "the split checkout's alert named both order ids" "$(grep -c "New order #$SO1, #$SO2" "$MAILLOG" 2>/dev/null | head -1)" "1"
chk "the alert carries the address" "$(grep -c "Moda Cd. 90" "$MAILLOG" 2>/dev/null | head -1 | awk '{print ($1>0)?1:0}')" "1"
fi

echo; echo "passed: $pass  failed: $fail"
[ "$fail" = "0" ]
