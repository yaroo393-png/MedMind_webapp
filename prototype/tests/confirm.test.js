// FR-04 confirm — "กินแล้ว" ทั้งมื้อ · "ยังไม่กิน" · ยกเลิก 10 วินาที · สถานะ + คำสถานะ (✓1 ✗2 ✓3 ✗4 ✓5 ✗6 · BR-10, 11, 12, 14, 15, 16 · NFR-07)
// เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · สัญญา: specs/004-confirm/contracts/confirm-module.md
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const CF = require('../src/modules/confirm.js');
const DS = require('../src/modules/doseSession.js');

const MS = 1;
const MIN = 60 * 1000;
const at = (hh, mm, day) => new Date(2026, 9, day || 24, hh, mm, 0, 0).getTime();
const session = (hhmm, ids) => {
  const t = hhmm.split(':').map(Number);
  return { sessionKey: '2026-10-24@' + hhmm, at: at(t[0], t[1]), medicationIds: ids || ['m1'] };
};
const PID = 'P-1';
const S0800 = session('08:00', ['m1', 'm2']);
const S1200 = session('12:00');
const SESSIONS = [S0800, S1200];
const record = (s, confirmedAt, pairingId) => ({ pairingId: pairingId || PID, sessionKey: s.sessionKey, confirmedAt });
const deepFreeze = (o) => { Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };

// ---------- Foundational: statusOf + statusLabel (BR-14) ----------

test('BR-14: before T the session is WAITING with no confirmedAt', () => {
  assert.deepEqual(CF.statusOf(S0800, [], PID, at(7, 59)), { status: 'WAITING', confirmedAt: null });
});

test('BR-14: from T until just before T+15 the session is ALERTING', () => {
  assert.equal(CF.statusOf(S0800, [], PID, at(8, 0)).status, 'ALERTING');
  assert.equal(CF.statusOf(S0800, [], PID, at(8, 15) - MS).status, 'ALERTING');
});

test('BR-14: from T+15 without a record the session is UNCONFIRMED, also after the late window', () => {
  assert.deepEqual(CF.statusOf(S0800, [], PID, at(8, 15)), { status: 'UNCONFIRMED', confirmedAt: null });
  assert.equal(CF.statusOf(S0800, [], PID, at(13, 0)).status, 'UNCONFIRMED');
});

test('BR-14: a record before T+15 is TAKEN with its time, whatever the time now', () => {
  assert.deepEqual(CF.statusOf(S0800, [record(S0800, at(8, 3))], PID, at(20, 0)), { status: 'TAKEN', confirmedAt: at(8, 3) });
  assert.equal(CF.statusOf(S0800, [record(S0800, at(8, 15) - MS)], PID, at(9, 0)).status, 'TAKEN');
});

test('BR-14 / BR-15: a record from T+15 is TAKEN_LATE', () => {
  assert.deepEqual(CF.statusOf(S0800, [record(S0800, at(8, 15))], PID, at(9, 0)), { status: 'TAKEN_LATE', confirmedAt: at(8, 15) });
});

test('NFR-04: a record of another pairing does not count', () => {
  assert.equal(CF.statusOf(S0800, [record(S0800, at(8, 3), 'P-2')], PID, at(8, 5)).status, 'ALERTING');
});

test('BR-14: statusLabel gives the exact words of all 5 statuses', () => {
  assert.equal(CF.statusLabel('TAKEN', at(7, 4)), 'กินแล้ว 07:04');
  assert.equal(CF.statusLabel('TAKEN_LATE', at(8, 40)), 'กินแล้ว (ยืนยันช้า) 08:40');
  assert.equal(CF.statusLabel('ALERTING', null), 'กำลังเตือน');
  assert.equal(CF.statusLabel('UNCONFIRMED', null), 'ยังไม่ยืนยัน');
  assert.equal(CF.statusLabel('WAITING', null), 'รอถึงเวลา');
});

test('BR-13 / constitution V: no status label says "ไม่ได้กิน"', () => {
  ['TAKEN', 'TAKEN_LATE', 'ALERTING', 'UNCONFIRMED', 'WAITING'].forEach((s) => {
    assert.ok(!CF.statusLabel(s, at(8, 3)).includes('ไม่ได้กิน'), s);
  });
});

