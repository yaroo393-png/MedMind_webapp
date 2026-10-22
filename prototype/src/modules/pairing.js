/* pairing — กฎการจับคู่ผู้สูงอายุกับผู้ดูแล (FR-01 · BR-01, BR-02, BR-17, BR-18 · NFR-04, NFR-05, NFR-10)
   ฟังก์ชันล้วน: รับ now (ms จาก clock · ADR-02) และ random เข้ามา · ไม่แตะ DOM/store · คืน list/object ใหม่ ไม่แก้ของที่รับมา
   ผิดเงื่อนไข → { ok: false, reason } · เรียกผิดรูปแบบ → TypeError · สัญญา: specs/001-pairing/contracts/pairing-module.md
   เจ้าของ: A (YAR OO) */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.pairing = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var MINUTE = 60 * 1000;
  var INVITE_TTL = 10 * MINUTE;     // BR-01
  var LOCK_LIMIT = 5;               // BR-18
  var LOCK_WINDOW = 10 * MINUTE;    // BR-18
  var LOCK_DURATION = 10 * MINUTE;  // BR-18
  var ID_LENGTH = 8;
  var ID_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';  // ไม่มี 0/o 1/l/i ที่อ่านสับสน

  // ---------- ตรวจรูปแบบการเรียก (ผิด = บั๊กของผู้เรียก → throw) ----------
  function assertTime(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) throw new TypeError('now must be a finite number of milliseconds');
  }
  function assertRandom(random) {
    if (typeof random !== 'function') throw new TypeError('random must be a function returning [0, 1)');
  }
  function assertId(id, name) {
    if (typeof id !== 'string' || id === '') throw new TypeError(name + ' must be a non-empty string');
  }
  function toList(list, name) {
    if (list === undefined || list === null) return [];
    if (!Array.isArray(list)) throw new TypeError(name + ' must be an array');
    return list;
  }

  // ค่าจาก random() ที่เป็น 1 พอดีต้องไม่ล้นช่วง
  function pick(random, size) {
    return Math.min(size - 1, Math.floor(random() * size));
  }

  function randomId(prefix, random) {
    var id = prefix;
    for (var i = 0; i < ID_LENGTH; i++) id += ID_CHARS.charAt(pick(random, ID_CHARS.length));
    return id;
  }

  // ---------- รหัสเครื่อง (ADR-05) ----------
  function ensureDevices(devices, now, random) {
    assertTime(now);
    assertRandom(random);
    var d = devices || {};
    return {
      seniorId: d.seniorId || randomId('S-', random),
      caregiverId: d.caregiverId || randomId('C-', random),
      createdAt: typeof d.createdAt === 'number' ? d.createdAt : now
    };
  }

  // ---------- รหัสเชิญ (BR-01) ----------
  function currentInvite(invites, seniorId) {
    var list = toList(invites, 'invites');
    for (var i = 0; i < list.length; i++) {
      if (list[i].seniorId === seniorId && list[i].usedAt === null) return list[i];
    }
    return null;
  }

  // นาทีที่ 10 พอดี = หมดอายุ
  function isExpired(invite, now) {
    assertTime(now);
    return now >= invite.expiresAt;
  }

  var MAX_CODE_DRAWS = 20;
  var CODE_SPACE = 1000000;

  function assertCode(code) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new TypeError('code must be a string of exactly 6 digits');
  }

  function drawCode(random) {
    var n = String(pick(random, CODE_SPACE));
    while (n.length < 6) n = '0' + n;
    return n;
  }

  function findInvite(list, code) {
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i];
    return null;
  }

  function replaceInvite(list, code, changes) {
    return list.map(function (inv) { return inv.code === code ? Object.assign({}, inv, changes) : inv; });
  }

  // รหัสใหม่ทำให้รหัสที่ยังไม่ใช้ของผู้สูงอายุคนเดิมเป็นโมฆะ (clarify Q4) → ผู้สูงอายุ 1 คนมีรหัสที่ใช้ได้ ≤ 1 รหัส
  function newInvite(invites, seniorId, now, random) {
    assertId(seniorId, 'seniorId');
    assertTime(now);
    assertRandom(random);
    var kept = toList(invites, 'invites').filter(function (inv) {
      return !(inv.seniorId === seniorId && inv.usedAt === null);
    });
    for (var i = 0; i < MAX_CODE_DRAWS; i++) {
      var code = drawCode(random);
      if (findInvite(kept, code)) continue;  // รหัสไม่ซ้ำใน list → pair ค้นได้ไม่เกิน 1 รายการ
      var invite = { code: code, seniorId: seniorId, createdAt: now, expiresAt: now + INVITE_TTL, consentAt: null, usedAt: null };
      return { invite: invite, invites: kept.concat([invite]) };
    }
    throw new Error('could not draw a unique invite code after ' + MAX_CODE_DRAWS + ' tries');
  }

  // ยินยอมผูกกับรหัสนี้ (BR-02 · NFR-05) · ยินยอมซ้ำคงเวลาแรก
  function consent(invites, code, now) {
    assertCode(code);
    assertTime(now);
    var list = toList(invites, 'invites');
    var inv = findInvite(list, code);
    if (!inv) return { ok: false, reason: 'NOT_FOUND' };
    if (isExpired(inv, now)) return { ok: false, reason: 'EXPIRED' };
    if (inv.usedAt !== null) return { ok: false, reason: 'USED' };
    if (inv.consentAt !== null) return { ok: true, invites: list };
    return { ok: true, invites: replaceInvite(list, code, { consentAt: now }) };
  }

  // ---------- ล็อกการเดารหัส (BR-18 · research R-3) ----------
  // L = ครั้งผิดล่าสุด · ล็อกเมื่อมีครั้งผิด ≥ 5 ในช่วง (L − 10 นาที, L] และ now < L + 10 นาที
  // (นับจาก L ไม่ใช่จาก now — ไม่งั้นปลดล็อกก่อนเวลาเมื่อครั้งผิดกระจายในช่วง 10 นาที)
  function lockedUntil(pairAttempts, caregiverId, now) {
    assertTime(now);
    var times = toList(pairAttempts, 'pairAttempts')
      .filter(function (a) { return a.caregiverId === caregiverId; })
      .map(function (a) { return a.failedAt; });
    if (times.length < LOCK_LIMIT) return null;
    var last = Math.max.apply(null, times);
    var inWindow = times.filter(function (t) { return t > last - LOCK_WINDOW && t <= last; }).length;
    var retryAt = last + LOCK_DURATION;
    return inWindow >= LOCK_LIMIT && now < retryAt ? retryAt : null;
  }

  function minutesLeft(retryAt, now) {
    assertTime(retryAt);
    assertTime(now);
    return Math.max(1, Math.ceil((retryAt - now) / MINUTE));
  }

  // ล็อกที่ยังมีผลตอน now มี L > now − 10 นาที และครั้งผิดของมันอยู่ใน (L − 10, L]
  // → ครั้งผิดที่เก่ากว่า 20 นาทีไม่มีผลต่อการตัดสินใดอีก จึงไม่เก็บ (NFR-09 · research R-3)
  function recentAttempts(attempts, now) {
    return attempts.filter(function (a) { return a.failedAt > now - LOCK_WINDOW - LOCK_DURATION; });
  }

  // ---------- จับคู่ (FR-01 ✓3 ✗2 ✗4 ✗5 ✗8) ----------
  // ตรวจตามลำดับ R4 คืนเหตุผลแรกที่ไม่ผ่าน (clarify Q1) · ระหว่างล็อกไม่ดูรหัสเลย
  function rejectReason(inv, pairing, now) {
    if (!inv) return 'NOT_FOUND';
    if (isExpired(inv, now)) return 'EXPIRED';
    if (inv.usedAt !== null) return 'USED';
    if (inv.consentAt === null) return 'NO_CONSENT';
    if (pairing && pairing.seniorId === inv.seniorId) return 'ALREADY_PAIRED';  // BR-02: ผู้ดูแลได้ 1 คน
    return null;
  }

  function pair(state, code, caregiverId, now) {
    assertCode(code);
    assertId(caregiverId, 'caregiverId');
    assertTime(now);
    var s = state || {};
    var invites = toList(s.invites, 'invites');
    var attempts = recentAttempts(toList(s.pairAttempts, 'pairAttempts'), now);

    var lockedRetry = lockedUntil(attempts, caregiverId, now);
    if (lockedRetry !== null) return { ok: false, reason: 'LOCKED', pairAttempts: attempts, retryAt: lockedRetry };

    var inv = findInvite(invites, code);
    var reason = rejectReason(inv, s.pairing, now);
    if (reason) {
      var counted = attempts.concat([{ caregiverId: caregiverId, failedAt: now }]);
      var result = { ok: false, reason: reason, pairAttempts: counted };
      var retryAt = lockedUntil(counted, caregiverId, now);  // ครั้งที่ 5 เริ่มล็อก
      if (retryAt !== null) result.retryAt = retryAt;
      return result;
    }
    return {
      ok: true,
      pairing: {
        pairingId: 'P-' + inv.seniorId + '-' + now,
        seniorId: inv.seniorId,
        caregiverId: caregiverId,
        consentAt: inv.consentAt,
        pairedAt: now
      },
      invites: replaceInvite(invites, code, { usedAt: now }),
      pairAttempts: attempts.filter(function (a) { return a.caregiverId !== caregiverId; })
    };
  }

  // ---------- ยกเลิกการจับคู่ (FR-01 ✗6 · BR-17 · NFR-10) ----------
  // ชุดข้อมูลของ feature อื่นที่ผูก pairingId (architecture §8.2 · §8.5) · mealTimes เป็น object เดียว ที่เหลือเป็น list
  var PAIR_RECORDS = ['mealTimes', 'medications', 'confirmations', 'notices'];

  // คืนชุดข้อมูลใหม่: ไม่มี pairing ของคู่นี้ และไม่มีระเบียนใดที่ pairingId ตรง · ชุดที่ไม่มีอยู่ก็ไม่สร้างขึ้นมา
  function unpair(data, pairingId) {
    assertId(pairingId, 'pairingId');
    var d = data || {};
    var out = {};
    Object.keys(d).forEach(function (key) {
      var value = d[key];
      if (key === 'pairing') {
        if (!(value && value.pairingId === pairingId)) out[key] = value;
      } else if (PAIR_RECORDS.indexOf(key) === -1) {
        out[key] = value;
      } else if (Array.isArray(value)) {
        out[key] = value.filter(function (r) { return !(r && r.pairingId === pairingId); });
      } else if (!(value && value.pairingId === pairingId)) {
        out[key] = value;
      }
    });
    return out;
  }

  // ---------- ข้อความเหตุผล (SC-005) — ✗5 ✗7 ✗8 กำหนดข้อความตรงตัว จึงอยู่ที่นี่เพื่อ test ได้ (research R-6) ----------
  var REASON_TEXT = {
    NOT_FOUND: 'ไม่พบรหัสนี้ กรุณาตรวจรหัสบนโทรศัพท์ของผู้สูงอายุ',
    EXPIRED: 'รหัสนี้หมดอายุแล้ว ให้ผู้สูงอายุกดสร้างรหัสใหม่',
    USED: 'รหัสนี้ถูกใช้แล้ว ให้ผู้สูงอายุกดสร้างรหัสใหม่',
    NO_CONSENT: 'รอผู้สูงอายุกดยินยอมก่อน แล้วลองอีกครั้ง',
    ALREADY_PAIRED: 'ผู้สูงอายุท่านนี้มีผู้ดูแลแล้ว',
    QR_UNREADABLE: 'อ่าน QR ไม่ได้ กรุณาใส่รหัส 6 หลัก'
  };

  function reasonText(reason, minutes) {
    if (reason === 'LOCKED') {
      if (typeof minutes !== 'number' || !(minutes >= 1) || Math.floor(minutes) !== minutes) {
        throw new TypeError('LOCKED needs whole minutes ≥ 1');
      }
      return 'ใส่รหัสผิดหลายครั้ง กรุณารอ ' + minutes + ' นาที';
    }
    if (!Object.prototype.hasOwnProperty.call(REASON_TEXT, reason)) throw new TypeError('unknown reason: ' + reason);
    return REASON_TEXT[reason];
  }

  // ---------- สิทธิ์เข้าถึง (NFR-04 · R7) — หน้าจอทุก FR เรียกก่อนอ่านข้อมูลของคู่ (architecture §8.5) ----------
  function canAccess(pairing, caregiverId) {
    return Boolean(pairing) && typeof caregiverId === 'string' && pairing.caregiverId === caregiverId;
  }

  function isSeniorPaired(pairing, seniorId) {
    return Boolean(pairing) && typeof seniorId === 'string' && pairing.seniorId === seniorId;
  }

  return {
    MINUTE: MINUTE,
    INVITE_TTL: INVITE_TTL,
    LOCK_LIMIT: LOCK_LIMIT,
    LOCK_WINDOW: LOCK_WINDOW,
    LOCK_DURATION: LOCK_DURATION,
    ensureDevices: ensureDevices,
    currentInvite: currentInvite,
    isExpired: isExpired,
    newInvite: newInvite,
    consent: consent,
    pair: pair,
    lockedUntil: lockedUntil,
    minutesLeft: minutesLeft,
    reasonText: reasonText,
    unpair: unpair,
    canAccess: canAccess,
    isSeniorPaired: isSeniorPaired
  };
});
