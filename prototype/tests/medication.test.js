// FR-02 medication — ตรวจร่าง · บันทึก · ลบ · เวลาเตือน (✓2 ✗3 ✗4 ✓6 ✗7 ✓8 ✓9 ✗10 · BR-03–07 · NFR-06)
// เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const M = require('../src/modules/medication.js');

const T0 = new Date(2026, 9, 23, 9, 0, 0, 0).getTime();
const MEALS = { breakfast: '07:00', lunch: '12:00', dinner: '18:00', bedtime: '21:00' };
const draft = (over) => Object.assign({
  name: 'CETIRIZINE 10 MG.', tabletsPerDose: 1, timing: 'BEDTIME', meals: [], minutesBefore: null,
  warnings: 'ยานี้อาจทำให้ง่วงนอน', contraindications: null, unsupported: null, needsCheck: [], found: 5
}, over);

// ---------- Foundational: เวลามื้อ (BR-06) ----------
test('BR-06: meal times at 00:00 and 23:59 are valid', () => {
  assert.deepEqual(M.validMealTimes({ breakfast: '00:00', lunch: '12:00', dinner: '23:59', bedtime: '21:00' }), { ok: true });
});

test('BR-06: wrongly formatted or missing meal times are reported by field', () => {
  const r = M.validMealTimes({ breakfast: '24:00', lunch: '7:00', dinner: '', bedtime: undefined });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'MEAL_TIMES');
  assert.deepEqual(r.fields, ['breakfast', 'lunch', 'dinner', 'bedtime']);
  assert.equal(M.validMealTimes(undefined).ok, false);
});

// ---------- US1: บันทึกเมื่อกดเท่านั้น · ค่าที่บันทึก = ค่าที่แก้ ----------
test('FR-02 ✓2 / NFR-06: the saved medication has the values the caregiver edited, not the values read from the label', () => {
  const edited = draft({ name: 'ยาแก้แพ้ (แก้ชื่อแล้ว)', tabletsPerDose: 2 });
  const r = M.saveMedication([], edited, MEALS, 'P-1', T0, 'm1');
  assert.equal(r.ok, true);
  assert.equal(r.medications.length, 1);
  assert.equal(r.medication.name, 'ยาแก้แพ้ (แก้ชื่อแล้ว)');
  assert.equal(r.medication.tabletsPerDose, 2);
  assert.equal(r.medication.pairingId, 'P-1');
  assert.equal(r.medication.savedAt, T0);
});

test('NFR-06: the saved record keeps only data-model fields (no needsCheck, found, unsupported)', () => {
  const r = M.saveMedication([], draft(), MEALS, 'P-1', T0, 'm1');
  assert.deepEqual(Object.keys(r.medication).sort(), ['contraindications', 'meals', 'medicationId', 'minutesBefore', 'name',
    'pairingId', 'savedAt', 'tabletsPerDose', 'timing', 'warnings']);
});

test('NFR-06: a draft that does not pass validation is not saved and the list is unchanged', () => {
  const before = [{ medicationId: 'm0', pairingId: 'P-1', name: 'เดิม' }];
  const r = M.saveMedication(before, draft({ name: null }), MEALS, 'P-1', T0, 'm1');
  assert.equal(r.ok, false);
  assert.equal(r.medications, undefined);
  assert.equal(before.length, 1);
});

test('FR-02 ✗7: cancelling (never calling save) leaves the list as it was — saving does not mutate the input', () => {
  const before = [];
  M.saveMedication(before, draft(), MEALS, 'P-1', T0, 'm1');
  assert.deepEqual(before, []);
});

test('BR-03: saving with an existing id edits that medication instead of adding another', () => {
  const first = M.saveMedication([], draft(), MEALS, 'P-1', T0, 'm1').medications;
  const r = M.saveMedication(first, draft({ tabletsPerDose: 3 }), MEALS, 'P-1', T0 + 1, 'm1');
  assert.equal(r.medications.length, 1);
  assert.equal(r.medications[0].tabletsPerDose, 3);
});

test('NFR-04: medicationsOf returns only the medications of that pair', () => {
  const list = [{ medicationId: 'a', pairingId: 'P-1' }, { medicationId: 'b', pairingId: 'P-2' }];
  assert.deepEqual(M.medicationsOf(list, 'P-1').map((m) => m.medicationId), ['a']);
  assert.deepEqual(M.medicationsOf(undefined, 'P-1'), []);
});

test('BR-05: warnings and contraindications are optional; blank text is stored as null', () => {
  const r = M.saveMedication([], draft({ warnings: '   ', contraindications: '' }), MEALS, 'P-1', T0, 'm1');
  assert.equal(r.ok, true);
  assert.equal(r.medication.warnings, null);
  assert.equal(r.medication.contraindications, null);
});

// ---------- US2: ตรวจร่าง (✗3 ✗4 ✗10 · BR-04, 05, 07) ----------
test('FR-02 ✗3 / BR-05: empty required fields block saving and are listed', () => {
  const r = M.validateDraft(draft({ name: '  ', tabletsPerDose: null, timing: null }), MEALS);
  assert.deepEqual(r, { ok: false, reason: 'MISSING', fields: ['name', 'tabletsPerDose', 'timing'] });
});

test('BR-05 boundary: tablets per dose must be a whole number from 1 to 20', () => {
  for (const ok of [1, 20]) assert.equal(M.validateDraft(draft({ tabletsPerDose: ok }), MEALS).ok, true, String(ok));
  for (const bad of [0, 21, 1.5, -1, '1']) assert.deepEqual(M.validateDraft(draft({ tabletsPerDose: bad }), MEALS).fields, ['tabletsPerDose'], String(bad));
});

