// FR-01 จับคู่ — test ทุก AC (✓1 ✗2 ✓3 ✗4 ✗5 ✗6 ✗8) + ค่าขอบของ BR-01, BR-18 (constitution หลักการ III)
// เจ้าของ: A (YAR OO) · ✗7 อยู่ใน qrScan.test.js
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const P = require('../src/modules/pairing.js');

const T0 = new Date(2026, 9, 22, 8, 0, 0, 0).getTime();
const min = (n) => n * 60 * 1000;
// random ที่ให้ค่าตามลำดับ (วนซ้ำเมื่อหมด) — test กำหนดรหัสที่สุ่มได้
const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };
// random ที่ให้รหัส 6 หลักตามที่ต้องการ เช่น codeRandom('123456')
const codeRandom = (...codes) => seq(...codes.map((c) => (Number(c) + 0.5) / 1e6));

// ---------- Foundational: รหัสเครื่อง · รหัสเชิญที่ยังไม่ใช้ · หมดอายุ ----------
function invite(over) {
  return Object.assign({ code: '123456', seniorId: 'S-a', createdAt: T0, expiresAt: T0 + min(10), consentAt: null, usedAt: null }, over);
}

test('ADR-05: ensureDevices creates random S-/C- device ids (8 chars) on first open, without personal data', () => {
  const d = P.ensureDevices(undefined, T0, seq(0.1, 0.5, 0.9));
  assert.match(d.seniorId, /^S-[a-z0-9]{8}$/);
  assert.match(d.caregiverId, /^C-[a-z0-9]{8}$/);
  assert.equal(d.createdAt, T0);
  assert.deepEqual(Object.keys(d).sort(), ['caregiverId', 'createdAt', 'seniorId']);
});

test('ADR-05: ensureDevices keeps existing ids and only fills the missing one', () => {
  const before = { seniorId: 'S-keepme12', createdAt: T0 - min(5) };
  const d = P.ensureDevices(before, T0, seq(0.3));
  assert.equal(d.seniorId, 'S-keepme12');
  assert.match(d.caregiverId, /^C-[a-z0-9]{8}$/);
  assert.equal(d.createdAt, T0 - min(5));
  assert.deepEqual(before, { seniorId: 'S-keepme12', createdAt: T0 - min(5) }, 'input not mutated');
});

test('ensureDevices rejects a non-number time or a missing random source', () => {
  assert.throws(() => P.ensureDevices(undefined, 'now', Math.random), TypeError);
  assert.throws(() => P.ensureDevices(undefined, T0, undefined), TypeError);
});

test('BR-01: currentInvite is null when there are no invites (empty)', () => {
  assert.equal(P.currentInvite([], 'S-a'), null);
  assert.equal(P.currentInvite(undefined, 'S-a'), null);
});

test('BR-01: currentInvite returns only the unused invite of that senior (used / other senior excluded)', () => {
  const used = invite({ code: '111111', usedAt: T0 });
  const other = invite({ code: '222222', seniorId: 'S-b' });
  const mine = invite({ code: '333333' });
  assert.equal(P.currentInvite([used, other], 'S-a'), null);
  assert.deepEqual(P.currentInvite([used, other, mine], 'S-a'), mine);
});

test('BR-01 boundary: invite is valid 1 ms before 10 minutes and expired at exactly 10 minutes', () => {
  const inv = invite();
  assert.equal(P.isExpired(inv, inv.expiresAt - 1), false);
  assert.equal(P.isExpired(inv, inv.expiresAt), true);
});

// ---------- US1: สร้างรหัส · ยินยอม · จับคู่ ----------
test('FR-01 ✓1 / BR-01: newInvite makes a 6-digit code valid for 10 minutes, not consented and not used', () => {
  const { invite: inv, invites } = P.newInvite([], 'S-a', T0, codeRandom('482913'));
  assert.equal(inv.code, '482913');
  assert.match(inv.code, /^\d{6}$/);
  assert.equal(inv.seniorId, 'S-a');
  assert.equal(inv.createdAt, T0);
  assert.equal(inv.expiresAt, T0 + min(10));
  assert.equal(inv.consentAt, null);
  assert.equal(inv.usedAt, null);
  assert.deepEqual(invites, [inv]);
});

