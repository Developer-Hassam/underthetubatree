import subprocess
import time
import urllib.request
import json
from websockets.sync.client import connect

proc = subprocess.Popen([
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=C:\\Users\\Hassa\\AppData\\Local\\Temp\\chrome-quick-check'
])
time.sleep(1.5)
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
    send('Page.navigate', {'url': 'http://localhost:8000/'})
    time.sleep(1.0)

    expr = """(() => {
        const card3Btn = document.querySelectorAll('.sg-card__btn')[2];
        const allStoryCircleBtns = Array.from(document.querySelectorAll('a[href="#story-circle"], a[href*="#story-circle"]')).map(a => ({
            text: a.textContent.trim(),
            href: a.getAttribute('href')
        }));
        return {
            card3Btn: card3Btn ? { text: card3Btn.textContent.trim(), href: card3Btn.getAttribute('href') } : null,
            allStoryCircleBtns: allStoryCircleBtns
        };
    })()"""

    res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
    print(json.dumps(res.get('result', {}).get('value'), indent=2))
    ws.close()
finally:
    proc.terminate()
