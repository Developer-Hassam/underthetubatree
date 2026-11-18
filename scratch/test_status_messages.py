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

async def test_viewport(client, vp):
    print(f"\n==========================================")
    print(f"TESTING AT VIEWPORT {vp}px")
    print(f"==========================================")

    is_mobile = vp < 900
    await client.send("Emulation.setDeviceMetricsOverride", {
        "width": vp,
        "height": 900,
        "deviceScaleFactor": 2 if is_mobile else 1,
        "mobile": is_mobile
    })

    # Clear sessionStorage and reload page fresh
    await client.eval_js("sessionStorage.clear();")
    await client.send("Page.navigate", {"url": "http://localhost:8000/"})
    await asyncio.sleep(1.5)

    # 1. LOAD TEST
    load_state = await client.eval_js("""
        (() => {
            const nlStatus = document.getElementById('newsletterStatus');
            const nlSuccessOld = document.getElementById('newsletterSuccess');
            const nlErrorOld = document.getElementById('newsletterError');
            const contactStatus = document.getElementById('contactStatus');
            const contactSuccessOld = document.getElementById('contactSuccess');
            const contactErrorOld = document.getElementById('contactError');

            // Find all visible status/msg boxes in document
            const allMsgBoxes = Array.from(document.querySelectorAll('.newsletter-msg, .contact-msg'));
            const visibleBoxes = allMsgBoxes.filter(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' && !el.hidden && rect.height > 0;
            });

            return {
                nlStatusHidden: nlStatus ? nlStatus.hidden : null,
                nlStatusDisplay: nlStatus ? getComputedStyle(nlStatus).display : null,
                contactStatusHidden: contactStatus ? contactStatus.hidden : null,
                contactStatusDisplay: contactStatus ? getComputedStyle(contactStatus).display : null,
                oldNlBoxesExist: !!(nlSuccessOld || nlErrorOld),
                oldContactBoxesExist: !!(contactSuccessOld || contactErrorOld),
                visibleBoxCount: visibleBoxes.length,
                visibleBoxDetails: visibleBoxes.map(b => ({ id: b.id, className: b.className, text: b.textContent.trim() }))
            };
        })()
    """)
    print("1. Page Load State:", json.dumps(load_state, indent=2))
    assert load_state["visibleBoxCount"] == 0, f"Expected 0 visible boxes on load, got {load_state['visibleBoxCount']}"
    assert load_state["nlStatusHidden"] == True
    assert load_state["nlStatusDisplay"] == "none"

    # 2. NEWSLETTER: INVALID EMAIL TEST
    await client.eval_js("""
        (() => {
            const email = document.getElementById('newsletterEmail');
            const consent = document.getElementById('newsletterConsent');
            const form = document.getElementById('newsletterForm');
            email.value = 'invalid-email';
            consent.checked = true;
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()
    """)
    await asyncio.sleep(0.3)

    invalid_email_state = await client.eval_js("""
        (() => {
            const status = document.getElementById('newsletterStatus');
            const style = getComputedStyle(status);
            const rect = status.getBoundingClientRect();
            const textEl = document.getElementById('newsletterStatusText');
            const iconSuccess = status.querySelector('.newsletter-msg__icon--success');
            const iconError = status.querySelector('.newsletter-msg__icon--error');

            const allMsgBoxes = Array.from(document.querySelectorAll('.newsletter-msg, .contact-msg'));
            const visibleBoxes = allMsgBoxes.filter(el => {
                const s = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return s.display !== 'none' && !el.hidden && r.height > 0;
            });

            return {
                hidden: status.hidden,
                display: style.display,
                dataType: status.getAttribute('data-type'),
                text: textEl ? textEl.textContent.trim() : status.textContent.trim(),
                borderColor: style.borderColor,
                bgColor: style.backgroundColor,
                textColor: style.color,
                iconSuccessDisplay: iconSuccess ? getComputedStyle(iconSuccess).display : null,
                iconErrorDisplay: iconError ? getComputedStyle(iconError).display : null,
                visibleBoxCount: visibleBoxes.length,
                emptyBoxesCount: visibleBoxes.filter(b => b.textContent.trim() === '').length
            };
        })()
    """)
    print("2. Newsletter Invalid Email:", json.dumps(invalid_email_state, indent=2))
    assert invalid_email_state["hidden"] == False
    assert invalid_email_state["dataType"] == "error"
    assert invalid_email_state["text"] == "Please enter a valid email address."
    assert invalid_email_state["iconErrorDisplay"] == "block"
    assert invalid_email_state["iconSuccessDisplay"] == "none"
    assert invalid_email_state["visibleBoxCount"] == 1
    assert invalid_email_state["emptyBoxesCount"] == 0

    # 3. NEWSLETTER: UNCHECKED CONSENT TEST
    await client.eval_js("""
        (() => {
            const email = document.getElementById('newsletterEmail');
            const consent = document.getElementById('newsletterConsent');
            const form = document.getElementById('newsletterForm');
            email.value = 'parent@example.com';
            consent.checked = false;
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()
    """)
    await asyncio.sleep(0.3)

    unchecked_consent_state = await client.eval_js("""
        (() => {
            const status = document.getElementById('newsletterStatus');
            const style = getComputedStyle(status);
            const textEl = document.getElementById('newsletterStatusText');
            const allMsgBoxes = Array.from(document.querySelectorAll('.newsletter-msg, .contact-msg'));
            const visibleBoxes = allMsgBoxes.filter(el => {
                const s = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return s.display !== 'none' && !el.hidden && r.height > 0;
            });

            return {
                hidden: status.hidden,
                dataType: status.getAttribute('data-type'),
                text: textEl ? textEl.textContent.trim() : status.textContent.trim(),
                visibleBoxCount: visibleBoxes.length,
                emptyBoxesCount: visibleBoxes.filter(b => b.textContent.trim() === '').length
            };
        })()
    """)
    print("3. Newsletter Unchecked Consent:", json.dumps(unchecked_consent_state, indent=2))
    assert unchecked_consent_state["hidden"] == False
    assert unchecked_consent_state["dataType"] == "error"
    assert unchecked_consent_state["text"] == "Please tick the box to agree."
    assert unchecked_consent_state["visibleBoxCount"] == 1
    assert unchecked_consent_state["emptyBoxesCount"] == 0

    # 4. NEWSLETTER: FIX AND SUBMIT (VALID SUBMISSION)
    await client.eval_js("""
        (() => {
            const email = document.getElementById('newsletterEmail');
            const consent = document.getElementById('newsletterConsent');
            const form = document.getElementById('newsletterForm');
            email.value = 'reader@example.com';
            consent.checked = true;
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()
    """)
    # Wait for demo delay (500ms + margin)
    await asyncio.sleep(0.9)

    valid_submit_state = await client.eval_js("""
        (() => {
            const status = document.getElementById('newsletterStatus');
            const style = getComputedStyle(status);
            const textEl = document.getElementById('newsletterStatusText');
            const email = document.getElementById('newsletterEmail');
            const btn = document.getElementById('newsletterSubmitBtn');
            const iconSuccess = status.querySelector('.newsletter-msg__icon--success');
            const iconError = status.querySelector('.newsletter-msg__icon--error');

            const allMsgBoxes = Array.from(document.querySelectorAll('.newsletter-msg, .contact-msg'));
            const visibleBoxes = allMsgBoxes.filter(el => {
                const s = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return s.display !== 'none' && !el.hidden && r.height > 0;
            });

            return {
                hidden: status.hidden,
                display: style.display,
                dataType: status.getAttribute('data-type'),
                text: textEl ? textEl.textContent.trim() : status.textContent.trim(),
                borderColor: style.borderColor,
                bgColor: style.backgroundColor,
                textColor: style.color,
                iconSuccessDisplay: iconSuccess ? getComputedStyle(iconSuccess).display : null,
                iconErrorDisplay: iconError ? getComputedStyle(iconError).display : null,
                emailCleared: email.value === '',
                btnDisabled: btn.disabled,
                btnText: btn.textContent.trim(),
                sessionStorageSet: sessionStorage.getItem('subscribed_newsletter') === 'true',
                visibleBoxCount: visibleBoxes.length,
                emptyBoxesCount: visibleBoxes.filter(b => b.textContent.trim() === '').length,
                allVisibleDetails: visibleBoxes.map(b => ({ id: b.id, text: b.textContent.trim(), type: b.getAttribute('data-type') }))
            };
        })()
    """)
    print("4. Newsletter Valid Submit:", json.dumps(valid_submit_state, indent=2))
    assert valid_submit_state["hidden"] == False
    assert valid_submit_state["dataType"] == "success"
    assert valid_submit_state["text"] == "Thank you! Please check your inbox to confirm your email. We'll send you one email when the book is ready."
    assert valid_submit_state["iconSuccessDisplay"] == "block"
    assert valid_submit_state["iconErrorDisplay"] == "none"
    assert valid_submit_state["emailCleared"] == True
    assert valid_submit_state["btnDisabled"] == True
    assert valid_submit_state["btnText"] == "Subscribed"
    assert valid_submit_state["visibleBoxCount"] == 1
    assert valid_submit_state["emptyBoxesCount"] == 0

    # 5. CONTACT FORM TESTS
    # Validation failure (empty submit)
    await client.eval_js("""
        (() => {
            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()
    """)
    await asyncio.sleep(0.3)

    contact_empty_submit = await client.eval_js("""
        (() => {
            const status = document.getElementById('contactStatus');
            const nameErr = document.getElementById('contactNameError');
            return {
                statusHidden: status ? status.hidden : null,
                statusDisplay: status ? getComputedStyle(status).display : null,
                nameErrHidden: nameErr ? nameErr.hidden : null,
                nameErrDisplay: nameErr ? getComputedStyle(nameErr).display : null
            };
        })()
    """)
    print("5a. Contact Empty Submit:", json.dumps(contact_empty_submit, indent=2))
    assert contact_empty_submit["statusHidden"] == True
    assert contact_empty_submit["statusDisplay"] == "none"
    assert contact_empty_submit["nameErrHidden"] == False
    assert contact_empty_submit["nameErrDisplay"] == "inline" or contact_empty_submit["nameErrDisplay"] == "block"

    # Contact Valid Submit
    await client.eval_js("""
        (() => {
            const form = document.getElementById('contactForm');
            document.getElementById('contactName').value = 'Jane Doe';
            document.getElementById('contactEmail').value = 'jane@example.com';
            document.getElementById('contactReason').value = 'Reader or parent';
            document.getElementById('contactMessage').value = 'Looking forward to the book release!';
            document.getElementById('contactConsent').checked = true;
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()
    """)
    await asyncio.sleep(0.9)

    contact_valid_submit = await client.eval_js("""
        (() => {
            const status = document.getElementById('contactStatus');
            const style = getComputedStyle(status);
            const textEl = document.getElementById('contactStatusText');
            const mailtoWrap = document.getElementById('contactMailtoFallback');
            const iconSuccess = status.querySelector('.contact-msg__icon--success');
            const iconError = status.querySelector('.contact-msg__icon--error');

            return {
                hidden: status.hidden,
                display: style.display,
                dataType: status.getAttribute('data-type'),
                text: textEl ? textEl.textContent.trim() : status.textContent.trim(),
                iconSuccessDisplay: iconSuccess ? getComputedStyle(iconSuccess).display : null,
                iconErrorDisplay: iconError ? getComputedStyle(iconError).display : null,
                mailtoWrapHidden: mailtoWrap ? mailtoWrap.hidden : null,
                mailtoWrapDisplay: mailtoWrap ? getComputedStyle(mailtoWrap).display : null
            };
        })()
    """)
    print("5b. Contact Valid Submit:", json.dumps(contact_valid_submit, indent=2))
    assert contact_valid_submit["hidden"] == False
    assert contact_valid_submit["dataType"] == "success"
    assert contact_valid_submit["text"] == "Thank you, your message is on its way. I'll reply as soon as I can."
    assert contact_valid_submit["iconSuccessDisplay"] == "block"
    assert contact_valid_submit["iconErrorDisplay"] == "none"
    assert contact_valid_submit["mailtoWrapHidden"] == False

    print(f"ALL TESTS PASSED AT {vp}px!")

async def main():
    temp_dir = tempfile.mkdtemp()
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9341
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

            # Test 390px
            await test_viewport(client, 390)

            # Test 1280px
            await test_viewport(client, 1280)

            print("\nConsole Errors Encountered:", len(client.console_errors))
            if client.console_errors:
                print("Console Errors:", json.dumps(client.console_errors, indent=2))
            assert len(client.console_errors) == 0, f"Expected 0 console errors, got {len(client.console_errors)}"

            client.close()
            print("\n==========================================")
            print("ALL VIEWPORT AND FORM TESTS COMPLETED SUCCESSFULLY!")
            print("==========================================")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
