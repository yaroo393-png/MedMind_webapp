---

description: "Task list — 001-pairing (FR-01)"
---

# Tasks: จับคู่ผู้สูงอายุกับผู้ดูแล (Pairing)

**Input**: `specs/001-pairing/` — [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/pairing-module.md](contracts/pairing-module.md) · [contracts/screens.md](contracts/screens.md) · [quickstart.md](quickstart.md)
<!-- เจ้าของ: A (YAR OO) · ร่างโดย Claude Code ตามคำสั่ง /speckit-tasks -->

**Tests**: **บังคับ** — constitution หลักการ III "ทุก AC (✓ และ ✗) ของ Must FR ต้องมี automated test" · เขียน test ก่อนและต้อง fail ก่อน implement ·
ชื่อ test ขึ้นต้นด้วยรหัส AC/BR เช่น `FR-01 ✗8 / BR-18: ...` · ใช้ `node:test` + `node:assert/strict` เท่านั้น · รัน `node --test` ที่ root

**กติกาโค้ดทุก task** (ไม่ต้องเขียนซ้ำในแต่ละข้อ):
- `src/modules/*.js` = UMD แบบเดียวกับ `prototype/src/core/clock.js` (`window.MedMind.<ชื่อ>` + `module.exports`) · ไม่มี `import`/`export` · ไม่เรียก `Date.now()` · ไม่แตะ DOM/store · คืน list/object ใหม่ ไม่แก้ของที่รับมา
- ผิดเงื่อนไขธุรกิจ → `{ ok: false, reason }` · เรียกผิดรูปแบบ → `throw TypeError`
- หน้าจอใช้ `ctx.h` (ไม่ใช้ innerHTML) · class จาก `app.css` เท่านั้น (`btn btn--primary btn--block btn--xl`, `btn--secondary`, `btn--danger`, `banner banner--danger|info|warn`, `field field__input field__label field__error`, `card`, `stack`, `muted`) · ไม่มีสีหรือ px เขียนตรง
- หัวไฟล์มีคอมเมนต์: หน้าที่ · FR/BR/NFR ที่ครอบ · `เจ้าของ: A (YAR OO)`

**กติกาหน้าจอ S1/C1** (ใช้กับ T014, T015, T024, T025, T029, T030 · แก้ตาม `/speckit-analyze` C1, C2, D1, D2, U1):
1. **render ต้องเรียกซ้ำได้ผลเท่าเดิม (idempotent):** `render` ถูกเรียกทุกครั้งที่ store/เวลาเปลี่ยน (`ctx.subscribe`) จึง**ห้ามเรียก `store.reload()` ใน render**
   (`reload()` แจ้งผู้ฟังทุกครั้ง → render ซ้ำไม่จบ · store.js:100) · ข้อมูลจากแท็บอื่นเข้ามาเองผ่าน `storage` event ของ shell (shell.js:313)
2. **เขียน store ใน render เฉพาะเมื่อค่าเปลี่ยนจริง:** `ensureDevices` → เขียน `devices` เมื่อยังไม่มี `seniorId`/`caregiverId` เท่านั้น ·
   `newInvite` อัตโนมัติ → เมื่อ `currentInvite = null` และยังไม่จับคู่เท่านั้น → render รอบถัดไปไม่เขียนอีก (จบใน 2 รอบเสมอ)
3. **`store.reload()` เฉพาะในตัวจัดการปุ่ม** (ยินยอม · สร้างรหัสใหม่ · เชื่อมต่อ · สแกน · ยกเลิกการจับคู่) ก่อนอ่านข้อมูลมาคำนวณ (research R-7)
   → คำนวณ → `store.set` ทันที · ตัวจัดการต้องเก็บค่าที่ต้องใช้ไว้ในตัวแปรก่อน `reload()` เพราะ DOM ถูก render ใหม่ระหว่างนั้น
4. **สีจาก token เท่านั้น** (constitution · Platform): canvas QR ใช้ `getComputedStyle(document.documentElement).getPropertyValue('--color-ink')`
   (โมดูลดำ) และ `'--color-surface'` (พื้น + ขอบเงียบ) · ห้ามเขียน `#000`, `#fff`, `black`, `white` ในไฟล์หน้าจอ
5. **1 สถานะ = ปุ่มหลัก (`btn--primary`) ไม่เกิน 1 ปุ่ม** · ปุ่มอื่นเป็น `btn btn--secondary btn--block` · ปุ่มยกเลิกการจับคู่ใช้ `btn--secondary` (สีแดงอยู่ใน dialog `tone: 'danger'`)
6. **ทุกการกระทำมี feedback:** สำเร็จ → `ctx.toast(ข้อความ, 'success')` · ไม่สำเร็จ → `banner banner--danger` `role="alert"` ในหน้าจอ (ไม่ใช่ toast ที่หายเอง)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: ทำพร้อมกันได้ (คนละไฟล์ ไม่รอ task ที่ยังไม่เสร็จ)
- **[Story]**: US1 / US2 / US3 ตาม [spec.md](spec.md)

---

## Phase 1: Setup

