import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.LAB_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  // Inject mock SpeechRecognition before navigating
  await page.addInitScript(() => {
    class MockSpeechRecognition extends EventTarget {
      constructor() {
        super();
        this.lang = '';
        this.interimResults = false;
        this.continuous = false;
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        window.__mockSpeechInstance = this;
      }
      start() {
        setTimeout(() => {
          if (this.onstart) this.onstart();
        }, 10);
      }
      stop() {
        setTimeout(() => {
          if (this.onend) this.onend();
        }, 10);
      }
      abort() {
        setTimeout(() => {
          if (this.onend) this.onend();
        }, 10);
      }
    }
    window.SpeechRecognition = MockSpeechRecognition;
  });

  await page.goto(`${base}/safety.html`);
  await page.waitForFunction(() => window.lab);

  // 1. Open the assistant details
  await page.locator('.assistant summary').click();

  const micBtn = page.locator('#mic-btn');
  const askInput = page.locator('#ask-input');
  const askBtn = page.locator('#ask-form button');

  // 2. Verify button existence, sizing, and accessibility
  await expect(micBtn).toBeVisible();
  const box = await micBtn.boundingBox();
  assert.ok(box.height >= 44, `Mic button height must be >= 44px, got ${box.height}`);
  assert.ok(box.width >= 44, `Mic button width must be >= 44px, got ${box.width}`);
  assert.equal(await micBtn.getAttribute('aria-label'), 'تحدث بالصوت');
  assert.equal(await micBtn.getAttribute('title'), 'تحدث بالصوت');

  // 3. Click mic to start recording
  await micBtn.click();
  await expect(micBtn).toHaveClass(/recording/);
  assert.equal(await micBtn.getAttribute('title'), 'إيقاف التسجيل الصوتي');
  assert.equal(await micBtn.getAttribute('aria-label'), 'إيقاف التسجيل الصوتي');
  await expect(askInput).toHaveAttribute('placeholder', /جاري الاستماع/);

  // 4. Simulate real-time streaming speech results (interim results)
  await page.evaluate(() => {
    const inst = window.__mockSpeechInstance;
    // User says "هل"
    inst.onresult({
      resultIndex: 0,
      results: [
        [{ transcript: 'هل ' }]
      ]
    });
  });
  assert.equal(await askInput.inputValue(), 'هل ');

  // User continues: "هل ألمس "
  await page.evaluate(() => {
    const inst = window.__mockSpeechInstance;
    inst.onresult({
      resultIndex: 0,
      results: [
        [{ transcript: 'هل ألمس ' }]
      ]
    });
  });
  assert.equal(await askInput.inputValue(), 'هل ألمس ');

  // User completes: "ما هي عناصر الدارة؟"
  await page.evaluate(() => {
    const inst = window.__mockSpeechInstance;
    inst.onresult({
      resultIndex: 0,
      results: [
        [{ transcript: 'ما هي عناصر الدارة؟' }]
      ]
    });
  });
  assert.equal(await askInput.inputValue(), 'ما هي عناصر الدارة؟');

  // 5. Submit the question
  await askBtn.click();

  // Recording stops and input clears
  await expect(micBtn).not.toHaveClass(/recording/);
  assert.equal(await micBtn.getAttribute('title'), 'تحدث بالصوت');
  assert.equal(await askInput.inputValue(), '');

  // Sharara answers the question from curriculum/textbook
  await expect(page.locator('#guide-text')).toContainText('الدارة');

  // 6. Test toggling mic off
  await micBtn.click();
  await expect(micBtn).toHaveClass(/recording/);
  await micBtn.click();
  await expect(micBtn).not.toHaveClass(/recording/);

  // 7. Test electricity page
  await page.goto(`${base}/electricity.html`);
  await page.waitForFunction(() => window.lab);
  await page.locator('.assistant summary').click();
  await expect(page.locator('#mic-btn')).toBeVisible();

  console.log('ALL VOICE CHAT INTEGRATION TESTS PASSED!');
} finally {
  await browser.close();
}
