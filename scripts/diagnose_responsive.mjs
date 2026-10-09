import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/screenshots', { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\Awad\\temp_cdp_profile';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--disable-background-networking'
]);

// Wait for Chrome CDP to be ready
let wsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 200));
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    wsUrl = data.webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch {}
}

if (!wsUrl) {
  console.error('Failed to connect to Chrome CDP');
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    const handler = event => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Create a new target page
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

function sendSession(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    const handler = event => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, sessionId, method, params }));
  });
}

await sendSession('Page.enable');
await sendSession('DOM.enable');

const viewports = [
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_412', width: 412, height: 915 },
  { name: 'mobile_375', width: 375, height: 667 },
  { name: 'mobile_320', width: 320, height: 568 },
  { name: 'mobile_280', width: 280, height: 653 }
];

console.log('Testing responsive layouts...');

for (const vp of viewports) {
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    mobile: vp.width <= 768
  });

  await sendSession('Page.navigate', { url: 'http://127.0.0.1:4173/safety.html' });
  await new Promise(r => setTimeout(r, 1200));

  // Run DOM diagnostic in page
  const evalResult = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const overflow = scrollW > docW;
      
      const overflowingElements = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > docW + 2 || r.right > docW + 2 || r.left < -2) {
          overflowingElements.push({
            tag: el.tagName,
            cls: el.className ? String(el.className).slice(0, 40) : '',
            id: el.id,
            w: Math.round(r.width),
            l: Math.round(r.left),
            r: Math.round(r.right)
          });
        }
      });

      return {
        viewportWidth: window.innerWidth,
        docWidth: docW,
        scrollWidth: scrollW,
        hasHorizontalScroll: overflow,
        overflowCount: overflowingElements.length,
        topOverflows: overflowingElements.slice(0, 8)
      };
    })()`,
    returnByValue: true
  });

  const res = evalResult.result.value;
  console.log(`\n=== Viewport ${vp.name} (${vp.width}x${vp.height}) ===`);
  console.log(`- clientWidth: ${res.docWidth}, scrollWidth: ${res.scrollWidth}, hasScroll: ${res.hasHorizontalScroll}`);
  if (res.overflowCount > 0) {
    console.log(`- Overflow elements count: ${res.overflowCount}`);
    console.log('- Details:', JSON.stringify(res.topOverflows, null, 2));
  } else {
    console.log('- PERFECT! No horizontal overflow.');
  }

  // Screenshot top
  const { data: base64Data } = await sendSession('Page.captureScreenshot', { format: 'png' });
  await writeFile(`docs/screenshots/${vp.name}.png`, Buffer.from(base64Data, 'base64'));

  // Also test scrolled state
  await sendSession('Runtime.evaluate', { expression: 'window.scrollTo(0, 260)' });
  await new Promise(r => setTimeout(r, 400));
  const { data: b64Scrolled } = await sendSession('Page.captureScreenshot', { format: 'png' });
  await writeFile(`docs/screenshots/${vp.name}_scrolled.png`, Buffer.from(b64Scrolled, 'base64'));
}

chrome.kill();
ws.close();
console.log('\nDiagnostic finished.');
