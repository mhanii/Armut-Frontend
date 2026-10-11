#!/usr/bin/env python3
"""Audit rendered HTML for accessibility problems that static linting misses.

Fetches each route from a running server and checks the real markup: images
without alt text, controls with no accessible name, inputs with no label,
skipped heading levels, duplicate ids and landmark structure.
"""
import pathlib, re, sys, urllib.request
from html.parser import HTMLParser

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3111"
ROUTES = ["/", "/category", "/category/Bedroom", "/product/1", "/cart",
          "/login", "/signup", "/forgot-password", "/reset-password?token=x",
          "/order/confirmed", "/account", "/checkout", "/vendor", "/admin"]

NAMED = {"a", "button"}
SELF_LABELLING = {"submit", "reset", "button", "image", "hidden"}

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.issues, self.ids, self.labels_for = [], [], set()
        self.headings, self.landmarks = [], []
        self.stack, self.text_in = [], {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.append(a["id"])
        if tag == "label" and "for" in a: self.labels_for.add(a["for"])
        if tag == "img" and "alt" not in a:
            self.issues.append(f"<img> without alt: src={a.get('src','?')[:60]}")
        if tag in NAMED:
            self.stack.append([tag, a, ""])
        if re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))
            self.stack.append([tag, a, ""])
        if tag in ("main", "nav", "header", "footer", "aside"):
            self.landmarks.append(tag)
        if tag == "input":
            t = a.get("type", "text").lower()
            if t not in SELF_LABELLING and "aria-label" not in a and "aria-labelledby" not in a:
                if "id" not in a:
                    self.issues.append(f"<input type={t}> has no id, so no <label> can point at it")
                else:
                    self.text_in.setdefault("needs_label", []).append(a["id"])
        if tag in ("select", "textarea"):
            if "aria-label" not in a and "aria-labelledby" not in a:
                if "id" not in a:
                    self.issues.append(f"<{tag}> has no id, so no <label> can point at it")
                else:
                    self.text_in.setdefault("needs_label", []).append(a["id"])

    def handle_data(self, data):
        if self.stack: self.stack[-1][2] += data

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1][0] == tag:
            t, a, text = self.stack.pop()
            if t in NAMED:
                name = (text.strip() or a.get("aria-label", "") or a.get("aria-labelledby", "")
                        or a.get("title", ""))
                if not name:
                    self.issues.append(f"<{t}> with no accessible name (class={a.get('class','')[:40]})")
            elif not text.strip():
                self.issues.append(f"<{t}> is empty")

    def finish(self):
        for i in self.text_in.get("needs_label", []):
            if i not in self.labels_for:
                self.issues.append(f"form control id={i} has no <label for>")
        dupes = {i for i in self.ids if self.ids.count(i) > 1}
        for d in dupes: self.issues.append(f"duplicate id: {d}")
        last = 0
        for h in self.headings:
            if last and h > last + 1:
                self.issues.append(f"heading jumps from h{last} to h{h}")
            last = h
        if self.headings and self.headings[0] != 1:
            self.issues.append(f"first heading is h{self.headings[0]}, not h1")
        if self.headings.count(1) > 1:
            self.issues.append(f"{self.headings.count(1)} <h1> elements")
        if "main" not in self.landmarks:
            self.issues.append("no <main> landmark")
        return self.issues

total = 0
for route in ROUTES:
    try:
        html = urllib.request.urlopen(BASE + route, timeout=15).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"{route}: could not fetch ({e})"); continue
    body = html.split("<body", 1)[-1]
    a = Audit(); a.feed(body); issues = a.finish()
    seen, uniq = set(), []
    for i in issues:
        if i not in seen: seen.add(i); uniq.append(i)
    total += len(uniq)
    print(f"\n── {route} ── {'clean' if not uniq else str(len(uniq)) + ' issue(s)'}")
    for i in uniq[:12]: print("   •", i)
    if len(uniq) > 12: print(f"   … and {len(uniq)-12} more")

# ---------------------------------------------------------------------------
# A source check, because the rendered HTML cannot show it.
#
# Two consoles declared role="dialog" aria-modal="true" on hand-rolled overlay
# markup and implemented none of what that promises: focus stayed on the body,
# Tab walked the page behind the overlay, and Escape did nothing. Every audit
# here passed the whole time — the attributes were present and correct, and
# attributes are all a parser can see. components/ui/Modal.jsx does the focus
# move, the trap, Escape, the scroll lock and the focus restore, so a dialog
# that is not one is a dialog that is missing all of it.
import glob, os
ALLOWED = os.path.join('components', 'ui', 'Modal.jsx')
rogue = []
for path in glob.glob('components/**/*.jsx', recursive=True) + glob.glob('app/**/*.jsx', recursive=True):
    if os.path.normpath(path) == ALLOWED:
        continue
    text = pathlib.Path(path).read_text()
    # ignore prose in comments that merely mentions the attribute
    code = re.sub(r'\{?/\*.*?\*/\}?', '', text, flags=re.S)
    if 'role="dialog"' in code:
        rogue.append(path)

print(f"\n── dialogs ── {'all go through <Modal>' if not rogue else str(len(rogue)) + ' hand-rolled'}")
for r in rogue:
    print(f"   • {r} declares role=\"dialog\" without <Modal>'s focus trap, Escape and focus restore")
total += len(rogue)

print(f"\n{'=' * 40}\nTOTAL: {total} issue(s)")
sys.exit(1 if total else 0)
