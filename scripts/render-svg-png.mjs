import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });

for (const id of ['plasticRuler', 'glassJar']) {
  const svgContent = readFileSync(`assets/thumbnails/materials/${id}.svg`, 'utf8');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 20px; background: white; display: flex; align-items: center; justify-content: center; width: 300px; height: 300px;">
        <div style="width: 260px; height: 260px; display: flex; align-items: center; justify-content: center;">
          ${svgContent}
        </div>
      </body>
    </html>
  `);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 340, height: 340 } });
  writeFileSync(`assets/book/${id}.png`, buf);
  console.log(`Rendered ${id}.png from SVG`);
}

await browser.close();
