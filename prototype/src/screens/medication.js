/* หน้าจอ C2 — ยาของผู้สูงอายุ: ถ่ายฉลาก → ร่าง → ตรวจ/แก้ → บันทึก · แก้ · ลบ (FR-02 · NFR-03, NFR-06, NFR-09)
   กฎอยู่ใน src/modules/labelParser.js, medication.js · การอ่านรูปอยู่หลัง adapter src/modules/readLabel.js (ADR-03)
   ร่างอยู่ในตัวแปรของหน้าจอเท่านั้น (ไม่อยู่ใน store) → ไม่มีอะไรถูกบันทึกจนกด "บันทึกยา" (NFR-06) · ข้อความดิบจาก OCR ไม่แสดง ไม่เก็บ (R10b)
   กติกาหน้าจอ: draw() เรียกซ้ำได้ · reload เฉพาะในปุ่ม · ปุ่มหลัก ≤ 1 · สีจาก token (specs/001-pairing/tasks.md)
   สัญญา: specs/002-label/contracts/screens.md · เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (window, document) {
  'use strict';

  var MM = window.MedMind || {};
  if (!MM.screens || !MM.pairing || !MM.labelParser || !MM.medication || !MM.readLabel) {
    console.error('[medication screen] โหลดไม่ครบ — ตรวจลำดับ <script> ใน index.html');
    return;
  }
  var P = MM.pairing;
  var LP = MM.labelParser;
  var MED = MM.medication;
  var RL = MM.readLabel;
  var h = MM.ui.h;

  var TIMING_TEXT = { AFTER_MEAL: 'หลังอาหาร', BEFORE_MEAL: 'ก่อนอาหาร', BEDTIME: 'ก่อนนอน' };
  var MEAL_TEXT = { BREAKFAST: 'เช้า', LUNCH: 'กลางวัน', DINNER: 'เย็น' };
  var MEAL_TIME_TEXT = { breakfast: 'มื้อเช้า', lunch: 'มื้อกลางวัน', dinner: 'มื้อเย็น', bedtime: 'เข้านอน' };
  var CHECK = 'กรุณาตรวจสอบ';

  function pairOf(app) {
    var d = app.store.get('devices');
    var pairing = app.store.get('pairing');
    return d && P.canAccess(pairing, d.caregiverId) ? pairing : null;
  }

  function scheduleText(med) {
    var when = TIMING_TEXT[med.timing] || '';
    if (med.timing === 'BEFORE_MEAL' && med.minutesBefore) when += ' ' + med.minutesBefore + ' นาที';
    var meals = (med.meals || []).map(function (m) { return MEAL_TEXT[m]; }).join(' ');
    return 'ครั้งละ ' + med.tabletsPerDose + ' เม็ด · ' + when + (meals ? ' ' + meals : '');
  }

  function newId(now) { return 'M-' + now + '-' + Math.floor(Math.random() * 1e9).toString(36); }

  MM.screens.register({
    id: 'C2',
    role: 'caregiver',
    title: 'ยาของผู้สูงอายุ',
    covers: ['FR-02', 'NFR-06', 'NFR-09'],
    isStart: function (app) { return pairOf(app) !== null; },
    render: function (body, ctx) {
      var app = ctx.app;
      var store = app.store;
      var mode = 'LIST';        // LIST | READING | DRAFT
      var draft = null;         // ร่างที่กำลังแก้ (ไม่อยู่ใน store)
      var editingId = null;     // แก้ยาเดิม = id เดิม
      var mealForm = null;      // เวลามื้อในฟอร์ม
      var notice = null;        // { tone, text }
      var readToken = 0;        // ผลอ่านที่มาช้ากว่าการกด "กรอกเอง" ถูกทิ้ง

      function startDraft(d, id, message) {
        draft = {
          name: d.name || '', tabletsPerDose: d.tabletsPerDose, timing: d.timing, meals: (d.meals || []).slice(),
          minutesBefore: d.minutesBefore, warnings: d.warnings || '', contraindications: d.contraindications || '',
          unsupported: d.unsupported || null
        };
        var mt = store.get('mealTimes') || {};
        mealForm = { breakfast: mt.breakfast || '', lunch: mt.lunch || '', dinner: mt.dinner || '', bedtime: mt.bedtime || '' };
        editingId = id || null;
        notice = message;
        mode = 'DRAFT';
        draw();
      }

      function manualEntry(message) {
        readToken += 1;
        startDraft(LP.emptyDraft(), null, message || null);
      }

      function onLabelChosen(e) {
        var file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        var token = ++readToken;
        mode = 'READING';
        notice = null;
        draw();
        RL.readLabel(file).then(function (r) {
          if (token !== readToken) return;  // ผู้ใช้เลือกกรอกเองไปแล้ว
          if (!r.ok) {
            startDraft(LP.emptyDraft(), null, { tone: 'warn', text: RL.REASON_TEXT[r.reason] });  // ✗5
            return;
          }
          var parsed = LP.parseLabel(r.text);  // ข้อความดิบไม่ถูกเก็บหรือแสดง (R10b)
          if (parsed.found === 0) {
            startDraft(LP.emptyDraft(), null, { tone: 'warn', text: RL.REASON_TEXT.UNREADABLE });
            return;
          }
          startDraft(parsed, null, { tone: 'info', text: 'ตรวจทุกช่องก่อนบันทึก ระบบยังไม่ได้บันทึกอะไร' });  // ✓1
        });
      }

      function validation() {
        var mt = Object.assign({}, mealForm);
        return {
          result: MED.validateDraft(draft, mt),
          // ช่องที่ต้องเตือนแสดงทุกช่องพร้อมกัน แม้ยาไม่รองรับ (validateDraft หยุดที่เหตุผลแรก)
          missing: (MED.validateDraft(Object.assign({}, draft, { unsupported: null }), mt).fields || []),
          mealTimes: (MED.validMealTimes(mt).fields || []),
          times: MED.reminderTimes(draft, mt)
        };
      }

      function onSave() {
        store.reload();
        var pairing = pairOf(app);
        if (!pairing) { ctx.go('C1', { notice: 'UNPAIRED' }); return; }
        var now = app.clock.now();
        var mealTimes = Object.assign({ pairingId: pairing.pairingId }, mealForm);
        var r = MED.saveMedication(store.get('medications', []), draft, mealTimes, pairing.pairingId, now, editingId || newId(now));
        if (!r.ok) { draw(); return; }
        mode = 'LIST';
        draft = null;
        notice = null;
        store.set('mealTimes', mealTimes);
        store.set('medications', r.medications);
        ctx.toast('บันทึกยาแล้ว', 'success');
      }

      function onCancel() {
        readToken += 1;
        mode = 'LIST';
        draft = null;
        notice = null;
        draw();
        ctx.toast('ยกเลิกแล้ว ไม่ได้บันทึก');  // ✗7
      }

      function onDelete(med) {
        ctx.confirm({
          title: 'ลบยานี้?',
          message: med.name + ' จะถูกลบและไม่เตือนอีก ย้อนกลับไม่ได้',
          confirmLabel: 'ลบยา',
          tone: 'danger'
        }).then(function (ok) {
          if (!ok) return;  // ยกเลิก = ไม่เปลี่ยน
          store.reload();
          store.set('medications', MED.removeMedication(store.get('medications', []), med.medicationId));
          ctx.toast('ลบยาแล้ว', 'success');
        });
      }

      // ---------- LIST ----------
      function listView(pairing) {
        var meds = MED.medicationsOf(store.get('medications', []), pairing.pairingId);
        var mt = store.get('mealTimes') || {};
        var fileInput = h('input', { class: 'visually-hidden', type: 'file', accept: 'image/*', tabindex: '-1', 'aria-hidden': 'true', onChange: onLabelChosen });
        var cards = meds.map(function (med) {
          var times = MED.reminderTimes(med, mt);
          return h('div', { class: 'card' }, [
            h('p', { class: 'card__title', text: med.name }),
            h('p', { text: scheduleText(med) }),
            h('p', { text: times ? 'เตือน ' + times.join(' · ') : 'ยังคำนวณเวลาเตือนไม่ได้ ตรวจเวลามื้อ' }),
            med.warnings ? h('p', { class: 'muted', text: 'ข้อควรระวัง: ' + med.warnings }) : null,
            med.contraindications ? h('p', { class: 'muted', text: 'ข้อห้ามใช้: ' + med.contraindications }) : null,
            h('div', { class: 'row' }, [
              h('button', { class: 'btn btn--secondary', type: 'button', onClick: function () { startDraft(med, med.medicationId, null); } }, 'แก้'),
              h('button', { class: 'btn btn--secondary', type: 'button', onClick: function () { onDelete(med); } }, 'ลบ')
            ])
          ]);
        });
        return [
          banner(notice),
          meds.length ? null : h('div', { class: 'empty' }, [
            h('p', { class: 'empty__title', text: 'ยังไม่มียา' }),
            h('p', { text: 'ถ่ายรูปฉลากยาจากโรงพยาบาล ระบบจะร่างข้อมูลให้ตรวจก่อนบันทึก' })
          ]),
          h('button', { class: 'btn btn--primary btn--block btn--xl', type: 'button', onClick: function () { fileInput.click(); } }, 'เพิ่มยาจากฉลาก'),
          fileInput,
          h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { manualEntry(); } }, 'กรอกเอง'),
          cards.length ? h('div', { class: 'stack' }, cards) : null,
          h('button', { class: 'btn btn--ghost btn--block', type: 'button', onClick: function () { ctx.go('C1'); } }, 'การเชื่อมต่อ')
        ];
      }

      // ---------- READING ----------
      function readingView() {
        return [
          h('div', { class: 'banner banner--info', role: 'status' }, 'กำลังอ่านฉลาก… ครั้งแรกอาจนานกว่าปกติ'),
          h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { manualEntry(); } }, 'กรอกเอง')
        ];
      }

      // ---------- DRAFT ----------
      var parts = null;  // อ้างอิงช่องในฟอร์ม เพื่ออัปเดตสถานะโดยไม่วาดใหม่ (พิมพ์แล้วโฟกัสไม่หาย)

      function field(key, label, input, hint) {
        var error = h('p', { class: 'field__error', text: CHECK, hidden: true });
        var wrap = h('div', { class: 'field' }, [h('label', { class: 'field__label', for: 'c2-' + key, text: label }), input, hint || null, error]);
        parts.fields[key] = { wrap: wrap, error: error };
        return wrap;
      }

      function textInput(key, value, onValue, extra) {
        return h('input', Object.assign({
          class: 'field__input', id: 'c2-' + key, type: 'text', value: value === null || value === undefined ? '' : String(value),
          autocomplete: 'off', onInput: function (e) { onValue(e.target.value); refresh(); }
        }, extra || {}));
      }

      function wholeOrRaw(v) { return /^\d+$/.test(v.trim()) ? Number(v.trim()) : (v.trim() === '' ? null : v); }

      function draftView() {
        parts = { fields: {}, groups: {} };
        var timingInputs = ['AFTER_MEAL', 'BEFORE_MEAL', 'BEDTIME'].map(function (t) {
          var input = h('input', { type: 'radio', name: 'c2-timing', value: t, onChange: function () { draft.timing = t; refresh(); } });
          input.checked = draft.timing === t;
          return h('label', { class: 'choice' }, [input, TIMING_TEXT[t]]);
        });
        var mealInputs = ['BREAKFAST', 'LUNCH', 'DINNER'].map(function (m) {
          var input = h('input', { type: 'checkbox', value: m, onChange: function (e) {
            var set = (draft.meals || []).filter(function (x) { return x !== m; });
            if (e.target.checked) set.push(m);
            draft.meals = ['BREAKFAST', 'LUNCH', 'DINNER'].filter(function (x) { return set.indexOf(x) !== -1; });
            refresh();
          } });
          input.checked = (draft.meals || []).indexOf(m) !== -1;
          return h('label', { class: 'choice' }, [input, MEAL_TEXT[m]]);
        });
        var timingGroup = h('fieldset', { class: 'field choices' }, [h('legend', { class: 'field__label', text: 'เวลาตามฉลาก' })].concat(timingInputs));
        var mealGroup = h('fieldset', { class: 'field choices' }, [h('legend', { class: 'field__label', text: 'มื้อ' })].concat(mealInputs));
        var timingError = h('p', { class: 'field__error', text: CHECK, hidden: true });
        var mealError = h('p', { class: 'field__error', text: CHECK, hidden: true });
        timingGroup.appendChild(timingError);
        mealGroup.appendChild(mealError);
        parts.fields.timing = { wrap: timingGroup, error: timingError };
        parts.fields.meals = { wrap: mealGroup, error: mealError };
        parts.groups.meals = mealGroup;

        var minutesField = field('minutesBefore', 'ก่อนอาหารกี่นาที (ตามฉลาก)',
          textInput('minutesBefore', draft.minutesBefore, function (v) { draft.minutesBefore = wholeOrRaw(v); }, { inputmode: 'numeric' }));
        parts.groups.minutes = minutesField;

        var mealTimeFields = Object.keys(MEAL_TIME_TEXT).map(function (k) {
          var input = h('input', { class: 'field__input', id: 'c2-mt-' + k, type: 'time', value: mealForm[k],
            onInput: function (e) { mealForm[k] = e.target.value; refresh(); } });
          var error = h('p', { class: 'field__error', text: CHECK, hidden: true });
          var wrap = h('div', { class: 'field' }, [h('label', { class: 'field__label', for: 'c2-mt-' + k, text: MEAL_TIME_TEXT[k] }), input, error]);
          parts.fields['mt-' + k] = { wrap: wrap, error: error };
          return wrap;
        });

        parts.unsupported = h('div', { class: 'banner banner--danger', role: 'alert', hidden: true });
        parts.preview = h('p', { class: 'card__title', role: 'status' });
        parts.save = h('button', { class: 'btn btn--primary btn--block btn--xl', type: 'button', onClick: onSave }, 'บันทึกยา');

        return [
          banner(notice),
          parts.unsupported,
          field('name', 'ชื่อยา', textInput('name', draft.name, function (v) { draft.name = v; })),
          field('tabletsPerDose', 'จำนวนเม็ดต่อครั้ง',
            textInput('tabletsPerDose', draft.tabletsPerDose, function (v) { draft.tabletsPerDose = wholeOrRaw(v); }, { inputmode: 'numeric' })),
          timingGroup,
          mealGroup,
          minutesField,
          field('warnings', 'ข้อควรระวัง (ถ้าฉลากมี)', textInput('warnings', draft.warnings, function (v) { draft.warnings = v; })),
          field('contraindications', 'ข้อห้ามใช้ (ถ้าฉลากมี)', textInput('contraindications', draft.contraindications, function (v) { draft.contraindications = v; })),
          h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'เวลามื้อของผู้สูงอายุ' })].concat(mealTimeFields)),
          parts.preview,
          parts.save,
          h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: onCancel }, 'ยกเลิก')
        ];
      }

      // อัปเดตเครื่องหมาย "กรุณาตรวจสอบ" · ช่องที่ซ่อน · ตัวอย่างเวลาเตือน · ปุ่มบันทึก โดยไม่วาดฟอร์มใหม่
      function refresh() {
        if (mode !== 'DRAFT' || !parts) return;
        var v = validation();
        var flagged = v.missing.concat(v.mealTimes.map(function (k) { return 'mt-' + k; }));
        if (v.result.reason === 'BEFORE_MIDNIGHT') {
          v.result.fields.forEach(function (meal) { flagged.push('mt-' + meal.toLowerCase()); });
        }
        Object.keys(parts.fields).forEach(function (key) {
          var on = flagged.indexOf(key) !== -1;
          parts.fields[key].wrap.classList.toggle('field--invalid', on);
          parts.fields[key].error.hidden = !on;
        });
        parts.groups.meals.hidden = !(draft.timing === 'AFTER_MEAL' || draft.timing === 'BEFORE_MEAL');
        parts.groups.minutes.hidden = draft.timing !== 'BEFORE_MEAL';
        parts.unsupported.hidden = !draft.unsupported;
        parts.unsupported.textContent = draft.unsupported ? MED.UNSUPPORTED_TEXT[draft.unsupported] : '';
        parts.preview.textContent = v.result.reason === 'BEFORE_MIDNIGHT'
          ? 'เวลาเตือนตกก่อนเที่ยงคืน กรุณาตรวจสอบเวลามื้อ'
          : (v.times ? 'จะเตือนเวลา ' + v.times.join(' · ') : 'ยังคำนวณเวลาเตือนไม่ได้');
        parts.save.disabled = !v.result.ok;
      }

      function banner(message) {
        if (!message) return null;
        return h('div', { class: 'banner banner--' + message.tone, role: message.tone === 'danger' ? 'alert' : 'status' }, message.text);
      }

      function draw() {
        var pairing = pairOf(app);
        if (!pairing) { ctx.go('C1', { notice: 'UNPAIRED' }); return; }  // architecture §8.5
        var active = document.activeElement;
        var focusId = active && body.contains(active) ? active.id : null;
        var content = mode === 'READING' ? readingView() : mode === 'DRAFT' ? draftView() : listView(pairing);
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, content));
        refresh();
        if (focusId) {
          var again = document.getElementById(focusId);
          if (again) again.focus();
        }
      }

      ctx.subscribe(draw);
      draw();
    }
  });
})(window, document);
