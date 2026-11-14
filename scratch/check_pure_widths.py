with open('style.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Match pure width: \d+px (not max-width)
matches = re.finditer(r'([^{}]*\{[^}]*(?<!max-)(?<!min-)width\s*:\s*([0-9]+)px[^}]*\})', text)
print("=== FIXED width: >= 360px (NOT max-width) ===")
for m in matches:
    rule = m.group(1).strip()
    val = int(m.group(2))
    if val >= 320:
        selector = rule.split('{')[0].strip()
        print(f"{val}px in: {selector}")
