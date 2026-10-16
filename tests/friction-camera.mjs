import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.LAB_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${base}/friction.html`);
  await page.waitForFunction(() => window.lab?.scene?.ready);
  const ids = ['winterHands', 'balloonWool', 'rulerWool', 'combHair', 'woodFriction'];
  for (const id of ids) {
    const before = await page.evaluate(() => lab.state.id);
    await page.locator('[data-open=camera]').click();
    await page.locator('#photo-file').setInputFiles(`assets/book/friction/${id}.jpg`);
    await expect(page.locator('#photo-preview')).toBeVisible();
    await expect(page.locator('#confirm-photo')).toBeDisabled();
    await page.locator('#match-photo').click();
    await expect(page.locator('#manual-item')).toHaveValue(id, { timeout: 60000 });
    assert.equal(await page.evaluate(() => lab.state.id), before);
    await page.locator('#confirm-photo').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-loaded', id);
  }
  const results = await page.evaluate(async () => {
    const { recognize } = await import('/src/electricity/recognition.js');
    const { frictionReferences: refs } = await import('/src/shared/references.js');
    const results = [];
    for (const ref of refs) {
      const img = new Image();
      img.src = ref.source;
      await img.decode();
      for (const cropped of [false, true]) {
        const [x, y, w, h] = cropped ? ref.rect : [0, 0, img.width, img.height];
        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 600;
        const g = canvas.getContext('2d');
        g.fillStyle = '#ddd'; g.fillRect(0, 0, 800, 600);
        g.translate(400, 300); g.rotate(0.09);
        const scale = Math.min(680 / w, 480 / h);
        g.filter = 'brightness(0.8)';
        g.drawImage(img, x, y, w, h, -w * scale / 2, -h * scale / 2, w * scale, h * scale);
        const match = await recognize(canvas.toDataURL('image/jpeg', 0.8), refs);
        results.push({ id: ref.id, cropped, matched: match?.id ?? null });
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 300;
    results.push({ id: null, matched: (await recognize(canvas.toDataURL(), refs))?.id ?? null });
    results.push({ id: null, matched: (await recognize('/assets/book/paperClip.png', refs))?.id ?? null });
    return results;
  });
  for (const result of results) assert.equal(result.matched, result.id, JSON.stringify(result));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ confirmedImages: ids, transformedAndNegativeChecks: results, errors }, null, 2));
} finally {
  await browser.close();
}
