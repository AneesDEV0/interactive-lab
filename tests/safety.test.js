// ═══════════════════════════════════════════════════════════════════════════
// tests/safety.test.js — اختبارات الجودة لمحطة حارس الأمان والسلامة الكهربائية
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { items, categories, byId, testClassification, answer, captainAmanDialogs, voiceLines, generateSafetyReport } from '../src/safety/data.js';

test('Safety data: items array holds 14 realistic behaviors with unique IDs and complete metadata', () => {
  assert.ok(Array.isArray(items), 'Items should be an array');
  assert.equal(items.length, 14, 'Items array should contain exactly 14 behaviors');

  const ids = new Set();
  items.forEach(item => {
    assert.ok(item.id, 'Every item must have an id');
    assert.ok(!ids.has(item.id), `Item id "${item.id}" must be unique`);
    ids.add(item.id);

    assert.ok(item.name, `Item ${item.id} must have a name`);
    assert.ok(['safe', 'hazard'].includes(item.category), `Item ${item.id} category must be safe or hazard`);
    assert.ok(item.dangerLevel, `Item ${item.id} must have dangerLevel`);
    assert.ok(item.hazardReason, `Item ${item.id} must have hazardReason`);
    assert.ok(item.goldenRule, `Item ${item.id} must have goldenRule`);
    assert.ok(item.fact, `Item ${item.id} must have fact`);
    assert.ok(item.hint, `Item ${item.id} must have hint`);
    assert.ok(item.safetyTip, `Item ${item.id} must have safetyTip`);
    assert.ok(item.fallbackImage, `Item ${item.id} must have fallbackImage path`);
    assert.ok(item.modelParams, `Item ${item.id} must have Three.js 3D model params`);
  });
});

test('Safety data: categories contain complete two-column metadata (safe & hazard)', () => {
  assert.ok(categories.safe, 'Must have safe category');
  assert.ok(categories.hazard, 'Must have hazard category');

  ['safe', 'hazard'].forEach(catId => {
    const cat = categories[catId];
    assert.equal(cat.id, catId);
    assert.ok(cat.name, `Category ${catId} must have a name`);
    assert.ok(cat.columnTitle, `Category ${catId} must have a columnTitle`);
    assert.ok(cat.symbol, `Category ${catId} must have a symbol`);
    assert.ok(cat.badge, `Category ${catId} must have a badge`);
    assert.ok(cat.desc, `Category ${catId} must have a description`);
  });
});

test('Classification logic: accurately validates safe and hazard behaviors', () => {
  const safeItems = items.filter(it => it.category === 'safe');
  const hazardItems = items.filter(it => it.category === 'hazard');

  assert.ok(safeItems.length >= 4, 'Should have multiple safe items');
  assert.ok(hazardItems.length >= 7, 'Should have multiple hazard items');

  safeItems.forEach(it => {
    const safeCheck = testClassification(it.id, 'safe');
    assert.equal(safeCheck.ok, true, `${it.name} should pass safe category`);
    const hazardCheck = testClassification(it.id, 'hazard');
    assert.equal(hazardCheck.ok, false, `${it.name} should fail hazard category`);
    assert.match(hazardCheck.text, /آمن/);
  });

  hazardItems.forEach(it => {
    const hazardCheck = testClassification(it.id, 'hazard');
    assert.equal(hazardCheck.ok, true, `${it.name} should pass hazard category`);
    const safeCheck = testClassification(it.id, 'safe');
    assert.equal(safeCheck.ok, false, `${it.name} should fail safe category`);
    assert.match(safeCheck.text, /خطر/);
  });
});

test('Educational Assistant "حارس الأمان": dialogs and voiceLines are rich and Grade-4 appropriate', () => {
  assert.ok(captainAmanDialogs.welcome.text, 'Must have welcome text');
  assert.ok(captainAmanDialogs.learnIntro.text, 'Must have learn mode intro text');
  assert.ok(captainAmanDialogs.playIntro.text, 'Must have play mode intro text');
  assert.ok(voiceLines.welcome, 'Must have welcome voice line');
  assert.ok(voiceLines.learn, 'Must have learn voice line');
  assert.ok(voiceLines.play, 'Must have play voice line');
  assert.ok(voiceLines.camera, 'Must have camera voice line');
});

