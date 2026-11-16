import subprocess
import time
import json
import urllib.request
import urllib.error
from websockets.sync.client import connect
import sys

def ensure_chrome():
    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read().decode())
        page_tabs = [t for t in tabs if t.get('type') == 'page']
        if page_tabs:
            print("Chrome already running with page tab")
            return None, page_tabs[0]["webSocketDebuggerUrl"]
    except Exception:
        pass

    print("Starting Chrome headless on 9222...")
    proc = subprocess.Popen([
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--no-first-run",
        "--no-default-browser-check",
        "--user-data-dir=C:\\Users\\Hassa\\AppData\\Local\\Temp\\chrome-test-profile"
    ])
    for _ in range(20):
        time.sleep(0.5)
        try:
            tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read().decode())
            page_tabs = [t for t in tabs if t.get('type') == 'page']
            if page_tabs:
                print("Chrome started successfully")
                return proc, page_tabs[0]["webSocketDebuggerUrl"]
        except Exception:
            pass
    raise RuntimeError("Failed to start Chrome")

class CDPClient:
    def __init__(self, ws_url):
        self.ws = connect(ws_url, legacy=True)
        self.msg_id = 0
        self.events = []

    def send(self, method, params=None):
        self.msg_id += 1
        payload = {"id": self.msg_id, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        while True:
            resp = json.loads(self.ws.recv())
            if "id" in resp and resp["id"] == self.msg_id:
                return resp.get("result", {})
            else:
                self.events.append(resp)

    def eval(self, expr):
        res = self.send("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True
        })
        if "exceptionDetails" in res:
            raise RuntimeError(f"JS Exception: {res['exceptionDetails']}")
        return res.get("result", {}).get("value")

    def close(self):
        self.ws.close()