**Purpose**: ไฟล์เปล่าที่โหลดได้ทั้งเบราว์เซอร์และ node

- [X] T001 [P] สร้าง `prototype/src/modules/pairing.js` เป็น UMD เปล่าที่ export ค่าคงที่ `MINUTE = 60000`, `INVITE_TTL = 10 * MINUTE`, `LOCK_LIMIT = 5`, `LOCK_WINDOW = 10 * MINUTE`, `LOCK_DURATION = 10 * MINUTE` (BR-01, BR-18)
- [X] T002 [P] สร้าง `prototype/src/modules/qrScan.js` เป็น UMD เปล่า · ฟังก์ชันภายใน `decoder()` คืน `window.jsQR` ในเบราว์เซอร์ หรือ `require('../../vendor/jsqr/jsQR.js')` ใน node · `encoder()` คืน `window.qrcode` หรือ `require('../../vendor/qrcode/qrcode.js')` · ไม่พบ → `throw Error('jsQR/qrcode not loaded — check index.html')`
- [X] T003 [P] สร้าง `prototype/tests/pairing.test.js` และ `prototype/tests/qrScan.test.js` (หัวไฟล์แบบ `foundation.test.js`) · ใน `pairing.test.js` มีตัวช่วย `T0 = new Date(2026, 9, 22, 8, 0).getTime()`, `min(n)`, `seq(...values)` (คืนฟังก์ชัน random ที่ให้ค่าตามลำดับ) · ยืนยันว่า `node --test` ยังผ่าน 23/23

---

## Phase 2: Foundational (ต้องเสร็จก่อนทุก story)

**Purpose**: รหัสเครื่องและการอ่านรหัสเชิญที่ทุก story ใช้

- [X] T004 เขียน test ใน `prototype/tests/pairing.test.js` (ต้อง fail): `ensureDevices(undefined, T0, seq(...))` ได้ `seniorId` ขึ้นต้น `S-` + 8 ตัว, `caregiverId` ขึ้นต้น `C-` + 8 ตัว, `createdAt = T0` · ส่ง object ที่มี `seniorId` แล้ว → `seniorId` เดิมไม่เปลี่ยน เติมเฉพาะ `caregiverId` · `currentInvite([], 'S-x')` = `null` · `currentInvite` คืนเฉพาะรหัสที่ `usedAt = null` ของ seniorId นั้น · `isExpired`: `now = expiresAt − 1` → false, `now = expiresAt` → **true** (ค่าขอบ BR-01 "นาทีที่ 10 พอดี = หมดอายุ")
- [X] T005 Implement `ensureDevices(devices, now, random)`, `currentInvite(invites, seniorId)`, `isExpired(invite, now)` ใน `prototype/src/modules/pairing.js` ตาม [contracts/pairing-module.md](contracts/pairing-module.md) · `now`/`random` ผิดชนิด → `TypeError` → T004 ผ่าน

**Checkpoint**: `node --test` ผ่าน · เริ่ม US1 ได้

---

## Phase 3: User Story 1 — ผู้ดูแลจับคู่กับโทรศัพท์ของพ่อแม่ (P1) 🎯 MVP

**Goal**: ผู้สูงอายุเห็น QR + รหัส 6 หลักโดยไม่ต้องกรอก กดยินยอม · ผู้ดูแลใส่รหัส → ทั้งสองเครื่องแสดงว่าเชื่อมต่อแล้ว (FR-01 ✓1 ✗2 ✓3 · BR-01, BR-02 · NFR-05)

**Independent Test**: quickstart ข้อ 2.1–2.3 · test `FR-01 ✓1`, `✗2`, `✓3` ผ่าน

### Tests for User Story 1 (เขียนก่อน ต้อง fail)

- [X] T006 [US1] test `newInvite` ใน `prototype/tests/pairing.test.js`: `FR-01 ✓1 / BR-01` รหัสเป็นข้อความตัวเลข 6 หลักพอดี (`/^\d{6}$/`) · `random` = 0.000123 → `"000123"` (เติม 0) · `expiresAt = createdAt + 10 นาที` · `consentAt = null`, `usedAt = null` · list เดิมไม่ถูกแก้ · **clarify Q4:** มีรหัสที่ยังไม่ใช้ของ seniorId เดิม → ถูกลบ เหลือรหัสที่ยังไม่ใช้ 1 รหัส · รหัสที่ใช้แล้ว (`usedAt ≠ null`) และรหัสของ senior อื่นยังอยู่ · สุ่มได้รหัสที่ซ้ำใน list → สุ่มใหม่ · ซ้ำ 20 ครั้ง → throw
- [X] T007 [US1] test `consent` ใน `prototype/tests/pairing.test.js`: `BR-02 / NFR-05` ใส่ `consentAt = now` · ยินยอมซ้ำคง `consentAt` เดิม · รหัสไม่มี → `NOT_FOUND` · หมดอายุ → `EXPIRED` · ใช้แล้ว → `USED`
- [X] T008 [US1] test `pair` happy + ยังไม่ยินยอม ใน `prototype/tests/pairing.test.js`: `FR-01 ✓3` ยินยอมแล้ว + รหัสถูก → `ok: true`, `pairing = { pairingId, seniorId, caregiverId, consentAt (จาก invite), pairedAt: now }`, invite ได้ `usedAt = now`, ครั้งผิดของ caregiver นี้ถูกลบ (ของคนอื่นคงอยู่) · `FR-01 ✗2 / NFR-05` ยังไม่ยินยอม → `{ ok: false, reason: 'NO_CONSENT' }`, ไม่มี `pairing`, `pairAttempts` เพิ่ม 1 · `code` ไม่ใช่ 6 หลัก → TypeError
- [X] T009 [P] [US1] test ใน `prototype/tests/qrScan.test.js`: `ADR-07` `qrText('004213')` = `'MEDMIND:004213'` · `qrMatrix('004213')` เป็น `boolean[][]` สี่เหลี่ยมจัตุรัส (21×21 ขึ้นไป) · **ไป-กลับ:** วาดตารางเป็น RGBA (8 px/โมดูล, ขอบเงียบ 4 โมดูล) → `readQr({ data, width, height })` ได้ `'004213'` (`FR-01 ✓3`)

