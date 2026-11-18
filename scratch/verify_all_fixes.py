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

async def run_tests():
    temp_dir = tempfile.mkdtemp()
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9335
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

            # Navigate to homepage
            await client.send("Page.navigate", {"url": "http://localhost:8000/"})
            await asyncio.sleep(1.5)

            results = {}

            # ==========================================
            # TEST 1: Check absence of visible "Story Circle"
            # ==========================================
            story_circle_text = await client.eval_js("""
                (() => {
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                    let found = [];
                    while (walker.nextNode()) {
                        const node = walker.currentNode;
                        if (node.parentElement && getComputedStyle(node.parentElement).display !== 'none') {
                            if (node.nodeValue.toLowerCase().includes('story circle')) {
                                found.push({ tag: node.parentElement.tagName, text: node.nodeValue.trim() });
                            }
                        }
                    }
                    return found;
                })()
            """)
            results["visible_story_circle_occurrences"] = story_circle_text

            # ==========================================
            # TEST 2: FIX 1 - Newsletter Form Behavior
            # ==========================================
            # (a) Invalid email test
            inv_res = await client.eval_js("""
                (() => {
                    const form = document.getElementById('newsletterForm');
                    const email = document.getElementById('newsletterEmail');
                    const submitBtn = document.getElementById('newsletterSubmitBtn');
                    const err = document.getElementById('newsletterError');
                    email.value = 'not-an-email';
                    submitBtn.click();
                    return {
                        errorHidden: err.hidden,
                        errorText: err.innerText.trim(),
                        role: err.getAttribute('role'),
                        ariaLive: err.getAttribute('aria-live')
                    };
                })()
            """)
            results["newsletter_invalid_email"] = inv_res

            # (b) Unchecked consent test
            uncheck_res = await client.eval_js("""
                (() => {
                    const form = document.getElementById('newsletterForm');
                    const email = document.getElementById('newsletterEmail');
                    const consent = document.getElementById('newsletterConsent');
                    const submitBtn = document.getElementById('newsletterSubmitBtn');
                    const err = document.getElementById('newsletterError');
                    email.value = 'hello@example.com';
                    consent.checked = false;
                    submitBtn.click();
                    return {
                        errorHidden: err.hidden,
                        errorText: err.innerText.trim(),
                        role: err.getAttribute('role'),
                        ariaLive: err.getAttribute('aria-live')
                    };
                })()
            """)
            results["newsletter_unchecked_consent"] = uncheck_res

            # (c) Valid submission test
            valid_res = await client.eval_js("""
                (async () => {
                    const form = document.getElementById('newsletterForm');
                    const email = document.getElementById('newsletterEmail');
                    const consent = document.getElementById('newsletterConsent');
                    const submitBtn = document.getElementById('newsletterSubmitBtn');
                    const success = document.getElementById('newsletterSuccess');
                    email.value = 'parent@example.com';
                    consent.checked = true;
                    submitBtn.click();
                    // wait for simulated sending delay
                    await new Promise(r => setTimeout(r, 650));
                    
                    const style = window.getComputedStyle(success);
                    const icon = success.querySelector('svg');
                    return {
                        successHidden: success.hidden,
                        successText: success.innerText.trim(),
                        role: success.getAttribute('role'),
                        ariaLive: success.getAttribute('aria-live'),
                        emailValueAfter: email.value,
                        btnDisabled: submitBtn.disabled,
                        btnText: submitBtn.innerText.trim(),
                        sessionFlag: sessionStorage.getItem('subscribed_newsletter'),
                        bgColor: style.backgroundColor,
                        textColor: style.color,
                        borderColor: style.borderColor,
                        borderRadius: style.borderRadius,
                        padding: style.padding,
                        hasIcon: !!icon,
                        fontSize: style.fontSize,
                        fontFamily: style.fontFamily
                    };
                })()
            """)
            results["newsletter_valid_submit"] = valid_res

            # ==========================================
            # TEST 3: FIX 2 - Desktop Layout (1024, 1280, 1440, 1920)
            # ==========================================
            desktop_viewports = [1024, 1280, 1440, 1920]
            desktop_tests = {}
            for vp in desktop_viewports:
                await client.send("Emulation.setDeviceMetricsOverride", {
                    "width": vp,
                    "height": 900,
                    "deviceScaleFactor": 1,
                    "mobile": False
                })
                await asyncio.sleep(0.3)

                vp_res = await client.eval_js("""
                    (() => {
                        const sec = document.getElementById('contact');
                        const container = sec.querySelector('.contact-container');
                        const header = sec.querySelector('.contact-header');
                        const grid = sec.querySelector('.contact-grid');
                        const leftCard = sec.querySelector('.contact-info-card');
                        const rightCard = sec.querySelector('.contact-card');
                        const blossomSvg = sec.querySelector('.contact-blossom-svg');
                        const privacyNote = sec.querySelector('.contact-privacy-note');
                        const formRow = sec.querySelector('.contact-form-row');
                        const nameInput = document.getElementById('contactName');
                        const reasonSelect = document.getElementById('contactReason');
                        const textarea = document.getElementById('contactMessage');
                        const submitBtn = document.getElementById('contactSubmitBtn');

                        const secStyle = getComputedStyle(sec);
                        const containerStyle = getComputedStyle(container);
                        const headerStyle = getComputedStyle(header);
                        const gridStyle = getComputedStyle(grid);
                        const leftStyle = getComputedStyle(leftCard);
                        const rightStyle = getComputedStyle(rightCard);
                        const blossomStyle = blossomSvg ? getComputedStyle(blossomSvg) : null;
                        const privacyStyle = getComputedStyle(privacyNote);
                        const formRowStyle = getComputedStyle(formRow);
                        const nameStyle = getComputedStyle(nameInput);
                        const selectStyle = getComputedStyle(reasonSelect);
                        const textareaStyle = getComputedStyle(textarea);
                        const btnStyle = getComputedStyle(submitBtn);

                        const leftRect = leftCard.getBoundingClientRect();
                        const rightRect = rightCard.getBoundingClientRect();

                        return {
                            viewportWidth: window.innerWidth,
                            horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
                            secPadding: secStyle.padding,
                            containerMaxWidth: containerStyle.maxWidth,
                            containerPadding: containerStyle.padding,
                            headerMarginBottom: headerStyle.marginBottom,
                            gridColumns: gridStyle.gridTemplateColumns,
                            gridGap: gridStyle.gap,
                            gridAlignItems: gridStyle.alignItems,
                            leftCardHeight: Math.round(leftRect.height),
                            rightCardHeight: Math.round(rightRect.height),
                            equalHeights: Math.abs(leftRect.height - rightRect.height) <= 1,
                            leftPadding: leftStyle.padding,
                            rightPadding: rightStyle.padding,
                            hasBlossomSvg: !!blossomSvg,
                            blossomOpacity: blossomStyle ? blossomStyle.opacity : null,
                            blossomAriaHidden: blossomSvg ? blossomSvg.getAttribute('aria-hidden') : null,
                            privacyMarginTop: privacyStyle.marginTop,
                            formRowColumns: formRowStyle.gridTemplateColumns,
                            nameHeight: nameStyle.height,
                            nameBorderRadius: nameStyle.borderRadius,
                            selectHeight: selectStyle.height,
                            textareaMinHeight: textareaStyle.minHeight,
                            btnHeight: btnStyle.height,
                            btnWidth: Math.round(submitBtn.getBoundingClientRect().width),
                            btnDisplay: btnStyle.display
                        };
                    })()
                """)
                desktop_tests[str(vp)] = vp_res

            results["desktop_contact_layout"] = desktop_tests

            # ==========================================
            # TEST 4: FIX 2 - Tablet Layout (768px)
            # ==========================================
            await client.send("Emulation.setDeviceMetricsOverride", {
                "width": 768,
                "height": 1024,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(0.3)

            tablet_res = await client.eval_js("""
                (() => {
                    const sec = document.getElementById('contact');
                    const container = sec.querySelector('.contact-container');
                    const formWrap = sec.querySelector('.contact-form-wrap');
                    const infoWrap = sec.querySelector('.contact-info');
                    const grid = sec.querySelector('.contact-grid');
                    const btn = document.getElementById('contactSubmitBtn');

                    return {
                        viewportWidth: window.innerWidth,
                        secPadding: getComputedStyle(sec).padding,
                        containerMaxWidth: getComputedStyle(container).maxWidth,
                        gridColumns: getComputedStyle(grid).gridTemplateColumns,
                        formWrapOrder: getComputedStyle(formWrap).order,
                        infoWrapOrder: getComputedStyle(infoWrap).order,
                        btnWidth: Math.round(btn.getBoundingClientRect().width)
                    };
                })()
            """)
            results["tablet_contact_layout"] = tablet_res

            # ==========================================
            # TEST 5: FIX 2 - Mobile Layout (390px, 360px)
            # ==========================================
            mobile_tests = {}
            for m_vp in [390, 360]:
                await client.send("Emulation.setDeviceMetricsOverride", {
                    "width": m_vp,
                    "height": 844,
                    "deviceScaleFactor": 3,
                    "mobile": True
                })
                await asyncio.sleep(0.3)

                m_res = await client.eval_js("""
                    (() => {
                        const sec = document.getElementById('contact');
                        const secStyle = getComputedStyle(sec);
                        return {
                            viewportWidth: window.innerWidth,
                            secPadding: secStyle.padding,
                            horizontalScroll: document.documentElement.scrollWidth > window.innerWidth
                        };
                    })()
                """)
                mobile_tests[str(m_vp)] = m_res
            results["mobile_contact_layout"] = mobile_tests

            # ==========================================
            # TEST 6: FIX 3 - Subtle Leaves & Collision Check
            # ==========================================
            # Test at 1280px (Desktop)
            await client.send("Emulation.setDeviceMetricsOverride", {
                "width": 1280,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await client.eval_js("window.initSectionBackgroundLeaves();")
            await asyncio.sleep(0.3)

            leaves_1280 = await client.eval_js("""
                (() => {
                    function getLeavesInfo(secId, containerId) {
                        const sec = document.getElementById(secId);
                        const c = document.getElementById(containerId);
                        if (!sec || !c) return null;
                        const leaves = Array.from(c.querySelectorAll('.section-leaf'));
                        return {
                            secId,
                            count: leaves.length,
                            zIndex: getComputedStyle(c).zIndex,
                            leaves: leaves.map(l => {
                                const r = l.getBoundingClientRect();
                                const s = getComputedStyle(l);
                                return {
                                    width: Math.round(r.width),
                                    height: Math.round(r.height),
                                    left: l.style.left,
                                    right: l.style.right,
                                    top: l.style.top,
                                    opacity: s.opacity
                                };
                            })
                        };
                    }

                    // Check collisions in contact section
                    const contactSec = document.getElementById('contact');
                    const contactLeaves = Array.from(contactSec.querySelectorAll('.section-leaf'));
                    const contactTargets = [
                        document.getElementById('contactName'),
                        document.getElementById('contactEmail'),
                        document.getElementById('contactReason'),
                        document.getElementById('contactMessage'),
                        document.getElementById('contactConsent'),
                        document.getElementById('contactSubmitBtn'),
                        ...contactSec.querySelectorAll('a')
                    ].filter(Boolean);

                    let contactCollisions = 0;
                    contactLeaves.forEach(leaf => {
                        const lr = leaf.getBoundingClientRect();
                        contactTargets.forEach(tgt => {
                            const tr = tgt.getBoundingClientRect();
                            const overlap = !(lr.right < tr.left || lr.left > tr.right || lr.bottom < tr.top || lr.top > tr.bottom);
                            if (overlap) contactCollisions++;
                        });
                    });

                    // Check collisions in newsletter section
                    const newsSec = document.getElementById('story-circle');
                    const newsLeaves = Array.from(newsSec.querySelectorAll('.section-leaf'));
                    const newsTargets = [
                        document.getElementById('newsletterEmail'),
                        document.getElementById('newsletterConsent'),
                        document.getElementById('newsletterSubmitBtn'),
                        ...newsSec.querySelectorAll('a')
                    ].filter(Boolean);

                    let newsCollisions = 0;
                    newsLeaves.forEach(leaf => {
                        const lr = leaf.getBoundingClientRect();
                        newsTargets.forEach(tgt => {
                            const tr = tgt.getBoundingClientRect();
                            const overlap = !(lr.right < tr.left || lr.left > tr.right || lr.bottom < tr.top || lr.top > tr.bottom);
                            if (overlap) newsCollisions++;
                        });
                    });

                    // Footer leaves check
                    const footer = document.querySelector('footer');
                    const footerLeavesCount = footer ? footer.querySelectorAll('.section-leaf, .margin-leaf, .sg-drift-leaf').length : 0;

                    return {
                        sgLeaves: getLeavesInfo('story-garden', 'sgFallingLeaves'),
                        newsletterLeaves: getLeavesInfo('story-circle', 'newsletterLeavesBg'),
                        contactLeaves: getLeavesInfo('contact', 'contactLeavesBg'),
                        footerLeavesCount: footerLeavesCount,
                        contactCollisions: contactCollisions,
                        newsCollisions: newsCollisions
                    };
                })()
            """)
            results["leaves_desktop_1280"] = leaves_1280

            # Test at 390px (Mobile)
            await client.send("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 3,
                "mobile": True
            })
            await client.eval_js("window.initSectionBackgroundLeaves();")
            await asyncio.sleep(0.3)

            leaves_390 = await client.eval_js("""
                (() => {
                    function getLeavesInfo(secId, containerId) {
                        const c = document.getElementById(containerId);
                        if (!c) return null;
                        const leaves = Array.from(c.querySelectorAll('.section-leaf'));
                        return {
                            secId,
                            count: leaves.length,
                            leaves: leaves.map(l => {
                                const r = l.getBoundingClientRect();
                                return {
                                    width: Math.round(r.width),
                                    height: Math.round(r.height),
                                    left: l.style.left,
                                    right: l.style.right,
                                    top: l.style.top
                                };
                            })
                        };
                    }

                    const contactSec = document.getElementById('contact');
                    const contactLeaves = Array.from(contactSec.querySelectorAll('.section-leaf'));
                    const contactTargets = [
                        document.getElementById('contactName'),
                        document.getElementById('contactEmail'),
                        document.getElementById('contactReason'),
                        document.getElementById('contactMessage'),
                        document.getElementById('contactConsent'),
                        document.getElementById('contactSubmitBtn'),
                        ...contactSec.querySelectorAll('a')
                    ].filter(Boolean);

                    let contactCollisions = 0;
                    contactLeaves.forEach(leaf => {
                        const lr = leaf.getBoundingClientRect();
                        contactTargets.forEach(tgt => {
                            const tr = tgt.getBoundingClientRect();
                            const overlap = !(lr.right < tr.left || lr.left > tr.right || lr.bottom < tr.top || lr.top > tr.bottom);
                            if (overlap) contactCollisions++;
                        });
                    });

                    const newsSec = document.getElementById('story-circle');
                    const newsLeaves = Array.from(newsSec.querySelectorAll('.section-leaf'));
                    const newsTargets = [
                        document.getElementById('newsletterEmail'),
                        document.getElementById('newsletterConsent'),
                        document.getElementById('newsletterSubmitBtn'),
                        ...newsSec.querySelectorAll('a')
                    ].filter(Boolean);

                    let newsCollisions = 0;
                    newsLeaves.forEach(leaf => {
                        const lr = leaf.getBoundingClientRect();
                        newsTargets.forEach(tgt => {
                            const tr = tgt.getBoundingClientRect();
                            const overlap = !(lr.right < tr.left || lr.left > tr.right || lr.bottom < tr.top || lr.top > tr.bottom);
                            if (overlap) newsCollisions++;
                        });
                    });

                    return {
                        sgLeaves: getLeavesInfo('story-garden', 'sgFallingLeaves'),
                        newsletterLeaves: getLeavesInfo('story-circle', 'newsletterLeavesBg'),
                        contactLeaves: getLeavesInfo('contact', 'contactLeavesBg'),
                        contactCollisions: contactCollisions,
                        newsCollisions: newsCollisions
                    };
                })()
            """)
            results["leaves_mobile_390"] = leaves_390

            client.close()
            results["console_errors"] = client.console_errors

            print("=== TEST RESULTS START ===")
            print(json.dumps(results, indent=2))
            print("=== TEST RESULTS END ===")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_tests())