test('FR-01 ✓1 / BR-01 boundary: small random numbers keep leading zeros (000123), random() = 1 stays 6 digits', () => {
  assert.equal(P.newInvite([], 'S-a', T0, () => 0.000123).invite.code, '000123');
  assert.equal(P.newInvite([], 'S-a', T0, () => 0).invite.code, '000000');
  assert.equal(P.newInvite([], 'S-a', T0, () => 1).invite.code, '999999');
});

test('BR-01 / clarify Q4: a new invite voids the senior\'s unused invite; used invites and other seniors\' invites stay', () => {
  const oldUnused = invite({ code: '111111' });
  const oldUsed = invite({ code: '222222', usedAt: T0 });
  const otherSenior = invite({ code: '333333', seniorId: 'S-b' });
  const before = [oldUnused, oldUsed, otherSenior];
  const { invite: inv, invites } = P.newInvite(before, 'S-a', T0 + min(1), codeRandom('444444'));
  assert.deepEqual(invites.map((i) => i.code), ['222222', '333333', '444444']);
  assert.equal(invites.filter((i) => i.seniorId === 'S-a' && i.usedAt === null).length, 1, 'at most 1 usable invite per senior');
  assert.equal(inv.code, '444444');
  assert.equal(before.length, 3, 'input list not mutated');
});

test('BR-01: a random code that already exists is re-drawn so codes stay unique', () => {
  const taken = invite({ code: '555555', seniorId: 'S-b' });
  const { invite: inv } = P.newInvite([taken], 'S-a', T0, codeRandom('555555', '555555', '666666'));
  assert.equal(inv.code, '666666');
});

test('BR-01: newInvite gives up with an error after 20 colliding draws', () => {
  const taken = invite({ code: '555555', seniorId: 'S-b' });
  assert.throws(() => P.newInvite([taken], 'S-a', T0, codeRandom('555555')), /unique/);
});

test('BR-02 / NFR-05: consent stamps consentAt = now; consenting again keeps the first time', () => {
  const r1 = P.consent([invite()], '123456', T0 + min(1));
  assert.equal(r1.ok, true);
  assert.equal(r1.invites[0].consentAt, T0 + min(1));
  const r2 = P.consent(r1.invites, '123456', T0 + min(2));
  assert.equal(r2.invites[0].consentAt, T0 + min(1));
});

test('BR-02: consent is refused for a missing, expired or used code', () => {
  assert.deepEqual(P.consent([invite()], '999999', T0), { ok: false, reason: 'NOT_FOUND' });
  assert.deepEqual(P.consent([invite()], '123456', T0 + min(10)), { ok: false, reason: 'EXPIRED' });
  assert.deepEqual(P.consent([invite({ usedAt: T0 })], '123456', T0), { ok: false, reason: 'USED' });
});

function readyState(over) {
  return Object.assign({ invites: [invite({ consentAt: T0 })], pairing: undefined, pairAttempts: [] }, over);
}

test('FR-01 ✓3: a consented, valid code pairs the caregiver and marks the code used', () => {
  const r = P.pair(readyState(), '123456', 'C-x', T0 + min(2));
  assert.equal(r.ok, true);
  assert.deepEqual(r.pairing, { pairingId: r.pairing.pairingId, seniorId: 'S-a', caregiverId: 'C-x', consentAt: T0, pairedAt: T0 + min(2) });
  assert.equal(typeof r.pairing.pairingId, 'string');
  assert.equal(r.invites[0].usedAt, T0 + min(2));
});