### Implementation for User Story 1

- [X] T010 [US1] Implement `newInvite(invites, seniorId, now, random)` และ `consent(invites, code, now)` ใน `prototype/src/modules/pairing.js` — รหัส = `String(Math.floor(random() * 1000000)).padStart(6, '0')` · "`code` ไม่ซ้ำใน list" · "ผู้สูงอายุ 1 คนมีรหัสที่ `usedAt = null` ≤ 1 รหัส" (data-model) → T006, T007 ผ่าน
- [X] T011 [US1] Implement `pair(state, code, caregiverId, now)` ส่วนสำเร็จ + `NOT_FOUND` + `NO_CONSENT` ใน `prototype/src/modules/pairing.js` (ลำดับเต็มทำใน T021) · `pairingId` = `'P-' + seniorId + '-' + now` · ทุกผลไม่สำเร็จเพิ่ม `{ caregiverId, failedAt: now }` → T008 ผ่าน
- [X] T012 [US1] Implement `qrText(code)`, `qrMatrix(code)` (`encoder()(0, 'M')` → `addData(qrText(code))` → `make()` → อ่าน `isDark(r, c)` ทุกช่อง) และ `readQr(imageData)` (`decoder()(data, width, height)` → `codeFromQr(result.data)` · ไม่พบ → `null`) ใน `prototype/src/modules/qrScan.js` · `codeFromQr` แบบง่ายก่อน (`/^MEDMIND:(\d{6})$/`) → T009 ผ่าน
- [X] T013 [US1] เอาคอมเมนต์ออกใน `prototype/index.html` 4 บรรทัดของ A (ลำดับคงเดิม): `vendor/jsqr/jsQR.js`, `vendor/qrcode/qrcode.js`, `src/modules/pairing.js`, `src/modules/qrScan.js` · **ยังไม่เปิด** `src/screens/pairing.js` (เปิดใน T014 พร้อมสร้างไฟล์ ไม่ให้ console มี 404 — analyze D3) · เปิดหน้าแล้ว console ไม่มี error และ `MedMind.pairing`, `MedMind.qrScan` มีค่า
- [X] T014 [US1] สร้าง `prototype/src/screens/pairing.js` + หน้าจอ **S1** ตาม [contracts/screens.md](contracts/screens.md) แล้วเอาคอมเมนต์บรรทัด `src/screens/pairing.js` ใน `prototype/index.html` ออก · `register({ id: 'S1', role: 'senior', title: 'เชื่อมต่อกับลูกหลาน', covers: ['FR-01', 'NFR-03', 'NFR-05'], isStart: (app) => !isSeniorPaired(...) })` · **render ตามกติกาหน้าจอข้อ 1–2:** `ensureDevices` (เขียนเมื่อขาด) → ยังไม่จับคู่และ `currentInvite = null` → `newInvite(..., Math.random)` แล้วเขียน `invites` · สถานะ `WAITING_CONSENT` / `WAITING_CAREGIVER` / `EXPIRED` ตาม [data-model.md](data-model.md) · QR วาดลง `<canvas>` จาก `qrMatrix` ≥ 200 px ขอบเงียบ 4 โมดูล สีตามกติกาข้อ 4 · `role="img"` `aria-label="QR รหัส 123 456"` · รหัสแสดงแบบเว้นวรรค 3+3 · "หมดอายุเวลา HH:MM" (`MedMind.clock.formatTime`) · `WAITING_CONSENT`: ปุ่มหลัก "อนุญาตให้ลูกหลานดูสถานะการกินยา" → `consent` → toast "อนุญาตแล้ว" · `WAITING_CONSENT` + `WAITING_CAREGIVER`: ปุ่มรอง "สร้างรหัสใหม่" · `EXPIRED`: ปุ่มหลัก "สร้างรหัสใหม่" · กด "สร้างรหัสใหม่" → `newInvite` → toast "สร้างรหัสใหม่แล้ว" (analyze U1) · **ไม่มีช่องกรอก** (SC-001) · `ctx.subscribe(render)` · **ทำจริง:** ดึงงาน `canAccess`/`isSeniorPaired` (+ test) จาก T027/T028 มาทำก่อนข้อนี้ เพราะ `isStart` ต้องใช้
- [X] T015 [US1] เพิ่มหน้าจอ **C1** สถานะ `READY` (ส่วนใส่รหัส) และ `PAIRED` (แสดงอย่างเดียว) ใน `prototype/src/screens/pairing.js`: `register({ id: 'C1', role: 'caregiver', title: 'จับคู่กับผู้สูงอายุ', covers: ['FR-01', 'NFR-04'], isStart: (app) => !canAccess(...) })` · render ตามกติกาหน้าจอข้อ 1–2 (`ensureDevices` เท่านั้น ไม่สร้างรหัส) · ช่องรหัส `field__input` `inputmode="numeric"` `maxlength="6"` `autocomplete="off"` ลบตัวที่ไม่ใช่ตัวเลขทุกครั้งที่พิมพ์ · ปุ่ม "เชื่อมต่อ" = `btn btn--secondary btn--block` (ปุ่มหลักของ `READY` คือ "สแกน QR" ใน T025 — analyze D2) `disabled` จนครบ 6 หลัก · ส่ง → กติกาข้อ 3: `store.reload()` → `pair` → เขียน `invites`, `pairing`, `pairAttempts` · สำเร็จ → toast "เชื่อมต่อแล้ว" → ถ้ามีหน้าจอผู้ดูแลอื่นที่ `isStart` เป็นจริง (C2/C3 ของ B, E) ไปหน้านั้นด้วย `ctx.go` ไม่มี → render สถานะ `PAIRED` (analyze U2) · ไม่สำเร็จ → banner danger ตามกติกาข้อ 6 (ข้อความชั่วคราวจนกว่า T022 มี `reasonText`) · `ctx.subscribe(render)` → S1 เปลี่ยนเป็น `PAIRED` เองเมื่อผู้ดูแลจับคู่ (✓3 ทั้งสองฝั่ง)
- [X] T016 [US1] เปิด `prototype/index.html` ทดสอบมือ quickstart ข้อ 2.1–2.3 + ข้อ 4 (2 แท็บ) · console ไม่มี error · จดผลจริงใน `HANDOFF.md` · **ทำจริง:** ตรวจด้วย Chrome headless อัตโนมัติ (สคริปต์ใน scratchpad ไม่ commit) ผ่าน 16/16 · ข้อ 4 (2 แท็บจริง) และการกดด้วยมือโดยคน = `[ทีมกรอก]`

