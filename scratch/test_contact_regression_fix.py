import asyncio
import json
import os
import subprocess
import tempfile
import urllib.request
import websockets

class CDPClient:
    def __init__(self, ws):
        self.ws = ws
        self.req_id = 0
        self.pending = {}
        self.console_errors = []
        self._reader_task = asyncio.create_task(self._reader())

    async def _reader(self):
        try:
            async for raw in self.ws:
                msg = json.loads(raw)
                if "id" in msg and msg["id"] in self.pending:
                    fut = self.pending.pop(msg["id"])
                    if not fut.done():
                        fut.set_result(msg.get("result", {}))
                elif msg.get("method") == "Runtime.consoleAPICalled":
                    params = msg.get("params", {})
                    if params.get("type") == "error":
                        self.console_errors.append(params)
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

async def run_audit():
    temp_dir = tempfile.mkdtemp()
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9339
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

        async with websockets.connect(ws_url, max_size=10*1024*1024) as ws:
            client = CDPClient(ws)
            await client.send("Page.enable")
            await client.send("Runtime.enable")

            # Load page
            await client.send("Page.navigate", {"url": "http://localhost:8000/"})
            await asyncio.sleep(1.5)

            viewports = [360, 390, 430, 600, 768, 899, 900, 1024, 1280, 1440]
            report = {}

            for vp in viewports:
                is_mobile = vp < 900
                await client.send("Emulation.setDeviceMetricsOverride", {
                    "width": vp,
                    "height": 900,
                    "deviceScaleFactor": 2 if is_mobile else 1,
                    "mobile": is_mobile
                })
                # Trigger leaf update if window changed
                await client.eval_js("if (window.initSectionBackgroundLeaves) window.initSectionBackgroundLeaves();")
                await asyncio.sleep(0.3)

                data = await client.eval_js("""
                    (() => {
                        const sec = document.getElementById('contact');
                        const container = sec.querySelector('.contact-container');
                        const grid = sec.querySelector('.contact-grid');
                        const infoCard = sec.querySelector('.contact-info-card');
                        const formCard = sec.querySelector('.contact-card');
                        const decorative = sec.querySelector('.contact-info-decorative');
                        const emailLink = sec.querySelector('.contact-link--email');
                        const emailSpan = emailLink.querySelector('span');
                        const nameInput = document.getElementById('contactName');
                        const emailInput = document.getElementById('contactEmail');
                        const reasonSelect = document.getElementById('contactReason');
                        const textarea = document.getElementById('contactMessage');
                        const submitBtn = document.getElementById('contactSubmitBtn');
                        const consent = document.getElementById('contactConsent');

                        const secStyle = getComputedStyle(sec);
                        const containerStyle = getComputedStyle(container);
                        const gridStyle = getComputedStyle(grid);
                        const infoStyle = getComputedStyle(infoCard);
                        const formStyle = getComputedStyle(formCard);
                        const decorStyle = getComputedStyle(decorative);
                        const emailStyle = getComputedStyle(emailLink);
                        const nameStyle = getComputedStyle(nameInput);
                        const selectStyle = getComputedStyle(reasonSelect);
                        const btnStyle = getComputedStyle(submitBtn);

                        const secRect = sec.getBoundingClientRect();
                        const infoRect = infoCard.getBoundingClientRect();
                        const formRect = formCard.getBoundingClientRect();
                        const nameRect = nameInput.getBoundingClientRect();
                        const emailInputRect = emailInput.getBoundingClientRect();
                        const emailSpanRect = emailSpan.getBoundingClientRect();
                        const btnRect = submitBtn.getBoundingClientRect();

                        // Check leaf collisions
                        const leaves = Array.from(sec.querySelectorAll('.section-leaf'));
                        const targets = [nameInput, emailInput, reasonSelect, textarea, consent, submitBtn].filter(Boolean);
                        let leafCollisions = 0;
                        leaves.forEach(leaf => {
                            const lr = leaf.getBoundingClientRect();
                            targets.forEach(t => {
                                const tr = t.getBoundingClientRect();
                                const overlap = !(lr.right < tr.left || lr.left > tr.right || lr.bottom < tr.top || lr.top > tr.bottom);
                                if (overlap) leafCollisions++;
                            });
                        });

                        const isOneColumn = infoRect.bottom <= formRect.top || formRect.bottom <= infoRect.top;
                        const infoFirst = infoRect.top < formRect.top;
                        const gapBetweenCards = Math.round(formRect.top - infoRect.bottom);
                        const fieldsStacked = nameRect.bottom <= emailInputRect.top;
                        const emailOneLine = emailSpanRect.height <= 30; // 1 line height is 15-27px, 2 lines would be >=40px

                        return {
                            vp: window.innerWidth,
                            hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
                            secPadding: secStyle.padding,
                            containerMaxWidth: containerStyle.maxWidth,
                            containerPadding: containerStyle.padding,
                            gridColumns: gridStyle.gridTemplateColumns,
                            isOneColumn: isOneColumn,
                            infoFirst: infoFirst,
                            gapBetweenCards: gapBetweenCards,
                            infoCardPadding: infoStyle.padding,
                            infoCardBorderRadius: infoStyle.borderRadius,
                            formCardPadding: formStyle.padding,
                            formCardBorderRadius: formStyle.borderRadius,
                            infoCardWidth: Math.round(infoRect.width),
                            formCardWidth: Math.round(formRect.width),
                            sideMarginLeft: Math.round(infoRect.left),
                            sideMarginRight: Math.round(window.innerWidth - infoRect.right),
                            fieldsStacked: fieldsStacked,
                            nameHeight: nameStyle.height,
                            nameWidth: Math.round(nameRect.width),
                            selectHeight: selectStyle.height,
                            btnHeight: btnStyle.height,
                            btnWidth: Math.round(btnRect.width),
                            btnFullWidth: Math.abs(btnRect.width - formRect.width + 48) <= 4, // width matching form inner width
                            decorativeDisplay: decorStyle.display,
                            emailOneLine: emailOneLine,
                            emailHeight: Math.round(emailSpanRect.height),
                            emailFontSize: emailStyle.fontSize,
                            equalHeights: Math.abs(infoRect.height - formRect.height) <= 1,
                            leafCollisions: leafCollisions
                        };
                    })()
                """)
                report[str(vp)] = data

            client.close()
            print("=== REGRESSION AUDIT RESULTS ===")
            print(json.dumps(report, indent=2))
            print("=== AUDIT END ===")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_audit())
