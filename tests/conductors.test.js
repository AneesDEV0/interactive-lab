// ═══════════════════════════════════════════════════════════════════════════
// tests/conductors.test.js — اختبارات الجودة لمحطة تصنيف المواد الموصلة والعازلة
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { items, categories, professorDialogs, generateProfessorReport } from '../src/conductors/data.js';

test('Conductivity data: items array is flexible and holds valid items with unique IDs', () => {
  assert.ok(Array.isArray(items), 'Items should be an array');
  assert.ok(items.length >= 8, 'Items array should contain at least 8 items');

  const ids = new Set();
  items.forEach(item => {
    assert.ok(item.id, 'Every item must have an id');
    assert.ok(!ids.has(item.id), `Item id "${item.id}" must be unique`);
    ids.add(item.id);

    assert.ok(item.name, `Item ${item.id} must have a name`);
    assert.ok(item.material, `Item ${item.id} must have a material`);
    assert.ok(['conductive', 'insulating'].includes(item.category), `Item ${item.id} category must be conductive or insulating`);
    assert.ok(item.fact, `Item ${item.id} must have an educational fact`);
    assert.ok(item.hint, `Item ${item.id} must have a hint`);
    assert.ok(item.fallbackImage, `Item ${item.id} must have a 2D fallback image path`);
    assert.ok(item.modelParams, `Item ${item.id} must have Three.js 3D model params`);
  });
});

test('Conductivity data: categories contain complete two-column properties and descriptions', () => {
  assert.ok(categories.conductive, 'Must have conductive category');
  assert.ok(categories.insulating, 'Must have insulating category');

  ['conductive', 'insulating'].forEach(catId => {
    const cat = categories[catId];
    assert.equal(cat.id, catId);
    assert.ok(cat.name, `Category ${catId} must have a name`);
    assert.ok(cat.columnTitle, `Category ${catId} must have a columnTitle`);
    assert.ok(cat.symbol, `Category ${catId} must have a symbol`);
    assert.ok(cat.badge, `Category ${catId} must have a badge`);
    assert.ok(cat.desc, `Category ${catId} must have a description`);
  });
});

test('Classification logic: accurately validates items to conductive and insulating categories', () => {
  const conductiveItems = items.filter(it => it.category === 'conductive');
  const insulatingItems = items.filter(it => it.category === 'insulating');

  assert.ok(conductiveItems.length >= 3, 'Should have multiple conductive items');
  assert.ok(insulatingItems.length >= 3, 'Should have multiple insulating items');

  conductiveItems.forEach(it => {
    assert.equal(it.category === 'conductive', true, `${it.name} should be conductive`);
    assert.equal(it.category === 'insulating', false, `${it.name} should not be insulating`);
  });

  insulatingItems.forEach(it => {
    assert.equal(it.category === 'insulating', true, `${it.name} should be insulating`);
    assert.equal(it.category === 'conductive', false, `${it.name} should not be conductive`);
  });
});

test('Educational Assistant "البروفيسور": dialogs and feedback are rich and Grade-4 appropriate', () => {
  assert.ok(professorDialogs.welcome.text, 'Must have welcome text');
  assert.ok(professorDialogs.learnIntro.text, 'Must have learn mode intro text');
  assert.ok(professorDialogs.playIntro.text, 'Must have play mode intro text');
  assert.ok(Array.isArray(professorDialogs.successQuotes), 'Must have success quotes array');
  assert.ok(professorDialogs.successQuotes.length >= 3, 'Should have varied success quotes');
  assert.ok(Array.isArray(professorDialogs.retryQuotes), 'Must have retry quotes array');
  assert.ok(professorDialogs.retryQuotes.length >= 2, 'Should have varied retry quotes');
});

test('Final Report Modal: accurately generates comprehensive evaluation report for students', () => {
  // تجربة نتيجة مثالية 100%
  const perfectReport = generateProfessorReport({
    totalItems: 8,
    attempts: 8,
    elapsedSeconds: 45
  });

  assert.equal(perfectReport.accuracy, 100);
  assert.equal(perfectReport.totalItems, 8);
  assert.equal(perfectReport.attempts, 8);
  assert.match(perfectReport.rank, /عبقري/);
  assert.ok(perfectReport.evaluation.length > 20);
  assert.ok(perfectReport.advice.length > 20);

  // تجربة نتيجة جيدة 80%
  const goodReport = generateProfessorReport({
    totalItems: 8,
    attempts: 10,
    elapsedSeconds: 70
  });

  assert.equal(goodReport.accuracy, 80);
  assert.match(goodReport.rank, /باحث/);

  // تجربة نتيجة تحتاج مثابرة
  const beginnerReport = generateProfessorReport({
    totalItems: 8,
    attempts: 16,
    elapsedSeconds: 120
  });

  assert.equal(beginnerReport.accuracy, 50);
  assert.match(beginnerReport.rank, /مستكشف/);
});

test('Conductors HTML entry: file exists and has unified architecture', () => {
  assert.ok(existsSync('conductors.html'), 'conductors.html must exist');
  const html = readFileSync('conductors.html', 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /محطة تصنيف المواد الموصلة والعازلة/);
  assert.match(html, /البروفيسور/);
  assert.match(html, /src\/conductors\/app\.js/);
  assert.match(html, /src\/conductors\/style\.css/);
});

test('Educational Assistant "البروفيسور": answer() accurately handles Grade 4 questions', async () => {
  const { answer, byId, testClassification } = await import('../src/conductors/data.js');
  
  const nail = byId('ironNail');
  const wood = byId('woodStick');

  assert.equal(nail.id, 'ironNail');
  assert.equal(wood.id, 'woodStick');

  // فحص التصنيف
  const correctNail = testClassification('ironNail', 'conductive');
  assert.equal(correctNail.ok, true);
  assert.match(correctNail.text, /موصلة|تضيء/);

  const wrongNail = testClassification('ironNail', 'insulating');
  assert.equal(wrongNail.ok, false);

  const correctWood = testClassification('woodStick', 'insulating');
  assert.equal(correctWood.ok, true);
  assert.match(correctWood.text, /عازلة/);

  // فحص الإجابة عن المصباح
  const lampNail = answer('هل يضيء المصباح؟', nail);
  assert.match(lampNail.text, /نعم|يضيء/);

  const lampWood = answer('هل يضيء المصباح؟', wood);
  assert.match(lampWood.text, /لا|لن يضيء/);

  // فحص تلميح
  const hintAns = answer('أعطني تلميحاً', nail);
  assert.ok(hintAns.text.length > 10);

  // فحص السلامة
  const safetyAns = answer('قواعد السلامة', nail);
  assert.match(safetyAns.text, /مقابس|مقبس|سلامة|صعق/);
});