**Checkpoint**: MVP ของ FR-01 — จับคู่ได้ด้วยรหัส · ✓1 ✗2 ✓3 มี test ผ่าน

---

## Phase 4: User Story 2 — จับคู่ไม่สำเร็จแล้วรู้สาเหตุและไปต่อได้ (P1)

**Goal**: เหตุผลปฏิเสธ 5 แบบตามลำดับ R4 · สแกน QR + ทางสำรองรหัส · ล็อก 10 นาทีหลังผิด 5 ครั้ง (FR-01 ✗4 ✗5 ✗7 ✗8 · BR-01, BR-02, BR-18 · NFR-04)

**Independent Test**: quickstart ข้อ 2.6–2.11 และข้อ 3 · test `✗4 ✗5 ✗7 ✗8` + คู่เหตุผลซ้อนกันผ่าน · **ต้องมี** `pair` จาก T011

### Tests for User Story 2 (เขียนก่อน ต้อง fail)

- [X] T017 [US2] test ลำดับเหตุผลใน `prototype/tests/pairing.test.js`: `FR-01 ✗4` รหัสไม่มี → `NOT_FOUND` · `now = expiresAt` พอดี → `EXPIRED` · ใช้แล้ว → `USED` · `FR-01 ✗5 / BR-02` มี `pairing` ของ senior นี้กับผู้ดูแลอื่น → `ALREADY_PAIRED` · **ซ้อนกัน (SC-005, clarify Q1):** หมดอายุ + ยังไม่ยินยอม → `EXPIRED` · ใช้แล้ว + มีผู้ดูแลแล้ว → `USED` · ยังไม่ยินยอม + มีผู้ดูแลแล้ว → `NO_CONSENT` · หมดอายุ + ใช้แล้ว → `EXPIRED` · ทุกกรณี: ไม่มี `pairing` ใหม่ และ `pairAttempts` เพิ่ม 1 · **clarify Q4:** สร้างรหัสใหม่แล้วใส่รหัสเก่า → `NOT_FOUND`
- [X] T018 [US2] test ล็อกใน `prototype/tests/pairing.test.js` (`FR-01 ✗8 / BR-18`): ผิดครั้งที่ 4 → ไม่มี `retryAt`, `lockedUntil` = `null` · ครั้งที่ 5 → `reason` เป็นเหตุผลของรหัสนั้น **และ** `retryAt = ครั้งที่ 5 + 10 นาที` · ครั้งที่ 6 ด้วย**รหัสที่ถูกต้อง**ก่อนครบ → `LOCKED`, `pairAttempts` ไม่เพิ่ม, ไม่มี `pairing` · `now = retryAt − 1` → ยังล็อก · `now = retryAt` พอดี → ปลดล็อก จับคู่ได้ · **research R-3:** ผิด 4 ครั้งที่ T0 + ครั้งที่ 5 ที่ T0+9 นาที → ที่ T0+10.5 นาทียังล็อก จนถึง T0+19 นาที · ผิด 5 ครั้งกระจายเกิน 10 นาที (ครั้งแรก 11 นาทีก่อน) → ไม่ล็อก · ล็อกเฉพาะ `caregiverId` นั้น (อีกคนใส่ได้) · จับคู่สำเร็จ → ครั้งผิดของคนนั้น = 0 · รายการ `failedAt ≤ now − 20 นาที` ถูกตัด · `minutesLeft(T0 + 10 นาที, T0)` = 10, `(T0 + 9.1 นาที, T0)` = 10 (ปัดขึ้น), `(T0 + 1, T0)` = 1
- [X] T019 [US2] test `reasonText` ใน `prototype/tests/pairing.test.js`: `FR-01 ✗5` `ALREADY_PAIRED` = `'ผู้สูงอายุท่านนี้มีผู้ดูแลแล้ว'` ตรงตัว · `FR-01 ✗8` `('LOCKED', 7)` = `'ใส่รหัสผิดหลายครั้ง กรุณารอ 7 นาที'` · `FR-01 ✗7` `QR_UNREADABLE` = `'อ่าน QR ไม่ได้ กรุณาใส่รหัส 6 หลัก'` · `NO_CONSENT` มีคำว่า "ยินยอม" (✗2) · 5 เหตุผลของ R4 ได้ข้อความต่างกัน 5 แบบ (SC-005) · reason ที่ไม่รู้จัก → TypeError
- [X] T020 [P] [US2] test `codeFromQr` ใน `prototype/tests/qrScan.test.js` (`FR-01 ✗7 / R8`): `'MEDMIND:123456'` → `'123456'` · `null`, `''`, `'123456'`, `'MEDMIND:12345'`, `'MEDMIND:1234567'`, `'medmind:123456'`, `'https://x?MEDMIND:123456'`, `' MEDMIND:123456'` → `null` · `readQr` ของภาพขาวล้วน → `null`

