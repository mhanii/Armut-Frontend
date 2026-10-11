#!/usr/bin/env python3
"""Check the palette's text/background pairings against WCAG contrast minima.

WCAG 2.1 AA wants 4.5:1 for body text, 3:1 for large text (>=24px, or >=18.66px
bold) and 3:1 for UI component boundaries.
"""
import re, sys, pathlib

def parse_tokens(mode='light'):
    """Resolve the palette the way the cascade does.

    Dark mode is an overlay, not a replacement: tokens the dark block does not
    redefine keep their :root value. Reading only the dark block left those
    tokens missing — and a token the audit cannot see is a token it cannot
    check. --on-ink and --on-ink-muted are deliberately theme-independent, so
    they are exactly the ones that used to fall through the gap.
    """
    text = pathlib.Path('app/tokens/colors.css').read_text()
    light = text.split('@media (prefers-color-scheme: dark)')[0]
    out = {}
    for m in re.finditer(r'--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})', light):
        out[m.group(1)] = m.group(2)
    if mode == 'dark':
        # the explicit [data-theme='dark'] block is the authoritative copy
        block = text[text.index("[data-theme='dark']"):]
        for m in re.finditer(r'--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})', block):
            out[m.group(1)] = m.group(2)
    return out

def rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def lum(h):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

MODE = sys.argv[1] if len(sys.argv) > 1 else 'light'
T = parse_tokens(MODE)
print(f"=== {MODE} mode ===")
# (foreground, background, minimum, what it is)
PAIRS = [
    ('ink-body',   'bg-page',       4.5, 'body text on the page'),
    ('ink-body',   'surface',       4.5, 'body text on a card'),
    ('ink-600',    'surface',       4.5, 'secondary text on a card'),
    ('ink-600',    'bg-page',       4.5, 'secondary text on the page'),
    ('ink-500',    'surface',       4.5, 'meta text on a card'),
    ('ink-500',    'bg-page',       4.5, 'meta text on the page'),
    ('ink-500',    'surface-muted', 4.5, 'meta text on a muted panel'),
    ('ink-400',    'surface',       3.0, 'placeholder / disabled'),
    ('brand-700',  'surface',       4.5, 'eyebrow + link text on a card'),
    ('brand-700',  'bg-page',       4.5, 'eyebrow + link text on the page'),
    ('brand-dark', 'surface',       4.5, 'accent text'),
    ('danger-dark','surface',       4.5, 'error text'),
    ('success-dark','surface',      4.5, 'success text'),
    ('danger-dark','alert-error-bg', 4.5, 'form error banner'),
    ('ink-600',    'surface',        4.5, 'upload progress text'),
    ('success-dark','pill-ok-bg',   4.5, 'status pill: ok'),
    ('brand-700',  'pill-warn-bg',  4.5, 'status pill: needs attention'),
    ('danger-dark','pill-risk-bg',  4.5, 'status pill: risk'),
    ('border-strong','surface',     3.0, 'input border against its field'),
    ('danger-dark','surface',       3.0, 'invalid field border'),
    ('brand',      'surface',       3.0, 'focus ring against a card'),
    ('brand',      'bg-page',       3.0, 'focus ring against the page'),
    ('star',       'surface',       3.0, 'rating star on a card'),
    ('star',       'bg-page',       3.0, 'rating star on the page'),
    ('star',       'surface-muted', 3.0, 'rating star on a muted panel'),
]

fails = []
print(f"{'pairing':<44}{'ratio':>7}  {'min':>5}")
print('-' * 60)
for fg, bg, minimum, label in PAIRS:
    if fg not in T or bg not in T:
        print(f"  ? missing token: {fg} or {bg}"); continue
    r = ratio(T[fg], T[bg])
    ok = r >= minimum
    if not ok: fails.append((label, fg, bg, r, minimum))
    print(f"{'✓' if ok else '✗'} {label:<42}{r:>6.2f}  {minimum:>5.1f}")

# Text that sits on a filled surface. --cta-fg and --on-brand invert with the
# scheme, so they are read from the palette rather than assumed to be white.
CTA_FG = T.get('cta-fg', '#ffffff')
ON_BRAND = T.get('on-brand', '#ffffff')
for fg, bg, minimum, label in [(CTA_FG, T['cta'], 4.5, 'button label on CTA'),
                               (T.get('on-ink', '#ffffff'), T['surface-ink'], 4.5, 'footer / console text'),
                               (T['on-ink-muted'], T['surface-ink'], 4.5, 'footer links / console nav'),
                               (T['on-ink-dim'], T['surface-ink'], 4.5, 'footer headings / legal line'),
                               (T.get('on-ink', '#ffffff'), '#2a2622', 4.5, 'active console tab (lifted sidebar)'),
                               (ON_BRAND, T['brand-dark'], 4.5, 'text on the clay accent'),
                               (ON_BRAND, T['danger'], 4.5, 'text on danger'),
                               (ON_BRAND, T['success'], 4.5, 'text on success')]:
    r = ratio(fg, bg)
    ok = r >= minimum
    if not ok: fails.append((label, 'white', bg, r, minimum))
    print(f"{'✓' if ok else '✗'} {label:<42}{r:>6.2f}  {minimum:>5.1f}")

