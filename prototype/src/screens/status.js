/* หน้าจอ C3 — สถานะการกินยาวันนี้ของผู้ดูแล + แถบแจ้งบนทุกหน้าผู้ดูแล + ตัวรันการแจ้งตามเวลา (FR-05 · NFR-01, NFR-04)
   กฎอยู่ใน src/modules/escalation.js · สถานะ/คำสถานะมาจาก confirm.js (คำเดียวกับหน้าแรกของผู้สูงอายุ)
   ตัวรันอยู่ระดับหน้าเว็บ ไม่ผูกหน้าจอ: เปิดหน้าไหนของใครก็แจ้งได้ (research R-2) · เขียน notices เฉพาะเมื่อเปลี่ยน + reload ก่อนเขียน
   กติกาหน้าจอ: draw() เรียกซ้ำได้ · ไม่มีปุ่มหลัก (หน้าดูอย่างเดียว) · สีจาก token · ไม่มีคำว่า "ไม่ได้กิน"
   สัญญา: specs/005-status/contracts/screens.md · เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (window, document) {
  'use strict';

  var MM = window.MedMind || {};
  if (!MM.screens || !MM.pairing || !MM.medication || !MM.doseSession || !MM.escalation) {
    console.error('[status screen] โหลดไม่ครบ — ตรวจลำดับ <script> ใน index.html');
    return;
  }
  var P = MM.pairing;
  var MED = MM.medication;
  var DS = MM.doseSession;
  var ES = MM.escalation;
  var h = MM.ui.h;

  var EMPTY_TEXT = 'ยังไม่มีมื้อยาวันนี้';  // FR-05 ✗4 ตรงตัว
  var STATUS_CLASS = {
    TAKEN: 'status--taken', TAKEN_LATE: 'status--taken',
    ALERTING: 'status--alerting', UNCONFIRMED: 'status--unconfirmed', WAITING: 'status--waiting'
  };

  // ผู้ดูแลของเครื่องนี้จับคู่อยู่ (NFR-04 · §8.5)
  function pairOf(app) {
    var d = app.store.get('devices');
    var pairing = app.store.get('pairing');
    return d && P.canAccess(pairing, d.caregiverId) ? pairing : null;
  }

  // มื้อของคู่: วันนี้ + (เมื่อวาน + วันนี้) สำหรับมื้อดึกที่ถึง T+15 หลังเที่ยงคืน
  function mealSessions(app, pairing, now) {
    var meds = MED.medicationsOf(app.store.get('medications', []), pairing.pairingId);
    var mt = app.store.get('mealTimes');
    if (!mt || mt.pairingId !== pairing.pairingId) mt = null;
    var today = DS.sessionsOf(meds, mt, DS.dayOf(now));
    return { meds: meds, today: today, all: DS.sessionsOf(meds, mt, DS.dayOf(now, -1)).concat(today) };
  }

  function sessionTime(sessionKey) { return sessionKey.split('@')[1]; }  // "YYYY-MM-DD@HH:MM" (§8.1)

  function noticeLine(notice, confirmations) {
    return 'มื้อ ' + sessionTime(notice.sessionKey) + ' · ' + ES.noticeText(notice, confirmations);
  }

  // ---------- ตัวรันการแจ้งตามเวลา (BR-13 · NFR-01 · research R-2) ----------
  // คิดจากข้อมูลในหน่วยความจำก่อน · มีข้อความใหม่จึง reload (store เขียนทั้งก้อน แท็บเก่าเขียนทับของใหม่ได้) แล้วคิดซ้ำก่อนเขียน
  function startRunner(app) {
    var busy = false;  // reload/set แจ้งผู้ฟังรวมถึงตัวนี้เอง

    function pending() {
      var pairing = app.store.get('pairing');
      if (!pairing || !pairing.pairingId) return null;
      var now = app.clock.now();
      var notices = app.store.get('notices', []);
      var next = ES.escalate(mealSessions(app, pairing, now).all, app.store.get('confirmations', []), notices, pairing.pairingId, now);
      return next === notices ? null : next;
    }

    function run() {
      if (busy) return;
      busy = true;
      try {
        if (!pending()) return;
        app.store.reload();
        var next = pending();
        if (next) app.store.set('notices', next);
      } catch (err) {
        console.error('[status] escalate failed', err);
      } finally {
        busy = false;
      }
    }

    app.clock.onChange(run);
    app.store.subscribe(run);
    run();
  }

  // shell.js ลงทะเบียน DOMContentLoaded ก่อนไฟล์นี้ → MedMind.app มีแล้วตอนนี้ทำงาน
  document.addEventListener('DOMContentLoaded', function () {
    if (MM.app) startRunner(MM.app);
    else console.error('[status] ไม่พบ MedMind.app — shell ยังไม่เริ่ม');
  });

  // ---------- แถบแจ้งบนทุกหน้าผู้ดูแล (R11 · clarify 24/10) ----------
  // onStatus = อยู่หน้า C3 แล้ว → ปุ่ม "รับทราบ" · หน้าอื่น → "ดูสถานะ" ไป C3 · ไม่มีข้อความที่ยังไม่กด → null
  // ไม่ต้องยืนยันก่อนกด: ข้อความยังอยู่ใน "ข้อความแจ้งวันนี้" บน C3 จึงไม่มีอะไรหาย
  function noticeBanner(ctx, onStatus) {
    var app = ctx.app;
    var pairing = pairOf(app);
    if (!pairing) return null;
    var list = ES.unseen(app.store.get('notices', []), pairing.pairingId);
    if (!list.length) return null;
    var confirmations = app.store.get('confirmations', []);

    function onTap() {
      app.store.reload();
      var p = pairOf(app);
      if (!p) { ctx.go('C1', { notice: 'UNPAIRED' }); return; }
      var before = app.store.get('notices', []);
      var after = ES.markSeen(before, p.pairingId, app.clock.now());
      if (after !== before) app.store.set('notices', after);
      if (!onStatus) ctx.go('C3');
    }

    // role="status" ไม่ใช่ "alert": หน้าผู้ดูแลวาดใหม่ทุกครั้งที่เวลาเปลี่ยน alert จะถูกอ่านซ้ำทุกครั้ง
    return h('div', { class: 'banner banner--warn stack', role: 'status' }, list.map(function (n) {
      return h('p', { text: noticeLine(n, confirmations) });
    }).concat([
      h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: onTap }, onStatus ? 'รับทราบ' : 'ดูสถานะ')
    ]));
  }

  MM.status = { noticeBanner: noticeBanner };

  // ---------- C3 · ผู้ดูแล ----------
  MM.screens.register({
    id: 'C3',
    role: 'caregiver',
    title: 'สถานะการกินยาวันนี้',
    covers: ['FR-05', 'NFR-01', 'NFR-04'],
    isStart: function (app) { return pairOf(app) !== null; },
    render: function (body, ctx) {
      var app = ctx.app;

      function toMedications() {
        return h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { ctx.go('C2'); } }, 'ยาของผู้สูงอายุ');
      }

      function sessionCard(row, namesById) {
        var titleId = 'c3-session-' + row.sessionKey;
        var names = row.medicationIds.map(function (id) { return namesById[id]; }).filter(Boolean);
        return h('section', { class: 'card', 'aria-labelledby': titleId }, [
          h('p', { class: 'session-time', id: titleId, text: MM.clock.formatTime(row.at) }),
          h('p', { class: 'card__title', text: names.join(' · ') }),
          h('p', {}, h('span', { class: 'status ' + STATUS_CLASS[row.status], text: row.label }))
        ]);
      }

      function noticesView(notices, confirmations) {
        if (!notices.length) return null;
        return h('section', { class: 'stack', 'aria-labelledby': 'c3-notices' }, [
          h('h3', { class: 'card__title', id: 'c3-notices', text: 'ข้อความแจ้งวันนี้' })
        ].concat(notices.map(function (n) {
          return h('p', { text: MM.clock.formatTime(n.sentAt) + ' · ' + noticeLine(n, confirmations) });
        })));
      }

      function draw() {
        var pairing = pairOf(app);
        if (!pairing) { ctx.go('C1', { notice: 'UNPAIRED' }); return; }  // ✗7 · NFR-04 · §8.5
        var now = app.clock.now();
        var s = mealSessions(app, pairing, now);
        var confirmations = app.store.get('confirmations', []);
        var rows = ES.dailyStatus(s.today, confirmations, pairing.pairingId, now);
        var namesById = {};
        s.meds.forEach(function (m) { namesById[m.medicationId] = m.name; });

        var content = [noticeBanner(ctx, true)];
        if (!rows.length) {
          content.push(h('div', { class: 'empty' }, [h('p', { class: 'empty__title', text: EMPTY_TEXT })]));
        } else {
          rows.forEach(function (row) { content.push(sessionCard(row, namesById)); });
        }
        content.push(noticesView(ES.noticesOf(app.store.get('notices', []), pairing.pairingId, now), confirmations));
        content.push(toMedications());
        content.push(h('button', { class: 'btn btn--ghost btn--block', type: 'button', onClick: function () { ctx.go('C1'); } }, 'การเชื่อมต่อ'));
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, content));
      }

      ctx.subscribe(draw);
      draw();
    }
  });
})(window, document);
