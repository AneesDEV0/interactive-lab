import test from 'node:test';
import assert from 'node:assert/strict';
import { findTextbookAnswer } from '../src/shared/textbook-qa.js';

test('Textbook QA: recognizes questions with typos and varied phrasing', () => {
  const cases = [
    ['شو عناصر الدارة', 'circuit_elements'],
    ['ما هي عناصر الدارة الكهربائية', 'circuit_elements'],
    ['مكونات الداره الكهربائيه', 'circuit_elements'],
    ['ن=عنصار الداؤة', 'circuit_elements'],
    ['شو وظيفة المفتاح الكهربائي', 'switch_function'],
    ['ليش اللمبة ما بتضوي', 'lamp_not_lighting_causes'],
    ['ما أسباب عدم إضاءة المصباح', 'lamp_not_lighting_causes'],
    ['الفرق بين الدارة المغلقة والمفتوحة', 'circuit_closed_open'],
    ['أهمية الكهرباء في المستشفى', 'hospital_places_electricity'],
    ['ماذا يحدث لو انقطعت الكهرباء في المستشفى', 'hospital_places_electricity'],
    ['بدائل انقطاع الكهرباء في غزة', 'gaza_electricity_alternatives'],
    ['أهل غزة والكهرباء', 'gaza_electricity_alternatives'],
    ['علل تصنع مفاتيح الكهرباء من البلاستيك', 'why_plastic_switches'],
    ['ليش مفتاح الكهربا بلاستيك', 'why_plastic_switches'],
    ['علل يستخدم المغناطيس في باب الثلاجة', 'why_fridge_magnet'],
    ['ليش باب التلاجة فيه مغناطيس', 'why_fridge_magnet'],
    ['علل تصنع علبة البوصلة من مادة غير مغناطيسية', 'why_compass_case'],
    ['ما الفرق بين المواد الموصلة والعازلة', 'conductors_insulators_difference'],
    ['شو الفرق بين الموصل والعازل', 'conductors_insulators_difference'],
    ['ما أشكال المغناطيس', 'magnet_shapes_uses'],
    ['ما استخدامات المغناطيس', 'magnet_shapes_uses'],
    ['كيف أصنع مغناطيساً بالدلك', 'how_to_make_magnet'],
    ['صناعة المغناطيس الكهربائي', 'how_to_make_magnet'],
    ['ما هي رموز عناصر الدارة؟', 'circuit_symbols'],
    ['أذكر استخدامين للكهرباء في حياتنا اليومية', 'electricity_daily_uses']
  ];

  for (const [query, expected] of cases) {
    const res = findTextbookAnswer(query);
    assert.ok(res, `Expected match for query: ${query}`);
    assert.equal(res.id, expected, `Query "${query}" should match intent "${expected}"`);
    assert.ok(res.text.length > 20, `Answer for "${query}" should be complete`);
  }
});
