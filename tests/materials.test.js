import test from 'node:test';
import assert from 'node:assert/strict';
import { items, categories, byId, byCategory, testClassification, answer, voiceLines } from '../src/materials/data.js';

test('Materials data array is flexible and holds valid items with unique IDs', () => {
  assert.ok(items.length >= 10, 'Should hold multiple environmental materials');
  const ids = items.map(i => i.id);
  assert.equal(new Set(ids).size, items.length, 'All item IDs must be unique');

  for (const item of items) {
    assert.ok(item.name && item.name.length > 2, `Item ${item.id} must have a name`);
    assert.ok(categories[item.category], `Item ${item.id} must belong to a defined category`);
    assert.ok(item.material, `Item ${item.id} must specify material`);
    assert.ok(item.fact, `Item ${item.id} must have educational fact`);
    assert.ok(item.result, `Item ${item.id} must have celebratory result text`);
    assert.ok(item.hint, `Item ${item.id} must have guidance hint`);
  }
});

test('Classification testing accurately validates item to target category', () => {
  for (const item of items) {
    // التصنيف الصحيح
    const correctRes = testClassification(item.id, item.category);
    assert.equal(correctRes.ok, true, `${item.name} should belong to ${item.category}`);
    assert.equal(correctRes.text, item.result);

    // التصنيف الخاطئ مع فئة أخرى
    const otherCat = Object.keys(categories).find(c => c !== item.category);
    const wrongRes = testClassification(item.id, otherCat);
    assert.equal(wrongRes.ok, false, `${item.name} should not belong to ${otherCat}`);
    assert.ok(wrongRes.text.includes(item.hint));
  }

  // مدخلات غير صحيحة
  assert.equal(testClassification('invalid_item', 'plastic').ok, false);
  assert.equal(testClassification('plasticRuler', 'invalid_cat').ok, false);
});

test('Educational Assistant "الخبير" responds appropriately to 4th-grade student questions', () => {
  const ruler = byId('plasticRuler');
  
  // سؤال السلامة
  assert.equal(answer('ما هي إرشادات السلامة؟', ruler).key, 'safety');
  
  // سؤال إعادة التدوير
  assert.equal(answer('هل يمكن إعادة التدوير؟', ruler).key, 'recycle');
  
  // سؤال المغناطيس
  assert.equal(answer('هل ينجذب للمغناطيس؟', ruler).key, 'magnet');
  
  // سؤال المادة
  const factAns = answer('مما يصنع هذا الشيء؟', ruler);
  assert.ok(factAns.text.includes('البلاستيك'));
  
  // سؤال المساعدة
  const hintAns = answer('ساعدني وين أحطها؟', ruler);
  assert.equal(hintAns.key, 'plasticRuler-hint');
  assert.equal(hintAns.text, ruler.hint);
});

test('Categories contain complete visual properties and descriptions', () => {
  const requiredCategories = ['plastic', 'glass', 'fabric', 'metal', 'wood', 'paper', 'rubber'];
  for (const catId of requiredCategories) {
    const cat = categories[catId];
    assert.ok(cat, `Category ${catId} must exist`);
    assert.ok(cat.name, `Category ${catId} must have name`);
    assert.ok(cat.icon, `Category ${catId} must have icon`);
    assert.ok(cat.color, `Category ${catId} must have color`);
    assert.ok(cat.desc, `Category ${catId} must have educational description`);
  }
});
