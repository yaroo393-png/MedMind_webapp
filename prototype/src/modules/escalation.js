/* escalation — แจ้งผู้ดูแล · สถานะรายวัน · ข้อความแจ้ง · ข้อความที่ผู้ดูแลยังไม่กดดู (FR-05 · BR-11, 13, 14, 15, 16 · NFR-01, 04)
   ฟังก์ชันล้วน: ไม่แตะ DOM/store/นาฬิกา · รับ now เข้ามา (ADR-02) · คืนรายการใหม่ ไม่แก้ของที่รับมา
   ไม่มีอะไรเปลี่ยน → คืนรายการเดิม (ตัวเดิม) ให้หน้าจอเขียน store เฉพาะเมื่อเปลี่ยน · ทุกหน้ารันซ้ำได้ไม่เพิ่ม (ADR-06 · §8.4)
   ช่วงเวลามาจาก doseSession · สถานะ/คำสถานะมาจาก confirm (ที่เดียวของทั้งแอป · architecture §8.1)
   สัญญา: specs/005-status/contracts/escalation-module.md · เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var MM = root && root.MedMind;
  var doseSession = isNode ? require('./doseSession.js') : MM && MM.doseSession;
  var confirm = isNode ? require('./confirm.js') : MM && MM.confirm;
  var api = factory(doseSession, confirm);
  if (isNode) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.escalation = api; }
})(typeof window !== 'undefined' ? window : null, function (doseSession, confirm) {
  'use strict';

  if (!doseSession || !confirm) throw new Error('escalation needs doseSession.js and confirm.js loaded first');

  var WINDOW = 15 * 60 * 1000;  // T+15 = แจ้งผู้ดูแล (BR-13)
  var TYPES = ['UNCONFIRMED', 'CONFIRMED_LATE'];

  function assertTime(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) throw new TypeError('time must be a finite number (ms)');
  }

  // undefined/null = ไม่มีรายการ · อย่างอื่นที่ไม่ใช่ list = ผิดรูป
  function listOf(list, name) {
    if (list === undefined || list === null) return [];
    if (!Array.isArray(list)) throw new TypeError(name + ' must be an array');
    return list;
  }

  function assertType(type) {
    if (TYPES.indexOf(type) === -1) throw new TypeError('notice type must be UNCONFIRMED or CONFIRMED_LATE');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(ms) { var d = new Date(ms); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  function confirmationOf(confirmations, pairingId, sessionKey) {
    return confirmations.filter(function (c) { return c && c.pairingId === pairingId && c.sessionKey === sessionKey; })[0] || null;
  }

  // ล่าสุดก่อน · เวลาเท่ากัน → ที่เพิ่มทีหลังก่อน
  function newestFirst(list) {
    return list.map(function (n, i) { return { n: n, i: i }; })
      .sort(function (a, b) { return (b.n.sentAt - a.n.sentAt) || (b.i - a.i); })
      .map(function (x) { return x.n; });
  }

  // 1 รายการต่อ (คู่, มื้อ, ชนิด) · มีแล้ว → คืนรายการเดิม (ตัวเดิม) (BR-13 · ✓5)
  function addNotice(notices, session, type, pairingId, now) {
    var list = listOf(notices, 'notices');
    if (!session || typeof session.sessionKey !== 'string') throw new TypeError('session needs a sessionKey');
    assertType(type);
    if (typeof pairingId !== 'string' || pairingId === '') throw new TypeError('pairingId must be a non-empty string');
    assertTime(now);
    var exists = list.some(function (n) { return n && n.pairingId === pairingId && n.sessionKey === session.sessionKey && n.type === type; });
    if (exists) return list;
    return list.concat([{ pairingId: pairingId, sessionKey: session.sessionKey, type: type, sentAt: now, seenAt: null }]);
  }

  // แจ้ง "ยังไม่ยืนยัน" ได้จนสิ้นช่วงยืนยันช้า · มื้อที่ช่วงนั้นว่าง (เช่น 23:50 → T+15 = 00:05 = lateUntil) แจ้งได้จนจบวันของ T+15
  function notifyUntil(session, sessions) {
    var end = doseSession.lateUntil(session, sessions);
    if (end > session.at + WINDOW) return end;
    var d = new Date(session.at + WINDOW);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  }

  // ถึง T+15 แล้วยังไม่ยืนยัน → "ยังไม่ยืนยัน" · ไม่แจ้งย้อนหลังหลังพ้นช่วง (BR-13, 15, 16 · research R-1)
  // sessions = มื้อของเมื่อวาน + วันนี้ (มื้อดึกถึง T+15 หลังเที่ยงคืน)
  function escalate(sessions, confirmations, notices, pairingId, now) {
    var all = listOf(sessions, 'sessions');
    var confirmed = listOf(confirmations, 'confirmations');
    var out = listOf(notices, 'notices');
    assertTime(now);
    all.forEach(function (s) {
      if (now < s.at + WINDOW || now >= notifyUntil(s, all)) return;
      if (confirmationOf(confirmed, pairingId, s.sessionKey)) return;
      out = addNotice(out, s, 'UNCONFIRMED', pairingId, now);
    });
    return out;
  }

  // ข้อความถึงผู้ดูแล (BR-13, BR-15) · ไม่มีคำว่า "ไม่ได้กิน" · เวลาของการยืนยันช้ามาจากบันทึกยืนยัน (research R-4)
  function noticeText(notice, confirmations) {
    assertType(notice && notice.type);
    if (notice.type === 'UNCONFIRMED') return 'ยังไม่ยืนยันการกินยา';
    var rec = confirmationOf(listOf(confirmations, 'confirmations'), notice.pairingId, notice.sessionKey);
    return rec ? 'ยืนยันการกินยาแล้ว เวลา ' + hhmm(rec.confirmedAt) : 'ยืนยันการกินยาแล้ว';
  }

  // ทุกมื้อของวันพร้อมสถานะ + คำ BR-14 (ใช้ confirm · คำเดียวกับหน้าแรกของผู้สูงอายุ)
  function dailyStatus(sessions, confirmations, pairingId, now) {
    var list = listOf(sessions, 'sessions');
    assertTime(now);
    return list.slice().sort(function (a, b) { return a.at - b.at; }).map(function (s) {
      var st = confirm.statusOf(s, confirmations, pairingId, now);
      return {
        sessionKey: s.sessionKey, at: s.at, medicationIds: s.medicationIds.slice(),
        status: st.status, confirmedAt: st.confirmedAt, label: confirm.statusLabel(st.status, st.confirmedAt)
      };
    });
  }

  // ข้อความของวันนี้ของคู่นี้ ล่าสุดก่อน (R10 · NFR-04)
  function noticesOf(notices, pairingId, now) {
    var today = doseSession.dayOf(now);
    return newestFirst(listOf(notices, 'notices').filter(function (n) {
      return n && n.pairingId === pairingId && doseSession.dayOf(n.sentAt) === today;
    }));
  }

  // ผู้ดูแลยังไม่กด "ดูสถานะ"/"รับทราบ" → แถบค้าง (R11 · clarify 24/10)
  function unseen(notices, pairingId) {
    return newestFirst(listOf(notices, 'notices').filter(function (n) {
      return n && n.pairingId === pairingId && (n.seenAt === null || n.seenAt === undefined);
    }));
  }

  function markSeen(notices, pairingId, now) {
    var list = listOf(notices, 'notices');
    assertTime(now);
    if (!unseen(list, pairingId).length) return list;
    return list.map(function (n) {
      if (!n || n.pairingId !== pairingId || (n.seenAt !== null && n.seenAt !== undefined)) return n;
      return { pairingId: n.pairingId, sessionKey: n.sessionKey, type: n.type, sentAt: n.sentAt, seenAt: now };
    });
  }

  return {
    addNotice: addNotice,
    escalate: escalate,
    noticeText: noticeText,
    dailyStatus: dailyStatus,
    noticesOf: noticesOf,
    unseen: unseen,
    markSeen: markSeen
  };
});