test('FR-01 ✓3 / BR-18: pairing clears that caregiver\'s failed attempts but keeps other caregivers\'', () => {
  const attempts = [{ caregiverId: 'C-x', failedAt: T0 }, { caregiverId: 'C-y', failedAt: T0 }];
  const r = P.pair(readyState({ pairAttempts: attempts }), '123456', 'C-x', T0 + min(1));
  assert.deepEqual(r.pairAttempts, [{ caregiverId: 'C-y', failedAt: T0 }]);
});

test('FR-01 ✗2 / NFR-05: before the senior consents, pairing is refused with NO_CONSENT and counts one failure', () => {
  const state = readyState({ invites: [invite()] });
  const r = P.pair(state, '123456', 'C-x', T0 + min(1));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'NO_CONSENT');
  assert.equal(r.pairing, undefined);
  assert.deepEqual(r.pairAttempts, [{ caregiverId: 'C-x', failedAt: T0 + min(1) }]);
  assert.equal(state.invites[0].usedAt, null, 'invite untouched');
});

test('FR-01: pair refuses a code that is not exactly 6 digits (caller bug, not a counted failure)', () => {
  assert.throws(() => P.pair(readyState(), '12345', 'C-x', T0), TypeError);
  assert.throws(() => P.pair(readyState(), 123456, 'C-x', T0), TypeError);
});

// ---------- สิทธิ์เข้าถึง (NFR-04) — ดึงมาจาก US3 (T027) เพราะหน้าจอ S1/C1 ใช้ตัดสินหน้าแรก ----------
test('NFR-04: canAccess is true only for the paired caregiver', () => {
  const pairing = { pairingId: 'P-1', seniorId: 'S-a', caregiverId: 'C-x', consentAt: T0, pairedAt: T0 };
  assert.equal(P.canAccess(pairing, 'C-x'), true);
  assert.equal(P.canAccess(pairing, 'C-y'), false);
  assert.equal(P.canAccess(undefined, 'C-x'), false);
  assert.equal(P.canAccess(pairing, undefined), false);
});

test('NFR-04: isSeniorPaired is true only for the paired senior', () => {
  const pairing = { pairingId: 'P-1', seniorId: 'S-a', caregiverId: 'C-x', consentAt: T0, pairedAt: T0 };
  assert.equal(P.isSeniorPaired(pairing, 'S-a'), true);
  assert.equal(P.isSeniorPaired(pairing, 'S-b'), false);
  assert.equal(P.isSeniorPaired(null, 'S-a'), false);
});


// ---------- US2: เหตุผลปฏิเสธตามลำดับ R4 (✗4 ✗5) ----------
const PAIRED_TO_OTHER = { pairingId: 'P-old', seniorId: 'S-a', caregiverId: 'C-other', consentAt: T0, pairedAt: T0 };
const reasonOf = (state, code = '123456', now = T0 + min(1)) => P.pair(state, code, 'C-x', now).reason;

test('FR-01 ✗4: an unknown code is refused with NOT_FOUND', () => {
  assert.equal(reasonOf(readyState(), '999999'), 'NOT_FOUND');
});

test('FR-01 ✗4 / BR-01 boundary: a code at exactly 10 minutes is refused with EXPIRED', () => {
  assert.equal(reasonOf(readyState(), '123456', T0 + min(10) - 1), undefined, 'still valid 1 ms before');
  assert.equal(reasonOf(readyState(), '123456', T0 + min(10)), 'EXPIRED');
});

test('FR-01 ✗4 / BR-01: a code can be used once — reusing it is refused with USED', () => {
  const first = P.pair(readyState(), '123456', 'C-x', T0 + min(1));
  const again = P.pair({ invites: first.invites, pairing: undefined, pairAttempts: [] }, '123456', 'C-y', T0 + min(2));
  assert.equal(again.reason, 'USED');
});

