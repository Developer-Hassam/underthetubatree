import os

files = [
    'ground.png', 'hero-bg.png', 'leaf-pair.png', 'logo-clean.png',
    'logo-lockup.png', 'logo-tree.png', 'top-branch.png',
    'heartfelt-stories.webp', 'little-roots.png', 'dreams-deen.png'
]

for f in files:
    found = []
    for root, dirs, fnames in os.walk('.'):
        if 'scratch' in root or '.git' in root:
            continue
        for fn in fnames:
            if fn.endswith(('.html', '.js', '.css')):
                p = os.path.join(root, fn)
                with open(p, 'r', encoding='utf-8') as fl:
                    t = fl.read()
                if f in t:
                    found.append(p)
    print(f"{f:<25}: {found if found else 'NOT FOUND IN ANY CODE'}")
