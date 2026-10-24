// FR-05 escalation — แจ้งผู้ดูแลที่ T+15 · ยืนยันช้า · สถานะรายวัน · ข้อความที่ยังไม่กดดู (✓1 ✗2 ✓3 ✗4 ✓5 ✓6 ✗7 · BR-13, 14, 15, 16 · NFR-01, 04)
// เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · สัญญา: specs/005-status/contracts/escalation-module.md
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const ES = require('../src/modules/escalation.js');
const CF = require('../src/modules/confirm.js');

const MS = 1;
const at = (hh, mm, day) => new Date(2026, 9, day || 24, hh, mm, 0, 0).getTime();
const session = (hhmm, day) => {
  const t = hhmm.split(':').map(Number);
  const d = day || 24;
  return { sessionKey: '2026-10-' + d + '@' + hhmm, at: at(t[0], t[1], d), medicationIds: ['m1'] };
};
const PID = 'P-1';
const S0800 = session('08:00');
const S1200 = session('12:00');
const S1800 = session('18:00');
const DAY = [S0800, S1200, S1800];
const confirmed = (s, time, pairingId) => ({ pairingId: pairingId || PID, sessionKey: s.sessionKey, confirmedAt: time });
const notice = (s, type, sentAt, extra) => Object.assign({ pairingId: PID, sessionKey: s.sessionKey, type, sentAt, seenAt: null }, extra);
const deepFreeze = (o) => { Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };
const NO_WORD = (text) => !text.includes('ไม่ได้กิน');

// ---------- Foundational: addNotice + noticeText (UNCONFIRMED) ----------

test('BR-13: addNotice adds exactly { pairingId, sessionKey, type, sentAt, seenAt: null }', () => {
  const list = ES.addNotice([], S0800, 'UNCONFIRMED', PID, at(8, 15));
  assert.deepEqual(list, [{ pairingId: PID, sessionKey: S0800.sessionKey, type: 'UNCONFIRMED', sentAt: at(8, 15), seenAt: null }]);
});

test('BR-13: the same pairing + session + type again returns the very same list (no second notice)', () => {
  const list = ES.addNotice([], S0800, 'UNCONFIRMED', PID, at(8, 15));
  assert.equal(ES.addNotice(list, S0800, 'UNCONFIRMED', PID, at(8, 20)), list);
});

test('BR-13: another pairing or another type is a different notice', () => {
  const list = ES.addNotice([], S0800, 'UNCONFIRMED', PID, at(8, 15));
  assert.equal(ES.addNotice(list, S0800, 'UNCONFIRMED', 'P-2', at(8, 15)).length, 2);
  assert.equal(ES.addNotice(list, S0800, 'CONFIRMED_LATE', PID, at(8, 40)).length, 2);
});

test('FR-05 ✗2 / BR-13: noticeText of UNCONFIRMED is "ยังไม่ยืนยันการกินยา" (never "ไม่ได้กิน")', () => {
  const text = ES.noticeText(notice(S0800, 'UNCONFIRMED', at(8, 15)), []);
  assert.equal(text, 'ยังไม่ยืนยันการกินยา');
  assert.ok(NO_WORD(text));
});

test('addNotice does not change its input · undefined notices = none', () => {
  const list = deepFreeze([notice(S1200, 'UNCONFIRMED', at(12, 15))]);
  const next = ES.addNotice(list, S0800, 'UNCONFIRMED', PID, at(8, 15));
  assert.equal(list.length, 1);
  assert.equal(next.length, 2);
  assert.equal(ES.addNotice(undefined, S0800, 'UNCONFIRMED', PID, at(8, 15)).length, 1);
});

test('addNotice / noticeText reject bad input with TypeError', () => {
  assert.throws(() => ES.addNotice('x', S0800, 'UNCONFIRMED', PID, at(8, 15)), TypeError);
  assert.throws(() => ES.addNotice([], S0800, 'UNCONFIRMED', PID, '08:15'), TypeError);
  assert.throws(() => ES.addNotice([], S0800, 'MISSED', PID, at(8, 15)), TypeError);
  assert.throws(() => ES.addNotice([], S0800, 'UNCONFIRMED', '', at(8, 15)), TypeError);
  assert.throws(() => ES.addNotice([], {}, 'UNCONFIRMED', PID, at(8, 15)), TypeError);
  assert.throws(() => ES.noticeText({ type: 'MISSED' }, []), TypeError);
});

// ---------- US1: escalate ----------

test('FR-05 ✓1: confirmed at 08:12 → at 08:15 nothing is added (same list)', () => {
  const notices = [];
  assert.equal(ES.escalate(DAY, [confirmed(S0800, at(8, 12))], notices, PID, at(8, 15)), notices);
});

test('FR-05 ✗2 / BR-13 / NFR-01: no confirmation → at 08:15 one UNCONFIRMED notice sent at 08:15', () => {
  const list = ES.escalate(DAY, [], [], PID, at(8, 15));
  assert.deepEqual(list, [notice(S0800, 'UNCONFIRMED', at(8, 15))]);
});

