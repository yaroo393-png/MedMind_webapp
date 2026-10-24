/* หน้าจอ S3 — หน้าแรกของผู้สูงอายุ "ยาของฉันวันนี้": ทุกมื้อของวันนี้ + สถานะ (BR-14) + ยืนยันช้า (FR-04 · FR-03 ✗5 · NFR-02, NFR-03, NFR-07)
   กฎอยู่ใน src/modules/confirm.js และ doseSession.js · "กินแล้ว" ใช้ MedMind.reminder.confirmTap ตัวเดียวกับหน้าเตือน (S2)
   รอบเตือนใหม่เริ่ม → ไปหน้าเตือนเอง ผู้สูงอายุไม่ต้องกด (FR-03 R8 · research R-6)
   กติกาหน้าจอ: draw() เรียกซ้ำได้ · ปุ่มหลัก 1 ปุ่มต่อหน้าจอ · สีจาก token · ไม่มีคำว่า "ไม่ได้กิน"
   สัญญา: specs/004-confirm/contracts/screens.md · เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (window) {
  'use strict';

  var MM = window.MedMind || {};
  if (!MM.screens || !MM.pairing || !MM.medication || !MM.doseSession || !MM.confirm || !MM.reminder) {
    console.error('[home screen] โหลดไม่ครบ — ตรวจลำดับ <script> ใน index.html');
    return;
  }
  var P = MM.pairing;
  var MED = MM.medication;
  var DS = MM.doseSession;
  var CF = MM.confirm;
  var R = MM.reminder;
  var h = MM.ui.h;

  var EMPTY_TEXT = 'ยังไม่มียา ให้ผู้ดูแลเพิ่มยา';  // FR-03 ✗5 ตรงตัว
  var STATUS_CLASS = {
    TAKEN: 'status--taken', TAKEN_LATE: 'status--taken',
    ALERTING: 'status--alerting', UNCONFIRMED: 'status--unconfirmed', WAITING: 'status--waiting'
  };

  function pairOf(app) {
    var d = app.store.get('devices');
    var pairing = app.store.get('pairing');
    return d && P.isSeniorPaired(pairing, d.seniorId) ? pairing : null;
  }

  MM.screens.register({
    id: 'S3',
    role: 'senior',
    title: 'ยาของฉันวันนี้',
    covers: ['FR-04', 'FR-03', 'NFR-02', 'NFR-03', 'NFR-07'],
    isStart: function (app) { return pairOf(app) !== null; },
    render: function (body, ctx) {
      var app = ctx.app;
      var seenDueKey = R.dueKey(app);  // รอบเตือนที่มีอยู่ตอนเปิดหน้านี้ไม่ดึงกลับ (แบบ S1 · 003)

      // button: null = ไม่มีปุ่ม · 'primary' | 'secondary'
      function sessionCard(s, namesById, st, button) {
        var titleId = 's3-session-' + s.sessionKey;
        var names = s.medicationIds.map(function (id) { return namesById[id]; }).filter(Boolean);
        return h('section', { class: 'card', 'aria-labelledby': titleId }, [
          h('p', { class: 'session-time', id: titleId, text: MM.clock.formatTime(s.at) }),
          h('p', { class: 'card__title', text: names.join(' · ') }),
          h('p', {}, h('span', { class: 'status ' + STATUS_CLASS[st.status], text: CF.statusLabel(st.status, st.confirmedAt) })),
          button ? h('button', {
            class: 'btn btn--xl btn--block btn--' + button, type: 'button',
            onClick: function () { R.confirmTap(ctx, s); }
          }, 'กินแล้ว') : null
        ]);
      }

      function draw() {
        var pairing = pairOf(app);
        if (!pairing) { ctx.go('S1'); return; }  // ไม่จับคู่/ถูกยกเลิก (NFR-04 · §8.5)
        var key = R.dueKey(app);
        if (key && key !== seenDueKey) { ctx.go('S2'); return; }
        seenDueKey = key;

        var now = app.clock.now();
        var meds = MED.medicationsOf(app.store.get('medications', []), pairing.pairingId);
        var mt = app.store.get('mealTimes');
        if (!mt || mt.pairingId !== pairing.pairingId) mt = null;
        var today = DS.sessionsOf(meds, mt, DS.dayOf(now));
        var confirmations = app.store.get('confirmations', []);
        var namesById = {};
        meds.forEach(function (m) { namesById[m.medicationId] = m.name; });

        var content = [
          R.undoBanner(),
          ctx.params.notice ? h('div', { class: 'banner banner--info', role: 'status' }, ctx.params.notice) : null  // feedback จาก S2
        ];
        if (!today.length) {
          content.push(h('div', { class: 'empty' }, [h('p', { class: 'empty__title', text: EMPTY_TEXT })]));
        } else {
          var hasPrimary = false;
          today.forEach(function (s) {
            var st = CF.statusOf(s, confirmations, pairing.pairingId, now);
            // ยืนยันช้า: เฉพาะมื้อ "ยังไม่ยืนยัน" ที่ยังอยู่ในช่วง (BR-15 · ✓5 ✗6) · ปุ่มหลักเฉพาะปุ่มแรก
            var button = null;
            if (CF.canConfirmLate(s, today, confirmations, pairing.pairingId, now)) {
              button = hasPrimary ? 'secondary' : 'primary';
              hasPrimary = true;
            }
            content.push(sessionCard(s, namesById, st, button));
          });
        }
        content.push(h('button', { class: 'btn btn--ghost btn--block', type: 'button', onClick: function () { ctx.go('S1'); } }, 'การเชื่อมต่อ'));
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, content));
      }

      function redraw() { draw(); }
      ctx.subscribe(redraw);
      ctx.onCleanup(R.subscribe(redraw));
      draw();
    }
  });
})(window);
