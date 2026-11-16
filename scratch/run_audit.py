import subprocess
import time
import json
import urllib.request
import urllib.error
from websockets.sync.client import connect
import sys
import os
from PIL import Image

def run_deep_audit():
    proc = subprocess.Popen([
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--no-first-run",
        "--no-default-browser-check",
        "--user-data-dir=C:\\Users\\Hassa\\AppData\\Local\\Temp\\chrome-audit-profile"
    ])
    time.sleep(1.5)

    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read().decode())
        page_tabs = [t for t in tabs if t.get('type') == 'page']
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]

        ws = connect(ws_url, legacy=True)
        msg_id = 0

        def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method}
            if params:
                payload["params"] = params
            ws.send(json.dumps(payload))
            while True:
                resp = json.loads(ws.recv())
                if "id" in resp and resp["id"] == msg_id:
                    return resp.get("result", {})

        def evaluate(expr):
            res = send("Runtime.evaluate", {
                "expression": expr,
                "returnByValue": True,
                "awaitPromise": True
            })
            if "exceptionDetails" in res:
                return {"error": res["exceptionDetails"]}
            return res.get("result", {}).get("value")

        send("Runtime.enable")
        send("Page.enable")

        results = {}

        # 1. VIEWPORT TESTS ACROSS ALL PAGES
        viewports = [360, 390, 430, 768, 1024, 1280, 1440]
        pages = [
            ("homepage", "http://localhost:8000/"),
            ("author", "http://localhost:8000/author.html"),
            ("privacy", "http://localhost:8000/privacy-policy")
        ]

        vp_results = {}
        for p_name, p_url in pages:
            vp_results[p_name] = {}
            for w in viewports:
                send("Emulation.setDeviceMetricsOverride", {
                    "width": w,
                    "height": 800,
                    "deviceScaleFactor": 1,
                    "mobile": (w <= 899)
                })
                send("Page.navigate", {"url": p_url})
                time.sleep(0.8)

                data = evaluate("""(() => {
                    const doc = document.documentElement;
                    const body = document.body;
                    const topBar = document.getElementById('topBar');
                    const mainNav = document.getElementById('mainNav');
                    const tbH = topBar ? topBar.offsetHeight : 0;
                    const navH = mainNav ? mainNav.offsetHeight : 0;
                    const totalHeaderH = tbH + navH;
                    const cssHeaderH = getComputedStyle(doc).getPropertyValue('--header-h').trim();

                    const scrollW = doc.scrollWidth;
                    const innerW = window.innerWidth;
                    const hasHScroll = scrollW > innerW;

                    // Wide elements
                    const wide = [];
                    document.querySelectorAll('*').forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.right > innerW + 1 && r.width > 0 && r.height > 0) {
                            const cs = window.getComputedStyle(el);
                            if (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.position !== 'fixed') {
                                wide.push({
                                    tag: el.tagName,
                                    cls: el.className,
                                    right: Math.round(r.right),
                                    w: Math.round(r.width)
                                });
                            }
                        }
                    });

                    // First heading offset
                    let firstH1 = document.querySelector('h1');
                    let h1Rect = firstH1 ? firstH1.getBoundingClientRect() : null;
                    let h1Clearance = h1Rect ? Math.round(h1Rect.top - totalHeaderH) : null;

                    // Drawer test if w <= 899
                    let drawerState = null;
                    if (window.innerWidth <= 899) {
                        const toggle = document.getElementById('menuToggle');
                        const drawer = document.getElementById('mobileDrawer');
                        const closeBtn = document.getElementById('drawerClose');
                        if (toggle && drawer) {
                            toggle.click();
                            const openClass = drawer.classList.contains('open');
                            const bodyLock = body.classList.contains('drawer-open');
                            if (closeBtn) closeBtn.click();
                            else toggle.click();
                            const closeClass = drawer.classList.contains('open');
                            const bodyUnlock = !body.classList.contains('drawer-open');
                            window.scrollBy({ top: 50, behavior: 'instant' });
                            const scrolled = window.pageYOffset > 0;
                            window.scrollTo({ top: 0, behavior: 'instant' });
                            drawerState = {
                                openClass,
                                bodyLock,
                                closeClass,
                                bodyUnlock,
                                scrolled
                            };
                        }
                    }

                    return {
                        scrollW,
                        innerW,
                        hasHScroll,
                        wide: wide.slice(0, 3),
                        totalHeaderH,
                        cssHeaderH,
                        h1Top: h1Rect ? Math.round(h1Rect.top) : null,
                        h1Clearance,
                        drawerState
                    };
                })()""")
                vp_results[p_name][w] = data

        results["viewports"] = vp_results

        # 2. HOMEPAGE DETAILED AUDIT (desktop & mobile)
        send("Emulation.setDeviceMetricsOverride", {"width": 1280, "height": 800, "deviceScaleFactor": 1, "mobile": False})
        send("Page.navigate", {"url": "http://localhost:8000/"})
        time.sleep(1.0)

        hp_details = evaluate("""(() => {
            // Hero details
            const h1 = document.querySelector('.hero-headline')?.textContent?.trim();
            const brand = document.querySelector('.hero-brand')?.textContent?.trim();
            const tagline = document.querySelector('.hero-tagline')?.textContent?.trim();
            const intro = document.querySelector('.hero-intro')?.textContent?.trim();
            const btns = Array.from(document.querySelectorAll('.hero-action .btn')).map(b => ({
                text: b.textContent.trim(),
                href: b.getAttribute('href')
            }));

            // Explore section
            const expH2 = document.querySelector('.explore-header h2')?.textContent?.trim();
            const expIntro = document.querySelector('.explore-header p')?.textContent?.trim();
            const expCards = Array.from(document.querySelectorAll('.explore-card')).map(c => ({
                title: c.querySelector('h3')?.textContent?.trim(),
                desc: c.querySelector('.explore-card__desc')?.textContent?.trim(),
                badge: c.querySelector('.explore-badge')?.textContent?.trim(),
                feat: c.querySelector('.explore-card__featured')?.textContent?.trim(),
                imgSrc: c.querySelector('img')?.getAttribute('src')
            }));

            // Featured Book
            const fbLabel = document.querySelector('.featured-book__label')?.textContent?.trim();
            const fbTitle = document.querySelector('.featured-book__title')?.textContent?.trim();
            const fbSubtitle = document.querySelector('.featured-book__subtitle')?.textContent?.trim();
            const fbStatus = document.querySelector('.featured-book__status')?.textContent?.trim();
            const fbDesc = Array.from(document.querySelectorAll('.featured-book__desc p')).map(p => p.textContent.trim());
            const fbThemes = Array.from(document.querySelectorAll('.featured-book__theme-tag')).map(t => t.textContent.trim());
            const fbAudience = document.querySelector('.featured-book__audience p')?.textContent?.trim();
            const fbBtn = document.querySelector('.featured-book__cta .btn-gold')?.textContent?.trim();
            const fbBtnHref = document.querySelector('.featured-book__cta .btn-gold')?.getAttribute('href');
            const lookInsideBtn = document.querySelector('.featured-book__cta .btn-look-inside')?.textContent?.trim();

            // Story Garden
            const sgH2 = document.querySelector('#story-garden h2')?.textContent?.trim();
            const sgIntro = document.querySelector('#story-garden .section__subhead, #story-garden .section-lead, #story-garden .section__intro, #story-garden p')?.textContent?.trim();
            const sgCards = Array.from(document.querySelectorAll('.sg-card')).map(c => ({
                badge: c.querySelector('.sg-card__badge')?.textContent?.trim(),
                title: c.querySelector('.sg-card__title')?.textContent?.trim(),
                desc: c.querySelector('.sg-card__desc')?.textContent?.trim(),
                btnText: c.querySelector('.sg-card__btn')?.textContent?.trim(),
                btnHref: c.querySelector('.sg-card__btn')?.getAttribute('href'),
                imgSrc: c.querySelector('.sg-card__img')?.getAttribute('src'),
                imgAlt: c.querySelector('.sg-card__img')?.getAttribute('alt')
            }));

            // Little Roots
            const lrTitle = document.querySelector('#little-roots h2, .little-roots__title')?.textContent?.trim();
            const lrTagline = document.querySelector('.little-roots__tagline, .little-roots__intro, .little-roots__lead')?.textContent?.trim();
            const lrSubhead = document.querySelector('.little-roots__subhead, .little-roots h3')?.textContent?.trim();
            const lrParas = Array.from(document.querySelectorAll('.little-roots__text p, .little-roots__description p')).map(p => p.textContent.trim());
            const lrListTitle = document.querySelector('.little-roots__list-title, .little-roots__themes-title')?.textContent?.trim();
            const lrItems = Array.from(document.querySelectorAll('.little-roots__themes li, .little-roots__list li')).map(li => li.textContent.trim());
            const lrBadge = document.querySelector('.little-roots__badge')?.textContent?.trim();
            const lrBtn = document.querySelector('.little-roots__cta a, .little-roots .btn')?.textContent?.trim();
            const lrBtnHref = document.querySelector('.little-roots__cta a, .little-roots .btn')?.getAttribute('href');

            // Author homepage section
            const authorH2 = document.querySelector('#author h2, .about-author h2')?.textContent?.trim();
            const authorTagline = document.querySelector('.about-author__tagline')?.textContent?.trim();
            const authorLead = document.querySelector('.about-author__lead, .about-author__italic, .about-author__quote')?.textContent?.trim();
            const authorLetter = Array.from(document.querySelectorAll('.about-author__letter p')).map(p => p.textContent.trim());
            const authorBtn = document.querySelector('.about-author__cta a, .about-author .btn')?.textContent?.trim();
            const authorBtnHref = document.querySelector('.about-author__cta a, .about-author .btn')?.getAttribute('href');

            // Signup section (#story-circle)
            const scHeading = document.querySelector('#story-circle h2, .newsletter-card h2')?.textContent?.trim();
            const scPromise = document.querySelector('.newsletter-card__promise, .newsletter-card p')?.textContent?.trim();
            const scPrivacy = document.querySelector('.newsletter-privacy, .form-privacy')?.textContent?.trim();
            const scConsent = document.querySelector('.form-consent label, .newsletter-consent label')?.textContent?.trim();
            const scPrivacyLink = document.querySelector('.newsletter-card a[href*="privacy"]')?.getAttribute('href');
            const scBtn = document.querySelector('#storyCircleForm button[type="submit"]')?.textContent?.trim();

            // Contact section
            const ctHeading = document.querySelector('#contact h2')?.textContent?.trim();
            const ctIntro = document.querySelector('#contact .section-lead, #contact .section__intro, #contact p')?.textContent?.trim();
            const ctEmail = document.querySelector('#contact a[href^="mailto:"]')?.getAttribute('href');
            const ctInsta = document.querySelector('#contact a[href*="instagram"]')?.getAttribute('href');
            const ctFb = document.querySelector('#contact a[href*="facebook"]');
            const ctFbDisplay = ctFb ? window.getComputedStyle(ctFb).display : 'none';

            // Footer
            const ftLogo = document.querySelector('.footer__logo-img')?.getAttribute('src');
            const ftTagline = document.querySelector('.footer__tagline')?.textContent?.trim();
            const ftLinks = Array.from(document.querySelectorAll('.footer__nav a')).map(a => ({
                text: a.textContent.trim(),
                href: a.getAttribute('href')
            }));
            const ftInsta = document.querySelector('.footer__socials a[href*="instagram"]')?.getAttribute('href');
            const ftFb = document.querySelector('.footer__socials a[href*="facebook"]');
            const ftFbDisplay = ftFb ? window.getComputedStyle(ftFb).display : 'none';
            const ftPrivacy = document.querySelector('.footer__privacy-link')?.getAttribute('href');
            const ftClosing = document.querySelector('.footer__closing')?.textContent?.trim();
            const ftCopyright = document.querySelector('.footer__copyright')?.textContent?.trim();

            return {
                hero: { h1, brand, tagline, intro, btns },
                explore: { expH2, expIntro, expCards },
                featuredBook: { fbLabel, fbTitle, fbSubtitle, fbStatus, fbDesc, fbThemes, fbAudience, fbBtn, fbBtnHref, lookInsideBtn },
                storyGarden: { sgH2, sgIntro, sgCards },
                littleRoots: { lrTitle, lrTagline, lrSubhead, lrParas, lrListTitle, lrItems, lrBadge, lrBtn, lrBtnHref },
                author: { authorH2, authorTagline, authorLead, authorLetter, authorBtn, authorBtnHref },
                signup: { scHeading, scPromise, scPrivacy, scConsent, scPrivacyLink, scBtn },
                contact: { ctHeading, ctIntro, ctEmail, ctInsta, ctFbDisplay },
                footer: { ftLogo, ftTagline, ftLinks, ftInsta, ftFbDisplay, ftPrivacy, ftClosing, ftCopyright }
            };
        })()""")
        results["homepage"] = hp_details

        # 3. LOOK INSIDE MODAL AUDIT
        look_inside_data = evaluate("""(() => {
            const btn = document.querySelector('.btn-look-inside');
            if (btn) btn.click();
            const modal = document.getElementById('lookInsideModal');
            const frame = document.querySelector('.look-inside__frame');
            const slides = Array.from(document.querySelectorAll('.look-inside__slide')).map(s => {
                const img = s.querySelector('img');
                return {
                    src: img?.getAttribute('src'),
                    alt: img?.getAttribute('alt'),
                    naturalW: img?.naturalWidth,
                    naturalH: img?.naturalHeight,
                    renderedW: img?.offsetWidth,
                    renderedH: img?.offsetHeight
                };
            });
            const counter = document.getElementById('lookInsidePageCounter')?.textContent?.trim();
            const note = document.querySelector('.look-inside__note')?.textContent?.trim();
            const title = document.querySelector('.look-inside__title')?.textContent?.trim();

            const closeBtn = document.getElementById('lookInsideClose');
            if (closeBtn) closeBtn.click();

            return {
                modalFound: !!modal,
                counter,
                note,
                title,
                slideCount: slides.length,
                slides
            };
        })()""")
        results["lookInside"] = look_inside_data

        # 4. FORMS SUBMISSION AUDIT
        # Signup form test
        send("Page.navigate", {"url": "http://localhost:8000/"})
        time.sleep(1.0)

        signup_test = evaluate("""(() => {
            const form = document.getElementById('storyCircleForm');
            const input = document.getElementById('storyCircleEmail');
            const submitBtn = form?.querySelector('button[type="submit"]');
            const consent = document.getElementById('storyCircleConsent');
            const successMsg = document.getElementById('storyCircleSuccess');
            const errorMsg = document.getElementById('storyCircleError');

            if (!form || !input) return { error: 'form not found' };

            // Test 1: invalid email
            input.value = 'invalid-email';
            if (consent) consent.checked = true;
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            const errVisible = errorMsg && !errorMsg.hidden ? errorMsg.textContent.trim() : null;

            // Test 2: valid email
            input.value = 'test@example.com';
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            return {
                action: form.getAttribute('action'),
                method: form.getAttribute('method'),
                errVisible,
                successShown: successMsg ? !successMsg.hidden : false,
                successText: successMsg ? successMsg.textContent.trim() : null
            };
        })()""")
        results["signupTest"] = signup_test

        # Contact form test
        contact_test = evaluate("""(() => {
            const form = document.getElementById('contactForm');
            const name = document.getElementById('contactName');
            const email = document.getElementById('contactEmail');
            const role = document.getElementById('contactRole');
            const msg = document.getElementById('contactMessage');
            const consent = document.getElementById('contactConsent');
            const success = document.getElementById('contactSuccess');
            const error = document.getElementById('contactError');

            if (!form) return { error: 'contact form not found' };

            name.value = 'Test User';
            email.value = 'test@example.com';
            if (role) role.value = 'Reader';
            msg.value = 'Test message for audit';
            if (consent) consent.checked = true;

            form.dispatchEvent(new Event('submit', { cancelable: true }));

            return {
                action: form.getAttribute('action'),
                method: form.getAttribute('method'),
                successShown: success ? !success.hidden : false,
                successText: success ? success.textContent.trim() : null,
                errorShown: error ? !error.hidden : false
            };
        })()""")
        results["contactTest"] = contact_test

        # 5. OPEN GRAPH & META AUDIT
        meta_audit = {}
        for p_name, p_url in pages:
            send("Page.navigate", {"url": p_url})
            time.sleep(0.5)
            meta_audit[p_name] = evaluate("""(() => {
                const getMeta = (prop) => document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)?.getAttribute('content');
                return {
                    title: document.title,
                    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
                    description: getMeta('description'),
                    ogType: getMeta('og:type'),
                    ogSiteName: getMeta('og:site_name'),
                    ogTitle: getMeta('og:title'),
                    ogDesc: getMeta('og:description'),
                    ogUrl: getMeta('og:url'),
                    ogImage: getMeta('og:image'),
                    ogImageW: getMeta('og:image:width'),
                    ogImageH: getMeta('og:image:height'),
                    ogImageAlt: getMeta('og:image:alt'),
                    twCard: getMeta('twitter:card'),
                    twTitle: getMeta('twitter:title'),
                    twDesc: getMeta('twitter:description'),
                    twImage: getMeta('twitter:image')
                };
            })()""")
        results["metaAudit"] = meta_audit

        # 6. ASSET FILE AUDIT (share-image.jpg, oversized images, etc.)
        asset_info = {}
        assets_dir = "assets"
        oversized = []
        for root, dirs, files in os.walk(assets_dir):
            for f in files:
                p = os.path.join(root, f)
                sz_kb = round(os.path.getsize(p) / 1024, 1)
                if sz_kb > 500:
                    oversized.append({"path": p, "sizeKB": sz_kb})

        # share-image check
        share_img_path = os.path.join("assets", "share-image.jpg")
        share_img_data = {}
        if os.path.exists(share_img_path):
            with Image.open(share_img_path) as im:
                share_img_data = {
                    "width": im.width,
                    "height": im.height,
                    "sizeKB": round(os.path.getsize(share_img_path) / 1024, 1)
                }

        results["assets"] = {
            "shareImage": share_img_data,
            "oversized": oversized
        }

        # 7. DEAD LINKS, PLACEHOLDERS, TODOs, LOREM
        issues = evaluate("""(() => {
            const deadLinks = [];
            document.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href');
                if (!href || href === '#' || href === '') {
                    deadLinks.push({
                        text: a.textContent.trim(),
                        html: a.outerHTML.slice(0, 100)
                    });
                }
            });

            const bodyHtml = document.body.innerHTML;
            const todos = (bodyHtml.match(/TODO/gi) || []).length;
            const lorem = (bodyHtml.match(/lorem\s+ipsum/gi) || []).length;
            const placeholders = Array.from(document.querySelectorAll('*')).filter(el => {
                return el.children.length === 0 && /\[.*?\]/.test(el.textContent);
            }).map(el => ({ tag: el.tagName, text: el.textContent.trim() }));

            return { deadLinks, todos, lorem, placeholders };
        })()""")
        results["textIssues"] = issues

        # Save results to json for detailed review
        with open("scratch/audit_results.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print("Audit data successfully gathered and saved to scratch/audit_results.json")

        ws.close()
    finally:
        proc.terminate()

if __name__ == "__main__":
    run_deep_audit()
