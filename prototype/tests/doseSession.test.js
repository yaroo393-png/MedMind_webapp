// FR-03 doseSession — มื้อยา · รอบเตือน · มื้อที่ต้องเตือน · ช่วงยืนยันช้า · คีย์เสียง (✓1 ✗2 ✓3 ✗4 ✗5 · BR-06, 08, 15, 16 · NFR-01)
// เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · สัญญา: specs/003-reminder/contracts/dose-session.md
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const DS = require('../src/modules/doseSession.js');

const MIN = 60 * 1000;
const at = (hh, mm, day) => new Date(2026, 9, day || 24, hh, mm, 0, 0).getTime();
const MEALS = { pairingId: 'P-1', breakfast: '08:00', lunch: '12:00', dinner: '18:00', bedtime: '21:00' };
const med = (id, over) => Object.assign({
  medicationId: id, pairingId: 'P-1', name: 'ยา ' + id, tabletsPerDose: 1,
  timing: 'AFTER_MEAL', meals: ['BREAKFAST'], minutesBefore: null, warnings: null, contraindications: null
}, over);
const TODAY = '2026-10-24';
const keyed = (list) => list.map((s) => s.sessionKey + (s.late ? ' late' : ' r' + s.round));

// ---------- dayOf (Foundational) ----------

test('dayOf: local YYYY-MM-DD, offset by whole days across month and year', () => {
  assert.equal(DS.dayOf(at(8, 0)), '2026-10-24');
  assert.equal(DS.dayOf(at(8, 0), -1), '2026-10-23');
  assert.equal(DS.dayOf(new Date(2026, 0, 1, 0, 5).getTime(), -1), '2025-12-31');
  assert.equal(DS.dayOf(new Date(2026, 9, 31, 12, 0).getTime(), 1), '2026-11-01');
});

test('dayOf: 23:59 and 00:00 are different days', () => {
  assert.notEqual(DS.dayOf(at(23, 59)), DS.dayOf(at(0, 0, 25)));
});

test('dayOf rejects a non-number', () => {
  assert.throws(() => DS.dayOf('08:00'), TypeError);
  assert.throws(() => DS.dayOf(NaN), TypeError);
});

// ---------- US1: sessionsOf + dueSessions รอบ 1 + newSoundKeys ----------

test('FR-03 ✓1 / BR-06: two medications at 08:00 become one session with both, in list order', () => {
  const s = DS.sessionsOf([med('m1'), med('m2')], MEALS, TODAY);
  assert.equal(s.length, 1);
  assert.equal(s[0].sessionKey, '2026-10-24@08:00');
  assert.equal(s[0].at, at(8, 0));
  assert.deepEqual(s[0].medicationIds, ['m1', 'm2']);
});

test('BR-06: a morning-and-evening medication is in two sessions, sorted by time', () => {
  const s = DS.sessionsOf([med('m1', { meals: ['DINNER', 'BREAKFAST'] }), med('m2', { timing: 'BEDTIME', meals: [] })], MEALS, TODAY);
  assert.deepEqual(s.map((x) => x.sessionKey), ['2026-10-24@08:00', '2026-10-24@18:00', '2026-10-24@21:00']);
  assert.deepEqual(s[1].medicationIds, ['m1']);
});

test('BR-06: before-meal 15 minutes makes its own session before the meal (06:45 vs 07:00)', () => {
  const mt = Object.assign({}, MEALS, { breakfast: '07:00' });
  const s = DS.sessionsOf([med('a', { timing: 'BEFORE_MEAL', minutesBefore: 15 }), med('b')], mt, TODAY);
  assert.deepEqual(s.map((x) => x.sessionKey), ['2026-10-24@06:45', '2026-10-24@07:00']);
});

test('BR-06: a medication without a reminder time (not enough data) is in no session — never guessed', () => {
  const s = DS.sessionsOf([med('m1', { timing: 'BEFORE_MEAL', minutesBefore: null }), med('m2')], MEALS, TODAY);
  assert.equal(s.length, 1);
  assert.deepEqual(s[0].medicationIds, ['m2']);
});

