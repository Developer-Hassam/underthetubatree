import urllib.request
import re

base = 'http://127.0.0.1:8080'
for u in ['/', '/style.css?v=28', '/script.js?v=28']:
    req = urllib.request.urlopen(base + u)
    content = req.read().decode('utf-8')
    print(f'{u}: 200 OK, length {len(content)}')

# Verify index.html content from server
index_html = urllib.request.urlopen(base + '/').read().decode('utf-8')
dividers = re.findall(r'<div[^>]*divider[^>]*>', index_html)
print('\nDividers found in index.html:', len(dividers))
for d in dividers:
    print(' ', d)

# Verify no section-divider in index.html
print('Has section-divider:', 'section-divider' in index_html)
print('Has explore-divider:', 'explore-divider' in index_html)
print('Has hero-wave-divider:', 'hero-wave-divider' in index_html)

# Verify style.css
css = urllib.request.urlopen(base + '/style.css?v=28').read().decode('utf-8')
print('\nCSS checks:')
print('Has .section-divider definition:', '.section-divider {' in css)
print('Has .explore-divider definition:', '.explore-divider {' in css)
print('Has .hero-wave-divider definition:', '.hero-wave-divider {' in css)

# Verify border-top removal on sections
for sec in ['.section--ivory', '.section--sage', '.sg', '.site-footer']:
    m = re.search(re.escape(sec) + r'\s*\{([^}]+)\}', css)
    if m:
        b_top = [l.strip() for l in m.group(1).split(';') if 'border-top' in l]
        print(f'{sec} border-top: {b_top}')
