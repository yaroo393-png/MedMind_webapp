/* clock — นาฬิกาจำลอง (Foundation · ใช้กับ FR-01 BR-01, FR-03–05 · NFR-01)
   กฎเวลาทุกข้อรับเวลาจาก clock นี้ ไม่เรียก Date.now() เอง → test และ demo เลื่อนเวลาได้ (CLAUDE.md · constitution หลักการ III)
   เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 22/10/69 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.clock = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var MINUTE = 60 * 1000;

  function assertTime(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) throw new TypeError('time must be a finite number of milliseconds');
  }

  // เวลาเดินหน้าเท่านั้น: ถอยเวลาทำให้กฎเตือน (BR-08, BR-13) เกิดซ้ำได้
  function createClock(startMs) {
    assertTime(startMs);
    var current = startMs;
    var listeners = [];

    function notify() {
      var list = listeners.slice();
      for (var i = 0; i < list.length; i++) list[i](current);
    }

    return {
      now: function () { return current; },
      set: function (ms) {
        assertTime(ms);
        if (ms < current) throw new RangeError('clock cannot move backwards');
        if (ms === current) return current;
        current = ms;
        notify();
        return current;
      },
      advance: function (minutes) {
        if (typeof minutes !== 'number' || !isFinite(minutes) || minutes < 0) {
          throw new RangeError('minutes must be a finite number ≥ 0');
        }
        return this.set(current + minutes * MINUTE);
      },
      onChange: function (fn) {
        if (typeof fn !== 'function') throw new TypeError('listener must be a function');
        listeners.push(fn);
        return function off() {
          var i = listeners.indexOf(fn);
          if (i !== -1) listeners.splice(i, 1);
        };
      }
    };
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // "HH:MM" ตามเวลาท้องถิ่น
  function formatTime(ms) {
    assertTime(ms);
    var d = new Date(ms);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  // เวลา "HH:MM" ของวันเดียวกับ dayMs → ms · รูปแบบผิดคืน null (ผู้เรียกต้องจัดการ ไม่เดาค่า)
  function atTime(dayMs, hhmm) {
    assertTime(dayMs);
    var m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm));
    if (!m) return null;
    var d = new Date(dayMs);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(m[1]), Number(m[2]), 0, 0).getTime();
  }

  return { MINUTE: MINUTE, createClock: createClock, formatTime: formatTime, atTime: atTime };
});