def run_tests():
    chrome_proc, ws_url = ensure_chrome()
    try:
        cdp = CDPClient(ws_url)

        # Enable runtime & console
        cdp.send("Runtime.enable")
        cdp.send("Page.enable")

        pages = [
            ("author.html", "http://localhost:8000/author.html", ".author-page-heading"),
            ("privacy-policy", "http://localhost:8000/privacy-policy", ".privacy-hero__title"),
            ("index.html", "http://localhost:8000/index.html", ".hero-headline")
        ]

        widths = [360, 390, 430, 768, 1024, 1440]

        for page_name, url, heading_sel in pages:
            print(f"\n==========================================")
            print(f"Testing Page: {page_name} ({url})")
            print(f"==========================================")

            for w in widths:
                h = 800
                cdp.send("Emulation.setDeviceMetricsOverride", {
                    "width": w,
                    "height": h,
                    "deviceScaleFactor": 1,
                    "mobile": (w <= 899)
                })

                # Navigate
                cdp.send("Page.navigate", {"url": url})
                time.sleep(1.0)

                # Collect console errors
                errors = []
                for ev in cdp.events:
                    if ev.get("method") == "Runtime.consoleAPICalled":
                        if ev["params"]["type"] == "error":
                            errors.append(ev["params"]["args"])
                    elif ev.get("method") == "Runtime.exceptionThrown":
                        errors.append(ev["params"]["exceptionDetails"])
                cdp.events = []

                # Evaluate state
                info = cdp.eval("""(() => {
                    const docEl = document.documentElement;
                    const body = document.body;
                    const topBar = document.getElementById('topBar');
                    const mainNav = document.getElementById('mainNav');
                    const totalHeaderHeight = (topBar ? topBar.offsetHeight : 0) + (mainNav ? mainNav.offsetHeight : 0);
                    const cssHeaderH = getComputedStyle(docEl).getPropertyValue('--header-h').trim();

                    const scrollW = docEl.scrollWidth;
                    const clientW = docEl.clientWidth;
                    const innerW = window.innerWidth;
                    const hasHorizontalScroll = scrollW > innerW;

                    // Elements extending beyond innerW
                    const wideElements = [];
                    document.querySelectorAll('*').forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.right > innerW + 1 && r.width > 0 && r.height > 0) {
                            const cs = window.getComputedStyle(el);
                            if (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && cs.position !== 'fixed') {
                                wideElements.push({
                                    tag: el.tagName,
                                    id: el.id,
                                    cls: el.className,
                                    right: Math.round(r.right),
                                    width: Math.round(r.width)
                                });
                            }
                        }
                    });

                    // Heading clearance
                    const headingSel = """ + json.dumps(heading_sel) + """;
                    const heading = document.querySelector(headingSel);
                    let headingInfo = null;
                    if (heading) {
                        const r = heading.getBoundingClientRect();
                        headingInfo = {
                            top: Math.round(r.top),
                            bottom: Math.round(r.bottom),
                            height: Math.round(r.height),
                            clearanceBelowHeader: Math.round(r.top - totalHeaderHeight)
                        };
                    }

                    // Nav visibility
                    const menuToggle = document.getElementById('menuToggle');
                    const toggleStyle = menuToggle ? window.getComputedStyle(menuToggle) : null;
                    const toggleVisible = toggleStyle ? (toggleStyle.display !== 'none') : false;

                    const desktopMenu = document.getElementById('navMenuDesktop');
                    const desktopStyle = desktopMenu ? window.getComputedStyle(desktopMenu) : null;
                    const desktopVisible = desktopStyle ? (desktopStyle.display !== 'none') : false;

                    return {
                        innerW,
                        clientW,
                        scrollW,
                        hasHorizontalScroll,
                        wideElements: wideElements.slice(0, 5),
                        totalHeaderHeight,
                        cssHeaderH,
                        headingInfo,
                        toggleVisible,
                        desktopVisible
                    };
                })()""")

                # Test mobile drawer if on mobile/tablet <= 899
                drawer_test = None
                if w <= 899:
                    drawer_test = cdp.eval("""(() => {
                        const toggle = document.getElementById('menuToggle');
                        const drawer = document.getElementById('mobileDrawer');
                        const panel = document.getElementById('drawerPanel');
                        const closeBtn = document.getElementById('drawerClose');
                        if (!toggle || !drawer) return { skipped: true };

                        // 1. Initial state
                        const initialOpen = drawer.classList.contains('open');

                        // 2. Open drawer
                        toggle.click();
                        const openedClass = drawer.classList.contains('open');
                        const bodyDrawerOpen = document.body.classList.contains('drawer-open');
                        const ariaExpOpened = toggle.getAttribute('aria-expanded');
                        const panelOpenRect = panel ? panel.getBoundingClientRect() : null;

                        // 3. Close drawer via closeBtn
                        if (closeBtn) {
                            closeBtn.click();
                        } else {
                            toggle.click();
                        }
                        const closedClass = drawer.classList.contains('open');
                        const bodyDrawerClosed = document.body.classList.contains('drawer-open');
                        const bodyOverflowAfter = document.body.style.overflow;
                        const ariaExpClosed = toggle.getAttribute('aria-expanded');

                        // Test if page can scroll after closing
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        window.scrollBy({ top: 120, behavior: 'instant' });
                        const scrolledY = window.pageYOffset;
                        window.scrollTo({ top: 0, behavior: 'instant' });

                        return {
                            initialOpen,
                            openedClass,
                            bodyDrawerOpen,
                            ariaExpOpened,
                            panelRight: panelOpenRect ? Math.round(panelOpenRect.right) : null,
                            closedClass,
                            bodyDrawerClosed,
                            bodyOverflowAfter,
                            ariaExpClosed,
                            canScrollAfterClose: (scrolledY > 0)
                        };
                    })()""")

                # Anchor test on privacy policy & author page
                anchor_test = None
                if "privacy" in page_name:
                    anchor_test = cdp.eval("""(() => {
                        const link = document.querySelector('a[href="#who-we-are"]');
                        if (!link) return null;
                        const target = document.querySelector('#who-we-are');
                        if (!target) return null;
                        link.click();
                        const headerH = (document.getElementById('topBar')?.offsetHeight || 0) + (document.getElementById('mainNav')?.offsetHeight || 0);
                        const r = target.getBoundingClientRect();
                        return {
                            targetId: '#who-we-are',
                            top: Math.round(r.top),
                            headerH,
                            clearance: Math.round(r.top - headerH)
                        };
                    })()""")

                status = "PASS"
                reasons = []
                if info["hasHorizontalScroll"]:
                    status = "FAIL"
                    reasons.append(f"H-Scroll (scrollW={info['scrollW']} > {w})")
                if len(info["wideElements"]) > 0:
                    status = "WARN"
                    reasons.append(f"Wide elements: {info['wideElements']}")
                if info["headingInfo"] and info["headingInfo"]["clearanceBelowHeader"] < 0:
                    status = "FAIL"
                    reasons.append(f"Heading hidden behind header! Clearance: {info['headingInfo']['clearanceBelowHeader']}px")
                if w <= 899 and drawer_test:
                    if not drawer_test.get("openedClass"):
                        status = "FAIL"
                        reasons.append("Drawer did not open on hamburger click")
                    if not drawer_test.get("canScrollAfterClose"):
                        status = "FAIL"
                        reasons.append("Page cannot scroll after drawer close!")
                if errors:
                    status = "FAIL"
                    reasons.append(f"{len(errors)} Console Errors: {errors}")

                drawer_str = f"drawer: open={drawer_test.get('openedClass') if drawer_test else 'N/A'}, scrollAfterClose={drawer_test.get('canScrollAfterClose') if drawer_test else 'N/A'}" if drawer_test else "desktop"
                anchor_str = f"anchorClearance={anchor_test['clearance']}px" if anchor_test else ""
                print(f"[{status}] {w}px: header={info['totalHeaderHeight']}px (css: {info['cssHeaderH']}), headingClearance={info['headingInfo']['clearanceBelowHeader'] if info['headingInfo'] else 'N/A'}px | {drawer_str} | toggle={info['toggleVisible']} | desktopNav={info['desktopVisible']} | {anchor_str} | {', '.join(reasons) if reasons else 'OK'}")

        print("\nAll Tests Complete Successfully!")
        cdp.close()
    finally:
        if chrome_proc:
            chrome_proc.terminate()

if __name__ == "__main__":
    run_tests()