test('NFR-01 boundary: 1 ms before T+15 nothing · at T+15 exactly one notice', () => {
  const none = [];
  assert.equal(ES.escalate(DAY, [], none, PID, at(8, 15) - MS), none);
  assert.equal(ES.escalate(DAY, [], [], PID, at(8, 15)).length, 1);
});

test('R6 / BR-15: notify only until the late window ends (11:59 yes · 12:00 = next session, no)', () => {
  assert.equal(ES.escalate([S0800, S1200], [], [], PID, at(11, 59)).filter((n) => n.sessionKey === S0800.sessionKey).length, 1);
  assert.equal(ES.escalate([S0800, S1200], [], [], PID, at(12, 0)).filter((n) => n.sessionKey === S0800.sessionKey).length, 0);
});

test('NFR-01: a bedtime session 23:50 (yesterday) is notified at 00:05 after midnight', () => {
  const late = session('23:50', 23);
  const list = ES.escalate([late], [], [], PID, at(0, 5, 24));
  assert.deepEqual(list.map((n) => n.sessionKey), [late.sessionKey]);
});

test('R6 boundary: a session with an empty late window (23:50) is notified until the end of its T+15 day, not after', () => {
  const late = session('23:50', 23);
  assert.equal(ES.escalate([late], [], [], PID, at(23, 59, 24)).length, 1);
  assert.equal(ES.escalate([late], [], [], PID, at(0, 0, 25)).length, 0);
});

test('FR-05 ✓5 / BR-11 / BR-13: already notified by "ยังไม่กิน" at 08:10 → nothing new at 08:15', () => {
  const notices = [notice(S0800, 'UNCONFIRMED', at(8, 10))];
  assert.equal(ES.escalate(DAY, [], notices, PID, at(8, 15)), notices);
});

test('BR-13: running escalate 5 times (several pages) keeps one notice per session', () => {
  let list = [];
  [at(8, 15), at(8, 15), at(8, 16), at(8, 30), at(11, 0)].forEach((now) => { list = ES.escalate(DAY, [], list, PID, now); });
  assert.equal(list.length, 1);
  assert.equal(list[0].sentAt, at(8, 15));
});

test('BR-16: sessions 06:45 and 07:00 are notified separately (07:00 and 07:15) · confirming 07:00 does not cover 06:45', () => {
  const A = session('06:45');
  const B = session('07:00');
  let list = ES.escalate([A, B], [], [], PID, at(7, 0));
  assert.deepEqual(list.map((n) => n.sessionKey), [A.sessionKey]);
  list = ES.escalate([A, B], [], list, PID, at(7, 15));
  assert.deepEqual(list.map((n) => n.sessionKey), [A.sessionKey, B.sessionKey]);
  assert.deepEqual(ES.escalate([A, B], [confirmed(B, at(7, 2))], [], PID, at(7, 15)).map((n) => n.sessionKey), [A.sessionKey]);
});

test('clock jump 07:00 → 12:30: the 08:00 session (window ended 12:00) is not notified · 12:00 is', () => {
  const list = ES.escalate(DAY, [], [], PID, at(12, 30));
  assert.deepEqual(list.map((n) => n.sessionKey), [S1200.sessionKey]);
});

test('edge: medication removed before T+15 → the session no longer exists → no notice', () => {
  assert.deepEqual(ES.escalate([S1200], [], [], PID, at(8, 15)), []);
});

test('NFR-04: a confirmation or notice of another pairing does not count for this pairing', () => {
  const list = ES.escalate(DAY, [confirmed(S0800, at(8, 3), 'P-2')], [notice(S0800, 'UNCONFIRMED', at(8, 15), { pairingId: 'P-2' })], PID, at(8, 15));
  assert.equal(list.filter((n) => n.pairingId === PID).length, 1);
});

test('escalate does not change its input · bad input → TypeError', () => {
  const notices = deepFreeze([]);
  ES.escalate(deepFreeze(DAY.slice()), deepFreeze([]), notices, PID, at(8, 15));
  assert.equal(notices.length, 0);
  assert.throws(() => ES.escalate('x', [], [], PID, at(8, 15)), TypeError);
  assert.throws(() => ES.escalate(DAY, [], [], PID, 'now'), TypeError);
});

// ---------- US1: unseen + markSeen (R11 · clarify 24/10) ----------

test('R11: unseen lists this pairing’s notices not yet viewed, newest first', () => {
  const list = [
    notice(S0800, 'UNCONFIRMED', at(8, 15)),
    notice(S1200, 'UNCONFIRMED', at(12, 15)),
    notice(S0800, 'CONFIRMED_LATE', at(8, 40), { seenAt: at(9, 0) }),
    notice(S1800, 'UNCONFIRMED', at(18, 15), { pairingId: 'P-2' })
  ];
  assert.deepEqual(ES.unseen(list, PID).map((n) => n.sessionKey + ' ' + n.type), [S1200.sessionKey + ' UNCONFIRMED', S0800.sessionKey + ' UNCONFIRMED']);
});

