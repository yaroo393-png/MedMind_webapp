# MedMind — Prototype

<!-- เจ้าของ: D (Foundation) · ร่างโดย A ตามที่ทีมตัดสิน 22/10/69 -->

## เปิดดู
- **ดับเบิลคลิก `prototype/index.html`** — ไม่ต้องมี server, DB หรือ npm
- สแกน QR / ถ่ายฉลากบนมือถือ: เปิดผ่านลิงก์ GitHub Pages `https://<owner>.github.io/<repo>/prototype/` (กล้องต้องใช้ HTTPS)
- จอใหญ่เห็นโทรศัพท์ 2 เครื่อง (ผู้สูงอายุ / ผู้ดูแล) ใช้ข้อมูลร่วมกัน · จอเล็กสลับด้วยแท็บ
- **เปิดแยกหน้า:** `index.html?role=senior` และ `index.html?role=caregiver` (หรือลิงก์ "เปิด:" บนแถบทดลอง) ในเบราว์เซอร์เดียวกัน
  → ข้อมูล เวลาจำลอง และการล้างข้อมูล ซิงก์กันผ่าน localStorage · **ข้ามเครื่อง/ข้ามเบราว์เซอร์ไม่ได้** (ไม่มี server · SRS §2.2)
- แถบด้านบน = **เวลาจำลอง** (+1 / +5 / +15 นาที, ไปที่เวลา, ล้างข้อมูล) ใช้สาธิตการเตือน T, T+5, T+10, T+15 — ไม่ใช่ส่วนของแอป

## รัน test
```
node --test
```
รันที่ root ของ repo (Node 18+) · **อย่าใส่ path โฟลเดอร์** (`node --test prototype/tests` จะ fail) · ไม่ใช้ npm

## โครงสร้าง
```
index.html              ลำดับ <script> · แต่ละคนเอาคอมเมนต์บรรทัดของตัวเองออกเมื่อสร้างไฟล์
src/core/               Foundation (D): events · clock (นาฬิกาจำลอง) · store (localStorage)
src/ui/                 Foundation (D): tokens.css · app.css · shell.js (2 โทรศัพท์ + แถบทดลอง)
src/modules/            กฎของแต่ละ FR (UMD · test ได้) — เจ้าของตาม TEAM-PLAN ข้อ 3
src/screens/            หน้าจอของแต่ละ FR (ลงทะเบียนกับ shell)
tests/                  *.test.js (node:test)
vendor/                 Tesseract.js, jsQR — ห้ามแก้
```

## เขียนโมดูลกฎ (`src/modules/*.js`)
ห้ามใช้ `import`/`export` (เปิดด้วย `file://` แล้ว CORS บล็อก) · ใช้ UMD แบบเดียวกับ `src/core/clock.js`:
```js
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.pairing = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  // ฟังก์ชันล้วน: รับข้อมูล + เวลา (ms จาก clock) → คืนผล · ไม่แตะ DOM · ไม่เรียก Date.now()
  return { /* ... */ };
});
```

## เขียนหน้าจอ (`src/screens/*.js`)
```js
MedMind.screens.register({
  id: 'C3', role: 'caregiver', title: 'สถานะวันนี้', covers: ['FR-05'],
  isStart: function (app) { return Boolean(app.store.get('pairing')); },   // ไม่บังคับ
  render: function (body, ctx) {
    var h = ctx.h;                       // สร้าง element (textContent เท่านั้น)
    function draw() { body.textContent = ''; body.appendChild(h('div', { class: 'stack' }, '...')); }
    ctx.subscribe(draw);                 // วาดใหม่เมื่อข้อมูล/เวลาเปลี่ยน · ยกเลิกเองเมื่อออกจากหน้า
    draw();
  }
});
```
`ctx` มี: `app` (`store`, `clock`, `events`, `toast(role, msg, tone)`) · `params` · `go(id, params)` · `toast(msg, tone)` ·
`confirm({ title, message, confirmLabel, tone })` · `subscribe(fn)` · `onCleanup(fn)` · `h`
ชื่อชุดข้อมูลใน `store` และฟิลด์ ตาม "สัญญาข้อมูล" ใน `docs/03-design/architecture.md` · class และ token ตาม `docs/03-design/design-system.md`

**เมื่อเปิดแยกหน้า ทุกหน้ารันกฎเวลาพร้อมกัน** → ผลของกฎต้องบันทึกใน `store` แบบทำซ้ำแล้วไม่เพิ่ม (เช่น เก็บว่าแจ้งมื้อนี้แล้ว · BR-12, BR-13 "1 ครั้งต่อมื้อ")
และแต่ละหน้าแสดงจากข้อมูลใน `store` · `app.toast(role, ...)` คืน `false` ถ้าบทบาทนั้นไม่ได้เปิดอยู่ในหน้านี้
