# Pull one value out of a JSON payload on stdin, for the e2e shell script.
# Keeps awkward quoting out of the test itself.
import sys, json

def money(x):
    return f"{float(x):.2f}"

def main():
    mode, args = sys.argv[1], sys.argv[2:]
    d = json.load(sys.stdin)
    if mode == "spend":                       # spend <email>
        print(money(next(c["spent"] for c in d["clients"] if c["email"] == args[0])))
    elif mode == "vendor-sales":              # vendor-sales <vendor id>
        print(money(next(v["sales"] for v in d["vendors"] if v["id"] == int(args[0]))))
    elif mode == "vendor-products":           # vendor-products <vendor id>
        print(next(v["products"] for v in d["vendors"] if v["id"] == int(args[0])))
    elif mode == "money":                     # money <dotted key>
        print(money(d[args[0]]))
    elif mode == "order-field":               # order-field <order id> <field>
        print(next(o[args[1]] for o in d["orders"] if o["id"] == int(args[0])))
    elif mode == "count-orders":              # count-orders <order id>
        print(len([o for o in d["orders"] if o["id"] == int(args[0])]))
    elif mode == "count-products":            # count-products <product id>
        print(len([p for p in d["products"] if p["id"] == int(args[0])]))
    elif mode == "sum-order-totals":          # sum-order-totals   (from a history payload)
        print(money(sum(o["total"] for o in d["orders"])))
    elif mode == "sum-vendor-orders":         # sum-vendor-orders  (from a vendor dashboard)
        print(money(sum(o["total"] for o in d["orders"])))
    elif mode == "count-all-orders":          # count-all-orders
        print(len(d["orders"]))
    else:
        raise SystemExit(f"unknown mode {mode}")

main()