test('R11: markSeen stamps only this pairing’s unseen notices · nothing to mark → same list', () => {
  const list = deepFreeze([notice(S0800, 'UNCONFIRMED', at(8, 15)), notice(S0800, 'UNCONFIRMED', at(8, 15), { pairingId: 'P-2' })]);
  const next = ES.markSeen(list, PID, at(9, 0));
  assert.equal(next[0].seenAt, at(9, 0));
  assert.equal(next[1].seenAt, null);
  assert.equal(list[0].seenAt, null);
  assert.equal(ES.markSeen(next, PID, at(9, 5)), next);
  assert.deepEqual(ES.unseen(next, PID), []);
});

// ---------- US2: dailyStatus + noticesOf ----------

test('FR-05 ✓3 / BR-14: dailyStatus at 12:30 shows every session of the day with the BR-14 words', () => {
  const rows = ES.dailyStatus([S1800, S0800, S1200], [confirmed(S0800, at(8, 3))], PID, at(12, 30));
  assert.deepEqual(rows.map((r) => r.sessionKey), [S0800.sessionKey, S1200.sessionKey, S1800.sessionKey]);
  assert.deepEqual(rows.map((r) => r.status), ['TAKEN', 'UNCONFIRMED', 'WAITING']);
  assert.deepEqual(rows.map((r) => r.label), ['กินแล้ว 08:03', 'ยังไม่ยืนยัน', 'รอถึงเวลา']);
  assert.equal(rows[0].confirmedAt, at(8, 3));
  assert.deepEqual(rows[0].medicationIds, ['m1']);
});

test('FR-05 ✓3: late confirmation and alerting read "กินแล้ว (ยืนยันช้า) 08:40" and "กำลังเตือน"', () => {
  const rows = ES.dailyStatus(DAY, [confirmed(S0800, at(8, 40))], PID, at(12, 5));
  assert.deepEqual(rows.map((r) => r.label).slice(0, 2), ['กินแล้ว (ยืนยันช้า) 08:40', 'กำลังเตือน']);
});

test('BR-14: dailyStatus labels are exactly confirm.statusLabel (one place for the words) and never "ไม่ได้กิน"', () => {
  ES.dailyStatus(DAY, [confirmed(S0800, at(8, 3))], PID, at(12, 5)).forEach((r) => {
    assert.equal(r.label, CF.statusLabel(r.status, r.confirmedAt));
    assert.ok(NO_WORD(r.label));
  });
});

test('FR-05 ✗4: no session today → dailyStatus is []', () => {
  assert.deepEqual(ES.dailyStatus([], [], PID, at(9, 0)), []);
  assert.deepEqual(ES.dailyStatus(undefined, undefined, PID, at(9, 0)), []);
});

test('FR-05 ✗7 / NFR-04: a confirmation of another pairing is not shown as taken', () => {
  assert.equal(ES.dailyStatus([S0800], [confirmed(S0800, at(8, 3), 'P-2')], PID, at(9, 0))[0].status, 'UNCONFIRMED');
});

test('R10 / NFR-04: noticesOf = this pairing’s notices sent today, newest first', () => {
  const list = [
    notice(session('21:00', 23), 'UNCONFIRMED', at(21, 15, 23)),
    notice(S0800, 'UNCONFIRMED', at(8, 15)),
    notice(S0800, 'CONFIRMED_LATE', at(8, 40)),
    notice(S1200, 'UNCONFIRMED', at(12, 15), { pairingId: 'P-2' })
  ];
  assert.deepEqual(ES.noticesOf(list, PID, at(13, 0)).map((n) => n.type), ['CONFIRMED_LATE', 'UNCONFIRMED']);
  assert.deepEqual(ES.noticesOf(undefined, PID, at(13, 0)), []);
});

// ---------- US3: ยืนยันช้า ----------

test('FR-05 ✓6 / BR-15: CONFIRMED_LATE reads "ยืนยันการกินยาแล้ว เวลา 08:40" from the confirmation time', () => {
  const n = notice(S0800, 'CONFIRMED_LATE', at(8, 41));
  assert.equal(ES.noticeText(n, [confirmed(S0800, at(8, 40))]), 'ยืนยันการกินยาแล้ว เวลา 08:40');
});

test('BR-15: CONFIRMED_LATE without this pairing’s confirmation reads without a time', () => {
  const n = notice(S0800, 'CONFIRMED_LATE', at(8, 41));
  assert.equal(ES.noticeText(n, [confirmed(S0800, at(8, 40), 'P-2')]), 'ยืนยันการกินยาแล้ว');
  assert.equal(ES.noticeText(n, undefined), 'ยืนยันการกินยาแล้ว');
});

test('FR-05 ✓6: after an UNCONFIRMED notice, CONFIRMED_LATE is still added once', () => {
  let list = [notice(S0800, 'UNCONFIRMED', at(8, 15))];
  list = ES.addNotice(list, S0800, 'CONFIRMED_LATE', PID, at(8, 40));
  assert.deepEqual(list.map((n) => n.type), ['UNCONFIRMED', 'CONFIRMED_LATE']);
  assert.equal(ES.addNotice(list, S0800, 'CONFIRMED_LATE', PID, at(8, 50)), list);
  assert.ok(NO_WORD(ES.noticeText(list[1], [confirmed(S0800, at(8, 40))])));
});
