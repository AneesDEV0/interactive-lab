import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const VOICE = 'ar-JO-SanaNeural';

function generateSecMsGec() {
  const WIN_EPOCH = 11644473600;
  let ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= 1e7;
  const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
  return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fetchEdgeTts(text) {
  return new Promise((resolve, reject) => {
    const reqId = crypto.randomUUID().replace(/-/g, '');
    const secMsGec = generateSecMsGec();
    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-130.0.2849.68&ConnectionId=${reqId}`;
    const ws = new WebSocket(url, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const audioChunks = [];
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('Edge TTS timeout'));
    }, 10000);

    ws.addEventListener('open', () => {
      const configMsg =
        `X-Timestamp:${new Date().toUTCString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        });
      ws.send(configMsg);

      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-JO'>` +
        `<voice name='${VOICE}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody></voice>` +
        `</speak>`;
      const ssmlMsg =
        `X-RequestId:${reqId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date().toUTCString()}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    });

    ws.addEventListener('message', async (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timer);
          try { ws.close(); } catch {}
          const buf = Buffer.concat(audioChunks);
          if (buf.length > 500) resolve(buf);
          else reject(new Error('Empty Edge TTS audio'));
        }
      } else {
        const raw = Buffer.from(event.data instanceof ArrayBuffer ? event.data : await event.data.arrayBuffer());
        if (raw.length > 2) {
          const headerLen = raw.readUInt16BE(0);
          const header = raw.subarray(2, 2 + headerLen).toString('utf8');
          if (header.includes('Path:audio')) {
            audioChunks.push(raw.subarray(2 + headerLen));
          }
        }
      }
    });

    ws.addEventListener('error', (err) => {
      clearTimeout(timer);
      reject(err.error || new Error('Edge TTS WebSocket error'));
    });
  });
}

function fetchGoogleTts(text) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ar&client=tw-ob`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function synthesize(text) {
  try {
    return await fetchEdgeTts(text);
  } catch {
    return await fetchGoogleTts(text);
  }
}

async function main() {
  const scriptData = JSON.parse(fs.readFileSync('docs/audio/recording-script.json', 'utf8'));
  const narrationDir = 'assets/audio/narration';
  fs.mkdirSync(narrationDir, { recursive: true });

  const recordings = scriptData.recordings;
  let generated = 0;

  for (let i = 0; i < recordings.length; i++) {
    const r = recordings[i];
    const target = path.join(narrationDir, r.file);
    if (fs.existsSync(target) && fs.statSync(target).size > 500) continue;
    const buf = await synthesize(r.text);
    fs.writeFileSync(target, buf);
    generated++;
    console.log(`[${generated}] Generated ${r.file}: ${r.text.slice(0, 45)}...`);
  }

  const manifest = {
    version: 1,
    voice: 'سَنا — الأردن',
    voiceId: VOICE,
    provider: 'Microsoft Edge TTS',
    generatedOn: '2026-10-12',
    rate: '+0%',
    pitch: '+0Hz',
    recordings: recordings.map(r => ({ id: r.id, file: r.file, text: r.text }))
  };

  fs.writeFileSync(path.join(narrationDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Done! Generated ${generated} new MP3s. Total in manifest: ${manifest.recordings.length}`);
}

main();
