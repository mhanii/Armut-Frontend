# Catch imports of names a module does not export. The bundler resolves these
# to undefined at runtime rather than failing the build.
import re, pathlib, sys
root = pathlib.Path('.')
files = [p for p in root.rglob('*.jsx') if 'node_modules' not in str(p) and '.next' not in str(p)]
exports = {}
for p in files:
    s = p.read_text()
    names = set(re.findall(r'^export\s+(?:async\s+)?function\s+(\w+)', s, re.M))
    names |= set(re.findall(r'^export\s+(?:const|let|var)\s+(\w+)', s, re.M))
    for m in re.findall(r'^export\s*\{([^}]*)\}', s, re.M):
        names |= {n.strip().split(' as ')[-1].strip() for n in m.split(',') if n.strip()}
    exports[p.resolve()] = names

bad = []
for p in files:
    s = p.read_text()
    for m in re.finditer(r'import\s*\{([^}]*)\}\s*from\s*[\'"]([^\'"]+)[\'"]', s):
        names, spec = m.group(1), m.group(2)
        if not (spec.startswith('.') or spec.startswith('@/')): continue
        target = (root / spec[2:]) if spec.startswith('@/') else (p.parent / spec)
        target = target.resolve()
        if target not in exports: continue
        for n in [x.strip().split(' as ')[0].strip() for x in names.split(',') if x.strip()]:
            if n and n not in exports[target]:
                bad.append(f"{p}: imports '{n}' from {spec} — not exported")
print("\n".join(bad) if bad else "✓ every named import resolves")
sys.exit(1 if bad else 0)
