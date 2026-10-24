/* doseSession — มื้อยาของวัน · รอบเตือน · มื้อที่ต้องเตือน · ช่วงยืนยันช้า · คีย์เสียง (FR-03 · BR-06, 08, 15, 16 · NFR-01)
   ฟังก์ชันล้วน: ไม่แตะ DOM/store/นาฬิกา · รับ now เข้ามา (ADR-02) · คืนรายการใหม่ ไม่แก้ของที่รับมา
   มื้อและรอบเป็นค่าคำนวณ ไม่เก็บ · เวลาเตือนของยามาจาก medication.reminderTimes (FR-02) ไม่คำนวณซ้ำ
   สัญญา: specs/003-reminder/contracts/dose-session.md · เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var medication = isNode ? require('./medication.js') : root && root.MedMind && root.MedMind.medication;
  var api = factory(medication);
  if (isNode) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.doseSession = api; }
})(typeof window !== 'undefined' ? window : null, function (medication) {
  'use strict';

  if (!medication) throw new Error('doseSession needs medication.js loaded first');

  var MINUTE = 60 * 1000;
  var ROUND = 5 * MINUTE;    // T, T+5, T+10 (BR-08)
  var WINDOW = 15 * MINUTE;  // รอบเตือนจบที่ T+15
  var DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

  function assertTime(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) throw new TypeError('time must be a finite number (ms)');
  }

  function assertList(list, name) {
    if (!Array.isArray(list)) throw new TypeError(name + ' must be an array');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function dayOf(ms, offsetDays) {
    assertTime(ms);
    var d = new Date(ms);
    var shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (offsetDays || 0));
    return shifted.getFullYear() + '-' + pad2(shifted.getMonth() + 1) + '-' + pad2(shifted.getDate());
  }

  // ms ของเวลา "HH:MM" ในวัน "YYYY-MM-DD" (เวลาท้องถิ่น)
  function atOf(day, hhmm) {
    var d = DAY.exec(day);
    var t = hhmm.split(':');
    return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[0]), Number(t[1]), 0, 0).getTime();
  }

  function dayKeyOf(session) { return session.sessionKey.split('@')[0]; }

  // ยาเวลาเตือนเดียวกันรวมเป็นมื้อเดียว (BR-06) · ยาที่ไม่มีเวลาเตือน (ข้อมูลไม่พอ) ไม่อยู่ในมื้อใด
  function sessionsOf(medications, mealTimes, day) {
    assertList(medications, 'medications');
    if (typeof day !== 'string' || !DAY.test(day)) throw new TypeError('day must be "YYYY-MM-DD"');
    if (!mealTimes || typeof mealTimes !== 'object') return [];
    var groups = {};
    medications.forEach(function (med) {
      (medication.reminderTimes(med, mealTimes) || []).forEach(function (hhmm) {
        (groups[hhmm] = groups[hhmm] || []).push(med.medicationId);
      });
    });
    return Object.keys(groups).sort().map(function (hhmm) {
      return { sessionKey: day + '@' + hhmm, at: atOf(day, hhmm), medicationIds: groups[hhmm] };
    });
  }

  // 0 ก่อน T · 1/2/3 ช่วง T, T+5, T+10 · null ตั้งแต่ T+15 (เวลาคงที่จาก T · BR-08)
  function roundAt(session, now) {
    assertTime(now);
    var diff = now - session.at;
    if (diff < 0) return 0;
    if (diff >= WINDOW) return null;
    return Math.floor(diff / ROUND) + 1;
  }

  // สิ้นสุดช่วงยืนยันช้า (ไม่รวม): มื้อแรกของวันเดียวกันที่เริ่มหลัง T+15 · ไม่มี = 00:00 วันถัดไป · ไม่น้อยกว่า T+15 (BR-15)
  function lateUntil(session, sessions) {
    var end = session.at + WINDOW;
    var day = dayKeyOf(session);
    var next = null;
    (sessions || []).forEach(function (s) {
      if (dayKeyOf(s) === day && s.at > end && (next === null || s.at < next)) next = s.at;
    });
    if (next === null) next = atOf(dayOf(session.at, 1), '00:00');
    return Math.max(next, end);
  }

  function isConfirmed(confirmations, pairingId, sessionKey) {
    return confirmations.some(function (c) { return c && c.pairingId === pairingId && c.sessionKey === sessionKey; });
  }

  // มื้อที่ยังไม่ยืนยันและอยู่ในรอบ 1–3 · มีอย่างน้อย 1 มื้อ → แสดงมื้อในช่วงยืนยันช้าด้วย (BR-16 · clarify 003 23/10)
  function dueSessions(sessions, confirmations, pairingId, now) {
    assertList(sessions, 'sessions');
    assertTime(now);
    var confirmed = Array.isArray(confirmations) ? confirmations : [];
    var open = sessions.filter(function (s) { return !isConfirmed(confirmed, pairingId, s.sessionKey); });
    var due = [];
    open.forEach(function (s) {
      var round = roundAt(s, now);
      if (round >= 1) due.push({ session: s, round: round, late: false });
    });
    if (!due.length) return [];
    open.forEach(function (s) {
      if (roundAt(s, now) === null && now < lateUntil(s, sessions)) due.push({ session: s, round: null, late: true });
    });
    return due.sort(function (a, b) { return a.session.at - b.session.at; }).map(function (d) {
      return { sessionKey: d.session.sessionKey, at: d.session.at, medicationIds: d.session.medicationIds.slice(), round: d.round, late: d.late };
    });
  }

  // คีย์เสียงใหม่ "at#round" ของมื้อที่กำลังเตือน · 1 ครั้งต่อรอบต่อเวลาเตือน (BR-09, BR-16) · หน้าจอเล่นเสียงครั้งเดียวต่อการวาด
  function newSoundKeys(due, played) {
    var seen = played instanceof Set ? played : new Set(Array.isArray(played) ? played : []);
    var out = [];
    (due || []).forEach(function (d) {
      if (d.late) return;
      var key = d.at + '#' + d.round;
      if (!seen.has(key) && out.indexOf(key) === -1) out.push(key);
    });
    return out;
  }

  return {
    dayOf: dayOf,
    sessionsOf: sessionsOf,
    roundAt: roundAt,
    lateUntil: lateUntil,
    dueSessions: dueSessions,
    newSoundKeys: newSoundKeys
  };
});
