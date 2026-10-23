/* หน้าจอ S2 — หน้าเตือนกินยา: ถึงเวลามื้อ → ยาทั้งมื้อในหน้าเดียว + เสียง · เตือนซ้ำ T+5, T+10 (FR-03 · NFR-01, NFR-03)
   กฎทั้งหมดอยู่ใน src/modules/doseSession.js · หน้านี้อ่าน store อย่างเดียว ไม่เขียน (data-model 003)
   ผู้สูงอายุไม่ต้องกดอะไร: S2 เปิดค้างหลังจับคู่ และวาดใหม่ทุกครั้งที่เวลาจำลอง/ข้อมูลเปลี่ยน (ADR-01, ADR-02)
   เสียงสร้างในหน้า (Web Audio) ไม่มีไฟล์ → ดับเบิลคลิกได้ · เล่นได้หลังแตะหน้าจอครั้งแรก (SRS §2.2)
   กติกาหน้าจอ: draw() เรียกซ้ำได้ · ปุ่มหลัก 1 ปุ่มต่อหน้าจอ · สีจาก token
   สัญญา: specs/003-reminder/contracts/screens.md · เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (window, document) {
  'use strict';

  var MM = window.MedMind || {};
  if (!MM.screens || !MM.pairing || !MM.medication || !MM.doseSession) {
    console.error('[reminder screen] โหลดไม่ครบ — ตรวจลำดับ <script> ใน index.html');
    return;
  }
  var P = MM.pairing;
  var MED = MM.medication;
  var DS = MM.doseSession;
  var h = MM.ui.h;

  var EMPTY_TEXT = 'ยังไม่มียา ให้ผู้ดูแลเพิ่มยา';  // FR-03 ✗5 ตรงตัว
  var ROUND_TEXT = { 1: 'ถึงเวลากินยา', 2: 'เตือนซ้ำครั้งที่ 1', 3: 'เตือนซ้ำครั้งที่ 2' };
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

  // มื้อของเมื่อวาน + วันนี้ (มื้อดึกยังเตือนซ้ำหลังเที่ยงคืน · research R-3)
  function stateOf(app, pairing, now) {
    var meds = MED.medicationsOf(app.store.get('medications', []), pairing.pairingId);
    var mt = app.store.get('mealTimes');
    if (!mt || mt.pairingId !== pairing.pairingId) mt = null;
    var today = DS.sessionsOf(meds, mt, DS.dayOf(now));
    var sessions = DS.sessionsOf(meds, mt, DS.dayOf(now, -1)).concat(today);
    return { meds: meds, today: today, due: DS.dueSessions(sessions, app.store.get('confirmations', []), pairing.pairingId, now) };
  }

  // หน้าอื่นของผู้สูงอายุใช้ตัดสินว่าต้องไป S2 หรือไม่ (S1 สถานะเชื่อมต่อแล้ว · S3 ของ FR-04)
  // คีย์ของรอบที่กำลังเตือน "at#round,…" · ว่าง = ไม่มีมื้อกำลังเตือน · เปลี่ยน = รอบใหม่เริ่ม
  MM.reminder = {
    dueKey: function (app) {
      var pairing = pairOf(app);
      if (!pairing) return '';
      return stateOf(app, pairing, app.clock.now()).due
        .filter(function (d) { return !d.late; })
        .map(function (d) { return d.at + '#' + d.round; }).join(',');
    }
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
    covers: ['FR-03', 'NFR-01', 'NFR-03'],
    isStart: function (app) { return pairOf(app) !== null; },
    render: function (body, ctx) {
      var app = ctx.app;

      // ปุ่มทำงานจริงใน FR-04 (specs/004-confirm) · ตอนนี้ feedback อย่างเดียว ไม่เขียน store (research R-9)
      function notYetAvailable() { ctx.toast('ยังบันทึกไม่ได้ในรุ่นนี้'); }

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
          h('button', { class: 'btn btn--xl btn--block ' + (index === 0 ? 'btn--primary' : 'btn--secondary'), type: 'button', onClick: notYetAvailable }, 'กินแล้ว'),
          h('button', { class: 'btn btn--secondary btn--xl btn--block', type: 'button', onClick: notYetAvailable }, 'ยังไม่กิน')
        ]));
      }

      function nextText(today, now) {
        var next = today.filter(function (s) { return s.at > now; })[0];
        return next ? 'มื้อถัดไป ' + MM.clock.formatTime(next.at) : 'วันนี้ไม่มีมื้อยาแล้ว';
      }

      function draw() {
        var pairing = pairOf(app);
        if (!pairing) { ctx.go('S1'); return; }  // ไม่จับคู่/ถูกยกเลิก (NFR-04 · §8.5)
        var now = app.clock.now();
        var st = stateOf(app, pairing, now);

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
        } else if (!st.today.length) {
          content = [h('div', { class: 'empty' }, [h('p', { class: 'empty__title', text: EMPTY_TEXT })])];
        } else {
          content = [h('div', { class: 'empty' }, [
            h('p', { class: 'empty__title', text: 'ยังไม่ถึงเวลากินยา' }),
            h('p', { text: nextText(st.today, now) })
          ])];
        }
        content.push(h('button', { class: 'btn btn--ghost btn--block', type: 'button', onClick: function () { ctx.go('S1'); } }, 'การเชื่อมต่อ'));
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, content));
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

      ctx.subscribe(draw);
      draw();
    }
  });
})(window, document);
