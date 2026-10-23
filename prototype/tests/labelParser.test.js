// FR-02 labelParser — ข้อความจากฉลาก → ร่าง (✓1 ✗3 ✗4 ✗5 ✗10 · BR-04, BR-05, BR-07 · NFR-09 R10b)
// เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const L = require('../src/modules/labelParser.js');
const { LABELS, PRIVATE } = require('./fixtures/labels.js');

// ---------- US1: ร่างจากฉลากที่อ่านได้ ----------
test('FR-02 ✓1: a clear bedtime label becomes a draft with name, dose, timing and warning — nothing to check', () => {
  const d = L.parseLabel(LABELS.bedtime);
  assert.equal(d.name, 'CETIRIZINE 10 MG.');
  assert.equal(d.tabletsPerDose, 1);
  assert.equal(d.timing, 'BEDTIME');
  assert.deepEqual(d.meals, []);
  assert.equal(d.minutesBefore, null);
  assert.equal(d.warnings, 'ยานี้อาจทำให้ง่วงนอน');
  assert.equal(d.unsupported, null);
  assert.deepEqual(d.needsCheck, []);
});

test('FR-02 ✓1: after-meal morning and evening → AFTER_MEAL with BREAKFAST and DINNER, 2 tablets', () => {
  const d = L.parseLabel(LABELS.afterMealTwice);
  assert.equal(d.name, 'VIT. B1-6-12 1000 TAB.');
  assert.equal(d.tabletsPerDose, 2);
  assert.equal(d.timing, 'AFTER_MEAL');
  assert.deepEqual(d.meals, ['BREAKFAST', 'DINNER']);
  assert.deepEqual(d.needsCheck, []);
});

test('research R-0: OCR misreadings seen on real labels are tolerated (เข้า = เช้า, รวันละ, MG without dot)', () => {
  const d = L.parseLabel(LABELS.beforeMealNoMinutes);
  assert.equal(d.name, 'DOMPERIDONE 10 MG');
  assert.equal(d.timing, 'BEFORE_MEAL');
  assert.deepEqual(d.meals, ['BREAKFAST', 'LUNCH', 'DINNER']);
});

test('research R-2: Thai sara am written as two characters (ํา) is read as ำ', () => {
  const d = L.parseLabel('ยานี้ทําให้ง่วง\nX-DRUG 5 MG[10] เม็ด');
  assert.equal(d.warnings, 'ยานี้ทำให้ง่วง');
});

test('FR-02 ✓1: capsules count like tablets and before-breakfast 30 minutes is read', () => {
  const d = L.parseLabel(LABELS.beforeBreakfast30);
  assert.equal(d.name, 'OMEPRAZOLE 20 MG.');
  assert.equal(d.tabletsPerDose, 1);
  assert.equal(d.timing, 'BEFORE_MEAL');
  assert.deepEqual(d.meals, ['BREAKFAST']);
  assert.equal(d.minutesBefore, 30);
  assert.deepEqual(d.needsCheck, []);
});

// ---------- NFR-09 / R10b / SC-011: ไม่อ่านชื่อผู้ป่วย / HN / แพทย์ ----------
test('SC-011 / NFR-09: no fixture draft contains the patient name, HN, prescription no., doctor or hospital phone', () => {
  for (const [key, text] of Object.entries(LABELS)) {
    const json = JSON.stringify(L.parseLabel(text));
    for (const secret of PRIVATE) assert.equal(json.includes(secret), false, key + ' leaks ' + secret);
  }
});

test('R10b: the draft has only the data-model fields — no raw text field', () => {
  const d = L.parseLabel(LABELS.bedtime);
  assert.deepEqual(Object.keys(d).sort(), ['contraindications', 'found', 'meals', 'minutesBefore', 'name', 'needsCheck',
    'tabletsPerDose', 'timing', 'unsupported', 'warnings']);
});

test('R10b: a Thai person-name line is never taken as the drug name', () => {
  const d = L.parseLabel('น.ส. ผู้ป่วย สมมุติ\nรับประทานครั้งละ 1 เม็ด\nก่อนนอน');
  assert.equal(d.name, null);
  assert.ok(d.needsCheck.includes('name'));
});

test('parseLabel rejects a non-string', () => {
  assert.throws(() => L.parseLabel(null), TypeError);
});