### Implementation for User Story 2

- [X] T021 [US2] ทำ `pair` ให้ครบลำดับ R4 ใน `prototype/src/modules/pairing.js`: `LOCKED` (ไม่ดูรหัส ไม่เพิ่มครั้งผิด มี `retryAt`) → `NOT_FOUND` → `EXPIRED` → `USED` → `NO_CONSENT` → `ALREADY_PAIRED` · ผลไม่สำเร็จมี `retryAt` เมื่อหลังเรียกแล้วถูกล็อก · ตัดรายการ "`failedAt ≤ now − 20 นาที`" ทุกครั้ง → T017 ผ่าน
- [X] T022 [US2] Implement `lockedUntil(pairAttempts, caregiverId, now)` ตามกฎ "L = ครั้งผิดล่าสุด · จำนวนในช่วง `(L − 10 นาที, L]` ≥ 5 **และ** `now < L + 10 นาที` → `L + 10 นาที`" (research R-3) · `minutesLeft(retryAt, now)` = `Math.max(1, Math.ceil((retryAt − now) / MINUTE))` · `reasonText(reason, minutesLeft)` ตามตารางใน [contracts/pairing-module.md](contracts/pairing-module.md) ใน `prototype/src/modules/pairing.js` → T018, T019 ผ่าน
- [X] T023 [US2] ทำ `codeFromQr` ให้ตรงสัญญา (`/^MEDMIND:(\d{6})$/` ไม่ trim · ไม่ใช่ข้อความ → `null`) ใน `prototype/src/modules/qrScan.js` → T020 ผ่าน · **ทำจริง:** T012 เขียน `codeFromQr` ตรงสัญญาแล้ว → T020 ผ่านโดยไม่ต้องแก้
- [X] T024 [US2] C1 ใน `prototype/src/screens/pairing.js`: banner danger ใช้ `pairing.reasonText` · ช่องรหัสไม่ถูกล้างเมื่อถูกปฏิเสธ · สถานะ `LOCKED` เมื่อ `lockedUntil ≠ null`: banner "ใส่รหัสผิดหลายครั้ง กรุณารอ N นาที", ปุ่มสแกน/ช่องรหัส/ปุ่มเชื่อมต่อ `disabled`, N อัปเดตตามเวลาจำลอง (`ctx.subscribe`), ครบเวลา → `READY` เอง
- [X] T025 [US2] ปุ่มหลัก "สแกน QR" ใน C1 (`prototype/src/screens/pairing.js`): `<input type="file" accept="image/*" capture="environment">` ซ่อนด้วย `visually-hidden` + `<label>` ที่ดูเป็นปุ่ม `btn btn--primary btn--block btn--xl` · เลือกรูป → `createImageBitmap` หรือ `Image` + `URL.createObjectURL` → canvas ย่อด้านยาว ≤ 1024 px → `getImageData` → `qrScan.readQr` · ได้รหัส → เติมช่องรหัสแล้วเรียก `pair` ทันที · `null` หรือโหลดรูปไม่ได้ → banner `reasonText('QR_UNREADABLE')` + โฟกัสช่องรหัส (**ไม่นับครั้งผิด**) · `revokeObjectURL` ทุกครั้ง
- [X] T026 [US2] ทดสอบมือ quickstart ข้อ 2.6–2.11 และข้อ 3.1–3.3 · จับเวลาอ่าน QR จากรูปมือถือ (เป้าภายในทีม ≤ 1 วินาที · plan Performance Goals · ไม่ใช่ NFR — analyze E1) · จดผลจริงใน `HANDOFF.md` · ข้อ 3.4 มือถือจริง = `[ทีมกรอก]` · **ทำจริง:** Chrome headless ผ่าน 17/17 (รวมสแกนรูป QR จริงจาก canvas ของ S1 และรูปไม่มี QR) · เวลาอ่าน QR บนมือถือจริง = `[ทีมกรอก]` (ค่าจาก headless เป็นเวลาจำลอง ใช้ไม่ได้)