test('Final Assessment Report: accurately generates safety evaluation and ranks', () => {
  // نتيجة مثالية 100%
  const goldReport = generateSafetyReport({
    totalItems: 14,
    attempts: 14,
    elapsedSeconds: 55
  });
  assert.equal(goldReport.accuracy, 100);
  assert.equal(goldReport.totalItems, 14);
  assert.equal(goldReport.attempts, 14);
  assert.match(goldReport.rank, /حارس الأمان الذهبي/);
  assert.ok(goldReport.evaluation.length > 20);
  assert.ok(goldReport.advice.length > 20);

  // نتيجة متمرسة 80%
  const silverReport = generateSafetyReport({
    totalItems: 14,
    attempts: 17,
    elapsedSeconds: 90
  });
  assert.equal(silverReport.accuracy, 82);
  assert.match(silverReport.rank, /مفتش أمان متمرس/);

  // نتيجة صاعدة أقل من 75%
  const bronzeReport = generateSafetyReport({
    totalItems: 14,
    attempts: 25,
    elapsedSeconds: 120
  });
  assert.ok(bronzeReport.accuracy < 75);
  assert.match(bronzeReport.rank, /مستكشف سلامة صاعد/);
});

test('Intelligent Q&A Assistant: answers user questions about safety rules and hazards', () => {
  const wetHandsItem = byId('wet_hands_plug');
  
  // سؤال فارغ
  const emptyAns = answer('', wetHandsItem);
  assert.equal(emptyAns.key, 'clarify');

  // سؤال عن التلميح
  const hintAns = answer('أعطني تلميح', wetHandsItem);
  assert.equal(hintAns.key, 'hint');
  assert.ok(hintAns.text.length > 5);

  // سؤال عن القاعدة الذهبية
  const ruleAns = answer('ما هي القاعدة الذهبية؟', wetHandsItem);
  assert.equal(ruleAns.key, 'golden_rule');

  // سؤال عن الماء والبلل
  const waterAns = answer('لماذا الماء خطر مع الكهرباء؟', wetHandsItem);
  assert.equal(waterAns.key, 'water_danger');

  // سؤال عن المعادن
  const metalAns = answer('هل إدخال مسمار في المقبس خطير؟', wetHandsItem);
  assert.equal(metalAns.key, 'metal_danger');

  // سؤال عن الأطفال
  const kidsAns = answer('كيف نحمي الأطفال من الكهرباء؟', wetHandsItem);
  assert.equal(kidsAns.key, 'kids_safety');
});

test('Assets verification: all 14 thumbnails and bin SVGs and book images exist', () => {
  items.forEach(it => {
    assert.ok(existsSync(it.fallbackImage), `Fallback image for ${it.id} must exist at ${it.fallbackImage}`);
  });

  assert.ok(existsSync('assets/bins/safe_behavior.svg'), 'assets/bins/safe_behavior.svg must exist');
  assert.ok(existsSync('assets/bins/hazard_behavior.svg'), 'assets/bins/hazard_behavior.svg must exist');
  assert.ok(existsSync('assets/book/safety_page89.png'), 'assets/book/safety_page89.png must exist');
  assert.ok(existsSync('assets/book/safety_page90.png'), 'assets/book/safety_page90.png must exist');
});

test('HTML entry point: safety.html is well-formed and links to correct script and styles', () => {
  assert.ok(existsSync('safety.html'), 'safety.html must exist');
  const html = readFileSync('safety.html', 'utf-8');
  assert.ok(html.includes('src/shared/lab.css'), 'Must link to shared design tokens');
  assert.ok(html.includes('src/shared/app.js'), 'Must link to shared activity layout');
  assert.ok(html.includes('data-activity="safety"'), 'Must select safety data');
});