test('FR-03 ✓1: at 08:00 the 08:00 session is due in round 1 · at 07:59 nothing is due', () => {
  const s = DS.sessionsOf([med('m1'), med('m2')], MEALS, TODAY);
  assert.deepEqual(DS.dueSessions(s, [], 'P-1', at(7, 59)), []);
  const due = DS.dueSessions(s, [], 'P-1', at(8, 0));
  assert.equal(due.length, 1);
  assert.equal(due[0].round, 1);
  assert.equal(due[0].late, false);
  assert.deepEqual(due[0].medicationIds, ['m1', 'm2']);
});

test('FR-03 ✓1 / BR-09: round 1 gives one new sound key', () => {
  const due = DS.dueSessions(DS.sessionsOf([med('m1'), med('m2')], MEALS, TODAY), [], 'P-1', at(8, 0));
  assert.deepEqual(DS.newSoundKeys(due, []), [at(8, 0) + '#1']);
});

test('FR-03 ✗5: no medications or no meal times → no sessions and nothing due at any minute of the day', () => {
  assert.deepEqual(DS.sessionsOf([], MEALS, TODAY), []);
  assert.deepEqual(DS.sessionsOf([med('m1')], undefined, TODAY), []);
  assert.deepEqual(DS.sessionsOf([med('m1')], null, TODAY), []);
  for (let m = 0; m < 24 * 60; m++) {
    assert.deepEqual(DS.dueSessions([], [], 'P-1', at(0, 0) + m * MIN), []);
  }
});

test('sessionsOf and dueSessions do not change their inputs', () => {
  const meds = [med('m1'), med('m2')];
  const copy = JSON.stringify(meds);
  const s = DS.sessionsOf(meds, MEALS, TODAY);
  const sCopy = JSON.stringify(s);
  const due = DS.dueSessions(s, [], 'P-1', at(8, 0));
  due[0].medicationIds.push('x');
  assert.equal(JSON.stringify(meds), copy);
  assert.equal(JSON.stringify(s), sCopy);
});

test('sessionsOf rejects malformed input', () => {
  assert.throws(() => DS.sessionsOf('m1', MEALS, TODAY), TypeError);
  assert.throws(() => DS.sessionsOf([], MEALS, '24/10/2026'), TypeError);
});

// ---------- US2: รอบเตือน T, T+5, T+10 · ยืนยันแล้วไม่เตือน ----------

test('FR-03 ✗2 / NFR-01: every minute from T−1 to T+15 gives rounds 0, 1×5, 2×5, 3×5, then none', () => {
  const s = { sessionKey: '2026-10-24@08:00', at: at(8, 0), medicationIds: ['m1'] };
  const got = [];
  for (let m = -1; m <= 15; m++) got.push(DS.roundAt(s, at(8, 0) + m * MIN));
  assert.deepEqual(got, [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, null]);
});

test('BR-08 boundaries: 1 ms before T+5 is round 1 · T+5 is round 2 · T+10 is round 3 · T+15 is over', () => {
  const s = { sessionKey: '2026-10-24@08:00', at: at(8, 0), medicationIds: ['m1'] };
  assert.equal(DS.roundAt(s, at(8, 5) - 1), 1);
  assert.equal(DS.roundAt(s, at(8, 5)), 2);
  assert.equal(DS.roundAt(s, at(8, 10)), 3);
  assert.equal(DS.roundAt(s, at(8, 15) - 1), 3);
  assert.equal(DS.roundAt(s, at(8, 15)), null);
});

test('FR-03 ✗2: not confirmed → 08:05 and 08:10 are repeat reminders 1 and 2, each with a new sound key', () => {
  const s = DS.sessionsOf([med('m1')], MEALS, TODAY);
  const played = new Set(DS.newSoundKeys(DS.dueSessions(s, [], 'P-1', at(8, 0)), []));
  const d5 = DS.dueSessions(s, [], 'P-1', at(8, 5));
  assert.equal(d5[0].round, 2);
  const k5 = DS.newSoundKeys(d5, played);
  assert.deepEqual(k5, [at(8, 0) + '#2']);
  k5.forEach((k) => played.add(k));
  const d10 = DS.dueSessions(s, [], 'P-1', at(8, 10));
  assert.equal(d10[0].round, 3);
  assert.deepEqual(DS.newSoundKeys(d10, played), [at(8, 0) + '#3']);
});

