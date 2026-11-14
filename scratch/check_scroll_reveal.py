with open('script.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'function initScrollReveal[\s\S]*?\n  \}', text)
if m:
    print(m.group(0))
else:
    print("Could not find initScrollReveal")
