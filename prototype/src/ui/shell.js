/* shell — โครงหน้า prototype: แถบทดลอง + 2 โทรศัพท์ (ผู้สูงอายุ / ผู้ดูแล) ใช้ข้อมูลร่วม (SRS §2.2)
   ให้บริการหน้าจอของทุก feature: ลงทะเบียนหน้าจอ · ป้าย Covers · เปลี่ยนหน้า · toast · dialog ยืนยัน
   ใช้ในเบราว์เซอร์เท่านั้น (ไม่มีกฎของ FR ในไฟล์นี้ — กฎอยู่ใน src/modules/ ที่ test ได้)
   เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 22/10/69 */
(function (window, document) {
  'use strict';

  var MM = window.MedMind = window.MedMind || {};
  var ROLES = [
    { id: 'senior', label: 'ผู้สูงอายุ' },
    { id: 'caregiver', label: 'ผู้ดูแล' }
  ];
  var TOAST_MS = 4000;
  var CLOCK_KEY = 'medmind.v2.clock';
  var nextId = 0;

  // ---------- DOM helper: สร้าง element ด้วย textContent เท่านั้น (ไม่ใช้ innerHTML) ----------
  // h('button', { class: 'btn btn--primary', type: 'button', onClick: fn }, 'บันทึก')
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (name) {
      var value = a[name];
      if (value === null || value === undefined || value === false) return;
      if (name === 'class') el.className = value;
      else if (name === 'text') el.textContent = value;
      else if (/^on[A-Z]/.test(name)) el.addEventListener(name.slice(2).toLowerCase(), value);
      else if (value === true) el.setAttribute(name, '');
      else el.setAttribute(name, String(value));
    });
    append(el, children);
    return el;
  }

  function append(el, children) {
    if (children === null || children === undefined || children === false) return;
    if (Array.isArray(children)) { children.forEach(function (c) { append(el, c); }); return; }
    if (typeof children === 'string' || typeof children === 'number') el.appendChild(document.createTextNode(String(children)));
    else el.appendChild(children);
  }

  function uid(prefix) { nextId += 1; return prefix + '-' + nextId; }

  // ---------- ลงทะเบียนหน้าจอ ----------
  // def = { id: 'S1', role: 'senior' | 'caregiver', title, covers: ['FR-01'], render(body, ctx), isStart?(app) }
  var registry = [];

  function register(def) {
    if (!def || typeof def.id !== 'string' || def.id === '') throw new TypeError('screen needs an id');
    if (!ROLES.some(function (r) { return r.id === def.role; })) throw new TypeError('screen ' + def.id + ': role must be senior or caregiver');
    if (typeof def.title !== 'string' || def.title === '') throw new TypeError('screen ' + def.id + ' needs a title');
    if (!Array.isArray(def.covers) || def.covers.length === 0) throw new TypeError('screen ' + def.id + ' must list the FR/NFR it covers');
    if (typeof def.render !== 'function') throw new TypeError('screen ' + def.id + ' needs render(body, ctx)');
    if (registry.some(function (s) { return s.id === def.id; })) throw new Error('screen ' + def.id + ' is registered twice');
    registry.push(def);
  }

  function screensOf(role) { return registry.filter(function (s) { return s.role === role; }); }

  // ---------- Dialog ยืนยัน (การกระทำที่ย้อนไม่ได้) ----------
  // คืน Promise<boolean> · tone 'danger' → โฟกัสปุ่มยกเลิกก่อน กันกดยืนยันโดยไม่ตั้งใจ
  function openDialog(container, opts, isPage) {
    var o = opts || {};
    return new Promise(function (resolve) {
      var previous = document.activeElement;
      var titleId = uid('dialog-title');
      var backdrop;
      function close(result) {
        document.removeEventListener('keydown', onKey);
        backdrop.remove();
        if (previous && typeof previous.focus === 'function') previous.focus();
        resolve(result);
      }
      function onKey(e) { if (e.key === 'Escape') close(false); }
      var confirmBtn = h('button', {
        class: 'btn btn--block ' + (o.tone === 'danger' ? 'btn--danger' : 'btn--primary'),
        type: 'button', onClick: function () { close(true); }
      }, o.confirmLabel || 'ยืนยัน');
      var cancelBtn = h('button', {
        class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { close(false); }
      }, o.cancelLabel || 'ยกเลิก');
      backdrop = h('div', {
        class: 'dialog-backdrop' + (isPage ? ' dialog-backdrop--page' : ''),
        onClick: function (e) { if (e.target === backdrop) close(false); }
      }, h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
        h('h3', { class: 'dialog__title', id: titleId, text: o.title || 'ยืนยัน' }),
        o.message ? h('p', { text: o.message }) : null,
        confirmBtn,
        cancelBtn
      ]));
      container.appendChild(backdrop);
      document.addEventListener('keydown', onKey);
      (o.tone === 'danger' ? cancelBtn : confirmBtn).focus();
    });
  }

  // ---------- โทรศัพท์ 1 เครื่อง ----------
  function createPhone(role, app) {
    var titleId = 'phone-title-' + role.id;
    var title = h('h2', { class: 'phone__title', id: titleId });
    var covers = h('span', { class: 'covers' });
    var body = h('div', { class: 'phone__body' });
    var toasts = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    var el = h('section', { class: 'phone', id: 'phone-' + role.id, 'data-role': role.id, 'aria-labelledby': titleId }, [
      // toast อยู่ใต้หัวจอ ไม่บังปุ่มยืนยันที่อยู่ล่างจอ
      h('header', { class: 'phone__header' }, [
        h('div', { class: 'phone__meta' }, [h('span', { class: 'phone__role', text: role.label }), covers]),
        title,
        toasts
      ]),
      body
    ]);
    var cleanups = [];

    function runCleanups() {
      cleanups.splice(0).forEach(function (fn) {
        try { fn(); } catch (err) { console.error('[shell] cleanup failed', err); }
      });
    }

    function toast(message, tone) {
      var t = h('div', { class: 'toast' + (tone ? ' toast--' + tone : ''), text: message });
      toasts.appendChild(t);
      window.setTimeout(function () { t.remove(); }, TOAST_MS);
    }

    function setHeader(text, coversText, screenId) {
      title.textContent = text;
      covers.textContent = coversText;
      el.setAttribute('data-screen', screenId);
    }

    function show(def, params) {
      runCleanups();
      body.textContent = '';
      setHeader(def.title, 'Covers: ' + def.covers.join(' · '), def.id);
      var ctx = {
        app: app,
        params: params || {},
        h: h,
        go: go,
        toast: toast,
        confirm: function (opts) { return openDialog(el, opts, false); },
        onCleanup: function (fn) { cleanups.push(fn); },
        // เรียก fn เมื่อข้อมูลหรือเวลาจำลองเปลี่ยน · ยกเลิกให้อัตโนมัติเมื่อออกจากหน้านี้
        subscribe: function (fn) {
          cleanups.push(app.store.subscribe(fn));
          cleanups.push(app.clock.onChange(fn));
        }
      };
      try {
        def.render(body, ctx);
      } catch (err) {
        console.error('[shell] screen ' + def.id + ' failed to render', err);
        body.textContent = '';
        append(body, h('div', { class: 'banner banner--danger', role: 'alert' }, 'หน้าจอนี้แสดงไม่ได้ กรุณาลองใหม่'));
      }
      body.scrollTop = 0;
    }

    function go(id, params) {
      var def = screensOf(role.id).filter(function (s) { return s.id === id; })[0];
      if (!def) {
        console.error('[shell] no screen "' + id + '" for role ' + role.id);
        toast('ไม่พบหน้าจอ ' + id, 'danger');
        return;
      }
      show(def, params);
    }

    // หน้าแรก = หน้าแรกที่ isStart(app) เป็นจริง ไม่มี → หน้าที่ลงทะเบียนก่อน ไม่มีเลย → สถานะว่างของ Foundation
    function start() {
      var list = screensOf(role.id);
      var def = list.filter(function (s) {
        if (typeof s.isStart !== 'function') return false;
        try { return Boolean(s.isStart(app)); } catch (err) { console.error('[shell] isStart of ' + s.id + ' failed', err); return false; }
      })[0] || list[0];
      if (def) { show(def); return; }
      runCleanups();
      body.textContent = '';
      setHeader('ยังไม่มีหน้าจอ', 'Covers: (รอ feature)', 'none');
      append(body, h('div', { class: 'empty' }, [
        h('p', { class: 'empty__title', text: 'ยังไม่มีหน้าจอของ' + role.label }),
        h('p', { class: 'muted', text: 'เจ้าของ feature ลงทะเบียนหน้าจอด้วย MedMind.screens.register()' })
      ]));
    }

    return { role: role.id, el: el, start: start, go: go, toast: toast };
  }

  // ---------- แถบทดลอง (นาฬิกาจำลอง) ----------
  function formatDate(ms) {
    try {
      return new Date(ms).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (err) {
      return '';
    }
  }

  // ลิงก์เปิดแต่ละบทบาทในแท็บใหม่ (เชื่อมกันผ่าน localStorage ของเบราว์เซอร์เดียวกัน)
  function roleLinks(current) {
    var base = window.location.pathname.split('/').pop() || 'index.html';
    var items = ROLES.map(function (r) { return { href: base + '?role=' + r.id, label: r.label, id: r.id }; })
      .concat([{ href: base, label: 'ทั้ง 2 เครื่อง', id: null }]);
    return h('nav', { class: 'demo-bar__group', 'aria-label': 'เปิดหน้าตามบทบาท' }, [h('span', { class: 'demo-bar__label', text: 'เปิด:' })].concat(
      items.map(function (it) {
        return h('a', {
          class: 'demo-bar__link', href: it.href, target: it.id === current ? null : '_blank', rel: 'noopener',
          'aria-current': it.id === current ? 'page' : null
        }, it.label);
      })
    ));
  }

  function createDemoBar(app, onReset, currentRole) {
    var time = h('span', { class: 'demo-bar__time' });
    var date = h('span', { class: 'demo-bar__label' });
    var jump = h('input', { type: 'time', required: true, 'aria-label': 'เวลาที่ต้องการไป' });

    function refresh() {
      var now = app.clock.now();
      time.textContent = MM.clock.formatTime(now);
      date.textContent = formatDate(now);
    }
    app.clock.onChange(refresh);
    refresh();

    function advance(minutes) { return function () { app.clock.advance(minutes); }; }

    // เวลาที่เลยมาแล้วของวันนี้ → ไปเวลานั้นของวันถัดไป (นาฬิกาเดินหน้าเท่านั้น)
    function goTo(e) {
      e.preventDefault();
      var target = MM.clock.atTime(app.clock.now(), jump.value);
      if (target === null) { jump.focus(); return; }
      if (target <= app.clock.now()) {
        var tomorrow = new Date(target);
        tomorrow.setDate(tomorrow.getDate() + 1);
        target = tomorrow.getTime();
      }
      app.clock.set(target);
    }

    return h('div', { class: 'demo-bar', role: 'region', 'aria-label': 'แถบทดลองสำหรับสาธิต' }, [
      h('div', { class: 'demo-bar__clock' }, [h('span', { class: 'demo-bar__label', text: 'เวลาจำลอง' }), time, date]),
      h('div', { class: 'demo-bar__group' }, [
        h('button', { type: 'button', onClick: advance(1) }, '+1 นาที'),
        h('button', { type: 'button', onClick: advance(5) }, '+5 นาที'),
        h('button', { type: 'button', onClick: advance(15) }, '+15 นาที')
      ]),
      h('form', { class: 'demo-bar__group', onSubmit: goTo }, [
        jump,
        h('button', { type: 'submit', title: 'เวลาที่เลยมาแล้ว = วันถัดไป' }, 'ไปที่เวลา')
      ]),
      h('button', { type: 'button', onClick: onReset }, 'ล้างข้อมูลทั้งหมด'),
      roleLinks(currentRole),
      h('span', { class: 'demo-bar__label', text: 'แถบนี้ใช้สาธิตเท่านั้น ไม่ใช่ส่วนของแอป' })
    ]);
  }

  // ---------- เริ่มทำงาน ----------
  function browserStorage() {
    try {
      var ls = window.localStorage;
      ls.getItem(CLOCK_KEY);
      return ls;
    } catch (err) {
      console.warn('[shell] localStorage ใช้ไม่ได้ — ข้อมูลจะหายเมื่อปิดหน้า', err);
      return undefined;
    }
  }

  function startOfMinute(ms) { return ms - (ms % MM.clock.MINUTE); }

  function boot() {
    var root = document.getElementById('app');
    if (!MM.events || !MM.clock || !MM.store) {
      root.textContent = 'โหลดไฟล์ของ Foundation ไม่ครบ (src/core) — ตรวจลำดับ <script> ใน index.html';
      return;
    }

    var storage = browserStorage();
    var store = MM.store.createStore({ storage: storage });
    var saved = storage ? Number(storage.getItem(CLOCK_KEY)) : NaN;
    var clock = MM.clock.createClock(isFinite(saved) && saved > 0 ? saved : startOfMinute(Date.now()));
    clock.onChange(function (ms) {
      if (!storage) return;
      try { storage.setItem(CLOCK_KEY, String(ms)); } catch (err) { console.error('[shell] save clock failed', err); }
    });

    // ?role=senior | ?role=caregiver → หน้านี้แสดงเครื่องเดียว · ไม่มี = แสดงทั้ง 2 เครื่อง
    var onlyRole = new URLSearchParams(window.location.search).get('role');
    var shownRoles = ROLES.filter(function (r) { return !onlyRole || r.id === onlyRole; });
    if (shownRoles.length === 0) { onlyRole = null; shownRoles = ROLES; }

    var app = { store: store, clock: clock, events: MM.events.createEventBus(), h: h, roles: shownRoles.map(function (r) { return r.id; }) };
    MM.app = app;

    var phones = shownRoles.map(function (role) { return createPhone(role, app); });

    // แสดงข้อความบนเครื่องของบทบาทนั้น ไม่ว่าเปิดหน้าไหนอยู่ (เช่น แจ้งผู้ดูแล FR-05)
    // บทบาทที่เปิดอยู่คนละแท็บ → ไม่แสดงที่นี่ (แท็บนั้นต้องแสดงจากข้อมูลใน store เอง) · คืน true เมื่อแสดงแล้ว
    app.toast = function (role, message, tone) {
      if (!ROLES.some(function (r) { return r.id === role; })) throw new TypeError('unknown role: ' + role);
      var target = phones.filter(function (p) { return p.role === role; })[0];
      if (!target) return false;
      target.toast(message, tone);
      return true;
    };

    // แท็บอื่นของเบราว์เซอร์เดียวกัน: ข้อมูลเปลี่ยน → อ่านใหม่ · ล้างข้อมูล → กลับหน้าแรก · เวลาจำลองเดิน → เดินตาม
    window.addEventListener('storage', function (e) {
      if (e.key === store.key) {
        store.reload();
        if (e.newValue === null) phones.forEach(function (p) { p.start(); });
      } else if (e.key === CLOCK_KEY) {
        var ms = Number(e.newValue);
        if (isFinite(ms) && ms > clock.now()) clock.set(ms);
      }
    });

    function resetAll() {
      openDialog(document.body, {
        title: 'ล้างข้อมูลทั้งหมด?',
        message: 'ข้อมูลจับคู่ ยา และประวัติการยืนยันในเบราว์เซอร์นี้จะถูกลบ และย้อนกลับไม่ได้',
        confirmLabel: 'ล้างข้อมูล',
        tone: 'danger'
      }, true).then(function (ok) {
        if (!ok) return;
        store.reset();
        phones.forEach(function (p) { p.start(); p.toast('ล้างข้อมูลแล้ว', 'success'); });
      });
    }

    // จอเล็ก: แท็บสลับเครื่อง (เฉพาะโหมด 2 เครื่อง)
    // data-active ซ่อนเครื่องเฉพาะจอเล็ก (app.css) · จอใหญ่เห็นทั้ง 2 เครื่องเสมอ
    var tabs = null;
    function select(index) {
      phones.forEach(function (p, i) {
        p.el.setAttribute('data-active', String(i === index));
        tabs.children[i].setAttribute('aria-selected', String(i === index));
      });
    }
    if (phones.length > 1) {
      tabs = h('div', { class: 'stage__tabs', role: 'tablist', 'aria-label': 'เลือกโทรศัพท์' });
      shownRoles.forEach(function (role, i) {
        tabs.appendChild(h('button', {
          class: 'stage__tab', type: 'button', role: 'tab', 'aria-controls': 'phone-' + role.id,
          onClick: function () { select(i); }
        }, role.label));
      });
    }

    if (onlyRole) document.title = 'MedMind — ' + shownRoles[0].label;
    root.textContent = '';
    append(root, [
      createDemoBar(app, resetAll, onlyRole),
      h('main', { class: 'stage' }, [tabs].concat(phones.map(function (p) { return p.el; })))
    ]);
    phones.forEach(function (p) { p.start(); });
    if (tabs) select(0);
  }

  MM.ui = { h: h, append: append };
  MM.screens = { register: register, all: function () { return registry.slice(); } };

  document.addEventListener('DOMContentLoaded', boot);
})(window, document);
