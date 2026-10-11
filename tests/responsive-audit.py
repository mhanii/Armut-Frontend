#!/usr/bin/env python3
"""Find fixed dimensions that would overflow a phone viewport.

Horizontal scroll on mobile almost always traces to a hardcoded width,
min-width or non-wrapping grid wider than the screen. This flags those in both
the stylesheets and the inline styles that remain in JSX.
"""
import re, sys, pathlib

PHONE = 375  # narrowest common viewport
REM = 16
ALLOWED_SCROLL = ('table-wrap', 'scroll-x', 'header__rail', 'console__nav')

def px(val, unit):
    return float(val) * (REM if unit == 'rem' else 1)

issues = []

# --- stylesheets -----------------------------------------------------------
for css in pathlib.Path('app/styles').glob('*.css'):
    text = css.read_text()
    # Track which rules sit inside a scroll container or a min-width media query.
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', text):
        sel, body = m.group(1).strip(), m.group(2)
        before = text[:m.start()]
        # inside a min-width media query? then it only applies on wider screens
        opens = before.count('@media')
        if opens and before.rfind('@media') > before.rfind('}\n}'):
            mq = text[before.rfind('@media'):m.start()]
            if 'min-width' in mq:
                continue
        if any(a in sel for a in ALLOWED_SCROLL):
            continue
        for prop in ('width', 'min-width'):
            for d in re.finditer(rf'(?<!-){prop}:\s*([\d.]+)(px|rem)', body):
                w = px(d.group(1), d.group(2))
                if w > PHONE:
                    issues.append(f"{css.name}: {sel} has {prop}: {d.group(1)}{d.group(2)} ({int(w)}px)")

# --- inline styles in JSX --------------------------------------------------
# Only look inside style={{ ... }}. A bare `width: 1200` elsewhere in a file is
# usually metadata (an OpenGraph image size), not a layout dimension.
STYLE_BLOCK = re.compile(r"style=\{\{(.*?)\}\}", re.S)
for jsx in list(pathlib.Path('components').rglob('*.jsx')) + list(pathlib.Path('app').rglob('*.jsx')):
    if 'EnvSwitch' in str(jsx):
        continue
    text = jsx.read_text()
    for blk in STYLE_BLOCK.finditer(text):
        for m in re.finditer(r"(minWidth|width):\s*'?([\d.]+)(px|rem)?'?", blk.group(1)):
            prop, val, unit = m.group(1), m.group(2), m.group(3) or 'px'
            w = px(val, unit)
            if w > PHONE:
                line = text[:blk.start() + m.start()].count('\n') + 1
                issues.append(f"{jsx}:{line}: {prop}: {val}{unit} ({int(w)}px)")

# --- non-wrapping multi-column grids --------------------------------------
for jsx in list(pathlib.Path('components').rglob('*.jsx')) + list(pathlib.Path('app').rglob('*.jsx')):
    text = jsx.read_text()
    for m in re.finditer(r"gridTemplateColumns:\s*'([^']+)'", text):
        v = m.group(1)
        if 'auto-fit' in v or 'auto-fill' in v or v.strip() == '1fr':
            continue
        line = text[:m.start()].count('\n') + 1
        issues.append(f"{jsx}:{line}: fixed grid '{v}' does not reflow")

print("\n".join(f"  • {i}" for i in issues) if issues else "✓ nothing would overflow a 375px viewport")
print(f"\n{len(issues)} finding(s)")
sys.exit(1 if issues else 0)