test('FR-01 ✗5 / BR-02: a senior who already has a caregiver refuses a second caregiver with ALREADY_PAIRED', () => {
  assert.equal(reasonOf(readyState({ pairing: PAIRED_TO_OTHER })), 'ALREADY_PAIRED');
});

test('SC-005 / clarify Q1: when several checks fail, the first in R4 order wins', () => {
  const t = T0 + min(10);
  assert.equal(reasonOf(readyState({ invites: [invite()] }), '123456', t), 'EXPIRED', 'expired + not consented');
  assert.equal(reasonOf(readyState({ invites: [invite({ consentAt: T0, usedAt: T0 })], pairing: PAIRED_TO_OTHER })), 'USED', 'used + already paired');
  assert.equal(reasonOf(readyState({ invites: [invite()], pairing: PAIRED_TO_OTHER })), 'NO_CONSENT', 'not consented + already paired');
  assert.equal(reasonOf(readyState({ invites: [invite({ consentAt: T0, usedAt: T0 })] }), '123456', t), 'EXPIRED', 'expired + used');
});

test('FR-01 ✗4 ✗5: every refusal creates no pairing and counts exactly one failure', () => {
  const cases = [
    [readyState(), '999999', T0 + min(1)],
    [readyState(), '123456', T0 + min(10)],
    [readyState({ invites: [invite({ consentAt: T0, usedAt: T0 })] }), '123456', T0 + min(1)],
    [readyState({ pairing: PAIRED_TO_OTHER }), '123456', T0 + min(1)]
  ];
  for (const [state, code, now] of cases) {
    const r = P.pair(state, code, 'C-x', now);
    assert.equal(r.ok, false);
    assert.equal(r.pairing, undefined);
    assert.equal(r.pairAttempts.length, 1);
  }
});

test('clarify Q4: after the senior makes a new code, the old code is NOT_FOUND', () => {
  const first = P.newInvite([], 'S-a', T0, codeRandom('111111'));
  const consented = P.consent(first.invites, '111111', T0).invites;
  const second = P.newInvite(consented, 'S-a', T0 + min(1), codeRandom('222222'));
  assert.equal(P.pair({ invites: second.invites, pairAttempts: [] }, '111111', 'C-x', T0 + min(2)).reason, 'NOT_FOUND');
});

// ---------- US2: ล็อก BR-18 (✗8) ----------
// ใส่รหัสที่ไม่มีอยู่ n ครั้ง ห่างกันครั้งละ gap นาที เริ่มที่ start · คืน state ล่าสุด
function failTimes(n, start = T0, gap = 1, caregiverId = 'C-x') {
  let state = readyState();
  let last;
  for (let i = 0; i < n; i++) {
    last = P.pair(state, '999999', caregiverId, start + min(i * gap));
    state = Object.assign({}, state, { pairAttempts: last.pairAttempts });
  }
  return { state, last };
}

test('FR-01 ✗8 / BR-18 boundary: the 4th failure does not lock', () => {
  const { state, last } = failTimes(4);
  assert.equal(last.retryAt, undefined);
  assert.equal(P.lockedUntil(state.pairAttempts, 'C-x', T0 + min(3)), null);
});

test('FR-01 ✗8 / BR-18: the 5th failure reports its own reason and starts a 10-minute lock', () => {
  const { last } = failTimes(5);
  assert.equal(last.reason, 'NOT_FOUND');
  assert.equal(last.retryAt, T0 + min(4) + min(10));
});

test('FR-01 ✗8 / BR-18: while locked, even the correct code is not checked, not counted and not paired', () => {
  const { state } = failTimes(5);
  const r = P.pair(state, '123456', 'C-x', T0 + min(5));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'LOCKED');
  assert.equal(r.retryAt, T0 + min(14));
  assert.equal(r.pairing, undefined);
  assert.equal(r.pairAttempts.length, 5, 'no extra failure while locked');
});