test('statusOf: confirmations undefined or null = no records', () => {
  assert.equal(CF.statusOf(S0800, undefined, PID, at(8, 1)).status, 'ALERTING');
  assert.equal(CF.statusOf(S0800, null, PID, at(8, 1)).status, 'ALERTING');
});

test('statusOf / statusLabel reject bad input with TypeError', () => {
  assert.throws(() => CF.statusOf(S0800, [], PID, '08:00'), TypeError);
  assert.throws(() => CF.statusOf(S0800, 'x', PID, at(8, 0)), TypeError);
  assert.throws(() => CF.statusLabel('EATEN', null), TypeError);
  assert.throws(() => CF.statusLabel('TAKEN', null), TypeError);
});

// ---------- US1: confirm ----------

test('FR-04 ✓1 / BR-10: "กินแล้ว" at 08:03 records the whole session once with the tap time', () => {
  const res = CF.confirm([], S0800, SESSIONS, PID, at(8, 3));
  assert.equal(res.ok, true);
  assert.equal(res.late, false);
  assert.deepEqual(res.confirmations, [{ pairingId: PID, sessionKey: '2026-10-24@08:00', confirmedAt: at(8, 3) }]);
  assert.deepEqual(res.confirmation, res.confirmations[0]);
  assert.deepEqual(Object.keys(res.confirmation).sort(), ['confirmedAt', 'pairingId', 'sessionKey']);
});

test('FR-04 ✓1: after confirming, the session is not due any more (no reminder at 08:05)', () => {
  const res = CF.confirm([], S0800, SESSIONS, PID, at(8, 3));
  assert.deepEqual(DS.dueSessions(SESSIONS, res.confirmations, PID, at(8, 5)), []);
});

test('FR-04 ✗2 / BR-12 / NFR-07: tapping again 5 times gives ALREADY and keeps 1 record with the first time', () => {
  let list = CF.confirm([], S0800, SESSIONS, PID, at(8, 3)).confirmations;
  [at(8, 3), at(8, 4), at(8, 20), at(11, 0), at(12, 30)].forEach((now) => {
    const res = CF.confirm(list, S0800, SESSIONS, PID, now);
    assert.deepEqual(res, { ok: false, reason: 'ALREADY' });
    if (res.ok) list = res.confirmations;
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].confirmedAt, at(8, 3));
});

test('FR-04 ✗2: a record of another pairing with the same sessionKey does not block this pairing', () => {
  const res = CF.confirm([record(S0800, at(8, 1), 'P-2')], S0800, SESSIONS, PID, at(8, 3));
  assert.equal(res.ok, true);
  assert.equal(res.confirmations.length, 2);
});

test('BR-10 boundary: 1 minute before T is NOT_STARTED · at T exactly is on time', () => {
  assert.deepEqual(CF.confirm([], S0800, SESSIONS, PID, at(7, 59)), { ok: false, reason: 'NOT_STARTED' });
  const res = CF.confirm([], S0800, SESSIONS, PID, at(8, 0));
  assert.equal(res.ok, true);
  assert.equal(res.late, false);
});

test('confirm does not change its input', () => {
  const list = deepFreeze([record(S1200, at(12, 1))]);
  const s = deepFreeze(session('08:00'));
  const res = CF.confirm(list, s, deepFreeze([s, session('12:00')]), PID, at(8, 3));
  assert.equal(res.ok, true);
  assert.equal(list.length, 1);
  assert.notEqual(res.confirmations, list);
});

test('confirm: confirmations null = none · bad input → TypeError', () => {
  assert.equal(CF.confirm(null, S0800, SESSIONS, PID, at(8, 3)).ok, true);
  assert.throws(() => CF.confirm('x', S0800, SESSIONS, PID, at(8, 3)), TypeError);
  assert.throws(() => CF.confirm([], S0800, 'x', PID, at(8, 3)), TypeError);
  assert.throws(() => CF.confirm([], S0800, SESSIONS, PID, '08:03'), TypeError);
  assert.throws(() => CF.confirm([], { at: at(8, 0) }, SESSIONS, PID, at(8, 3)), TypeError);
  assert.throws(() => CF.confirm([], S0800, SESSIONS, '', at(8, 3)), TypeError);
});

