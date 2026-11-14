import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

assert 'id="story-garden"' in html, 'id=story-garden missing'
assert 'id="sgTreeWrap"' in html, 'sgTreeWrap missing'
assert 'id="sgTreeStage"' in html, 'sgTreeStage missing'
assert 'id="sgLeavesLayer"' in html, 'sgLeavesLayer missing'
assert 'id="sgMobilePills"' in html, 'sgMobilePills missing'
assert 'id="sgCardPanel"' in html, 'sgCardPanel missing'
assert 'id="sgPanelInner"' in html, 'sgPanelInner missing'
assert 'id="sgDebugBox"' not in html, 'old sgDebugBox still in html'

# Check Exact Client Content in script.js
with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

assert 'Whispers from Jannah' in js
assert 'Our first book' in js
assert 'A heartfelt story about love, loss, faith and hope.' in js
assert 'Learn about the book' in js
assert '#featured-book' in js

assert 'Little Roots: Pakistani Stories Collection' in js
assert 'In development' in js
assert 'A growing collection celebrating the beauty of Pakistani childhood.' in js
assert 'Discover Little Roots' in js
assert '#little-roots' in js

assert 'More Stories Under the Tree' in js
assert 'Future ideas' in js
assert 'New adventures, meaningful lessons and imaginative worlds waiting to grow.' in js

assert 'leafPositions' in js
assert 'gardenItems' in js
assert 'defaultIndex' in js

print('All code assertion checks passed!')