test('FR-01 ✗8 / BR-18 boundary: still locked 1 ms before retryAt, unlocked exactly at retryAt and can pair', () => {
  const { state } = failTimes(5);
  const retryAt = T0 + min(14);
  assert.equal(P.pair(state, '123456', 'C-x', retryAt - 1).reason, 'LOCKED');
  const fresh = Object.assign({}, state, { invites: [invite({ consentAt: T0, expiresAt: retryAt + min(10) })] });
  assert.equal(P.pair(fresh, '123456', 'C-x', retryAt).ok, true);
});

test('BR-18 / research R-3: 4 failures at T0 and the 5th at T0+9 lock until T0+19 (not released at T0+10.5)', () => {
  let state = failTimes(4, T0, 0).state;
  const fifth = P.pair(state, '999999', 'C-x', T0 + min(9));
  assert.equal(fifth.retryAt, T0 + min(19));
  state = Object.assign({}, state, { pairAttempts: fifth.pairAttempts });
  assert.equal(P.lockedUntil(state.pairAttempts, 'C-x', T0 + min(10.5)), T0 + min(19));
  assert.equal(P.pair(state, '123456', 'C-x', T0 + min(10.5)).reason, 'LOCKED');
});

test('BR-18: 5 failures spread over more than 10 minutes do not lock', () => {
  const { last } = failTimes(5, T0, 2.75);  // ครั้งแรกห่างจากครั้งที่ 5 = 11 นาที
  assert.equal(last.retryAt, undefined);
  assert.equal(P.lockedUntil(last.pairAttempts, 'C-x', T0 + min(11)), null);
});

test('BR-18: the lock applies only to that caregiver device', () => {
  const { state } = failTimes(5);
  assert.equal(P.pair(state, '123456', 'C-other', T0 + min(5)).ok, true);
});

test('BR-18: a successful pairing resets that caregiver\'s failure count to 0', () => {
  const { state } = failTimes(3);
  const r = P.pair(state, '123456', 'C-x', T0 + min(3));
  assert.equal(r.ok, true);
  assert.equal(r.pairAttempts.filter((a) => a.caregiverId === 'C-x').length, 0);
});

test('NFR-09 / research R-3: failures that can no longer affect a lock (older than 20 minutes) are dropped', () => {
  const { state } = failTimes(2);  // T0, T0+1
  const kept = P.pair(state, '999999', 'C-x', T0 + min(20));
  assert.deepEqual(kept.pairAttempts.map((a) => a.failedAt), [T0 + min(1), T0 + min(20)], 'exactly 20 minutes old (T0) is dropped, T0+1 kept');
  const r = P.pair(state, '999999', 'C-x', T0 + min(21));
  assert.deepEqual(r.pairAttempts, [{ caregiverId: 'C-x', failedAt: T0 + min(21) }]);
});

test('FR-01 ✗8: minutesLeft rounds up to whole minutes and is at least 1', () => {
  assert.equal(P.minutesLeft(T0 + min(10), T0), 10);
  assert.equal(P.minutesLeft(T0 + min(9.1), T0), 10);
  assert.equal(P.minutesLeft(T0 + 1, T0), 1);
  assert.equal(P.lockedUntil([], 'C-x', T0), null, 'empty list is not locked');
});

// ---------- US2: ข้อความเหตุผล (SC-005) ----------
test('FR-01 ✗5 ✗7 ✗8: reason texts match the acceptance criteria word for word', () => {
  assert.equal(P.reasonText('ALREADY_PAIRED'), 'ผู้สูงอายุท่านนี้มีผู้ดูแลแล้ว');
  assert.equal(P.reasonText('LOCKED', 7), 'ใส่รหัสผิดหลายครั้ง กรุณารอ 7 นาที');
  assert.equal(P.reasonText('QR_UNREADABLE'), 'อ่าน QR ไม่ได้ กรุณาใส่รหัส 6 หลัก');
  assert.match(P.reasonText('NO_CONSENT'), /ยินยอม/);
});