// ---------- US2: อ่านไม่ได้ = ว่าง + กรุณาตรวจสอบ (ห้ามเดา) ----------
test('FR-02 ✗3 / BR-04: a missing dose line leaves tabletsPerDose empty and flagged', () => {
  const d = L.parseLabel('ก่อนนอน\nCETIRIZINE 10 MG.[10] เม็ด');
  assert.equal(d.tabletsPerDose, null);
  assert.deepEqual(d.needsCheck, ['tabletsPerDose']);
});

test('FR-02 ✗3 / BR-04: a dose without a unit is not guessed', () => {
  const d = L.parseLabel('รับประทานครั้งละ 1\nก่อนนอน\nCETIRIZINE 10 MG.[10]');
  assert.equal(d.tabletsPerDose, null);
  assert.ok(d.needsCheck.includes('tabletsPerDose'));
});

test('FR-02 ✗3 / BR-04: before AND after meal on one label → timing empty, not guessed', () => {
  const d = L.parseLabel(LABELS.conflicting);
  assert.equal(d.timing, null);
  assert.ok(d.needsCheck.includes('timing'));
});

test('FR-02 ✗3 / research R-0: a covered word ("…งอาหาร") is neither before nor after meal → timing empty, meals kept', () => {
  const d = L.parseLabel(LABELS.obscured);
  assert.equal(d.timing, null);
  assert.deepEqual(d.meals, ['BREAKFAST', 'DINNER']);
  assert.ok(d.needsCheck.includes('timing'));
});

test('FR-02 ✗3: meal-based timing without any meal word → meals empty and flagged', () => {
  const d = L.parseLabel('รับประทานครั้งละ 1 เม็ด\nหลังอาหาร\nX-DRUG 5 MG[10] เม็ด');
  assert.equal(d.meals, null);
  assert.deepEqual(d.needsCheck, ['meals']);
});

test('FR-02 ✗10: before-meal without minutes → minutesBefore empty and flagged (not guessed)', () => {
  const d = L.parseLabel(LABELS.beforeMealNoMinutes);
  assert.equal(d.minutesBefore, null);
  assert.deepEqual(d.needsCheck, ['minutesBefore']);
});

test('BR-06: "ครึ่งชั่วโมง" written on the label means 30 minutes', () => {
  const d = L.parseLabel('รับประทานครั้งละ 1 เม็ด\nก่อนอาหารเช้า ครึ่งชั่วโมง\nX-DRUG 5 MG[10] เม็ด');
  assert.equal(d.minutesBefore, 30);
});

test('FR-02 ✗4 / BR-07: a when-needed label is unsupported (AS_NEEDED) and keeps the contraindication', () => {
  const d = L.parseLabel(LABELS.asNeeded);
  assert.equal(d.unsupported, 'AS_NEEDED');
  assert.equal(d.contraindications, 'ห้ามใช้เกิน 8 เม็ดต่อวัน');
});

test('BR-07: powder sachets "drink often" are unsupported — when-needed wins over not-a-tablet', () => {
  assert.equal(L.parseLabel(LABELS.powder).unsupported, 'AS_NEEDED');
  assert.equal(L.parseLabel('รับประทานครั้งละ 1 ซอง\nหลังอาหาร เช้า\nORS POWDER[5] ซอง').unsupported, 'NOT_TABLET');
  assert.equal(L.parseLabel('รับประทานครั้งละ 5 มล.\nหลังอาหาร เช้า').unsupported, 'NOT_TABLET');
});

test('BR-07: half tablets (ครึ่ง, ½, 1/2, 0.5) are unsupported', () => {
  assert.equal(L.parseLabel(LABELS.halfTablet).unsupported, 'HALF_TABLET');
  for (const amount of ['½', '1/2', '0.5']) {
    assert.equal(L.parseLabel('รับประทานครั้งละ ' + amount + ' เม็ด\nหลังอาหาร เช้า').unsupported, 'HALF_TABLET', amount);
  }
});

test('FR-02 ✗5: empty text and unreadable noise give found = 0 (screen shows the reason + an empty form)', () => {
  assert.equal(L.parseLabel('').found, 0);
  assert.equal(L.parseLabel(LABELS.garbage).found, 0);
  assert.equal(L.parseLabel(LABELS.garbage).name, null);
});

test('FR-02 ✗5: emptyDraft flags every required field and has found = 0', () => {
  const d = L.emptyDraft();
  assert.deepEqual(d.needsCheck, ['name', 'tabletsPerDose', 'timing']);
  assert.equal(d.found, 0);
  assert.equal(d.unsupported, null);
});
