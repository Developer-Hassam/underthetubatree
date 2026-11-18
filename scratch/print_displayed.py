import json

with open('scratch/step1_audit_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('=== DESKTOP (1280px) DISPLAYED SIZES ===')
for item in d['displayedInfo'].get('desktop', []):
    src = item.get('src', '')
    if any(k in src for k in ['reader', 'little-roots', 'dreams-deen', 'heartfelt', 'hero-bg', 'author', 'logo', 'cover', 'garden']):
        print(f"{src.split('/')[-1]:<30} Rendered: {item['w']}x{item['h']} | Natural: {item['naturalW']}x{item['naturalH']}")

print('\n=== MOBILE (390px) DISPLAYED SIZES ===')
for item in d['displayedInfo'].get('mobile', []):
    src = item.get('src', '')
    if any(k in src for k in ['reader', 'little-roots', 'dreams-deen', 'heartfelt', 'hero-bg', 'author', 'logo', 'cover', 'garden']):
        print(f"{src.split('/')[-1]:<30} Rendered: {item['w']}x{item['h']} | Natural: {item['naturalW']}x{item['naturalH']}")

print('\n=== LIGHTBOX DISPLAYED SIZES ===')
lb = d['displayedInfo'].get('lightbox_desktop', {})
print(f"Lightbox image rendered: {lb.get('w')}x{lb.get('h')}")
