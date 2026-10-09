import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/audit', { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\Awad\\temp_cdp_profile_audit';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--disable-background-networking'
]);

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

// Listen for console errors & failed requests
const consoleErrors = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.consoleAPICalled' && (data.params.type === 'error' || data.params.type === 'warning')) {
    consoleErrors.push(data.params);
  }
});

const pages = [
  { name: 'Portal', path: '/' },
  { name: 'Activity 1 (Electricity)', path: '/electricity.html' },
  { name: 'Activity 2 (Materials)', path: '/materials.html' },
  { name: 'Activity 3 (Safety)', path: '/safety.html' },
  { name: 'Activity 4 (Conductors)', path: '/conductors.html' }
];

const viewports = [
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_412', width: 412, height: 915 },
  { name: 'mobile_375', width: 375, height: 667 },
  { name: 'mobile_320', width: 320, height: 568 },
  { name: 'mobile_280', width: 280, height: 653 }
];

console.log('=== STARTING LAB-WIDE RESPONSIVE & CONSOLE AUDIT ===');
const report = [];

for (const pg of pages) {
  console.log(`\n--- Auditing: ${pg.name} (${pg.path}) ---`);
  
  await sendSession('Page.navigate', { url: `http://127.0.0.1:4173${pg.path}` });
  await new Promise(r => setTimeout(r, 1000));

  for (const vp of viewports) {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width <= 768
    });
    await new Promise(r => setTimeout(r, 200));

    const metricsRes = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
        const clientWidth = doc.clientWidth;
        const hasScroll = scrollWidth > clientWidth + 1;
        
        let badEls = [];
        if (hasScroll) {
          const all = Array.from(document.querySelectorAll('*'));
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > clientWidth + 2 || rect.left < -2) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className ? (typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '') : '';
              const id = el.id ? '#' + el.id : '';
              badEls.push({ sel: tag + id + cls, right: Math.round(rect.right), left: Math.round(rect.left), width: Math.round(rect.width) });
            }
          }
        }
        return { scrollWidth, clientWidth, hasScroll, badCount: badEls.length, topBads: badEls.slice(0, 5) };
      })()`,
      returnByValue: true
    });

    const m = metricsRes.result.value;
    const status = m.hasScroll ? '❌ OVERFLOW' : '✅ OK';
    console.log(`  [${vp.name}] ${status} | scrollWidth: ${m.scrollWidth}px vs clientWidth: ${m.clientWidth}px`);
    if (m.hasScroll) {
      console.log(`     Overflowing elements:`, JSON.stringify(m.topBads, null, 2));
    }

    report.push({
      page: pg.name,
      path: pg.path,
      viewport: vp.name,
      width: vp.width,
      hasScroll: m.hasScroll,
      scrollWidth: m.scrollWidth,
      clientWidth: m.clientWidth,
      topBads: m.topBads
    });
  }
}

await writeFile('docs/audit/responsive_report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('\nAudit complete! Report saved to docs/audit/responsive_report.json');

try {
  await send('Target.closeTarget', { targetId });
  ws.close();
} catch {}
chrome.kill();
process.exit(0);
