/* events — ส่งข้อความระหว่างโมดูล (Foundation · ใช้ร่วมทุก FR)
   เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 22/10/69
   UMD: ใช้ได้ทั้ง <script src> (window.MedMind.events) และ node --test (require) · ห้ามใช้ import/export (TEAM-PLAN ข้อ 5) */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.events = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // onError: ผู้ฟังตัวหนึ่งพังต้องไม่ทำให้ผู้ฟังตัวอื่นไม่ได้รับข้อความ
  function createEventBus(onError) {
    var listeners = {};
    var report = onError || function (err, type) {
      if (typeof console !== 'undefined') console.error('[events] listener of "' + type + '" failed', err);
    };

    function on(type, handler) {
      if (typeof type !== 'string' || type === '') throw new TypeError('event type must be a non-empty string');
      if (typeof handler !== 'function') throw new TypeError('handler must be a function');
      (listeners[type] = listeners[type] || []).push(handler);
      return function off() {
        var list = listeners[type] || [];
        var i = list.indexOf(handler);
        if (i !== -1) list.splice(i, 1);
      };
    }

    // คืนจำนวนผู้ฟังที่ได้รับข้อความ
    function emit(type, payload) {
      var list = (listeners[type] || []).slice();
      for (var i = 0; i < list.length; i++) {
        try { list[i](payload); } catch (err) { report(err, type); }
      }
      return list.length;
    }

    return { on: on, emit: emit };
  }

  return { createEventBus: createEventBus };
});
