/* medication — ตรวจร่าง · บันทึก · แก้ · ลบยา · เวลาเตือนจากคำสั่งบนฉลาก (FR-02 · BR-03–07 · NFR-06)
   ฟังก์ชันล้วน: ไม่แตะ DOM/store · รับ now เข้ามา · คืนรายการใหม่ ไม่แก้ของที่รับมา
   บันทึกได้เฉพาะร่างที่ผ่าน validateDraft (NFR-06) · เวลาเตือนเป็นค่าคำนวณ ไม่เก็บ (FR-03 เรียก reminderTimes)
   สัญญา: specs/002-label/contracts/label-modules.md · เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.medication = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var TIMINGS = ['AFTER_MEAL', 'BEFORE_MEAL', 'BEDTIME'];
  var MEAL_FIELD = { BREAKFAST: 'breakfast', LUNCH: 'lunch', DINNER: 'dinner' };
  var MEAL_TIME_FIELDS = ['breakfast', 'lunch', 'dinner', 'bedtime'];
  var HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
  var MAX_NAME = 100;
  var MAX_TABLETS = 20;
  var MAX_MINUTES = 120;

  // ข้อความยาไม่รองรับ (BR-07) · AS_NEEDED ตรงตัวตาม FR-02 ✗4
  var UNSUPPORTED_TEXT = {
    AS_NEEDED: 'ระบบยังไม่รองรับยาเมื่อมีอาการ',
    NOT_TABLET: 'ระบบยังไม่รองรับยาน้ำ ยาผง หรือยาที่ไม่ใช่เม็ด',
    HALF_TABLET: 'ระบบยังไม่รองรับยาครึ่งเม็ด'
  };

  function isWhole(n, min, max) {
    return typeof n === 'number' && Math.floor(n) === n && n >= min && n <= max;
  }

  function minutesOf(hhmm) {
    var m = HHMM.exec(hhmm);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function hhmm(total) {
    var h = Math.floor(total / 60);
    var m = total % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function validMealTimes(mealTimes) {
    var mt = mealTimes || {};
    var bad = MEAL_TIME_FIELDS.filter(function (k) { return minutesOf(mt[k]) === null; });
    return bad.length ? { ok: false, reason: 'MEAL_TIMES', fields: bad } : { ok: true };
  }

  function needsMeals(timing) { return timing === 'AFTER_MEAL' || timing === 'BEFORE_MEAL'; }

  function missingFields(d) {
    var fields = [];
    var name = typeof d.name === 'string' ? d.name.trim() : '';
    if (name === '' || name.length > MAX_NAME) fields.push('name');
    if (!isWhole(d.tabletsPerDose, 1, MAX_TABLETS)) fields.push('tabletsPerDose');
    if (TIMINGS.indexOf(d.timing) === -1) fields.push('timing');
    if (needsMeals(d.timing) && !(Array.isArray(d.meals) && d.meals.length && d.meals.every(function (m) { return MEAL_FIELD[m]; }))) {
      fields.push('meals');
    }
    if (d.timing === 'BEFORE_MEAL' && !isWhole(d.minutesBefore, 1, MAX_MINUTES)) fields.push('minutesBefore');
    return fields;
  }

  // เวลาเตือนของแต่ละมื้อเป็นนาทีของวัน · อาจติดลบ (ก่อนเที่ยงคืน) — ผู้เรียกตัดสิน
  function rawTimes(med, mealTimes) {
    var mt = mealTimes || {};
    if (med.timing === 'BEDTIME') {
      var bed = minutesOf(mt.bedtime);
      return bed === null ? null : [{ meal: 'BEDTIME', at: bed }];
    }
    if (!needsMeals(med.timing) || !Array.isArray(med.meals) || !med.meals.length) return null;
    var offset = med.timing === 'BEFORE_MEAL' ? med.minutesBefore : 0;
    if (med.timing === 'BEFORE_MEAL' && !isWhole(offset, 1, MAX_MINUTES)) return null;
    var out = [];
    for (var i = 0; i < med.meals.length; i++) {
      var t = minutesOf(mt[MEAL_FIELD[med.meals[i]]]);
      if (t === null) return null;
      out.push({ meal: med.meals[i], at: t - offset });
    }
    return out;
  }

  // หลังอาหาร = เวลามื้อ · ก่อนอาหาร N = เวลามื้อ − N · ก่อนนอน = เวลาเข้านอน (BR-06) · ก่อน 00:00 → null (clarify 002 Q1)
  function reminderTimes(med, mealTimes) {
    var times = rawTimes(med || {}, mealTimes);
    if (!times || times.some(function (t) { return t.at < 0; })) return null;
    var list = times.map(function (t) { return t.at; }).sort(function (a, b) { return a - b; });
    return list.filter(function (t, i) { return i === 0 || t !== list[i - 1]; }).map(hhmm);
  }

  // ลำดับ: ไม่รองรับ → ช่องบังคับ → เวลามื้อ → ก่อนเที่ยงคืน
  function validateDraft(draft, mealTimes) {
    var d = draft || {};
    if (d.unsupported) return { ok: false, reason: 'UNSUPPORTED', fields: [d.unsupported] };
    var missing = missingFields(d);
    if (missing.length) return { ok: false, reason: 'MISSING', fields: missing };
    var meals = validMealTimes(mealTimes);
    if (!meals.ok) return meals;
    var early = (rawTimes(d, mealTimes) || []).filter(function (t) { return t.at < 0; }).map(function (t) { return t.meal; });
    if (early.length) return { ok: false, reason: 'BEFORE_MIDNIGHT', fields: early };
    return { ok: true };
  }

  function text(v) {
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  }

  // บันทึก/แก้ (id เดิม = แก้) · เก็บเฉพาะฟิลด์ใน data model (architecture §6) · ไม่ผ่าน = ไม่เปลี่ยนรายการ (NFR-06)
  function saveMedication(list, draft, mealTimes, pairingId, now, medicationId) {
    if (typeof pairingId !== 'string' || pairingId === '') throw new TypeError('pairingId must be a non-empty string');
    if (typeof now !== 'number' || !isFinite(now)) throw new TypeError('now must be a finite number');
    if (typeof medicationId !== 'string' || medicationId === '') throw new TypeError('medicationId must be a non-empty string');
    var check = validateDraft(draft, mealTimes);
    if (!check.ok) return check;
    var med = {
      medicationId: medicationId,
      pairingId: pairingId,
      name: draft.name.trim(),
      tabletsPerDose: draft.tabletsPerDose,
      timing: draft.timing,
      meals: draft.timing === 'BEDTIME' ? [] : draft.meals.slice(),
      minutesBefore: draft.timing === 'BEFORE_MEAL' ? draft.minutesBefore : null,
      warnings: text(draft.warnings),
      contraindications: text(draft.contraindications),
      savedAt: now
    };
    var current = Array.isArray(list) ? list : [];
    var exists = current.some(function (m) { return m.medicationId === medicationId; });
    var medications = exists
      ? current.map(function (m) { return m.medicationId === medicationId ? med : m; })
      : current.concat([med]);
    return { ok: true, medications: medications, medication: med };
  }

  function removeMedication(list, medicationId) {
    var current = Array.isArray(list) ? list : [];
    if (!current.some(function (m) { return m.medicationId === medicationId; })) return current;
    return current.filter(function (m) { return m.medicationId !== medicationId; });
  }

  function medicationsOf(list, pairingId) {
    return (Array.isArray(list) ? list : []).filter(function (m) { return m.pairingId === pairingId; });
  }

  return {
    UNSUPPORTED_TEXT: UNSUPPORTED_TEXT,
    validMealTimes: validMealTimes,
    validateDraft: validateDraft,
    reminderTimes: reminderTimes,
    saveMedication: saveMedication,
    removeMedication: removeMedication,
    medicationsOf: medicationsOf
  };
});