test('SC-004: redrawing inside the same round gives no new sound key', () => {
  const s = DS.sessionsOf([med('m1')], MEALS, TODAY);
  const played = DS.newSoundKeys(DS.dueSessions(s, [], 'P-1', at(8, 0)), []);
  for (let m = 1; m <= 4; m++) assert.deepEqual(DS.newSoundKeys(DS.dueSessions(s, [], 'P-1', at(8, m)), played), []);
});

test('SC-004: jumping from 07:59 to 08:12 sounds only the current round (3), not the skipped ones', () => {
  const s = DS.sessionsOf([med('m1')], MEALS, TODAY);
  assert.deepEqual(DS.newSoundKeys(DS.dueSessions(s, [], 'P-1', at(8, 12)), []), [at(8, 0) + '#3']);
});

test('FR-03 ✓3: a confirmed session is never due again', () => {
  const s = DS.sessionsOf([med('m1')], MEALS, TODAY);
  const confirmations = [{ pairingId: 'P-1', sessionKey: '2026-10-24@08:00', confirmedAt: at(8, 3) }];
  for (let m = 0; m < 15; m++) assert.deepEqual(DS.dueSessions(s, confirmations, 'P-1', at(8, m)), []);
});

test('FR-03 ✓3 / NFR-04: a confirmation of another pairing does not stop this pairing’s reminder', () => {
  const s = DS.sessionsOf([med('m1')], MEALS, TODAY);
  const other = [{ pairingId: 'P-other', sessionKey: '2026-10-24@08:00', confirmedAt: at(8, 1) }];
  assert.equal(DS.dueSessions(s, other, 'P-1', at(8, 5)).length, 1);
});

test('R-3 / NFR-01: a 23:55 session of yesterday still repeats at 00:00 and 00:05, and is over at 00:10', () => {
  const mt = Object.assign({}, MEALS, { bedtime: '23:55' });
  const meds = [med('m1', { timing: 'BEDTIME', meals: [] })];
  const sessions = DS.sessionsOf(meds, mt, '2026-10-23').concat(DS.sessionsOf(meds, mt, '2026-10-24'));
  assert.deepEqual(keyed(DS.dueSessions(sessions, [], 'P-1', at(0, 0, 24))), ['2026-10-23@23:55 r2']);
  assert.deepEqual(keyed(DS.dueSessions(sessions, [], 'P-1', at(0, 5, 24))), ['2026-10-23@23:55 r3']);
  assert.deepEqual(DS.dueSessions(sessions, [], 'P-1', at(0, 10, 24)), []);
});

test('dueSessions: missing or non-list confirmations mean nothing is confirmed · non-number now is rejected', () => {
  const s = DS.sessionsOf([med('m1')], MEALS, TODAY);
  assert.equal(DS.dueSessions(s, undefined, 'P-1', at(8, 0)).length, 1);
  assert.equal(DS.dueSessions(s, null, 'P-1', at(8, 0)).length, 1);
  assert.throws(() => DS.dueSessions(s, [], 'P-1', '08:00'), TypeError);
  assert.throws(() => DS.dueSessions('s', [], 'P-1', at(8, 0)), TypeError);
});

// ---------- US3: มื้อซ้อน · ช่วงยืนยันช้า ----------

const OVERLAP_MEALS = Object.assign({}, MEALS, { breakfast: '07:00' });
const overlap = () => DS.sessionsOf([med('a', { timing: 'BEFORE_MEAL', minutesBefore: 15 }), med('b')], OVERLAP_MEALS, TODAY);

test('BR-15: lateUntil is the next session of the same day that starts after T+15', () => {
  const s = DS.sessionsOf([med('m1', { meals: ['BREAKFAST', 'LUNCH'] })], MEALS, TODAY);
  assert.equal(DS.lateUntil(s[0], s), at(12, 0));
});

