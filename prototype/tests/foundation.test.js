// Foundation — test ของ core ที่ทุก FR ใช้ร่วม (นาฬิกาจำลองรองรับ NFR-01 · store รองรับ NFR-09/10 reset)
// เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 22/10/69
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { createClock, formatTime, atTime, MINUTE } = require('../src/core/clock.js');
const { createStore, createMemoryStorage } = require('../src/core/store.js');
const { createEventBus } = require('../src/core/events.js');

const AT_0800 = new Date(2026, 9, 22, 8, 0, 0, 0).getTime();

// ---------- clock ----------
test('clock: now() returns the start time until moved', () => {
  const clock = createClock(AT_0800);
  assert.equal(clock.now(), AT_0800);
});

test('clock: advance(5) moves exactly 5 minutes and notifies listeners once', () => {
  const clock = createClock(AT_0800);
  const seen = [];
  clock.onChange((ms) => seen.push(ms));
  clock.advance(5);
  assert.equal(clock.now(), AT_0800 + 5 * MINUTE);
  assert.deepEqual(seen, [AT_0800 + 5 * MINUTE]);
});

test('clock: advance(0) and set(same time) do not notify (no duplicate reminder ticks)', () => {
  const clock = createClock(AT_0800);
  let calls = 0;
  clock.onChange(() => { calls += 1; });
  clock.advance(0);
  clock.set(AT_0800);
  assert.equal(calls, 0);
});

test('clock: refuses to move backwards so reminder rules cannot fire twice', () => {
  const clock = createClock(AT_0800);
  assert.throws(() => clock.set(AT_0800 - MINUTE), RangeError);
  assert.throws(() => clock.advance(-1), RangeError);
  assert.equal(clock.now(), AT_0800);
});

test('clock: rejects non-numeric times', () => {
  assert.throws(() => createClock('08:00'), TypeError);
  assert.throws(() => createClock(NaN), TypeError);
  assert.throws(() => createClock(AT_0800).advance(Infinity), RangeError);
});

test('clock: a removed listener is no longer called', () => {
  const clock = createClock(AT_0800);
  let calls = 0;
  const off = clock.onChange(() => { calls += 1; });
  off();
  clock.advance(1);
  assert.equal(calls, 0);
});

test('formatTime: pads hours and minutes to HH:MM', () => {
  assert.equal(formatTime(new Date(2026, 9, 22, 7, 5).getTime()), '07:05');
  assert.equal(formatTime(new Date(2026, 9, 22, 23, 59).getTime()), '23:59');
});

test('atTime: returns the given HH:MM on the same day', () => {
  assert.equal(atTime(AT_0800, '06:30'), new Date(2026, 9, 22, 6, 30).getTime());
  assert.equal(atTime(AT_0800, '00:00'), new Date(2026, 9, 22, 0, 0).getTime());
  assert.equal(atTime(AT_0800, '23:59'), new Date(2026, 9, 22, 23, 59).getTime());
});

test('atTime: invalid or empty time returns null instead of guessing (BR-06)', () => {
  assert.equal(atTime(AT_0800, ''), null);
  assert.equal(atTime(AT_0800, '24:00'), null);
  assert.equal(atTime(AT_0800, '7:00'), null);
  assert.equal(atTime(AT_0800, '07:60'), null);
  assert.equal(atTime(AT_0800, undefined), null);
});

// ---------- store ----------
test('store: get() of a missing collection returns the fallback', () => {
  const store = createStore();
  assert.equal(store.get('medications'), undefined);
  assert.deepEqual(store.get('medications', []), []);
});

test('store: set() then get() returns an equal copy, not the same object', () => {
  const store = createStore();
  const meds = [{ name: 'A' }];
  store.set('medications', meds);
  const read = store.get('medications');
  assert.deepEqual(read, meds);
  read[0].name = 'changed';
  meds.push({ name: 'B' });
  assert.deepEqual(store.get('medications'), [{ name: 'A' }]);
});

