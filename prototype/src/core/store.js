/* store — ที่เก็บข้อมูลร่วมของ prototype (Foundation · ใช้ร่วมทุก FR)
   ไม่รู้โครงข้อมูลของ feature: ชื่อและฟิลด์ของแต่ละชุดข้อมูลตาม "สัญญาข้อมูล" ใน docs/03-design/architecture.md (เจ้าของ: C)
   ไม่มี server → เก็บในเบราว์เซอร์ (localStorage) · 2 แท็บในเบราว์เซอร์เดียวกันเห็นข้อมูลเดียวกัน (TEAM-PLAN ข้อ 5)
   เก็บเฉพาะข้อมูลที่ FR-01–05 ใช้ (NFR-09) · reset() ใช้ลบข้อมูลทั้งหมด
   เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 22/10/69 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.store = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var DEFAULT_KEY = 'medmind.v2';

  function createMemoryStorage() {
    var data = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[k] = String(v); },
      removeItem: function (k) { delete data[k]; }
    };
  }

  // คัดลอกแบบลึก: ผู้เรียกแก้ object ที่ได้ไปแล้วต้องไม่เปลี่ยนข้อมูลใน store โดยไม่ผ่าน set/update
  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function createStore(options) {
    var opts = options || {};
    var storage = opts.storage || createMemoryStorage();
    var key = opts.key || DEFAULT_KEY;
    var report = opts.onError || function (err) {
      if (typeof console !== 'undefined') console.error('[store]', err);
    };
    var listeners = [];
    var state = load();

    function load() {
      var raw;
      try { raw = storage.getItem(key); } catch (err) { report(err); return {}; }
      if (raw === null || raw === undefined) return {};
      try {
        var parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch (err) {
        report(new Error('stored data is not valid JSON — starting empty'));
        return {};
      }
    }

    function save() {
      try { storage.setItem(key, JSON.stringify(state)); } catch (err) { report(err); }
    }

    function notify(name) {
      var list = listeners.slice();
      for (var i = 0; i < list.length; i++) {
        try { list[i](name); } catch (err) { report(err); }
      }
    }

    function assertName(name) {
      if (typeof name !== 'string' || name === '') throw new TypeError('collection name must be a non-empty string');
    }

    return {
      get: function (name, fallback) {
        assertName(name);
        return Object.prototype.hasOwnProperty.call(state, name) ? clone(state[name]) : clone(fallback);
      },
      set: function (name, value) {
        assertName(name);
        if (value === undefined) throw new TypeError('value must not be undefined — use remove()');
        state[name] = clone(value);
        save();
        notify(name);
      },
      // fn รับสำเนาค่าปัจจุบัน (หรือ fallback) แล้วคืนค่าใหม่
      update: function (name, fn, fallback) {
        assertName(name);
        if (typeof fn !== 'function') throw new TypeError('updater must be a function');
        var next = fn(this.get(name, fallback));
        this.set(name, next);
        return clone(next);
      },
      remove: function (name) {
        assertName(name);
        if (!Object.prototype.hasOwnProperty.call(state, name)) return;
        delete state[name];
        save();
        notify(name);
      },
      reset: function () {
        state = {};
        try { storage.removeItem(key); } catch (err) { report(err); }
        notify(null);
      },
      // อ่านใหม่จาก storage เมื่อแท็บอื่นเปลี่ยนข้อมูล (storage event)
      reload: function () {
        state = load();
        notify(null);
      },
      // name = ชื่อชุดข้อมูลที่เปลี่ยน หรือ null เมื่อเปลี่ยนทั้งหมด
      subscribe: function (fn) {
        if (typeof fn !== 'function') throw new TypeError('listener must be a function');
        listeners.push(fn);
        return function off() {
          var i = listeners.indexOf(fn);
          if (i !== -1) listeners.splice(i, 1);
        };
      },
      key: key
    };
  }

  return { DEFAULT_KEY: DEFAULT_KEY, createStore: createStore, createMemoryStorage: createMemoryStorage };
});