test('SC-005: the 5 refusal reasons of R4 have 5 different messages', () => {
  const texts = ['NOT_FOUND', 'EXPIRED', 'USED', 'NO_CONSENT', 'ALREADY_PAIRED'].map((r) => P.reasonText(r));
  assert.equal(new Set(texts).size, 5);
});

test('reasonText rejects an unknown reason and LOCKED without minutes', () => {
  assert.throws(() => P.reasonText('NOPE'), TypeError);
  assert.throws(() => P.reasonText('LOCKED'), TypeError);
});

// ---------- US3: ยกเลิกการจับคู่ = ลบข้อมูลของคู่ (✗6 · BR-17 · NFR-10) ----------
function pairedData() {
  return {
    devices: { seniorId: 'S-a', caregiverId: 'C-x', createdAt: T0 },
    invites: [invite({ consentAt: T0, usedAt: T0 })],
    pairAttempts: [{ caregiverId: 'C-y', failedAt: T0 }],
    pairing: { pairingId: 'P-1', seniorId: 'S-a', caregiverId: 'C-x', consentAt: T0, pairedAt: T0 },
    mealTimes: { pairingId: 'P-1', breakfast: '08:00', lunch: '12:00', dinner: '18:00', bedtime: '21:00' },
    medications: [{ medicationId: 'm1', pairingId: 'P-1', name: 'ยา A' }, { medicationId: 'm2', pairingId: 'P-other', name: 'ยา B' }],
    confirmations: [{ pairingId: 'P-1', sessionKey: '2026-10-22@08:00', confirmedAt: T0 }],
    notices: [{ pairingId: 'P-1', sessionKey: '2026-10-22@08:00', type: 'UNCONFIRMED', sentAt: T0 }]
  };
}

test('FR-01 ✗6 / NFR-10: unpair removes the pairing and every record of that pair (0 left)', () => {
  const after = P.unpair(pairedData(), 'P-1');
  assert.equal(after.pairing, undefined);
  assert.equal(after.mealTimes, undefined);
  assert.equal(after.medications.filter((m) => m.pairingId === 'P-1').length, 0);
  assert.equal(after.confirmations.length, 0);
  assert.equal(after.notices.length, 0);
});

test('FR-01 ✗6: unpair keeps other pairs\' records, devices, invites and attempts, and does not mutate its input', () => {
  const data = pairedData();
  const snapshot = JSON.parse(JSON.stringify(data));
  const after = P.unpair(data, 'P-1');
  assert.deepEqual(after.medications, [{ medicationId: 'm2', pairingId: 'P-other', name: 'ยา B' }]);
  assert.deepEqual(after.devices, data.devices);
  assert.deepEqual(after.invites, data.invites);
  assert.deepEqual(after.pairAttempts, data.pairAttempts);
  assert.deepEqual(data, snapshot);
});

test('FR-01 ✗6: unpair with a pairingId that does not match changes nothing', () => {
  const data = pairedData();
  assert.deepEqual(P.unpair(data, 'P-nope'), data);
});

test('FR-01 ✗6 (empty): unpair copes with collections that other features have not created yet', () => {
  const data = { devices: { seniorId: 'S-a', caregiverId: 'C-x', createdAt: T0 }, pairing: pairedData().pairing };
  const after = P.unpair(data, 'P-1');
  assert.equal(after.pairing, undefined);
  assert.deepEqual(after.devices, data.devices);
  assert.equal('medications' in after, false);
});

test('SC-003 / NFR-04 / NFR-10: after unpair the former caregiver has no access', () => {
  const data = pairedData();
  assert.equal(P.canAccess(data.pairing, 'C-x'), true);
  const after = P.unpair(data, 'P-1');
  assert.equal(P.canAccess(after.pairing, 'C-x'), false);
  assert.equal(P.isSeniorPaired(after.pairing, 'S-a'), false);
});
