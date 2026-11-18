import re
import subprocess
import time
import json
import urllib.request
from websockets.sync.client import connect

def parse_css_selectors():
    with open('style.css', 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove comments
    content_no_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

    # Remove @media / @keyframes blocks headers but keep contents
    # Let's extract selector blocks: selector { ... }
    # We can use regex to find all `selector {`
    # ignoring @-rules
    selectors = []
    # Split by { and }
    depth = 0
    buffer = ""
    in_selector = True
    current_sel = ""

    for line in content.splitlines():
        line_clean = re.sub(r'/\*.*?\*/', '', line).strip()
        if not line_clean:
            continue
        if line_clean.startswith('@keyframes'):
            continue
        if '{' in line_clean:
            parts = line_clean.split('{')
            sel_part = parts[0].strip()
            if sel_part and not sel_part.startswith('@'):
                # Multiple comma-separated selectors
                for s in sel_part.split(','):
                    s_clean = s.strip()
                    if s_clean and not s_clean.startswith('@') and not s_clean.startswith('from') and not s_clean.startswith('to') and not s_clean.endswith('%'):
                        selectors.append(s_clean)

    # Deduplicate while preserving order
    unique_sels = []
    seen = set()
    for s in selectors:
        if s not in seen:
            seen.add(s)
            unique_sels.append(s)

    return unique_sels

def test_selectors_in_browser(selectors):
    proc = subprocess.Popen([
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--no-first-run",
        "--no-default-browser-check",
        "--user-data-dir=C:\\Users\\Hassa\\AppData\\Local\\Temp\\chrome-css-clean"
    ])
    time.sleep(1.5)

    unused_selectors = []
    used_selectors = []
    syntax_error_selectors = []

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

        pages = [
            'http://localhost:8000/',
            'http://localhost:8000/author.html',
            'http://localhost:8000/privacy-policy'
        ]

        # For each selector, we clean pseudo-classes/elements for querySelector:
        # e.g., :hover, :focus, :active, :focus-visible, ::before, ::after, ::placeholder, :nth-child
        def clean_sel(s):
            # remove pseudo elements
            c = re.sub(r'::[a-zA-Z0-9_-]+', '', s)
            # remove dynamic pseudo classes
            c = re.sub(r':(hover|focus|active|focus-visible|focus-within|visited|checked|disabled|placeholder-shown|target)', '', c)
            # If selector starts with body.drawer-open or .mobile-drawer.open or has dynamic classes, strip dynamic prefix
            c = re.sub(r'body\.(drawer-open|skip-intro-active|intro-ready)\s+', '', c)
            c = re.sub(r'\.(open|is-active|in|active|main-nav--scrolled)\b', '', c)
            return c.strip()

        matched = set()

        for url in pages:
            send('Page.navigate', {'url': url})
            time.sleep(0.8)

            # Test selectors in page
            res = send('Runtime.evaluate', {
                'expression': '''((sels) => {
                    const results = {};
                    sels.forEach(s => {
                        try {
                            const count = document.querySelectorAll(s).length;
                            results[s] = count;
                        } catch(e) {
                            results[s] = -1; // syntax / pseudo error
                        }
                    });
                    return results;
                })(''' + json.dumps([clean_sel(s) for s in selectors]) + ''')''',
                'returnByValue': True
            })

            data = res.get('result', {}).get('value', {})
            for original_sel in selectors:
                c = clean_sel(original_sel)
                cnt = data.get(c, 0)
                if cnt > 0:
                    matched.add(original_sel)

        for s in selectors:
            if s not in matched:
                unused_selectors.append(s)
            else:
                used_selectors.append(s)

        ws.close()
    finally:
        proc.terminate()

    return unused_selectors, used_selectors

if __name__ == '__main__':
    sels = parse_css_selectors()
    print(f'Total selectors parsed: {len(sels)}')
    unused, used = test_selectors_in_browser(sels)
    print(f'Used selectors: {len(used)}')
    print(f'Potentially unused selectors: {len(unused)}')
    with open('scratch/unused_css.json', 'w', encoding='utf-8') as f:
        json.dump({'unused': unused, 'used': used}, f, indent=2)
    print('Unused CSS written to scratch/unused_css.json')