// ---------- US1: undoConfirm (R1b · analyze 24/10) ----------

test('FR-04 R1b / BR-10: undo right after "กินแล้ว" removes the record and the session is due again', () => {
  const list = CF.confirm([], S0800, SESSIONS, PID, at(8, 3)).confirmations;
  const undone = CF.undoConfirm(list, PID, S0800.sessionKey);
  assert.deepEqual(undone, []);
  assert.equal(CF.statusOf(S0800, undone, PID, at(8, 3)).status, 'ALERTING');
  assert.deepEqual(DS.dueSessions(SESSIONS, undone, PID, at(8, 3)).map((d) => d.sessionKey), [S0800.sessionKey]);
});

test('R1b: undo touches only that pairing and that session', () => {
  const other = [record(S0800, at(8, 1), 'P-2'), record(S1200, at(12, 2))];
  const list = CF.confirm(other, S0800, SESSIONS, PID, at(8, 3)).confirmations;
  assert.deepEqual(CF.undoConfirm(list, PID, S0800.sessionKey), other);
});

test('R1b: undo with no matching record returns an equal list · input not changed', () => {
  const list = deepFreeze([record(S1200, at(12, 2))]);
  assert.deepEqual(CF.undoConfirm(list, PID, S0800.sessionKey), list);
  assert.deepEqual(CF.undoConfirm(undefined, PID, S0800.sessionKey), []);
});

test('R1b: after undo the session can be confirmed again', () => {
  const list = CF.undoConfirm(CF.confirm([], S0800, SESSIONS, PID, at(8, 3)).confirmations, PID, S0800.sessionKey);
  const res = CF.confirm(list, S0800, SESSIONS, PID, at(8, 4));
  assert.equal(res.ok, true);
  assert.equal(res.confirmation.confirmedAt, at(8, 4));
});

// ---------- US2: notYet + visibleDue ----------

test('FR-04 ✓3 / BR-11: "ยังไม่กิน" in round 1 or 2 waits and hides until the next round starts', () => {
  assert.deepEqual(CF.notYet(S0800, at(8, 1)), { action: 'WAIT', hideUntil: at(8, 5) });
  assert.deepEqual(CF.notYet(S0800, at(8, 5) - MS), { action: 'WAIT', hideUntil: at(8, 5) });
  assert.deepEqual(CF.notYet(S0800, at(8, 5)), { action: 'WAIT', hideUntil: at(8, 10) });
  assert.deepEqual(CF.notYet(S0800, at(8, 7)), { action: 'WAIT', hideUntil: at(8, 10) });
});

test('FR-04 ✗4 / BR-11: "ยังไม่กิน" in round 3 notifies the caregiver and hides until T+15', () => {
  assert.deepEqual(CF.notYet(S0800, at(8, 10)), { action: 'NOTIFY', hideUntil: at(8, 15) });
  assert.deepEqual(CF.notYet(S0800, at(8, 14)), { action: 'NOTIFY', hideUntil: at(8, 15) });
});

test('BR-11: outside the reminder rounds "ยังไม่กิน" does nothing', () => {
  assert.deepEqual(CF.notYet(S0800, at(7, 59)), { action: 'NONE' });
  assert.deepEqual(CF.notYet(S0800, at(8, 15)), { action: 'NONE' });
});

test('FR-04 R4b: a hidden session is not shown until hideUntil, then shows again', () => {
  const hidden = { [S0800.sessionKey]: at(8, 5) };
  assert.deepEqual(CF.visibleDue(DS.dueSessions([S0800], [], PID, at(8, 1)), hidden, at(8, 1)), []);
  assert.deepEqual(CF.visibleDue(DS.dueSessions([S0800], [], PID, at(8, 5)), hidden, at(8, 5)).map((d) => d.round), [2]);
});