test('BR-05 boundary: the name must not be longer than 100 characters', () => {
  assert.equal(M.validateDraft(draft({ name: 'A'.repeat(100) }), MEALS).ok, true);
  assert.deepEqual(M.validateDraft(draft({ name: 'A'.repeat(101) }), MEALS).fields, ['name']);
});

test('FR-02 ✗3: meal-based timing needs at least one meal', () => {
  assert.deepEqual(M.validateDraft(draft({ timing: 'AFTER_MEAL', meals: [] }), MEALS).fields, ['meals']);
  assert.deepEqual(M.validateDraft(draft({ timing: 'AFTER_MEAL', meals: null }), MEALS).fields, ['meals']);
});

test('FR-02 ✗10: before-meal without minutes cannot be saved; minutes must be 1–120', () => {
  const base = { timing: 'BEFORE_MEAL', meals: ['BREAKFAST'] };
  assert.deepEqual(M.validateDraft(draft(Object.assign({ minutesBefore: null }, base)), MEALS).fields, ['minutesBefore']);
  for (const ok of [1, 120]) assert.equal(M.validateDraft(draft(Object.assign({ minutesBefore: ok }, base)), MEALS).ok, true, String(ok));
  for (const bad of [0, 121, 7.5]) assert.deepEqual(M.validateDraft(draft(Object.assign({ minutesBefore: bad }, base)), MEALS).fields, ['minutesBefore'], String(bad));
});

test('FR-02 ✗4 / BR-07: an unsupported medicine is refused first, with the exact message for when-needed medicine', () => {
  assert.deepEqual(M.validateDraft(draft({ unsupported: 'AS_NEEDED', name: null }), MEALS), { ok: false, reason: 'UNSUPPORTED', fields: ['AS_NEEDED'] });
  assert.equal(M.UNSUPPORTED_TEXT.AS_NEEDED, 'ระบบยังไม่รองรับยาเมื่อมีอาการ');
  assert.ok(M.UNSUPPORTED_TEXT.NOT_TABLET && M.UNSUPPORTED_TEXT.HALF_TABLET);
});

test('BR-06: invalid meal times block saving after the required fields are complete', () => {
  assert.deepEqual(M.validateDraft(draft(), Object.assign({}, MEALS, { bedtime: '9pm' })), { ok: false, reason: 'MEAL_TIMES', fields: ['bedtime'] });
});

// ---------- US3: เวลาเตือนจากฉลาก (✓6 ✓8 ✓9 · BR-06) + ลบยา (BR-03) ----------
test('FR-02 ✓6: after breakfast with breakfast at 07:00 reminds at 07:00', () => {
  assert.deepEqual(M.reminderTimes(draft({ timing: 'AFTER_MEAL', meals: ['BREAKFAST'] }), MEALS), ['07:00']);
});

test('FR-02 ✓8: 30 minutes before breakfast at 07:00 reminds at 06:30', () => {
  assert.deepEqual(M.reminderTimes(draft({ timing: 'BEFORE_MEAL', meals: ['BREAKFAST'], minutesBefore: 30 }), MEALS), ['06:30']);
});

test('FR-02 ✓9: bedtime at 21:00 reminds at 21:00', () => {
  assert.deepEqual(M.reminderTimes(draft(), MEALS), ['21:00']);
});

test('BR-06: several meals are sorted by time and equal times appear once', () => {
  const med = draft({ timing: 'AFTER_MEAL', meals: ['DINNER', 'BREAKFAST', 'LUNCH'] });
  assert.deepEqual(M.reminderTimes(med, MEALS), ['07:00', '12:00', '18:00']);
  assert.deepEqual(M.reminderTimes(med, Object.assign({}, MEALS, { lunch: '07:00' })), ['07:00', '18:00']);
});

test('clarify Q1 boundary: 30 minutes before 00:30 is 00:00 (allowed); before 00:29 falls before midnight (not allowed)', () => {
  const med = draft({ timing: 'BEFORE_MEAL', meals: ['BREAKFAST'], minutesBefore: 30 });
  assert.deepEqual(M.reminderTimes(med, Object.assign({}, MEALS, { breakfast: '00:30' })), ['00:00']);
  const early = Object.assign({}, MEALS, { breakfast: '00:29' });
  assert.equal(M.reminderTimes(med, early), null);
  assert.deepEqual(M.validateDraft(med, early), { ok: false, reason: 'BEFORE_MIDNIGHT', fields: ['BREAKFAST'] });
});

test('BR-06: not enough data (missing meal time or minutes) gives no reminder times', () => {
  assert.equal(M.reminderTimes(draft({ timing: 'BEFORE_MEAL', meals: ['BREAKFAST'], minutesBefore: null }), MEALS), null);
  assert.equal(M.reminderTimes(draft(), Object.assign({}, MEALS, { bedtime: '' })), null);
  assert.equal(M.reminderTimes(draft({ timing: null }), MEALS), null);
});

test('BR-03 / clarify Q2: removeMedication deletes by id, leaves others, and does not mutate the input', () => {
  const list = [{ medicationId: 'a' }, { medicationId: 'b' }];
  assert.deepEqual(M.removeMedication(list, 'a'), [{ medicationId: 'b' }]);
  assert.deepEqual(M.removeMedication(list, 'zzz'), list);
  assert.equal(list.length, 2);
  assert.deepEqual(M.removeMedication([{ medicationId: 'a' }], 'a'), []);
});