**Checkpoint**: ✗4 ✗5 ✗7 ✗8 มี test ผ่าน · US1 ยังผ่าน

---

## Phase 5: User Story 3 — ยกเลิกการจับคู่และข้อมูลถูกลบ (P1)

**Goal**: ยกเลิกได้ทั้งสองฝั่ง ต้องยืนยัน → ผู้ดูแลหมดสิทธิ์ทันที ข้อมูลคู่เหลือ 0 ผู้สูงอายุเห็น QR ใหม่ (FR-01 ✗6 · BR-17 · NFR-04, NFR-10)

**Independent Test**: quickstart ข้อ 2.4–2.5 · test `✗6` + `canAccess` ผ่าน · ใช้ `pair` จาก T011 สร้างคู่ตั้งต้นได้

### Tests for User Story 3 (เขียนก่อน ต้อง fail)

- [X] T027 [US3] test ใน `prototype/tests/pairing.test.js`: `FR-01 ✗6 / NFR-10` `unpair(data, pairingId)` → ไม่มี `pairing` · `mealTimes`, `medications`, `confirmations`, `notices` ที่ `pairingId` ตรงเหลือ 0 รายการ · ระเบียนของ `pairingId` อื่นคงอยู่ · `devices`, `invites`, `pairAttempts` คงเดิม · `data` เดิมไม่ถูกแก้ · `pairingId` ไม่ตรง → ข้อมูลเหมือนเดิม · ชุดข้อมูลที่ไม่มี (undefined) → ไม่ throw · `NFR-04` `canAccess(pairing, caregiverId)` true เฉพาะผู้ดูแลที่จับคู่ · ผู้ดูแลอื่น → false · `pairing` ไม่มี → false · หลัง `unpair` ผู้ดูแลเดิม → false (SC-003) · `isSeniorPaired` แบบเดียวกันสำหรับ seniorId

### Implementation for User Story 3

- [X] T028 [US3] Implement `unpair(data, pairingId)`, `canAccess(pairing, caregiverId)`, `isSeniorPaired(pairing, seniorId)` ใน `prototype/src/modules/pairing.js` → T027 ผ่าน
- [X] T029 [US3] ปุ่มรอง "ยกเลิกการจับคู่" (`btn btn--secondary btn--block` · กติกาหน้าจอข้อ 5) ใน S1 และ C1 สถานะ `PAIRED` (`prototype/src/screens/pairing.js`): `ctx.confirm({ title: 'ยกเลิกการจับคู่?', message: 'ลูกหลานจะดูสถานะการกินยาไม่ได้ และข้อมูลยากับประวัติการกินยาจะถูกลบ ย้อนกลับไม่ได้', confirmLabel: 'ยกเลิกการจับคู่', tone: 'danger' })` · ไม่ยืนยัน → ไม่เปลี่ยน · ยืนยัน → กติกาข้อ 3: `store.reload()` → `unpair` → เขียนทุกชุดข้อมูลที่เปลี่ยน (`store.remove('pairing')`) → toast "ยกเลิกการจับคู่แล้ว" · S1 สร้าง `newInvite` ทันที (เห็น QR ใหม่)
- [X] T030 [US3] C1 รับ `ctx.params.notice === 'UNPAIRED'` → banner info "การจับคู่ถูกยกเลิกแล้ว" · C1 ที่อยู่สถานะ `PAIRED` แล้ว `pairing` หายจากอีกแท็บ → แสดง banner เดียวกัน (clarify Q2) · S1 ที่ `PAIRED` แล้วถูกยกเลิก → QR ใหม่ ใน `prototype/src/screens/pairing.js`
- [X] T031 [US3] ทดสอบมือ quickstart ข้อ 2.4–2.5 และข้อ 4 (ยกเลิกจากอีกแท็บ) · จดผลจริงใน `HANDOFF.md` · **ทำจริง:** Chrome headless ผ่าน 13/13 (ยกเลิกจากทั้งสองฝั่ง · dialog ยกเลิก = ไม่เปลี่ยน · ข้อมูลคู่เหลือ 0) · ยกเลิกจากอีกแท็บจริง = `[ทีมกรอก]`

