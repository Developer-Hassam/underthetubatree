const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function getChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function capture() {
  const chromePath = await getChromePath();
  if (!chromePath) {
    console.log('Chrome not found');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'laptop_1280', width: 1280, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_360', width: 360, height: 740 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 6500)); // wait for full intro to finish
    await page.screenshot({ path: `C:/Users/Hassa/.gemini/antigravity/brain/884ba6af-3150-4726-a4bd-93114871e242/hero_${vp.name}.png` });
    await page.close();
  }

  await browser.close();
  console.log('All viewports captured successfully');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
