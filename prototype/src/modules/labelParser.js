/* labelParser — ข้อความจากฉลากยา (ผล OCR) → ร่างข้อมูลยา (FR-02 ✓1 ✗3 ✗4 ✗5 ✗10 · BR-04, BR-05, BR-07 · NFR-09)
   รับเฉพาะรูปแบบที่รู้จัก (whitelist) 5 แบบ: ชื่อยา · ขนาดต่อครั้ง · เวลา/มื้อ · ยาเมื่อมีอาการ · คำเตือน/ข้อห้าม
   บรรทัดอื่นทั้งหมดถูกทิ้ง → ชื่อผู้ป่วย / HN / แพทย์ ไม่มีทางเข้าไปในร่าง แม้ OCR อ่านคำนำหน้าหรือ "HN" เพี้ยน (research R-0, R-3)
   ช่องที่แยกไม่ได้ = null + อยู่ใน needsCheck (BR-04 ห้ามเดา) · ร่างไม่มีช่องข้อความดิบ
   สัญญา: specs/002-label/contracts/label-modules.md · เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.labelParser = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

  // ชื่อยา: ขึ้นต้นด้วยอักษรละตินตัวใหญ่ ตามด้วย [จำนวนจ่าย] (รูปแบบฉลากโรงพยาบาล · R-0) · หน่วยหลัง ] ถ้ามี
  var DRUG_LINE = /([A-Z][A-Za-z0-9 .,\-\/%+()฀-๿]*?)\s*\[\s*\d+\s*\]\s*([฀-๿a-zA-Z.]+)?/;
  // ขนาด: "ครั้งละ <จำนวน> <หน่วย>" · จำนวนเป็นจำนวนเต็ม / ทศนิยม / เศษส่วน / ครึ่ง / ½
  var DOSE = /ครั้งละ\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|½|ครึ่ง)\s*([฀-๿a-zA-Z.]+)?/;
  var TABLET_UNITS = /^(เม็ด|แคปซูล|tab|tablet|cap|capsule)/i;
  var NOT_TABLET_UNITS = /^(ซอง|ช้อน|มล|ml|ซีซี|cc|หยด|ขวด|หลอด)/i;
  var AS_NEEDED = /เมื่อมีอาการ|เวลามีอาการ|เมื่อปวด|เมื่อมีไข้|เมื่อไข้|ทุก\s*\d+(\s*-\s*\d+)?\s*ชั่วโมง|บ่อย\s*ๆ|\bprn\b/i;
  var MEAL_LINE = /อาหาร|วันละ|ก่อนนอน/;  // บรรทัดเวลา · คำว่า "เย็น" ในบรรทัดอื่น (เช่น เก็บในที่เย็น) ไม่นับ
  var MEALS = [
    ['BREAKFAST', /เช้า|เข้า/],  // OCR อ่าน เช้า เป็น เข้า บ่อย (R-0)
    ['LUNCH', /กลางวัน|เที่ยง/],
    ['DINNER', /เย็น/]
  ];
  var REQUIRED = ['name', 'tabletsPerDose', 'timing'];

  // ทำข้อความให้เป็นรูปเดียวกัน: NFC · นิคหิต+สระอา (ํา) → สระอำ · เลขไทย → อารบิก
  function normalize(text) {
    return text.normalize('NFC')
      .replace(/ํา/g, 'ำ')
      .replace(/[๐-๙]/g, function (d) { return String(THAI_DIGITS.indexOf(d)); });
  }

  function clean(s) { return s.replace(/\s+/g, ' ').trim(); }

  // ข้อความภาษาไทยช่วงเดียวที่ขึ้นต้นด้วยคำสำคัญ (ตัดขยะท้ายบรรทัดที่ห่างด้วยช่องว่างหลายช่อง)
  function thaiPhrase(line, start) {
    var s = line.slice(start).split(/\s{2,}/)[0];
    var m = /^[฀-๿0-9 .,\-]+/.exec(s);
    return m ? clean(m[0]).replace(/[ .,\-]+$/, '') : null;
  }

  function parseDose(line) {
    var m = DOSE.exec(line);
    if (!m) return null;
    var amount = m[1];
    var unit = m[2] || '';
    if (NOT_TABLET_UNITS.test(unit)) return { unsupported: 'NOT_TABLET', tablets: null };
    var whole = /^\d+$/.test(amount);
    if (!whole) {
      // ครึ่ง/½/เศษส่วน/ทศนิยม = ยาครึ่งเม็ด (BR-07) ไม่ว่าหน่วยจะอ่านได้หรือไม่
      return { unsupported: 'HALF_TABLET', tablets: null };
    }
    if (!TABLET_UNITS.test(unit)) return { unsupported: null, tablets: null };  // ไม่มีหน่วย / หน่วยอ่านไม่ออก → ไม่เดา
    var n = Number(amount);
    return { unsupported: null, tablets: n >= 1 ? n : null };
  }

  function emptyDraft() {
    return {
      name: null, tabletsPerDose: null, timing: null, meals: null, minutesBefore: null,
      warnings: null, contraindications: null, unsupported: null,
      needsCheck: REQUIRED.slice(), found: 0
    };
  }

  function parseLabel(text) {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    var lines = normalize(text).split(/\r?\n/);
    var d = emptyDraft();
    var timings = {};
    var meals = [];
    var minutes = null;
    var drugUnit = '';
    var asNeeded = false;
    var doseUnsupported = null;

    lines.forEach(function (line) {
      var drug = DRUG_LINE.exec(line);
      if (drug && d.name === null && /[A-Z].*[A-Z].*[A-Z]/.test(drug[1])) {
        d.name = clean(drug[1]);
        drugUnit = drug[2] || '';
      }

      var dose = parseDose(line);
      if (dose && d.tabletsPerDose === null) {
        d.tabletsPerDose = dose.tablets;
        doseUnsupported = doseUnsupported || dose.unsupported;
      }

      if (AS_NEEDED.test(line)) asNeeded = true;

      if (MEAL_LINE.test(line)) {
        if (/ก่อนอาหาร/.test(line)) timings.BEFORE_MEAL = true;
        if (/หลังอาหาร/.test(line)) timings.AFTER_MEAL = true;
        if (/ก่อนนอน/.test(line)) timings.BEDTIME = true;
        MEALS.forEach(function (meal) {
          if (meal[1].test(line) && meals.indexOf(meal[0]) === -1) meals.push(meal[0]);
        });
        var mm = /(\d+)\s*นาที/.exec(line);
        if (mm) minutes = Number(mm[1]);
        else if (/ครึ่งชั่วโมง/.test(line)) minutes = 30;
      }

      var warn = /ยาน[ีิ]/.exec(line) || /ระวัง/.exec(line);
      if (warn && d.warnings === null) d.warnings = thaiPhrase(line, warn.index);
      var contra = /ห้าม/.exec(line);
      if (contra && d.contraindications === null) d.contraindications = thaiPhrase(line, contra.index);
    });

    // เวลา: ต้องมีแบบเดียวพอดี · ขัดกันเอง (ก่อน+หลังอาหาร ฯลฯ) = ว่าง ไม่เดา (BR-04)
    var kinds = Object.keys(timings);
    d.timing = kinds.length === 1 ? kinds[0] : null;
    if (d.timing === 'BEDTIME') d.meals = [];
    else d.meals = meals.length ? meals.sort(function (a, b) { return order(a) - order(b); }) : null;
    d.minutesBefore = d.timing === 'BEFORE_MEAL' && minutes !== null && minutes >= 1 ? minutes : null;

    // ไม่รองรับ (BR-07): ยาเมื่อมีอาการก่อน (ข้อความ AC ✗4) → ไม่ใช่ยาเม็ด → ครึ่งเม็ด
    if (asNeeded) d.unsupported = 'AS_NEEDED';
    else if (NOT_TABLET_UNITS.test(drugUnit) || doseUnsupported === 'NOT_TABLET') d.unsupported = 'NOT_TABLET';
    else if (doseUnsupported === 'HALF_TABLET') d.unsupported = 'HALF_TABLET';

    d.needsCheck = [];
    if (d.name === null) d.needsCheck.push('name');
    if (d.tabletsPerDose === null) d.needsCheck.push('tabletsPerDose');
    if (d.timing === null) d.needsCheck.push('timing');
    if ((d.timing === 'AFTER_MEAL' || d.timing === 'BEFORE_MEAL') && d.meals === null) d.needsCheck.push('meals');
    if (d.timing === 'BEFORE_MEAL' && d.minutesBefore === null) d.needsCheck.push('minutesBefore');

    d.found = ['name', 'tabletsPerDose', 'timing', 'minutesBefore', 'warnings', 'contraindications', 'unsupported']
      .filter(function (k) { return d[k] !== null; }).length + (d.meals && d.meals.length ? 1 : 0);
    return d;
  }

  function order(meal) {
    for (var i = 0; i < MEALS.length; i++) if (MEALS[i][0] === meal) return i;
    return MEALS.length;
  }

  return { parseLabel: parseLabel, emptyDraft: emptyDraft, MEALS: MEALS.map(function (m) { return m[0]; }) };
});