- [X] T039 [US2] **(เพิ่ม 22/10 หลังผู้ใช้ทดสอบมือถือ — ADR-07 แก้)** กล้องสดใน C1 (`prototype/src/screens/pairing.js`): `getUserMedia` กล้องหลัง ไม่ขอเสียง → `<video>` ในกรอบ `.scanner` → อ่านเฟรมทุก 200 ms (ย่อ ≤ 640 px) ด้วย `qrScan.readQr` → เจอรหัสของเรา = ปิดกล้อง + `pair` · ไม่เจอ = เล็งต่อ ไม่นับครั้งผิด · ไม่อนุญาต/เปิดไม่ได้ = `reasonText('QR_UNREADABLE')` + โฟกัสช่องรหัส (✗7) · ไม่มี `mediaDevices` = เปิดตัวเลือกรูป · ปิดกล้อง (หยุดทุก track) เมื่อ: เจอ QR / กด "ปิดกล้อง" / ล็อก / จับคู่แล้ว / ออกจากหน้า · `draw()` ซ้ำใช้ `<video>` เดิม
- [X] T040 [US2] เพิ่ม `.scanner` ใน `prototype/src/ui/app.css` (token เท่านั้น) + แถวใน `design-system.md` §2 · ปุ่มรอง "เลือกรูป QR จากเครื่อง" (ไม่มี `capture` เพื่อเลือกจากคลังได้) · ปุ่มหลักยังมี 1 ปุ่ม
- [X] T041 [US2] แก้ ADR-07 (`architecture.md`) · research R-2 · `contracts/screens.md` · `quickstart.md` ข้อ 0 · README · AI log ให้ตรง — ระบุว่ากลับคำตัดสินเพราะอะไร
- [X] T042 [US2] ตรวจด้วย Chrome headless + กล้องปลอม (วิดีโอ y4m ที่มี QR ของรหัสเชิญ · สคริปต์ใน scratchpad ไม่ commit): เปิดกล้อง (กล้องหลัง ไม่เสียง) · สแกนก่อนยินยอม = ปฏิเสธ NO_CONSENT · ยินยอมแล้ว = จับคู่ ✓3 · ไฟกล้องดับ · ปุ่มปิดกล้อง · เวลาจำลองเดินแล้ว `<video>` เดิม · ล็อกแล้วปุ่มสแกน/รูป disabled · ไม่อนุญาตกล้อง = ข้อความ ✗7 ไม่นับครั้งผิด · ไม่มี API = ถอยไปรูป · ผ่านทั้งหมด · **มือถือจริง = `[ทีมกรอก]`**

**Checkpoint**: AC ของ FR-01 ครบ 8 ข้อมี test (SC-006)

---

## Phase 6: Polish & Cross-Cutting

- [X] T032 [P] ตรวจ NFR-03 บน S1/C1 ด้วย DevTools: ปุ่มหลักสูง ≥ 64 px กว้างเต็มจอ · ข้อความ ≥ 18 px · รหัส 6 หลักใช้ `--text-2xl` (design-system §1.2) · contrast ทุกคู่ ≥ 4.5:1 (ใช้ token ที่ตรวจแล้วใน `docs/03-design/design-system.md` §1.1) · ถ้าต้องมี class ใหม่ (กล่อง QR, รหัสตัวใหญ่) → เพิ่มใน `prototype/src/ui/app.css` + `design-system.md` §2 พร้อมคอมเมนต์ "เจ้าของ: D · เพิ่มโดย A" และแจ้ง D · **ทำจริง:** วัด computed style ใน Chrome ทุกสถานะผ่าน 27/27 · เพิ่ม `.qr`, `.invite-code`, `.field__input--code` + token `--qr-size` และแถวใน design-system §2 (แจ้ง D)
- [X] T033 [P] อัปเดต `docs/03-design/design-system.md` §3 Screen map: S1, C1 สถานะ "(รอ feature)" → "ทำแล้ว 001-pairing"
- [X] T034 [P] อัปเดตแถว FR-01 ใน `docs/02-requirements/spec.md` §7 Golden Thread: คอลัมน์ Prototype = S1, C1 (`src/screens/pairing.js`) · คอลัมน์ Test = ชื่อไฟล์ test + จำนวน test ที่ผ่านจริง
- [X] T035 [P] อัปเดต `docs/03-design/architecture.md` §9 traceability ของ FR-01 ให้ตรง operation ที่ทำจริง (เทียบกับ [contracts/pairing-module.md](contracts/pairing-module.md))
- [X] T036 [P] เพิ่มวิธีลองจับคู่ใน `prototype/README.md` (3–4 บรรทัด อ้าง quickstart)
- [X] T037 ตรวจ 5 ความผิดพลาดของ AI กับไฟล์ที่เขียน: hallucinated API (`isDark`, `getModuleCount`, `jsQR` เรียกตามที่มีจริงใน vendor) · edge case (ว่าง/undefined) · over-engineering (ไม่มี operation นอกสัญญา) · dependency (เฉพาะใน vendor) · silent wrong logic (อ่านเทียบ AC ✓1–✗8) · `grep` ต้องไม่พบ `Date.now`, `import `, `export `, `innerHTML` ใน `prototype/src/modules/pairing.js`, `qrScan.js`, `src/screens/pairing.js` · ไม่พบสีเขียนตรง (`#[0-9a-fA-F]{3,6}`, `black`, `white`, `rgb(`) และ `reload()` อยู่นอกตัวจัดการปุ่มใน `src/screens/pairing.js` (กติกาหน้าจอข้อ 1, 4) · ตรวจว่าเปิด S1/C1 ค้างไว้ 10 วินาทีแล้ว render ไม่วน (ใส่ `console.count('render S1')` ชั่วคราว ต้องนิ่ง แล้วลบออกก่อน commit) · **ทำจริง:** grep ไม่พบ (`innerHTML` มีแค่ในคอมเมนต์) · `reload()` 4 จุดอยู่ในตัวจัดการปุ่มทั้งหมด · render ไม่วน (MutationObserver ตอนอยู่นิ่ง = 0) · **test ค่าขอบจับบั๊กได้:** ตัดครั้งผิด ≤ now − 10 นาทีทำให้ปลดล็อกก่อนเวลา → แก้เป็น 20 นาที (research R-3)
- [X] T038 รัน `node --test` ที่ root → จดจำนวน pass/fail จริง · อัปเดต `HANDOFF.md` (ไฟล์ · FR · ผล test · ที่ยังขาด) + แถว AI log ใน `docs/02-requirements/spec.md` §8 (ช่องทีมตรวจ/บทเรียน = `[ผู้ใช้กรอก]`) · เสนอคำสั่ง commit/push `feat/pairing` + PR ให้ผู้ใช้รันเอง