test('store: update() receives the current value and saves the returned one', () => {
  const store = createStore();
  store.update('doses', (list) => list.concat({ id: 1 }), []);
  store.update('doses', (list) => list.concat({ id: 2 }), []);
  assert.deepEqual(store.get('doses'), [{ id: 1 }, { id: 2 }]);
});

test('store: subscribers hear the collection name that changed', () => {
  const store = createStore();
  const names = [];
  store.subscribe((name) => names.push(name));
  store.set('pairing', { status: 'paired' });
  store.remove('pairing');
  store.reset();
  assert.deepEqual(names, ['pairing', 'pairing', null]);
});

test('store: data survives a new store on the same storage (page reload)', () => {
  const storage = createMemoryStorage();
  createStore({ storage }).set('medications', [{ name: 'A' }]);
  assert.deepEqual(createStore({ storage }).get('medications'), [{ name: 'A' }]);
});

test('store: reset() deletes everything from storage (NFR-10 · ลบข้อมูลได้)', () => {
  const storage = createMemoryStorage();
  const store = createStore({ storage });
  store.set('medications', [{ name: 'A' }]);
  store.reset();
  assert.equal(store.get('medications'), undefined);
  assert.equal(storage.getItem(store.key), null);
});

test('store: corrupt stored data starts empty and reports instead of crashing', () => {
  const storage = createMemoryStorage();
  storage.setItem('medmind.v2', '{not json');
  const errors = [];
  const store = createStore({ storage, onError: (e) => errors.push(e) });
  assert.equal(store.get('medications'), undefined);
  assert.equal(errors.length, 1);
});

test('store: a storage that throws (private mode) still works in memory for this page', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const errors = [];
  const store = createStore({ storage: broken, onError: (e) => errors.push(e) });
  store.set('pairing', { status: 'paired' });
  assert.deepEqual(store.get('pairing'), { status: 'paired' });
  assert.ok(errors.length >= 1);
});

test('store: reload() picks up changes written by another tab', () => {
  const storage = createMemoryStorage();
  const tabA = createStore({ storage });
  const tabB = createStore({ storage });
  tabA.set('pairing', { status: 'paired' });
  assert.equal(tabB.get('pairing'), undefined);
  tabB.reload();
  assert.deepEqual(tabB.get('pairing'), { status: 'paired' });
});

test('store: rejects empty names and undefined values', () => {
  const store = createStore();
  assert.throws(() => store.get(''), TypeError);
  assert.throws(() => store.set('x', undefined), TypeError);
  assert.throws(() => store.update('x', 'not a function'), TypeError);
});

// ---------- events ----------
test('events: emit() delivers the payload to every listener of that type only', () => {
  const bus = createEventBus();
  const got = [];
  bus.on('dose:confirmed', (p) => got.push(['a', p]));
  bus.on('dose:confirmed', (p) => got.push(['b', p]));
  bus.on('other', () => got.push(['wrong']));
  assert.equal(bus.emit('dose:confirmed', { id: 7 }), 2);
  assert.deepEqual(got, [['a', { id: 7 }], ['b', { id: 7 }]]);
});

test('events: emit() with no listeners returns 0', () => {
  assert.equal(createEventBus().emit('nobody'), 0);
});

test('events: one failing listener does not stop the others', () => {
  const errors = [];
  const bus = createEventBus((err) => errors.push(err));
  let reached = false;
  bus.on('x', () => { throw new Error('boom'); });
  bus.on('x', () => { reached = true; });
  bus.emit('x');
  assert.equal(reached, true);
  assert.equal(errors.length, 1);
});

test('events: off() stops delivery', () => {
  const bus = createEventBus();
  let calls = 0;
  const off = bus.on('x', () => { calls += 1; });
  off();
  bus.emit('x');
  assert.equal(calls, 0);
});