test('FR-04 R4b / BR-16: hiding A of two alerting sessions keeps B (and a late session) on screen', () => {
  const A = session('08:00');
  const B = session('08:05');
  const late = session('07:50');
  const all = [late, A, B];
  const due = DS.dueSessions(all, [], PID, at(8, 6));
  const shown = CF.visibleDue(due, { [A.sessionKey]: at(8, 10) }, at(8, 6));
  assert.deepEqual(shown.map((d) => d.sessionKey + (d.late ? ' late' : '')), [late.sessionKey + ' late', B.sessionKey]);
});

test('FR-04 R4b: hiding the only alerting session leaves nothing, even with a late session (late never opens the alert)', () => {
  const A = session('07:50');
  const B = session('08:00');
  const all = [A, B, S1200];
  const due = DS.dueSessions(all, [], PID, at(8, 6));
  assert.deepEqual(due.map((d) => d.late), [true, false]);
  assert.deepEqual(CF.visibleDue(due, { [B.sessionKey]: at(8, 10) }, at(8, 6)), []);
});

test('visibleDue: no hidden map = due unchanged · input not changed', () => {
  const due = deepFreeze(DS.dueSessions(SESSIONS, [], PID, at(8, 1)));
  assert.deepEqual(CF.visibleDue(due, undefined, at(8, 1)), due);
  assert.deepEqual(CF.visibleDue([], {}, at(8, 1)), []);
  assert.throws(() => CF.visibleDue(due, {}, 'now'), TypeError);
});

// ---------- US3: ยืนยันช้าจากหน้าแรก ----------

test('FR-04 ✓5 / BR-15: "กินแล้ว" at 08:40 is a late confirmation and reads "กินแล้ว (ยืนยันช้า) 08:40"', () => {
  const res = CF.confirm([], S0800, SESSIONS, PID, at(8, 40));
  assert.equal(res.ok, true);
  assert.equal(res.late, true);
  const st = CF.statusOf(S0800, res.confirmations, PID, at(8, 41));
  assert.deepEqual(st, { status: 'TAKEN_LATE', confirmedAt: at(8, 40) });
  assert.equal(CF.statusLabel(st.status, st.confirmedAt), 'กินแล้ว (ยืนยันช้า) 08:40');
});

test('BR-15 boundary: 1 ms before T+15 is on time · T+15 exactly is late', () => {
  assert.equal(CF.confirm([], S0800, SESSIONS, PID, at(8, 15) - MS).late, false);
  assert.equal(CF.confirm([], S0800, SESSIONS, PID, at(8, 15)).late, true);
});

test('FR-04 ✗6 / BR-15: 11:59 can still confirm · at 12:00 (next session) it is TOO_LATE and stays UNCONFIRMED', () => {
  assert.equal(CF.confirm([], S0800, SESSIONS, PID, at(11, 59)).ok, true);
  const list = [record(S1200, at(12, 1))];
  assert.deepEqual(CF.confirm(list, S0800, SESSIONS, PID, at(12, 0)), { ok: false, reason: 'TOO_LATE' });
  assert.equal(list.length, 1);
  assert.equal(CF.statusOf(S0800, list, PID, at(12, 0)).status, 'UNCONFIRMED');
});

test('BR-15: with no next session the late window ends at midnight (23:59 ok · 00:00 TOO_LATE)', () => {
  assert.equal(CF.confirm([], S0800, [S0800], PID, at(23, 59)).ok, true);
  assert.deepEqual(CF.confirm([], S0800, [S0800], PID, at(0, 0, 25)), { ok: false, reason: 'TOO_LATE' });
});

test('FR-04 ✓5 ✗6: canConfirmLate only for an unconfirmed session inside its late window', () => {
  assert.equal(CF.canConfirmLate(S0800, SESSIONS, [], PID, at(8, 40)), true);
  assert.equal(CF.canConfirmLate(S0800, SESSIONS, [], PID, at(12, 0)), false);
  assert.equal(CF.canConfirmLate(S0800, SESSIONS, [record(S0800, at(8, 3))], PID, at(8, 40)), false);
  assert.equal(CF.canConfirmLate(S0800, SESSIONS, [], PID, at(8, 5)), false);
  assert.equal(CF.canConfirmLate(S0800, SESSIONS, [], PID, at(7, 0)), false);
});
