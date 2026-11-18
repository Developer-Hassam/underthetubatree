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
        res = await self.send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
        if "exceptionDetails" in res:
            raise Exception(f"JS Exception: {res['exceptionDetails']}")
        return res.get("result", {}).get("value")

    def close(self):
        self._reader_task.cancel()

async def run_tests():
    temp_dir = tempfile.mkdtemp()
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9350
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

            # ---------------------------------------------------------------
            # TEST FIX 1: "GET NOTIFIED" REPEAT SUBMIT & NO REFRESH PERSISTENCE
            # ---------------------------------------------------------------
            print("=== TESTING FIX 1: NEWSLETTER FRESH ON REFRESH & EDIT RE-ENABLE ===")
            await client.send("Page.navigate", {"url": "http://localhost:8000/"})
            await asyncio.sleep(1.5)

            # Check initial fresh state
            init_state = await client.eval_js("""
                (() => {
                    const email = document.getElementById('newsletterEmail');
                    const consent = document.getElementById('newsletterConsent');
                    const btn = document.getElementById('newsletterSubmitBtn');
                    const status = document.getElementById('newsletterStatus');
                    return {
                        emailVal: email.value,
                        consentChecked: consent.checked,
                        btnDisabled: btn.disabled,
                        btnText: btn.textContent.trim(),
                        statusHidden: status.hidden,
                        storageKeySession: sessionStorage.getItem('subscribed_newsletter'),
                        storageKeyLocal: localStorage.getItem('subscribed_newsletter')
                    };
                })()
            """)
            print("Initial Newsletter State:", json.dumps(init_state, indent=2))
            assert init_state["emailVal"] == ""
            assert init_state["consentChecked"] == False
            assert init_state["btnDisabled"] == False
            assert init_state["btnText"] == "Subscribe"
            assert init_state["statusHidden"] == True
            assert init_state["storageKeySession"] is None
            assert init_state["storageKeyLocal"] is None

            # Perform successful submit
            await client.eval_js("""
                (() => {
                    const email = document.getElementById('newsletterEmail');
                    const consent = document.getElementById('newsletterConsent');
                    const form = document.getElementById('newsletterForm');
                    email.value = 'reader@test.com';
                    consent.checked = true;
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                })()
            """)
            await asyncio.sleep(0.9)

            sub_state = await client.eval_js("""
                (() => {
                    const email = document.getElementById('newsletterEmail');
                    const btn = document.getElementById('newsletterSubmitBtn');
                    const status = document.getElementById('newsletterStatus');
                    return {
                        emailVal: email.value,
                        btnDisabled: btn.disabled,
                        btnText: btn.textContent.trim(),
                        statusHidden: status.hidden,
                        statusType: status.getAttribute('data-type'),
                        storageKeySession: sessionStorage.getItem('subscribed_newsletter')
                    };
                })()
            """)
            print("Post-Subscribe State (Page stays open):", json.dumps(sub_state, indent=2))
            assert sub_state["emailVal"] == ""
            assert sub_state["btnDisabled"] == True
            assert sub_state["btnText"] == "Subscribed"
            assert sub_state["statusHidden"] == False
            assert sub_state["statusType"] == "success"
            assert sub_state["storageKeySession"] is None

            # Test edit email field -> button should re-enable!
            edit_state = await client.eval_js("""
                (() => {
                    const email = document.getElementById('newsletterEmail');
                    const btn = document.getElementById('newsletterSubmitBtn');
                    email.value = 'new-reader@test.com';
                    email.dispatchEvent(new Event('input', { bubbles: true }));
                    return {
                        emailVal: email.value,
                        btnDisabled: btn.disabled,
                        btnText: btn.textContent.trim()
                    };
                })()
            """)
            print("After Typing in Email Input:", json.dumps(edit_state, indent=2))
            assert edit_state["btnDisabled"] == False
            assert edit_state["btnText"] == "Subscribe"

            # Test page refresh / reload -> must be completely fresh!
            await client.send("Page.reload")
            await asyncio.sleep(1.5)

            refresh_state = await client.eval_js("""
                (() => {
                    const email = document.getElementById('newsletterEmail');
                    const consent = document.getElementById('newsletterConsent');
                    const btn = document.getElementById('newsletterSubmitBtn');
                    const status = document.getElementById('newsletterStatus');
                    return {
                        emailVal: email.value,
                        consentChecked: consent.checked,
                        btnDisabled: btn.disabled,
                        btnText: btn.textContent.trim(),
                        statusHidden: status.hidden,
                        storageKeySession: sessionStorage.getItem('subscribed_newsletter'),
                        storageKeyLocal: localStorage.getItem('subscribed_newsletter')
                    };
                })()
            """)
            print("After Page Reload:", json.dumps(refresh_state, indent=2))
            assert refresh_state["emailVal"] == ""
            assert refresh_state["consentChecked"] == False
            assert refresh_state["btnDisabled"] == False
            assert refresh_state["btnText"] == "Subscribe"
            assert refresh_state["statusHidden"] == True
            assert refresh_state["storageKeySession"] is None
            print(">>> FIX 1 PASSED 100%!")

            # ---------------------------------------------------------------
            # TEST FIX 2: CONTACT LEFT CARD (DESKTOP STICKY, COMPACT & MOBILE/TABLET)
            # ---------------------------------------------------------------
            print("\n=== TESTING FIX 2: CONTACT SECTION ACROSS VIEWPORTS ===")
            viewports = [390, 768, 1024, 1280, 1440, 1920]

            for vp in viewports:
                is_mobile = vp < 900
                await client.send("Emulation.setDeviceMetricsOverride", {
                    "width": vp,
                    "height": 900,
                    "deviceScaleFactor": 2 if is_mobile else 1,
                    "mobile": is_mobile
                })
                # Scroll to top
                await client.eval_js("window.scrollTo({ top: 0, behavior: 'instant' });")
                await asyncio.sleep(0.3)

                data = await client.eval_js("""
                    (() => {
                        const sec = document.getElementById('contact');
                        const grid = sec.querySelector('.contact-grid');
                        const info = sec.querySelector('.contact-info');
                        const card = sec.querySelector('.contact-info-card');
                        const formWrap = sec.querySelector('.contact-form-wrap');
                        const formCard = sec.querySelector('.contact-card');
                        const decorative = sec.querySelector('.contact-info-decorative');
                        const emailLink = sec.querySelector('.contact-link--email');
                        const emailIcon = emailLink ? emailLink.querySelector('svg') : null;
                        const instaLink = sec.querySelector('.contact-link--instagram');
                        const instaIcon = instaLink ? instaLink.querySelector('svg') : null;
                        const privacyNote = sec.querySelector('.contact-privacy-note');
                        const infoTop = sec.querySelector('.contact-info-top');

                        const gridStyle = getComputedStyle(grid);
                        const cardStyle = getComputedStyle(card);
                        const emailStyle = getComputedStyle(emailLink);
                        const privacyStyle = getComputedStyle(privacyNote);
                        const infoTopStyle = getComputedStyle(infoTop);

                        const cardRect = card.getBoundingClientRect();
                        const formRect = formCard.getBoundingClientRect();

                        const hasBranchInDOM = !!decorative;
                        const isOneColumn = cardRect.bottom <= formRect.top || formRect.bottom <= cardRect.top;

                        return {
                            vp: window.innerWidth,
                            hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
                            hasBranchInDOM: hasBranchInDOM,
                            isOneColumn: isOneColumn,
                            gridAlignItems: gridStyle.alignItems,
                            cardPosition: cardStyle.position,
                            cardHeight: Math.round(cardRect.height),
                            formHeight: Math.round(formRect.height),
                            cardPadding: cardStyle.padding,
                            cardBorderRadius: cardStyle.borderRadius,
                            infoTopGap: infoTopStyle.gap,
                            emailFontSize: emailStyle.fontSize,
                            emailIconWidth: emailIcon ? emailIcon.getBoundingClientRect().width : null,
                            emailIconHeight: emailIcon ? emailIcon.getBoundingClientRect().height : null,
                            privacyMarginTop: privacyStyle.marginTop,
                            privacyBorderTop: privacyStyle.borderTop
                        };
                    })()
                """)
                print(f"Viewport {vp}px Data:", json.dumps(data, indent=2))
                assert data["hasHorizontalScroll"] == False, f"Horizontal scroll detected at {vp}px!"
                assert data["hasBranchInDOM"] == False, f"Decorative branch still in DOM at {vp}px!"

                if vp < 900:
                    assert data["isOneColumn"] == True, f"Expected 1 column at {vp}px"
                    assert data["cardBorderRadius"] == "24px"
                    assert data["cardPadding"] == "24px"
                else:
                    assert data["isOneColumn"] == False, f"Expected 2 columns at {vp}px"
                    assert data["gridAlignItems"] == "start", f"Expected align-items: start at {vp}px"
                    assert data["cardPosition"] == "sticky", f"Expected position: sticky on card at {vp}px"
                    assert data["cardHeight"] < data["formHeight"] - 150, f"Card should be compact and shorter than form! card: {data['cardHeight']}, form: {data['formHeight']}"
                    assert data["cardPadding"] == "36px"
                    assert data["emailFontSize"] == "17px"
                    assert data["emailIconWidth"] == 22
                    assert data["infoTopGap"] == "18px"
                    assert data["privacyMarginTop"] == "28px"
                    assert "rgba(196, 154, 88, 0.3)" in data["privacyBorderTop"] or "1px solid" in data["privacyBorderTop"]

                    # Test Sticky Scrolling on Desktop!
                    scroll_test = await client.eval_js("""
                        (() => {
                            const sec = document.getElementById('contact');
                            const card = sec.querySelector('.contact-info-card');
                            const grid = sec.querySelector('.contact-grid');
                            const gridTop = grid.getBoundingClientRect().top + window.scrollY;
                            const targetScroll = gridTop - 146;

                            // Scroll so card reaches sticky threshold
                            window.scrollTo({ top: targetScroll + 60, behavior: 'instant' });
                            const top1 = Math.round(card.getBoundingClientRect().top);

                            // Scroll further while still within form height
                            window.scrollTo({ top: targetScroll + 160, behavior: 'instant' });
                            const top2 = Math.round(card.getBoundingClientRect().top);

                            return {
                                gridTop: Math.round(gridTop),
                                targetScroll: Math.round(targetScroll),
                                top1: top1,
                                top2: top2,
                                isStuck: Math.abs(top1 - top2) <= 1
                            };
                        })()
                    """)
                    print(f"Viewport {vp}px Sticky Scroll Test:", json.dumps(scroll_test, indent=2))
                    assert scroll_test["isStuck"] == True, f"Card failed to stick at {vp}px! top1: {scroll_test['top1']}, top2: {scroll_test['top2']}"

            print(">>> FIX 2 PASSED 100% ACROSS ALL VIEWPORTS!")
            client.close()

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_tests())