test('BR-15: a session inside T+15 is skipped when finding the end of the late window', () => {
  const s = overlap().concat(DS.sessionsOf([med('c', { meals: ['LUNCH'] })], OVERLAP_MEALS, TODAY));
  assert.equal(DS.lateUntil(s[0], s), at(12, 0));
});

test('BR-15: no later session → the late window ends at 00:00 of the next day (until 23:59)', () => {
  const s = DS.sessionsOf([med('m1', { meals: ['DINNER'] })], MEALS, TODAY);
  assert.equal(DS.lateUntil(s[0], s), at(0, 0, 25));
});

test('BR-15: a 23:55 session has no late window (it ends at T+15)', () => {
  const s = DS.sessionsOf([med('m1', { timing: 'BEDTIME', meals: [] })], Object.assign({}, MEALS, { bedtime: '23:55' }), TODAY);
  assert.equal(DS.lateUntil(s[0], s), at(23, 55) + 15 * MIN);
});

test('BR-15: sessions of another day are not the "next session"', () => {
  const s1 = DS.sessionsOf([med('m1', { meals: ['DINNER'] })], MEALS, '2026-10-23');
  const s2 = DS.sessionsOf([med('m1')], MEALS, TODAY);
  assert.equal(DS.lateUntil(s1[0], s1.concat(s2)), at(0, 0, 24));
});

test('FR-03 ✗4 / BR-16: at 06:59 only A (06:45) is due, in round 3', () => {
  assert.deepEqual(keyed(DS.dueSessions(overlap(), [], 'P-1', at(6, 59))), ['2026-10-24@06:45 r3']);
});

test('FR-03 ✗4 / BR-16 / clarify: at 07:00 A (late window) and B (round 1) are both shown, sorted by time', () => {
  const due = DS.dueSessions(overlap(), [], 'P-1', at(7, 0));
  assert.deepEqual(keyed(due), ['2026-10-24@06:45 late', '2026-10-24@07:00 r1']);
  assert.equal(due[0].round, null);
});

test('FR-03 ✗4 / BR-16: at 07:00 only B makes a sound key (late sessions are silent)', () => {
  const due = DS.dueSessions(overlap(), [], 'P-1', at(7, 0));
  assert.deepEqual(DS.newSoundKeys(due, [at(6, 45) + '#3']), [at(7, 0) + '#1']);
});

test('clarify 23/10: a late-window session alone does not open the reminder (B confirmed, 07:20 → nothing)', () => {
  const conf = [{ pairingId: 'P-1', sessionKey: '2026-10-24@07:00', confirmedAt: at(7, 2) }];
  assert.deepEqual(DS.dueSessions(overlap(), conf, 'P-1', at(7, 20)), []);
});

test('clarify 23/10: a session past its late window is not shown with a new reminder', () => {
  const s = DS.sessionsOf([med('m1', { meals: ['BREAKFAST', 'LUNCH'] })], MEALS, TODAY);
  assert.deepEqual(keyed(DS.dueSessions(s, [], 'P-1', at(12, 0))), ['2026-10-24@12:00 r1']);
  assert.deepEqual(keyed(DS.dueSessions(s, [], 'P-1', at(11, 59))), []);
});

test('BR-16: two sessions at different times reaching a round in the same redraw give two keys (the screen plays once)', () => {
  const mt = Object.assign({}, MEALS, { breakfast: '07:00' });
  const s = DS.sessionsOf([med('a', { timing: 'BEFORE_MEAL', minutesBefore: 5 }), med('b')], mt, TODAY);
  const keys = DS.newSoundKeys(DS.dueSessions(s, [], 'P-1', at(7, 5)), []);
  assert.deepEqual(keys.sort(), [at(6, 55) + '#3', at(7, 0) + '#2'].sort());
});

test('newSoundKeys accepts a Set or an array and never repeats a key', () => {
  const due = DS.dueSessions(DS.sessionsOf([med('m1')], MEALS, TODAY), [], 'P-1', at(8, 0));
  assert.deepEqual(DS.newSoundKeys(due, new Set([at(8, 0) + '#1'])), []);
  assert.deepEqual(DS.newSoundKeys(due.concat(due), undefined), [at(8, 0) + '#1']);
});
