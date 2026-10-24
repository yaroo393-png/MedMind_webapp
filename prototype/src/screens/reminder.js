/* หน้าจอ S2 — หน้าเตือนกินยา: ถึงเวลามื้อ → ยาทั้งมื้อในหน้าเดียว + เสียง · เตือนซ้ำ T+5, T+10 (FR-03 · NFR-01, NFR-03)
   + ปุ่ม "กินแล้ว"/"ยังไม่กิน" และการยกเลิก 10 วินาที (FR-04 · NFR-02, NFR-07)
   กฎทั้งหมดอยู่ใน src/modules/doseSession.js (FR-03) และ confirm.js (FR-04) · หน้านี้เขียนเฉพาะ confirmations (data-model 004)
   ผู้สูงอายุไม่ต้องกดอะไรเพื่อให้เตือน: หน้าแรก (S3) ส่งมาที่นี่เองเมื่อรอบเตือนใหม่เริ่ม · วาดใหม่ทุกครั้งที่เวลาจำลอง/ข้อมูลเปลี่ยน (ADR-01, ADR-02)
   เสียงสร้างในหน้า (Web Audio) ไม่มีไฟล์ → ดับเบิลคลิกได้ · เล่นได้หลังแตะหน้าจอครั้งแรก (SRS §2.2)
   กติกาหน้าจอ: draw() เรียกซ้ำได้ · reload เฉพาะใน handler · ปุ่มหลัก 1 ปุ่มต่อหน้าจอ · สีจาก token
   สัญญา: specs/003-reminder/contracts/screens.md · specs/004-confirm/contracts/screens.md
   เจ้าของ: C (Takkan Khanlui) · ส่วนปุ่มและการยกเลิก: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (window, document) {
  'use strict';

  var MM = window.MedMind || {};
  if (!MM.screens || !MM.pairing || !MM.medication || !MM.doseSession || !MM.confirm || !MM.escalation) {
    console.error('[reminder screen] โหลดไม่ครบ — ตรวจลำดับ <script> ใน index.html');
    return;
  }
  var P = MM.pairing;
  var MED = MM.medication;
  var DS = MM.doseSession;
  var CF = MM.confirm;
  var h = MM.ui.h;

  var EMPTY_TEXT = 'ยังไม่มียา ให้ผู้ดูแลเพิ่มยา';  // FR-03 ✗5 ตรงตัว
  var ROUND_TEXT = { 1: 'ถึงเวลากินยา', 2: 'เตือนซ้ำครั้งที่ 1', 3: 'เตือนซ้ำครั้งที่ 2' };
  var REASON_TEXT = { ALREADY: 'มื้อนี้ยืนยันแล้ว', TOO_LATE: 'เลยเวลายืนยันมื้อนี้แล้ว', NOT_STARTED: 'ยังไม่ถึงเวลามื้อนี้' };
  var UNDO_MS = 10 * 1000;  // ยกเลิกได้ 10 วินาที นับด้วยเวลาจริง ไม่ใช่นาฬิกาจำลอง (BR-10, BR-11 · research R-8)
  var BEEPS = 3;            // เสียงสั้น 3 จังหวะต่อรอบ
  var BEEP_GAP_S = 0.4;
  var BEEP_LEN_S = 0.3;
  var BEEP_HZ = 880;

  // ---------- เสียง (research R-6, R-7) · อยู่ระดับหน้าเว็บ: แตะครั้งเดียวใช้ได้ทุกหน้าจอ · คีย์ที่เล่นแล้วไม่ซ้ำแม้สลับหน้า ----------
  var audio = { unlocked: false, ctx: null, played: new Set() };

  function unlockAudio() {
    audio.unlocked = true;
    document.removeEventListener('pointerdown', unlockAudio, true);
    document.removeEventListener('keydown', unlockAudio, true);
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;  // เบราว์เซอร์ไม่มีเสียง → เตือนด้วยภาพตามปกติ
    try {
      if (!audio.ctx) audio.ctx = new Ctx();
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
    } catch (err) {
      console.error('[reminder] เปิดเสียงไม่ได้', err);
    }
  }
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);

  function beep() {
    var c = audio.ctx;
    if (!c) return;
    try {
      var t0 = c.currentTime;
      for (var i = 0; i < BEEPS; i++) {
        var start = t0 + i * BEEP_GAP_S;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.frequency.value = BEEP_HZ;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + BEEP_LEN_S);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + BEEP_LEN_S + 0.02);
      }
    } catch (err) {
      console.error('[reminder] เล่นเสียงไม่ได้', err);
    }
  }

  // ---------- ข้อมูลของคู่นี้ → มื้อ (อ่านอย่างเดียว) ----------
  function pairOf(app) {
    var d = app.store.get('devices');
    var pairing = app.store.get('pairing');
    return d && P.isSeniorPaired(pairing, d.seniorId) ? pairing : null;
  }

  function hasScreen(id) {
    return MM.screens.all().some(function (s) { return s.id === id; });
  }

  // ---------- มื้อที่ซ่อนหลัง "ยังไม่กิน" { sessionKey → hideUntil } · อยู่ในหน้าเว็บ ไม่บันทึก (R4b · research R-3) ----------
  var hidden = {};

  // มื้อของเมื่อวาน + วันนี้ (มื้อดึกยังเตือนซ้ำหลังเที่ยงคืน · 003 research R-3) · due = มื้อที่แสดงบนหน้าเตือน (ตัดมื้อที่ซ่อนแล้ว)
  function stateOf(app, pairing, now) {
    var meds = MED.medicationsOf(app.store.get('medications', []), pairing.pairingId);
    var mt = app.store.get('mealTimes');
    if (!mt || mt.pairingId !== pairing.pairingId) mt = null;
    var today = DS.sessionsOf(meds, mt, DS.dayOf(now));
    var sessions = DS.sessionsOf(meds, mt, DS.dayOf(now, -1)).concat(today);
    var due = DS.dueSessions(sessions, app.store.get('confirmations', []), pairing.pairingId, now);
    return { meds: meds, today: today, sessions: sessions, due: CF.visibleDue(due, hidden, now) };
  }

  // คีย์ของรอบที่กำลังเตือน "at#round,…" · ว่าง = ไม่มีมื้อกำลังเตือน · เปลี่ยน = รอบใหม่เริ่ม (S1, S3 ใช้ตัดสินว่าต้องมาหน้านี้)
  function dueKey(app) {
    var pairing = pairOf(app);
    if (!pairing) return '';
    return stateOf(app, pairing, app.clock.now()).due
      .filter(function (d) { return !d.late; })
      .map(function (d) { return d.at + '#' + d.round; }).join(',');
  }

  // ---------- สิ่งที่เปลี่ยนในหน้าเว็บแต่ไม่อยู่ใน store (ซ่อน/ยกเลิก) → ให้หน้าที่เปิดอยู่วาดใหม่ ----------
  var listeners = [];
  function subscribe(fn) {
    listeners.push(fn);
    return function () { var i = listeners.indexOf(fn); if (i !== -1) listeners.splice(i, 1); };
  }
  function changed() {
    listeners.slice().forEach(function (fn) { if (listeners.indexOf(fn) !== -1) fn(); });  // หน้าที่ปิดระหว่างนั้นไม่ถูกเรียก
  }

  // ---------- ยกเลิกได้ 10 วินาที (R1b · research R-8) · เก็บการแตะล่าสุด 1 รายการ ----------
  // commit = สิ่งที่ย้อนไม่ได้ (แจ้งลูกหลาน) ทำเมื่อพ้น 10 วินาที · ปิดหน้าก่อนครบ = ไม่ทำ (spec edge)
  var pending = null;  // { text, undo, commit, timer, banners }

  function settle(which) {
    var p = pending;
    if (!p) return;
    pending = null;
    window.clearTimeout(p.timer);
    p.banners.forEach(function (el) { el.remove(); });
    try {
      if (p[which]) p[which]();
    } catch (err) {
      console.error('[reminder] ' + which + ' failed', err);
    }
  }

  function offerUndo(opts) {
    settle('commit');  // แตะใหม่ → การแตะก่อนหน้ายกเลิกไม่ได้แล้ว
    pending = { text: opts.text, undo: opts.undo, commit: opts.commit || null, banners: [] };
    pending.timer = window.setTimeout(function () { settle('commit'); }, UNDO_MS);
    changed();
  }

  // แถบบนสุดของ S2 และ S3 · ไม่มีอะไรให้ยกเลิก = null
  function undoBanner() {
    if (!pending) return null;
    var p = pending;
    var el = h('div', { class: 'banner banner--info stack', role: 'status' }, [
      h('p', { text: p.text }),
      h('button', {
        class: 'btn btn--secondary btn--block', type: 'button',
        onClick: function () { if (pending === p) settle('undo'); }
      }, 'ยกเลิก')
    ]);
    p.banners.push(el);
    return el;
  }

  // ---------- แจ้งลูกหลานผ่าน FR-05 (004 research R-5 · 005 R-8) · addNotice ซ้ำไม่เพิ่ม (BR-13) ----------
  function notifyCaregiver(ctx, session, type) {
    var app = ctx.app;
    app.store.reload();
    var pairing = pairOf(app);
    if (!pairing) return;  // ยกเลิกการจับคู่ระหว่าง 10 วินาที → ไม่แจ้ง
    var before = app.store.get('notices', []);
    var after = MM.escalation.addNotice(before, session, type, pairing.pairingId, app.clock.now());
    if (after.length !== before.length) app.store.set('notices', after);
    ctx.toast('แจ้งลูกหลานแล้ว', 'success');
  }

  // ---------- "กินแล้ว" (S2 และ S3 ใช้ตัวเดียวกัน) · บันทึกทันทีด้วยเวลาที่แตะ แล้วให้ยกเลิกได้ 10 วินาที (BR-10, BR-12, BR-15) ----------
  function confirmTap(ctx, session) {
    var app = ctx.app;
    app.store.reload();
    var pairing = pairOf(app);
    if (!pairing) { ctx.go('S1'); return; }
    var pairingId = pairing.pairingId;
    var now = app.clock.now();
    var res = CF.confirm(app.store.get('confirmations', []), session, stateOf(app, pairing, now).sessions, pairingId, now);
    if (!res.ok) { ctx.toast(REASON_TEXT[res.reason]); return; }  // ALREADY: แท็บอื่นยืนยันก่อน → ไม่เพิ่มระเบียน (NFR-07)
    app.store.set('confirmations', res.confirmations);
    offerUndo({
      text: 'บันทึกแล้ว: ' + CF.statusLabel(res.late ? 'TAKEN_LATE' : 'TAKEN', now),
      undo: function () {
        app.store.reload();
        var list = app.store.get('confirmations', []);
        var next = CF.undoConfirm(list, pairingId, session.sessionKey);
        if (next.length !== list.length) app.store.set('confirmations', next);
        ctx.toast('ยกเลิกแล้ว');
      },
      // ยืนยันช้า → แจ้งลูกหลานเมื่อพ้นช่วงยกเลิก (BR-15)
      commit: res.late ? function () { notifyCaregiver(ctx, session, 'CONFIRMED_LATE'); } : null
    });
  }

  MM.reminder = {
    dueKey: dueKey,
    subscribe: subscribe,
    offerUndo: offerUndo,
    undoBanner: undoBanner,
    confirmTap: confirmTap
  };

  function medCard(med) {
    return h('div', { class: 'card' }, [
      h('p', { class: 'card__title', text: med.name }),
      h('p', { text: 'ครั้งละ ' + med.tabletsPerDose + ' เม็ด' }),
      med.warnings ? h('p', { text: 'ข้อควรระวัง: ' + med.warnings }) : null,
      med.contraindications ? h('p', { text: 'ข้อห้ามใช้: ' + med.contraindications }) : null
    ]);
  }

  MM.screens.register({
    id: 'S2',
    role: 'senior',
    title: 'หน้าเตือนกินยา',
    covers: ['FR-03', 'FR-04', 'NFR-01', 'NFR-02', 'NFR-03', 'NFR-07'],
    // เปิดหน้าเว็บกลางรอบเตือน → เห็นหน้าเตือนก่อน · ไม่มีรอบเตือน → หน้าแรก (S3) · ไม่มี S3 → หน้านี้ (research R-6)
    isStart: function (app) { return pairOf(app) !== null && (dueKey(app) !== '' || !hasScreen('S3')); },
    render: function (body, ctx) {
      var app = ctx.app;

      // "ยังไม่กิน" (BR-11): ซ่อนมื้อจนรอบถัดไป · รอบ T+10 → แจ้งลูกหลานเมื่อพ้นช่วงยกเลิก ไม่ต้องรอ T+15
      function onNotYet(item) {
        var r = CF.notYet(item, app.clock.now());
        if (r.action === 'NONE') { draw(); return; }  // รอบเตือนจบพอดีระหว่างแตะ → แสดงสถานะล่าสุด
        hidden[item.sessionKey] = r.hideUntil;
        if (r.action === 'WAIT') { draw('จะเตือนอีกครั้ง ' + MM.clock.formatTime(r.hideUntil)); return; }
        offerUndo({
          text: 'จะแจ้งลูกหลานว่ายังไม่ยืนยันการกินยา',
          undo: function () { delete hidden[item.sessionKey]; ctx.toast('ยกเลิกแล้ว'); changed(); },
          commit: function () { notifyCaregiver(ctx, item, 'UNCONFIRMED'); }
        });
      }

      function sessionView(item, index, medsById) {
        var titleId = 's2-session-' + index;
        var meds = item.medicationIds.map(function (id) { return medsById[id]; }).filter(Boolean);
        return h('section', { class: 'session', 'aria-labelledby': titleId }, [
          h('p', { class: 'session-time', id: titleId, text: MM.clock.formatTime(item.at) }),
          item.late
            ? h('p', {}, [h('span', { class: 'status status--unconfirmed', text: 'ยังไม่ยืนยัน' }), ' เลยเวลาแล้ว'])
            : h('p', {}, [h('span', { class: 'status status--alerting', text: 'กำลังเตือน' }), ' ' + ROUND_TEXT[item.round]])
        ].concat(meds.map(medCard)).concat([
          // ปุ่มหลัก 1 ปุ่มต่อหน้าจอ: "กินแล้ว" ของมื้อแรก · มื้ออื่นเป็นปุ่มรองขนาดเดียวกัน (constitution · analyze D1)
          h('button', {
            class: 'btn btn--xl btn--block ' + (index === 0 ? 'btn--primary' : 'btn--secondary'), type: 'button',
            onClick: function () { confirmTap(ctx, item); }
          }, 'กินแล้ว'),
          // มื้อที่เลย T+15 แล้วไม่มี "ยังไม่กิน" (ไม่มีรอบให้รอ · BR-11)
          item.late ? null : h('button', {
            class: 'btn btn--secondary btn--xl btn--block', type: 'button', onClick: function () { onNotYet(item); }
          }, 'ยังไม่กิน')
        ]));
      }

      function nextText(today, now) {
        var next = today.filter(function (s) { return s.at > now; })[0];
        return next ? 'มื้อถัดไป ' + MM.clock.formatTime(next.at) : 'วันนี้ไม่มีมื้อยาแล้ว';
      }

      // notice = feedback ของการแตะ "ยังไม่กิน" · ไม่เหลือมื้อต้องแสดง → หน้าแรกพร้อมข้อความ (R8, R9)
      function draw(notice) {
        var pairing = pairOf(app);
        if (!pairing) { ctx.go('S1'); return; }  // ไม่จับคู่/ถูกยกเลิก (NFR-04 · §8.5)
        var now = app.clock.now();
        var st = stateOf(app, pairing, now);
        if (!st.due.length && hasScreen('S3')) { ctx.go('S3', notice ? { notice: notice } : undefined); return; }
        if (notice) ctx.toast(notice);

        var keys = DS.newSoundKeys(st.due, audio.played);
        keys.forEach(function (k) { audio.played.add(k); });  // จดแม้ยังเล่นไม่ได้ → ไม่เล่นย้อนหลัง
        if (keys.length && audio.unlocked) beep();             // หลายมื้อขึ้นรอบพร้อมกัน = เสียงครั้งเดียว (BR-16)

        var content;
        unlockBanner = null;
        if (st.due.length) {
          var medsById = {};
          st.meds.forEach(function (m) { medsById[m.medicationId] = m; });
          if (!audio.unlocked) unlockBanner = h('div', { class: 'banner banner--warn', role: 'status' }, 'แตะหน้าจอ 1 ครั้งเพื่อเปิดเสียงเตือน');
          content = [unlockBanner].concat(st.due.map(function (item, i) { return sessionView(item, i, medsById); }));
        } else if (!st.today.length) {  // ทางสำรองเมื่อไม่มีหน้าแรก (S3)
          content = [h('div', { class: 'empty' }, [h('p', { class: 'empty__title', text: EMPTY_TEXT })])];
        } else {
          content = [h('div', { class: 'empty' }, [
            h('p', { class: 'empty__title', text: 'ยังไม่ถึงเวลากินยา' }),
            h('p', { text: nextText(st.today, now) })
          ])];
        }
        content.push(h('button', { class: 'btn btn--ghost btn--block', type: 'button', onClick: function () { ctx.go('S1'); } }, 'การเชื่อมต่อ'));
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, [undoBanner()].concat(content)));
      }

      // แตะครั้งแรก → เอา banner "แตะหน้าจอ…" ออกเฉย ๆ ไม่วาดใหม่ (วาดใหม่ตอน pointerdown ทำให้ปุ่มใต้นิ้วหาย และ click ไม่เกิด)
      // ตัวเปิดเสียงระดับหน้าเว็บลงทะเบียนก่อน จึงทำงานก่อนตัวนี้
      var unlockBanner = null;
      function hideUnlockBanner() {
        if (audio.unlocked && unlockBanner) { unlockBanner.remove(); unlockBanner = null; }
      }
      document.addEventListener('pointerdown', hideUnlockBanner, true);
      document.addEventListener('keydown', hideUnlockBanner, true);
      ctx.onCleanup(function () {
        document.removeEventListener('pointerdown', hideUnlockBanner, true);
        document.removeEventListener('keydown', hideUnlockBanner, true);
      });

      function redraw() { draw(); }
      ctx.subscribe(redraw);
      ctx.onCleanup(subscribe(redraw));
      draw();
    }
  });
})(window, document);
