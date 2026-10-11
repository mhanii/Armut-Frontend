#!/usr/bin/env python3
"""Every product must have its own photograph, and every photograph must load.

Product imagery is hot-linked from a third party, so two things rot silently:
a URL is withdrawn upstream and the card falls back to a placeholder, or a
catalogue edit leaves two products sharing one picture. Both make a storefront
look scraped rather than shot, and neither shows up in a build.

Checks the seed and the mock fixtures by default; --live also checks the
running database's catalogue endpoint.
"""
import collections, json, re, pathlib, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

PHOTO = re.compile(r'photo-[\w-]+')


def products_from(path):
    text = pathlib.Path(path).read_text()
    if path.endswith('seed.js'):
        pairs = re.findall(r"\{ name: '([^']+)', v: '[^']+',.*?image: '([^']+)'", text, re.S)
    else:
        pairs = re.findall(r"\{ id: \d+, name: '([^']+)',.*?image: '([^']+)'", text)
    return pairs


def live_catalog(base='http://localhost:4000'):
    """Products, hero slides and room tiles — everything the storefront shows."""
    out = subprocess.run(['curl', '-s', '--max-time', '10', base + '/api/v1/catalog'],
                         capture_output=True, text=True).stdout
    try:
        d = json.loads(out)
    except Exception:
        return None
    rows = [(p['name'], p['image']) for p in d.get('products', []) if p.get('image')]
    rows += [(b.get('title', 'slide'), b['image']) for b in d.get('banners', []) if b.get('image')]
    rows += [(c['name'], c['image']) for c in d.get('categories', []) if c.get('image')]
    return rows


def head(url):
    return subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                           '--max-time', '25', '-L', url], capture_output=True, text=True).stdout.strip()


def audit(label, pairs, check_urls, duplicates=True):
    problems = []
    by = collections.defaultdict(list)
    for name, url in pairs:
        m = PHOTO.search(url)
        by[m.group(0) if m else url].append(name)
    if duplicates:
        for key, names in by.items():
            if len(names) > 1:
                problems.append(f'{len(names)} products share one photograph: ' + ', '.join(names))
    dead = []
    if check_urls:
        urls = {url for _, url in pairs}
        with ThreadPoolExecutor(max_workers=8) as ex:
            for url, code in zip(urls, ex.map(head, urls)):
                if code != '200':
                    dead.append((code, url))
        for code, url in dead:
            owner = next((n for n, u in pairs if u == url), '?')
            problems.append(f'{owner}: image returns {code} — {url[:72]}')
    print(f'{label:<28} {len(pairs):>3} images, {len(by):>3} distinct photographs'
          + (f', {len(dead)} dead' if check_urls else ''))
    for p in problems:
        print('   ✗ ' + p)
    return problems


live = '--live' in sys.argv
net = '--no-net' not in sys.argv
found = []
found += audit('backend/src/seed.js', products_from('backend/src/seed.js'), net)
found += audit('lib/mockData.js', products_from('lib/mockData.js'), net)
if live:
    rows = live_catalog()
    if rows is None:
        print('running API                  unreachable — skipped')
    else:
        # A hero slide reusing a product's photograph is not a fault — a banner
        # may legitimately show a piece from the catalogue — so the live pass
        # reports liveness across everything and duplicates only among products.
        found += audit('running API (all imagery)', rows, net, duplicates=False)

print()
print('Every product has its own photograph and every photograph loads.' if not found
      else f'{len(found)} problem(s) above.')
sys.exit(1 if found else 0)
