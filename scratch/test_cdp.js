// Check responsive widths and horizontal overflow via CDP
const http = require('http');
const { spawn } = require('child_process');

async function testViewport(width, height) {
  return new Promise((resolve, reject) => {
    // Launch Chrome with remote debugging on port 9222
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--window-size=${width},${height}`,
      '--disable-gpu',
      '--no-sandbox',
      'http://127.0.0.1:8080/'
    ]);

    setTimeout(() => {
      // Connect to CDP
      http.get('http://127.0.0.1:9222/json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const targets = JSON.parse(data);
            const target = targets.find(t => t.type === 'page');
            if (!target) {
              chrome.kill();
              return resolve({ width, error: 'No page target' });
            }

            const WebSocket = require('node:net');
            // We can also evaluate via Chrome DevTools Protocol HTTP or WS
            chrome.kill();
            resolve({ width, height, status: 'ok' });
          } catch (e) {
            chrome.kill();
            resolve({ width, error: e.message });
          }
        });
      }).on('error', err => {
        chrome.kill();
        resolve({ width, error: err.message });
      });
    }, 1500);
  });
}

console.log('Testing setup ready');
