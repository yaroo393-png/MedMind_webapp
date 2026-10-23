/* หน้าจอจับคู่ — S1 (ผู้สูงอายุ: QR + รหัสเชิญ + ยินยอม) · C1 (ผู้ดูแล: ใส่รหัส / สแกน QR · ยกเลิกการจับคู่)
   FR-01 · NFR-03, NFR-04, NFR-05 · สัญญา: specs/001-pairing/contracts/screens.md
   กฎทั้งหมดอยู่ใน src/modules/pairing.js และ qrScan.js — ไฟล์นี้อ่าน/เขียน store และวาดหน้าจอเท่านั้น
   กติกาหน้าจอ (specs/001-pairing/tasks.md): draw() เรียกซ้ำได้ผลเดิม · ไม่ reload ใน draw · เขียน store ใน draw เฉพาะเมื่อค่าขาด
   แล้ว return ทันที (store แจ้งผู้ฟัง → draw รอบใหม่วาดเอง) · reload เฉพาะในตัวจัดการปุ่ม · สีจาก token
   เจ้าของ: A (YAR OO) */
(function (window, document) {
  'use strict';

  var MM = window.MedMind || {};
  if (!MM.screens || !MM.pairing || !MM.qrScan) {
    console.error('[pairing screens] โหลดไม่ครบ — ตรวจลำดับ <script> ใน index.html');
    return;
  }
  var P = MM.pairing;
  var Q = MM.qrScan;
  var h = MM.ui.h;
  var QR_CELL = 8;   // px ต่อโมดูลใน canvas (CSS ย่อ/ขยายให้พอดีกรอบ .qr)
  var QR_QUIET = 4;  // ขอบเงียบตามมาตรฐาน QR
  var MAX_IMAGE_SIDE = 1024;  // ย่อรูปมือถือก่อนอ่าน QR (research R-2)
  var MAX_FRAME_SIDE = 640;   // ย่อเฟรมกล้องสดก่อนอ่าน QR
  var SCAN_INTERVAL_MS = 200; // อ่านเฟรมละ 5 ครั้ง/วินาที พอสำหรับถือกล้องเล็ง ไม่กินเครื่อง
  var UNPAIRED_TEXT = 'การจับคู่ถูกยกเลิกแล้ว';  // clarify Q2

  // ---------- ตัวช่วยร่วม ----------
  // รหัสเครื่องของเบราว์เซอร์นี้ · ขาด → เขียนแล้วคืน null (ผู้เรียก return เพราะ draw รอบใหม่จะเริ่มเอง)
  function devicesOrCreate(app) {
    var d = app.store.get('devices');
    if (d && d.seniorId && d.caregiverId) return d;
    app.store.set('devices', P.ensureDevices(d, app.clock.now(), Math.random));
    return null;
  }

  function spaced(code) { return code.slice(0, 3) + ' ' + code.slice(3); }

  function cssToken(name) {
    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function qrBox(code) {
    var matrix = Q.qrMatrix(code);
    var size = (matrix.length + QR_QUIET * 2) * QR_CELL;
    var canvas = h('canvas', { width: size, height: size, role: 'img', 'aria-label': 'QR รหัส ' + spaced(code) });
    var g = canvas.getContext('2d');
    g.fillStyle = cssToken('--color-surface');
    g.fillRect(0, 0, size, size);
    g.fillStyle = cssToken('--color-ink');
    for (var r = 0; r < matrix.length; r++) {
      for (var c = 0; c < matrix.length; c++) {
        if (matrix[r][c]) g.fillRect((c + QR_QUIET) * QR_CELL, (r + QR_QUIET) * QR_CELL, QR_CELL, QR_CELL);
      }
    }
    return h('div', { class: 'qr' }, canvas);
  }

  function banner(message) {
    if (!message) return null;
    return h('div', { class: 'banner banner--' + message.tone, role: message.tone === 'danger' ? 'alert' : 'status' }, message.text);
  }

  // ชุดข้อมูลทั้งหมดใน store (architecture §8.2) — unpair เลือกลบเฉพาะของคู่นี้
  var DATA_KEYS = ['devices', 'invites', 'pairAttempts', 'pairing', 'mealTimes', 'medications', 'confirmations', 'notices'];

  // ยกเลิกการจับคู่ทั้งสองฝั่ง (BR-17): ต้องยืนยันใน dialog · คืน Promise<boolean> ว่ายกเลิกแล้วหรือไม่
  function confirmUnpair(ctx) {
    return ctx.confirm({
      title: 'ยกเลิกการจับคู่?',
      message: 'ลูกหลานจะดูสถานะการกินยาไม่ได้ และข้อมูลยากับประวัติการกินยาจะถูกลบ ย้อนกลับไม่ได้',
      confirmLabel: 'ยกเลิกการจับคู่',
      tone: 'danger'
    }).then(function (ok) {
      if (!ok) return false;  // ไม่ยืนยัน = ไม่เปลี่ยนอะไร
      var store = ctx.app.store;
      store.reload();
      var pairing = store.get('pairing');
      if (!pairing) return false;  // อีกเครื่องยกเลิกไปก่อนแล้ว
      var data = {};
      DATA_KEYS.forEach(function (k) { var v = store.get(k); if (v !== undefined) data[k] = v; });
      var next = P.unpair(data, pairing.pairingId);
      DATA_KEYS.forEach(function (k) {
        if (!(k in data)) return;
        if (!(k in next)) store.remove(k);
        else if (JSON.stringify(next[k]) !== JSON.stringify(data[k])) store.set(k, next[k]);
      });
      ctx.toast('ยกเลิกการจับคู่แล้ว', 'success');
      return true;
    });
  }

  function hasScreen(id) {
    return MM.screens.all().some(function (s) { return s.id === id; });
  }

  function unpairButton(onClick) {
    return h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: onClick }, 'ยกเลิกการจับคู่');
  }

  function isStartOf(role) {
    return function (app) {
      var d = app.store.get('devices');
      var pairing = app.store.get('pairing');
      if (!d) return true;
      return role === 'senior' ? !P.isSeniorPaired(pairing, d.seniorId) : !P.canAccess(pairing, d.caregiverId);
    };
  }

  // ---------- S1 · ผู้สูงอายุ ----------
  MM.screens.register({
    id: 'S1',
    role: 'senior',
    title: 'เชื่อมต่อกับลูกหลาน',
    covers: ['FR-01', 'NFR-03', 'NFR-05'],
    isStart: isStartOf('senior'),
    render: function (body, ctx) {
      var app = ctx.app;
      var store = app.store;
      var seenDueKey = MM.reminder ? MM.reminder.dueKey(app) : '';  // รอบเตือนที่มีอยู่ตอนเปิดหน้านี้

      function onNewCode() {
        store.reload();
        var d = store.get('devices');
        var r = P.newInvite(store.get('invites', []), d.seniorId, app.clock.now(), Math.random);
        store.set('invites', r.invites);
        ctx.toast('สร้างรหัสใหม่แล้ว', 'success');
      }

      function onConsent(code) {
        store.reload();
        var r = P.consent(store.get('invites', []), code, app.clock.now());
        if (r.ok) {
          store.set('invites', r.invites);
          ctx.toast('อนุญาตแล้ว', 'success');
        } else {
          draw();  // รหัสหมดอายุ/ถูกเปลี่ยนจากแท็บอื่นระหว่างนั้น → แสดงสถานะล่าสุด
        }
      }

      function pairedView(pairing) {
        return [
          h('div', { class: 'card' }, [
            h('p', { class: 'card__title', text: 'เชื่อมต่อกับลูกหลานแล้ว' }),
            h('p', { class: 'muted', text: 'เชื่อมต่อเมื่อเวลา ' + MM.clock.formatTime(pairing.pairedAt) + ' · ลูกหลานเห็นรายการยาและสถานะการกินยาของคุณ' })
          ]),
          // หน้าเตือนของ C (FR-03 · specs/003-reminder) · ยังไม่มี → ไม่แสดงปุ่ม
          hasScreen('S2')
            ? h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { ctx.go('S2'); } }, 'หน้าเตือนกินยา')
            : null,
          unpairButton(function () { confirmUnpair(ctx); })  // สำเร็จ → draw() เห็นว่าไม่มีคู่ → รหัสใหม่ (✗6)
        ];
      }

      function inviteView(inv, now) {
        if (P.isExpired(inv, now)) {
          return [
            banner({ tone: 'warn', text: 'รหัสหมดอายุแล้ว' }),
            h('p', { text: 'กดปุ่มด้านล่างเพื่อสร้างรหัสใหม่ แล้วให้ลูกหลานสแกนอีกครั้ง' }),
            h('button', { class: 'btn btn--primary btn--block btn--xl', type: 'button', onClick: onNewCode }, 'สร้างรหัสใหม่')
          ];
        }
        var consented = inv.consentAt !== null;
        return [
          consented
            ? banner({ tone: 'info', text: 'อนุญาตแล้ว รอลูกหลานสแกน QR หรือใส่รหัส' })
            : h('p', { text: 'ให้ลูกหลานสแกน QR นี้ หรือใส่รหัสด้านล่าง' }),
          qrBox(inv.code),
          h('p', { class: 'invite-code', 'aria-label': 'รหัสเชิญ ' + inv.code.split('').join(' ') }, spaced(inv.code)),
          h('p', { class: 'muted', text: 'รหัสหมดอายุเวลา ' + MM.clock.formatTime(inv.expiresAt) }),
          consented ? null : h('p', { text: 'เมื่ออนุญาต ลูกหลานจะเห็นรายการยาและสถานะการกินยาของคุณ' }),
          consented ? null : h('button', {
            class: 'btn btn--primary btn--block btn--xl', type: 'button', onClick: function () { onConsent(inv.code); }
          }, 'อนุญาตให้ลูกหลานดูสถานะการกินยา'),
          h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: onNewCode }, 'สร้างรหัสใหม่')
        ];
      }

      function draw() {
        var d = devicesOrCreate(app);
        if (!d) return;
        var pairing = store.get('pairing');
        var content;
        if (P.isSeniorPaired(pairing, d.seniorId)) {
          // รอบเตือนใหม่เริ่ม → ไปหน้าเตือนเอง ผู้สูงอายุไม่ต้องกด (FR-03 R8) · รอบที่เห็นอยู่แล้วตอนเปิดหน้านี้ไม่ดึงกลับ
          // (ผู้สูงอายุกด "การเชื่อมต่อ" จาก S2 เพื่อยกเลิกการจับคู่ได้) · specs/003-reminder/contracts/screens.md
          var dueKey = MM.reminder ? MM.reminder.dueKey(app) : '';
          if (dueKey && dueKey !== seenDueKey) { ctx.go('S2'); return; }
          seenDueKey = dueKey;
          content = pairedView(pairing);
        } else {
          var invites = store.get('invites', []);
          var inv = P.currentInvite(invites, d.seniorId);
          if (!inv) {  // เปิดครั้งแรก / หลังจับคู่หรือยกเลิก → รหัสใหม่ทันที (✓1)
            store.set('invites', P.newInvite(invites, d.seniorId, app.clock.now(), Math.random).invites);
            return;
          }
          content = inviteView(inv, app.clock.now());
        }
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, content));
      }

      ctx.subscribe(draw);
      draw();
    }
  });

  // ---------- C1 · ผู้ดูแล ----------
  MM.screens.register({
    id: 'C1',
    role: 'caregiver',
    title: 'จับคู่กับผู้สูงอายุ',
    covers: ['FR-01', 'NFR-04'],
    isStart: isStartOf('caregiver'),
    render: function (body, ctx) {
      var app = ctx.app;
      var store = app.store;
      var codeValue = '';   // คงค่าที่พิมพ์ไว้เมื่อ draw ใหม่
      var codeInput = null;
      var wasPaired = false;  // เห็นสถานะเชื่อมต่อแล้ว → ถ้าคู่หายไปจากอีกเครื่อง แจ้ง "การจับคู่ถูกยกเลิกแล้ว" (clarify Q2)
      var selfUnpairing = false;
      var camera = null;      // { stream, video, box, timer } ขณะเปิดกล้องสด · อยู่นอก draw เพราะ draw ล้างหน้าจอใหม่ได้ทุกเมื่อ
      var starting = false;   // กันกดซ้ำระหว่างรอผู้ใช้ตอบขอสิทธิ์กล้อง
      // { tone, text } ของผลครั้งล่าสุด · มาจากหน้าอื่นด้วย notice UNPAIRED (architecture §8.5)
      var message = ctx.params.notice === 'UNPAIRED' ? { tone: 'info', text: UNPAIRED_TEXT } : null;

      // หน้าแรกของผู้ดูแลหลังจับคู่ (C2/C3 ของ B, E) · ยังไม่มี → อยู่ C1 สถานะเชื่อมต่อแล้ว
      function nextScreenId() {
        var next = MM.screens.all().filter(function (s) {
          return s.role === 'caregiver' && s.id !== 'C1' && typeof s.isStart === 'function' && s.isStart(app);
        })[0];
        return next ? next.id : null;
      }

      function attemptPair(code) {
        store.reload();
        var d = store.get('devices');
        var r = P.pair({
          invites: store.get('invites', []),
          pairing: store.get('pairing'),
          pairAttempts: store.get('pairAttempts', [])
        }, code, d.caregiverId, app.clock.now());
        if (r.ok) {
          message = null;
          codeValue = '';
          store.set('invites', r.invites);
          store.set('pairAttempts', r.pairAttempts);
          store.set('pairing', r.pairing);
          ctx.toast('เชื่อมต่อแล้ว', 'success');
          var next = nextScreenId();
          if (next) ctx.go(next);
          return;
        }
        // LOCKED แสดงจากสถานะล็อกใน draw() อยู่แล้ว → ไม่ซ้ำ · ครั้งที่ 5 แสดงเหตุผลของรหัสนั้น + แถบล็อก (✗8)
        message = r.reason === 'LOCKED' ? null : { tone: 'danger', text: P.reasonText(r.reason) };
        store.set('pairAttempts', r.pairAttempts);
      }

      // ---------- กล้องสด (ADR-07 แก้ 22/10 · research R-2) ----------
      function stopCamera() {
        if (!camera) return;
        window.clearInterval(camera.timer);
        camera.stream.getTracks().forEach(function (t) { t.stop(); });  // ปิดไฟกล้อง
        camera = null;
      }

      function scanFrame() {
        var v = camera && camera.video;
        if (!v || v.readyState < 2 || !v.videoWidth) return;
        var scale = Math.min(1, MAX_FRAME_SIDE / Math.max(v.videoWidth, v.videoHeight));
        var w = Math.max(1, Math.round(v.videoWidth * scale));
        var hgt = Math.max(1, Math.round(v.videoHeight * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = hgt;
        var g = canvas.getContext('2d', { willReadFrequently: true });
        g.drawImage(v, 0, 0, w, hgt);
        var code = Q.readQr(g.getImageData(0, 0, w, hgt));
        if (!code) return;  // ยังไม่เห็น QR (หรือไม่ใช่ QR ของเรา) → เล็งต่อ ไม่นับครั้งผิด
        stopCamera();
        codeValue = code;
        attemptPair(code);
      }

      // เปิดกล้องหลัง · ไม่มี API (เช่น http ไม่ใช่ HTTPS) → ถอยไปเลือก/ถ่ายรูป · ไม่อนุญาต/เปิดไม่ได้ → ข้อความ ✗7 + ช่องรหัส
      function startCamera(fallbackPick) {
        if (camera || starting) return;
        var md = window.navigator.mediaDevices;
        if (!md || typeof md.getUserMedia !== 'function') { fallbackPick(); return; }
        starting = true;
        md.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (stream) {
          starting = false;
          var video = h('video', { playsinline: true, muted: true, autoplay: true, 'aria-label': 'ภาพจากกล้อง' });
          video.muted = true;
          video.srcObject = stream;
          camera = { stream: stream, video: video, box: h('div', { class: 'scanner' }, video), timer: null };
          camera.timer = window.setInterval(function () {
            try { scanFrame(); } catch (err) { console.warn('[C1] scan frame failed', err); }
          }, SCAN_INTERVAL_MS);
          draw();
          video.play().catch(function () { /* autoplay ถูกบล็อก: ผู้ใช้เพิ่งกดปุ่ม จึงไม่ควรเกิด */ });
        }, function (err) {
          starting = false;
          console.warn('[C1] camera unavailable', err && err.name);
          showQrError();
        });
      }

      function showQrError() {
        message = { tone: 'danger', text: P.reasonText('QR_UNREADABLE') };  // ✗7 · ไม่นับครั้งผิด
        draw();
        if (codeInput) codeInput.focus();
      }

      // รูปจากกล้อง/คลัง → ย่อด้านยาว ≤ 1024 px → อ่าน QR (ADR-07 · research R-2) · URL ของรูปคืนทุกครั้ง
      function readImageFile(file) {
        return new Promise(function (resolve, reject) {
          var url = URL.createObjectURL(file);
          var img = new Image();
          img.onload = function () {
            try {
              var scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
              var w = Math.max(1, Math.round(img.naturalWidth * scale));
              var hgt = Math.max(1, Math.round(img.naturalHeight * scale));
              var canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = hgt;
              var g = canvas.getContext('2d');
              g.drawImage(img, 0, 0, w, hgt);
              resolve(Q.readQr(g.getImageData(0, 0, w, hgt)));
            } catch (err) {
              reject(err);
            } finally {
              URL.revokeObjectURL(url);
            }
          };
          img.onerror = function () {
            URL.revokeObjectURL(url);
            reject(new Error('image could not be decoded'));
          };
          img.src = url;
        });
      }

      function onImageChosen(e) {
        var file = e.target.files && e.target.files[0];
        e.target.value = '';  // เลือกรูปเดิมซ้ำได้
        if (!file) return;    // ปิดตัวเลือกรูป = ไม่ทำอะไร (ช่องรหัสยังอยู่)
        readImageFile(file).then(function (code) {
          if (!code) { showQrError(); return; }
          codeValue = code;
          attemptPair(code);
        }, function (err) {
          console.warn('[C1] read QR image failed', err);
          showQrError();
        });
      }

      function pairedView(pairing) {
        return [
          h('div', { class: 'card' }, [
            h('p', { class: 'card__title', text: 'เชื่อมต่อกับผู้สูงอายุแล้ว' }),
            h('p', { class: 'muted', text: 'เชื่อมต่อเมื่อเวลา ' + MM.clock.formatTime(pairing.pairedAt) })
          ]),
          // ไปหน้ายา (C2 · FR-02) เมื่อมีหน้าจอนั้นแล้ว
          MM.screens.all().some(function (s) { return s.id === 'C2'; })
            ? h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { ctx.go('C2'); } }, 'ยาของผู้สูงอายุ')
            : null,
          unpairButton(function () {
            selfUnpairing = true;  // ยกเลิกเองเห็น toast แล้ว ไม่ต้องแจ้งซ้ำ (draw ระหว่าง dialog เปิดไม่ล้างค่านี้)
            confirmUnpair(ctx).then(function () { selfUnpairing = false; }, function () { selfUnpairing = false; });
          })
        ];
      }

      function readyView(retryAt, now) {
        var locked = retryAt !== null;
        var connect = h('button', {
          class: 'btn btn--secondary btn--block', type: 'submit', disabled: locked || codeValue.length !== 6
        }, 'เชื่อมต่อ');
        codeInput = h('input', {
          class: 'field__input field__input--code', id: 'c1-code', type: 'text', inputmode: 'numeric',
          maxlength: '6', autocomplete: 'off', 'aria-describedby': 'c1-code-hint', disabled: locked,
          onInput: function (e) {
            codeValue = e.target.value.replace(/\D/g, '').slice(0, 6);
            e.target.value = codeValue;
            connect.disabled = codeValue.length !== 6;
          }
        });
        codeInput.value = codeValue;
        // เลือก/ถ่ายรูป QR (input ซ่อน) — ทางสำรองเมื่อกล้องสดใช้ไม่ได้ เช่น เปิดแบบดับเบิลคลิก
        var fileInput = h('input', {
          class: 'visually-hidden', type: 'file', accept: 'image/*',
          tabindex: '-1', 'aria-hidden': 'true', onChange: onImageChosen
        });
        var scanning = camera !== null;
        return [
          locked ? banner({ tone: 'danger', text: P.reasonText('LOCKED', P.minutesLeft(retryAt, now)) }) : null,
          banner(message),
          h('p', { text: scanning ? 'เล็งกล้องไปที่ QR บนโทรศัพท์ของผู้สูงอายุ' : 'สแกน QR บนโทรศัพท์ของผู้สูงอายุ หรือใส่รหัส 6 หลัก' }),
          scanning ? camera.box : null,
          scanning
            ? h('button', { class: 'btn btn--secondary btn--block', type: 'button', onClick: function () { stopCamera(); draw(); } }, 'ปิดกล้อง')
            : h('button', {
              class: 'btn btn--primary btn--block btn--xl', type: 'button', disabled: locked,
              onClick: function () { startCamera(function () { fileInput.click(); }); }
            }, 'สแกน QR'),
          scanning ? null : h('button', {
            class: 'btn btn--ghost btn--block', type: 'button', disabled: locked,
            onClick: function () { fileInput.click(); }
          }, 'เลือกรูป QR จากเครื่อง'),
          fileInput,
          h('form', {
            class: 'stack', novalidate: true,
            onSubmit: function (e) { e.preventDefault(); if (!locked && codeValue.length === 6) attemptPair(codeValue); }
          }, [
            h('div', { class: 'field' }, [
              h('label', { class: 'field__label', for: 'c1-code', text: 'รหัส 6 หลัก' }),
              codeInput,
              h('p', { class: 'field__hint', id: 'c1-code-hint', text: 'ตัวเลขเท่านั้น' })
            ]),
            connect
          ])
        ];
      }

      function draw() {
        var d = devicesOrCreate(app);
        if (!d) return;
        var hadFocus = codeInput !== null && document.activeElement === codeInput;
        var pairing = store.get('pairing');
        var now = app.clock.now();
        var paired = P.canAccess(pairing, d.caregiverId);
        if (!paired && wasPaired && !selfUnpairing) message = { tone: 'info', text: UNPAIRED_TEXT };
        wasPaired = paired;
        var lockedNow = P.lockedUntil(store.get('pairAttempts', []), d.caregiverId, now) !== null;
        if (paired || lockedNow) stopCamera();  // เชื่อมต่อแล้ว/ถูกล็อก → ปิดกล้อง
        var content = paired
          ? pairedView(pairing)
          : readyView(P.lockedUntil(store.get('pairAttempts', []), d.caregiverId, now), now);
        body.textContent = '';
        body.appendChild(h('div', { class: 'stack stack--lg' }, content));
        if (hadFocus && codeInput && codeInput.isConnected) codeInput.focus();
      }

      ctx.onCleanup(stopCamera);  // ออกจากหน้า C1 → ปิดกล้อง
      ctx.subscribe(draw);
      draw();
      if (camera && camera.video.isConnected) camera.video.play().catch(function () {});
    }
  });
})(window, document);
