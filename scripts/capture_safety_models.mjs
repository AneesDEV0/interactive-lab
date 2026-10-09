import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/screenshots/safety_models', { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\Awad\\temp_cdp_profile_models';

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

await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false
});

const itemsToCapture = [
  'overloaded_socket',
  'exposed_damaged_wire',
  'wet_hands_plug',
  'inserting_scissors_socket',
  'kids_playing_cords',
  'pulling_cord_violently',
  'pulling_by_plug_head',
  'dry_hands_switch'
];

for (const itemId of itemsToCapture) {
  console.log(`Loading and capturing item: ${itemId}`);
  await sendSession('Page.navigate', { url: `http://127.0.0.1:4173/safety.html?item=${itemId}` });
  await new Promise(r => setTimeout(r, 1200));
  await sendSession('Runtime.evaluate', { expression: "document.getElementById('stage').scrollIntoView({ behavior: 'instant', block: 'center' })" });
  await new Promise(r => setTimeout(r, 400));

  const screenshot = await sendSession('Page.captureScreenshot', { format: 'png' });
  await writeFile(`docs/screenshots/safety_models/${itemId}.png`, Buffer.from(screenshot.data, 'base64'));
  console.log(`Saved screenshot: docs/screenshots/safety_models/${itemId}.png`);
}

try {
  await send('Target.closeTarget', { targetId });
  ws.close();
} catch {}
chrome.kill();
console.log('Capture complete!');
process.exit(0);
