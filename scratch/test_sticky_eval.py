import asyncio
import json
import subprocess
import tempfile
import urllib.request
import websockets

class CDPClient:
    def __init__(self, ws):
        self.ws = ws
        self.req_id = 0
        self.pending = {}
        self._reader_task = asyncio.create_task(self._reader())

    async def _reader(self):
        try:
            async for raw in self.ws:
                msg = json.loads(raw)
                if "id" in msg and msg["id"] in self.pending:
                    fut = self.pending.pop(msg["id"])
                    if not fut.done():
                        fut.set_result(msg.get("result", {}))
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    async def send(self, method, params=None):
        self.req_id += 1
        msg_id = self.req_id
        fut = asyncio.get_running_loop().create_future()
        self.pending[msg_id] = fut
        await self.ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        return await fut

    async def eval_js(self, expr):
        res = await self.send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        if "exceptionDetails" in res:
            raise Exception(f"JS Exception: {res['exceptionDetails']}")
        return res.get("result", {}).get("value")

    def close(self):
        self._reader_task.cancel()

async def test_sticky():
    temp_dir = tempfile.mkdtemp()
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9347
    cmd = [
        chrome_path,
        "--headless=new",
        f"--remote-debugging-port={port}",
        "--remote-allow-origins=*",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "http://localhost:8000/"
    ]
    proc = subprocess.Popen(cmd)
    await asyncio.sleep(2)

    try:
        with urllib.request.urlopen(f"http://localhost:{port}/json/list") as resp:
            tabs = json.loads(resp.read().decode())
            page_tab = next(t for t in tabs if t.get("type") == "page")
            ws_url = page_tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            client = CDPClient(ws)
            await client.send("Page.enable")
            await client.send("Page.navigate", {"url": "http://localhost:8000/"})
            await asyncio.sleep(1.5)

            await client.send("Emulation.setDeviceMetricsOverride", {
                "width": 1280,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })

            data = await client.eval_js("""
                (() => {
                    const sec = document.getElementById('contact');
                    sec.style.overflow = 'clip';
                    const grid = sec.querySelector('.contact-grid');
                    grid.style.alignItems = 'start';
                    const info = sec.querySelector('.contact-info');
                    info.style.height = '100%';
                    const card = sec.querySelector('.contact-info-card');
                    card.style.position = 'sticky';
                    card.style.top = 'calc(var(--header-h, 120px) + 24px)';
                    card.style.height = 'auto';

                    const secTop = sec.offsetTop;
                    window.scrollTo({ top: secTop + 250, behavior: 'instant' });
                    return new Promise(resolve => {
                        requestAnimationFrame(() => {
                            const cardRect = card.getBoundingClientRect();
                            resolve({
                                secTop: secTop,
                                scrollY: window.scrollY,
                                cardBoundingTop: Math.round(cardRect.top),
                                cardHeight: Math.round(cardRect.height),
                                headerH: getComputedStyle(document.documentElement).getPropertyValue('--header-h')
                            });
                        });
                    });
                })()
            """)
            print("Sticky Test:", json.dumps(data, indent=2))
            client.close()

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_sticky())
