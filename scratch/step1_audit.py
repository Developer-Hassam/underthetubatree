import os
import re
import json
import hashlib
import urllib.request
import subprocess
import time
from PIL import Image
from websockets.sync.client import connect

def get_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def analyze_project():
    project_root = os.path.abspath('.')
    
    # All project files
    all_files = {}
    for root, dirs, files in os.walk(project_root):
        if 'scratch' in root or '.git' in root:
            continue
        for f in files:
            p = os.path.relpath(os.path.join(root, f), project_root)
            full_p = os.path.join(project_root, p)
            all_files[p] = {
                'size': os.path.getsize(full_p),
                'hash': get_hash(full_p)
            }

    # Text files content
    text_files = [
        'index.html', 'author.html', 'privacy-policy/index.html',
        'privacy-policy.html', 'privacy.html', 'style.css', 'script.js'
    ]
    texts = {}
    for tf in text_files:
        if tf in all_files:
            with open(os.path.join(project_root, tf), 'r', encoding='utf-8') as f:
                texts[tf] = f.read()

    # Dynamic asset patterns in script.js:
    # garden-${item.stage}-900.webp, garden-${item.stage}-1400.webp
    # Stages are bloom, sprout, seed
    dynamic_resolved = [
        'assets/garden-bloom-900.webp', 'assets/garden-bloom-1400.webp',
        'assets/garden-sprout-900.webp', 'assets/garden-sprout-1400.webp',
        'assets/garden-seed-900.webp', 'assets/garden-seed-1400.webp'
    ]

    # Map references
    ref_map = {}
    for p in all_files:
        if p.startswith('assets'):
            norm_p = p.replace('\\', '/')
            base_p = os.path.basename(p)
            found_in = []
            
            if norm_p in dynamic_resolved:
                found_in.append('script.js (dynamic garden-${item.stage}-...)')
            
            for tf, content in texts.items():
                if norm_p in content or ('assets/' + base_p) in content or ('assets/images/' + base_p) in content:
                    found_in.append(tf)
                # Check css url()
                if tf == 'style.css' and base_p in content:
                    found_in.append('style.css (url)')
            
            ref_map[norm_p] = list(set(found_in))

    # (a) Unreferenced assets
    unreferenced = []
    for p, refs in ref_map.items():
        if len(refs) == 0:
            unreferenced.append({
                'path': p,
                'size': all_files[p.replace('/', '\\')]['size']
            })

    # (b) Duplicates & redundant formats
    hashes = {}
    duplicates = []
    for p, d in all_files.items():
        if p.startswith('assets'):
            h = d['hash']
            if h in hashes:
                duplicates.append({
                    'file1': hashes[h],
                    'file2': p,
                    'size': d['size']
                })
            else:
                hashes[h] = p

    # Format duplicates (same stem name)
    format_dupes = []
    stems = {}
    for p in all_files:
        if p.startswith('assets'):
            stem = os.path.splitext(os.path.basename(p))[0]
            stems.setdefault(stem, []).append(p)
    for stem, file_list in stems.items():
        if len(file_list) > 1:
            format_dupes.append({
                'stem': stem,
                'files': file_list,
                'refs': {f: ref_map.get(f.replace('\\', '/'), []) for f in file_list}
            })

    # (c) Measure displayed sizes in Chrome
    proc = subprocess.Popen([
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--no-first-run",
        "--no-default-browser-check",
        "--user-data-dir=C:\\Users\\Hassa\\AppData\\Local\\Temp\\chrome-audit-clean"
    ])
    time.sleep(1.5)

    displayed_info = {}
    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read().decode())
        page = [t for t in tabs if t.get('type') == 'page'][0]
        ws = connect(page['webSocketDebuggerUrl'], legacy=True)
        msg_id = [0]
        def send(method, params=None):
            msg_id[0] += 1
            ws.send(json.dumps({'id': msg_id[0], 'method': method, 'params': params or {}}))
            while True:
                resp = json.loads(ws.recv())
                if resp.get('id') == msg_id[0]:
                    return resp.get('result', {})

        send('Runtime.enable')
        send('Page.enable')

        for w, mode in [(1280, 'desktop'), (390, 'mobile')]:
            send('Emulation.setDeviceMetricsOverride', {
                'width': w, 'height': 800, 'deviceScaleFactor': 1, 'mobile': (mode == 'mobile')
            })
            send('Page.navigate', {'url': 'http://localhost:8000/'})
            time.sleep(1.0)

            # Query all images
            img_data = send('Runtime.evaluate', {'expression': '''(() => {
                const results = [];
                document.querySelectorAll('img, picture source').forEach(el => {
                    const src = el.currentSrc || el.src || el.getAttribute('srcset') || el.getAttribute('src');
                    const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
                    results.push({
                        tag: el.tagName,
                        src: src,
                        w: r ? Math.round(r.width) : (el.offsetWidth || 0),
                        h: r ? Math.round(r.height) : (el.offsetHeight || 0),
                        naturalW: el.naturalWidth || null,
                        naturalH: el.naturalHeight || null
                    });
                });
                return results;
            })()''', 'returnByValue': True})
            displayed_info[mode] = img_data.get('result', {}).get('value', [])

        # Look inside modal images
        send('Runtime.evaluate', {'expression': '''document.getElementById('lookInsideBtn')?.click();'''})
        time.sleep(0.5)
        lb_img = send('Runtime.evaluate', {'expression': '''(() => {
            const img = document.getElementById('lightboxImg');
            const r = img ? img.getBoundingClientRect() : null;
            return {
                src: img ? img.src : null,
                w: r ? Math.round(r.width) : 0,
                h: r ? Math.round(r.height) : 0
            };
        })()''', 'returnByValue': True})
        displayed_info['lightbox_desktop'] = lb_img.get('result', {}).get('value', {})

        ws.close()
    finally:
        proc.terminate()

    # (d) Unused CSS analysis
    css_content = texts.get('style.css', '')
    
    # CSS variables
    var_defs = re.findall(r'--([a-zA-Z0-9_-]+)\s*:', css_content)
    unused_vars = []
    for v in set(var_defs):
        # check if var(--name) appears elsewhere in css or js
        usage_in_css = len(re.findall(r'var\(--' + re.escape(v) + r'[\),]', css_content))
        usage_in_js = len(re.findall(r'--' + re.escape(v), texts.get('script.js', '')))
        if usage_in_css == 0 and usage_in_js == 0:
            unused_vars.append('--' + v)

    # CSS @keyframes
    keyframes_defs = re.findall(r'@keyframes\s+([a-zA-Z0-9_-]+)', css_content)
    unused_keyframes = []
    for kf in set(keyframes_defs):
        if len(re.findall(r'animation[^;]*\b' + re.escape(kf) + r'\b', css_content)) == 0 and \
           len(re.findall(r'\b' + re.escape(kf) + r'\b', texts.get('script.js', ''))) == 0:
            unused_keyframes.append(kf)

    # Output everything to json
    results = {
        'totalFiles': len(all_files),
        'totalBytes': sum(d['size'] for d in all_files.values()),
        'allFiles': all_files,
        'referenceMap': ref_map,
        'unreferencedAssets': unreferenced,
        'duplicateAssets': duplicates,
        'formatDuplicates': format_dupes,
        'displayedInfo': displayed_info,
        'unusedVars': unused_vars,
        'unusedKeyframes': unused_keyframes
    }

    with open('scratch/step1_audit_data.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print('Step 1 Audit Data generated successfully!')

if __name__ == '__main__':
    analyze_project()