---

## Dependencies & Execution Order

- **Setup (T001–T003)** → **Foundational (T004–T005)** → **US1 (T006–T016)** → US2 และ US3 (ทำพร้อมกันได้หลัง T011) → **Polish**
- **US2** ต้องมี `pair` (T011) และ C1 (T015) · **US3** ต้องมี `pair` (T011) เพื่อสร้างคู่ใน test และ S1/C1 สถานะ `PAIRED` (T014, T015)
- ในแต่ละ story: test → ทำให้ผ่าน → หน้าจอ → ทดสอบมือ
- `prototype/src/screens/pairing.js` เป็นไฟล์เดียว → T014, T015, T024, T025, T029, T030 ทำทีละข้อ (ไม่ [P])
- `prototype/src/modules/pairing.js` เป็นไฟล์เดียว → T005, T010, T011, T021, T022, T028 ทำทีละข้อ

### Parallel examples

```text
# Setup: T001, T002, T003 พร้อมกัน (คนละไฟล์)
# US1 tests: T006→T007→T008 (pairing.test.js ไฟล์เดียว) ∥ T009 (qrScan.test.js)
# US1 impl: T012 (qrScan.js) ∥ T010→T011 (pairing.js)
# US2 tests: T017→T018→T019 (pairing.test.js) ∥ T020 (qrScan.test.js) · impl: T023 (qrScan.js) ∥ T021→T022 (pairing.js)
# Polish: T032–T036 พร้อมกัน
```

## Implementation Strategy

1. **MVP = Phase 1–3 (US1):** จับคู่ด้วยรหัสได้ทั้งสองเครื่อง · หยุดทดสอบ quickstart 2.1–2.3 ก่อนไปต่อ
2. **+ US2:** ข้อความเหตุผล + สแกน QR + ล็อก (ความปลอดภัย BR-18)
3. **+ US3:** ยกเลิก = ลบข้อมูล (PDPA NFR-10) → FR-01 ครบทุก AC
4. **Polish:** NFR-03 · เอกสาร Golden Thread · PR
- ทุก Must FR ของ MVP คือ P1 ทั้ง 3 story → ต้องครบทั้ง 3 ก่อน demo M3 · commit หลังจบแต่ละ checkpoint (ข้อความอ้าง FR-01 + AC)

## Coverage: AC → test task

| AC / กฎ | Test | Impl |
|---|---|---|
| ✓1 · BR-01 | T006, T009 | T010, T012, T014 |
| ✗2 · NFR-05 | T007, T008, T019 | T010, T011 |
| ✓3 | T008, T009 | T011, T012, T015 |
| ✗4 · BR-01 · clarify Q4 | T004, T017 | T005, T021 |
| ✗5 · BR-02 | T017, T019 | T021, T022 |
| ✗6 · BR-17 · NFR-10 · NFR-04 | T027 | T028, T029, T030 |
| ✗7 · ADR-07 | T019, T020 | T023, T025 |
| ✗8 · BR-18 · research R-3 | T018, T019 | T021, T022, T024 |
| NFR-03 | (ทดสอบมือ) T032 | T014, T015 |