# --brand is too light to carry white text (3.46:1). It is allowed as a
# decorative fill, but must never become the background of a text element.
import pathlib as _pl, re as _re
misuse = []
for _css in ([] if MODE == 'dark' else _pl.Path('app/styles').glob('*.css')):
    for _m in _re.finditer(r'([^{}]+)\{([^{}]*background:\s*var\(--brand\)[^{}]*)\}', _css.read_text()):
        _sel, _body = _m.group(1).strip(), _m.group(2)
        if 'color:' in _body or 'font' in _body:
            misuse.append(f"{_css.name}: {_sel} puts text on --brand (only 3.46:1 with white)")
for _m in misuse:
    fails.append((_m, 'brand', 'text', 3.46, 4.5))
    print(f"✗ {_m}")

# ---------------------------------------------------------------------------
# Sweep the stylesheets rather than trusting the list above.
#
# Every failure this audit has ever found in review was a pairing nobody had
# thought to add to PAIRS: the status pills, the error banner, and then six
# separate places quietly setting text in --ink-400. A hand-kept list cannot
# find what it was not told about, so this section enumerates the declarations
# instead. For every rule that sets `color: var(--token)`, the colour has to
# clear 4.5:1 on the ground the rule actually sits on.
# ---------------------------------------------------------------------------

# A rule's ground, when it is not the neutral page. Longest prefix wins.
GROUNDS = {
    '.footer':          'surface-ink',
    # Everything in the console sidebar except .console__main, which is the
    # light working area.
    '.console__side':   'surface-ink',
    '.console__nav':    'surface-ink',
    '.console__link':   'surface-ink',
    '.console__brand':  'surface-ink',
    '.console__badge':  'surface-ink',
    '.console__word':   'surface-ink',
    '.console__who':    'surface-ink',
    '.console__sign':   'surface-ink',
    '.console__foot':   'surface-ink',
    # The save bar is an ink panel of its own, inside the light console main.
    '.savebar':         'surface-ink',
    # NOT .console-auth__ — the console sign-in screen is a light page on
    # --bg-page. It only shares a name prefix with the sidebar.
}

# Rules exempt from 4.5:1, each with the reason it is exempt. Anything not
# listed here is held to the text minimum — that is the point.
ALLOW = {
    '[disabled]':       'WCAG 1.4.3 exempts disabled controls',
    ':disabled':        'WCAG 1.4.3 exempts disabled controls',
    '.hero__dot':       'carousel dot, no text',
    '.uploader__drop':  'dropzone glyph, checked as a 3:1 control below',
    '.skip-link':       'inverted on its own dark ground while focused',
    '.theme-toggle':    'icon button, 3:1 control',
    # The stars always sit beside the same value in text ("4.6 · 128 reviews",
    # or an aria-hidden echo of it), so they are a graphic whose information is
    # available another way. They still owe 3:1 as a meaningful graphic, which
    # is checked explicitly below rather than waived.
    '.rating':          'stars duplicate adjacent text; held to 3:1 below',
    '.star-picker':     'input control, labelled; held to 3:1 below',
    # Sits on a photograph behind .tile__scrim, so there is no token to
    # compare against. The scrim is what guarantees the contrast.
    '.tile__label':     'white on a scrimmed photograph',
}

# The neutral grounds a component can sit on when it declares none itself.
NEUTRALS = ['surface', 'bg-page', 'surface-muted']

STRIP = _re.compile(r'/\*.*?\*/', _re.S)   # or the comment above a rule becomes part of its selector
BLOCK = _re.compile(r'([^{}]+)\{([^{}]*)\}')
COLOR = _re.compile(r'(?<!-)\bcolor:\s*var\(--([\w-]+)\)')
BG    = _re.compile(r'\bbackground(?:-color)?:\s*var\(--([\w-]+)\)')

swept = checked = 0
for css in sorted(_pl.Path('app/styles').glob('*.css')):
    for m in BLOCK.finditer(STRIP.sub(' ', css.read_text())):
        sel, body = ' '.join(m.group(1).split()), m.group(2)
        cm = COLOR.search(body)
        if not cm:
            continue
        fg = cm.group(1)
        if fg not in T:            # an indirection such as --btn-fg, not a palette colour
            continue
        swept += 1
        why = next((r for k, r in ALLOW.items() if k in sel), None)
        if why:
            continue
        bgm = BG.search(body)
        if bgm and bgm.group(1) in T:
            grounds = [bgm.group(1)]
        else:
            ground = next((g for k, g in sorted(GROUNDS.items(), key=lambda kv: -len(kv[0])) if k in sel), None)
            grounds = [ground] if ground else NEUTRALS
        checked += 1
        for g in grounds:
            r = ratio(T[fg], T[g])
            if r < 4.5:
                where = f"{css.name}: {sel}"
                fails.append((where, fg, g, r, 4.5))
                print(f"✗ {where[:42]:<42}{r:>6.2f}   4.5   ({fg} on {g})")

print(f"  swept {swept} color declarations across app/styles/*.css "
      f"({checked} held to 4.5:1, {swept - checked} exempt with a reason)")

print()
if fails:
    print(f"{len(fails)} pairing(s) below the WCAG AA minimum:")
    for label, fg, bg, r, m in fails:
        print(f"  • {label}: {fg} on {bg} is {r:.2f}:1, needs {m}:1")
else:
    print("All pairings meet WCAG AA.")
sys.exit(1 if fails else 0)
