with open('style.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find any width / min-width greater than 360px without max-width or % or media query
matches = re.finditer(r'([^{}]*\{[^}]*\b(?:min-width|width)\s*:\s*([0-9]+)px[^}]*\})', text)
print("=== FIXED WIDTHS >= 360px IN CSS ===")
for m in matches:
    rule = m.group(1).strip()
    val = int(m.group(2))
    if val >= 360:
        selector = rule.split('{')[0].strip()
        # check if it has max-width: 100% or similar
        print(f"{val}px in: {selector}")
