with open('style.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.finditer(r'(\.reveal-on-scroll[^{}]*\{[^}]*\})', text)
for m in matches:
    print(m.group(1))
    print('---')
