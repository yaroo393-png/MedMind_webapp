/* confirm — ยืนยันการกินยาทั้งมื้อ · "ยังไม่กิน" · สถานะของมื้อ + คำสถานะ (FR-04 · BR-10, 11, 12, 14, 15, 16 · NFR-07)
   ฟังก์ชันล้วน: ไม่แตะ DOM/store/นาฬิกา · รับ now เข้ามา (ADR-02) · คืนรายการใหม่ ไม่แก้ของที่รับมา
   ช่วงเวลา (รอบเตือน, ช่วงยืนยันช้า) มาจาก doseSession ตัวเดียวกับหน้าเตือน (research R-1)
   สัญญา: specs/004-confirm/contracts/confirm-module.md · เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var doseSession = isNode ? require('./doseSession.js') : root && root.MedMind && root.MedMind.doseSession;
  var api = factory(doseSession);
  if (isNode) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.confirm = api; }
})(typeof window !== 'undefined' ? window : null, function (doseSession) {
  'use strict';

  if (!doseSession) throw new Error('confirm needs doseSession.js loaded first');

  var MINUTE = 60 * 1000;
  var ROUND = 5 * MINUTE;    // T, T+5, T+10 (BR-08)
  var WINDOW = 15 * MINUTE;  // ตั้งแต่ T+15 = ยืนยันช้า (BR-15)

  function assertTime(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) throw new TypeError('time must be a finite number (ms)');
  }

  // undefined/null = ไม่มีรายการ · อย่างอื่นที่ไม่ใช่ list = ผิดรูป
  function listOf(list, name) {
    if (list === undefined || list === null) return [];
    if (!Array.isArray(list)) throw new TypeError(name + ' must be an array');
    return list;
  }

  function assertSession(session) {
    if (!session || typeof session.sessionKey !== 'string') throw new TypeError('session needs a sessionKey');
    assertTime(session.at);
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(ms) { var d = new Date(ms); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  function recordOf(confirmations, pairingId, sessionKey) {
    return confirmations.filter(function (c) { return c && c.pairingId === pairingId && c.sessionKey === sessionKey; })[0] || null;
  }

  // สถานะของมื้อ (§5 · BR-14) · ค่าคำนวณ ไม่เก็บ · "ยังไม่ยืนยัน" คงเดิมหลังพ้นช่วงยืนยันช้า
  function statusOf(session, confirmations, pairingId, now) {
    assertSession(session);
    assertTime(now);
    var rec = recordOf(listOf(confirmations, 'confirmations'), pairingId, session.sessionKey);
    if (rec) return { status: rec.confirmedAt >= session.at + WINDOW ? 'TAKEN_LATE' : 'TAKEN', confirmedAt: rec.confirmedAt };
    if (now < session.at) return { status: 'WAITING', confirmedAt: null };
    if (now < session.at + WINDOW) return { status: 'ALERTING', confirmedAt: null };
    return { status: 'UNCONFIRMED', confirmedAt: null };
  }

  // คำตาม BR-14 ตรงตัว · ที่เดียวของทั้งแอป (S3, C3 ใช้ตัวนี้ · architecture §8.1) · ไม่มีคำว่า "ไม่ได้กิน" (BR-13)
  var LABELS = { ALERTING: 'กำลังเตือน', UNCONFIRMED: 'ยังไม่ยืนยัน', WAITING: 'รอถึงเวลา' };
  function statusLabel(status, confirmedAt) {
    if (status === 'TAKEN' || status === 'TAKEN_LATE') {
      assertTime(confirmedAt);
      return (status === 'TAKEN' ? 'กินแล้ว ' : 'กินแล้ว (ยืนยันช้า) ') + hhmm(confirmedAt);
    }
    if (!Object.prototype.hasOwnProperty.call(LABELS, status)) throw new TypeError('unknown status: ' + status);
    return LABELS[status];
  }

  // "กินแล้ว" 1 แตะ = 1 ระเบียนต่อมื้อ (BR-10, BR-12 · NFR-07) · ตรวจตามลำดับ ALREADY → NOT_STARTED → TOO_LATE (research R-1)
  // sessions = มื้อของวันเดียวกัน ใช้หาสิ้นช่วงยืนยันช้า (doseSession.lateUntil · BR-15)
  function confirm(confirmations, session, sessions, pairingId, now) {
    var list = listOf(confirmations, 'confirmations');
    var sameDay = listOf(sessions, 'sessions');
    assertSession(session);
    assertTime(now);
    if (typeof pairingId !== 'string' || pairingId === '') throw new TypeError('pairingId must be a non-empty string');
    if (recordOf(list, pairingId, session.sessionKey)) return { ok: false, reason: 'ALREADY' };
    if (now < session.at) return { ok: false, reason: 'NOT_STARTED' };
    if (now >= doseSession.lateUntil(session, sameDay)) return { ok: false, reason: 'TOO_LATE' };
    var confirmation = { pairingId: pairingId, sessionKey: session.sessionKey, confirmedAt: now };
    return { ok: true, confirmations: list.concat([confirmation]), confirmation: confirmation, late: now >= session.at + WINDOW };
  }

  // ยกเลิกภายใน 10 วินาทีหลังแตะ (BR-10 · R1b) · หน้าจอเป็นคนจับเวลา · ไม่มีระเบียน = รายการเท่าเดิม
  function undoConfirm(confirmations, pairingId, sessionKey) {
    return listOf(confirmations, 'confirmations').filter(function (c) {
      return !(c && c.pairingId === pairingId && c.sessionKey === sessionKey);
    });
  }

  // "ยังไม่กิน" (BR-11): รอบ 1–2 รอรอบถัดไป · รอบ 3 แจ้งผู้ดูแล · hideUntil = เวลาที่มื้อกลับมาบนหน้าเตือน (R4b)
  function notYet(session, now) {
    assertSession(session);
    var round = doseSession.roundAt(session, now);
    if (round === 1 || round === 2) return { action: 'WAIT', hideUntil: session.at + round * ROUND };
    if (round === 3) return { action: 'NOTIFY', hideUntil: session.at + WINDOW };
    return { action: 'NONE' };
  }

  // มื้อบนหน้าเตือนหลังตัดมื้อที่ซ่อน (R4b) · ไม่เหลือมื้อกำลังเตือน = [] (มื้อช่วงยืนยันช้าไม่เปิดหน้าเตือนเอง · clarify 003)
  function visibleDue(due, hidden, now) {
    var list = listOf(due, 'due');
    assertTime(now);
    var until = hidden || {};
    var shown = list.filter(function (d) { return d.late || !(now < until[d.sessionKey]); });
    return shown.some(function (d) { return !d.late; }) ? shown : [];
  }

  // หน้าแรกแสดงปุ่ม "กินแล้ว" เฉพาะมื้อยังไม่ยืนยันที่ยังอยู่ในช่วงยืนยันช้า (BR-15 · ✓5 ✗6)
  function canConfirmLate(session, sessions, confirmations, pairingId, now) {
    return statusOf(session, confirmations, pairingId, now).status === 'UNCONFIRMED' &&
      now < doseSession.lateUntil(session, listOf(sessions, 'sessions'));
  }

  return {
    confirm: confirm,
    undoConfirm: undoConfirm,
    notYet: notYet,
    visibleDue: visibleDue,
    statusOf: statusOf,
    statusLabel: statusLabel,
    canConfirmLate: canConfirmLate
  };
});
