---

description: "Task list — 004-confirm (FR-04)"
---

# Tasks: ยืนยันการกินยาทั้งมื้อ (Confirm)

**Input**: `specs/004-confirm/` — [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/confirm-module.md](contracts/confirm-module.md) · [contracts/screens.md](contracts/screens.md) · [quickstart.md](quickstart.md)
<!-- เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-tasks -->

**Tests**: **บังคับ** (constitution III) · เขียนก่อนและต้อง fail ก่อน implement · ชื่อ test ขึ้นต้นด้วยรหัส AC/BR · `node:test` เท่านั้น · เวลาใน test สร้างด้วย `new Date(y, m, d, hh, mm)`

**กติกาโค้ด**: เหมือน `specs/003-reminder/tasks.md` (UMD · ไม่มี `Date.now` ในโมดูล · ไม่มี innerHTML · token เท่านั้น · draw เรียกซ้ำได้ · `reload` เฉพาะใน handler · เขียน store เฉพาะเมื่อค่าเปลี่ยน · ปุ่มหลัก ≤ 1 ต่อหน้าจอ · feedback ทุกการกระทำ · ไม่มีคำ "ไม่ได้กิน") ·
ระเบียนยืนยันมีแค่ `{ pairingId, sessionKey, confirmedAt }` — "คู่ (`pairingId`, `sessionKey`) ไม่ซ้ำ (NFR-07 · BR-12)" · "`at ≤ confirmedAt < lateUntil` (BR-10, BR-15)"

## Phase 1: Setup

- [X] T001 สร้าง UMD เปล่า `prototype/src/modules/confirm.js` (`window.MedMind.confirm` + `module.exports` · ใน node `require('./doseSession.js')` · ในเบราว์เซอร์ใช้ `MedMind.doseSession`) และ `prototype/tests/confirm.test.js` · `node --test` ยังผ่าน

## Phase 2: Foundational

- [X] T002 test `statusOf` + `statusLabel` ใน `prototype/tests/confirm.test.js`: `BR-14` ทั้ง 5 สถานะ (`WAITING` ก่อน T · `ALERTING` T ถึงก่อน T+15 · `UNCONFIRMED` ตั้งแต่ T+15 ไม่มีบันทึก · `TAKEN` บันทึกก่อน T+15 · `TAKEN_LATE` บันทึกตั้งแต่ T+15) + `confirmedAt` · บันทึกของ `pairingId` อื่นไม่นับ · `statusLabel` ตรงตัว "กินแล้ว 07:04" / "กินแล้ว (ยืนยันช้า) 08:40" / "กำลังเตือน" / "ยังไม่ยืนยัน" / "รอถึงเวลา" · ผลทั้งหมดไม่มี "ไม่ได้กิน" · `confirmations` `undefined` = `[]` · `now` ไม่ใช่ตัวเลข → `TypeError`
- [X] T003 Implement `statusOf`, `statusLabel` ใน `prototype/src/modules/confirm.js` → T002 ผ่าน (ใช้ `MedMind.clock.formatTime` ไม่ได้ใน node → จัดรูป HH:MM ในโมดูลเอง)

## Phase 3: User Story 1 — "กินแล้ว" 1 แตะ ยืนยันทั้งมื้อ (P1) 🎯 MVP

**Independent Test**: quickstart 2.6–2.7 · test ✓1 ✗2

- [X] T004 [US1] test `confirm` ใน `prototype/tests/confirm.test.js`: `FR-04 ✓1 / BR-10` มื้อ 08:00 ยืนยัน 08:03 → ok · 1 ระเบียน `{ pairingId, sessionKey, confirmedAt: 08:03 }` ไม่มีฟิลด์อื่น · `late` false · `doseSession.dueSessions` ที่ 08:05 ไม่มีมื้อนี้ · `FR-04 ✗2 / BR-12 / NFR-07` ยืนยันซ้ำ 5 ครั้ง (08:04, 08:20, 11:00, 12:30) → `ALREADY` ทุกครั้ง รายการ 1 ระเบียน เวลาเดิม · บันทึกของคู่อื่น `sessionKey` เดียวกัน → ยังยืนยันได้ · ค่าขอบ 07:59 `NOT_STARTED` · 08:00 ได้ · ไม่แก้ input · input ผิดรูป → `TypeError`
- [X] T005 [US1] Implement `confirm` ใน `prototype/src/modules/confirm.js` ตาม [contracts/confirm-module.md](contracts/confirm-module.md) (ลำดับ `ALREADY` → `NOT_STARTED` → `TOO_LATE` · `TOO_LATE` ใช้ `doseSession.lateUntil`) → T004 ผ่าน · เปิดบรรทัด `confirm.js` ใน `prototype/index.html` (หลัง `doseSession.js`)
- [X] T006 [US1] test + implement `undoConfirm` ใน `prototype/tests/confirm.test.js`, `prototype/src/modules/confirm.js`: `R1b / BR-10` ยกเลิกหลัง `confirm` → ไม่มีบันทึก · `statusOf` กลับตามเวลา · `dueSessions` มีมื้อนี้อีกในรอบ · ไม่กระทบมื้อ/คู่อื่น · ไม่มีระเบียน = รายการเดิม · ยืนยันใหม่ได้ (test ก่อน → fail → implement)
- [X] T007 [US1] ตัวจัดการยกเลิกระดับหน้าเว็บใน `prototype/src/screens/reminder.js` ตาม research R-8: `MedMind.reminder.offerUndo({ text, undo, commit })` (รายการเดียว · แตะใหม่ commit ของเดิมก่อน · `setTimeout` 10 วินาทีจริง → commit) + `MedMind.reminder.undoBanner()` (`.banner--info` + ปุ่ม "ยกเลิก" `btn--secondary`)
- [X] T008 [US1] ปุ่ม "กินแล้ว" บน S2 ใน `prototype/src/screens/reminder.js`: handler `store.reload()` → `confirm` → ok: `store.set('confirmations', …)` + `offerUndo` "บันทึกแล้ว: " + `statusLabel` (undo = `undoConfirm` + เขียน) · แสดง `undoBanner` บนสุดของ S2 · `ALREADY` → toast "มื้อนี้ยืนยันแล้ว" · `TOO_LATE` → toast "เลยเวลายืนยันมื้อนี้แล้ว" · ลบ toast ชั่วคราว "ยังบันทึกไม่ได้ในรุ่นนี้" ของ "กินแล้ว"
- [X] T009 [US1] ทดสอบ Chrome (ดับเบิลคลิก · สคริปต์ใน scratchpad): 08:00 เตือน → 08:03 "กินแล้ว" → ระเบียน 1 รายการ 08:03 · หน้าเตือนปิด · 08:05 ไม่เตือนและไม่มีเสียง · แตะซ้ำด้วยปุ่มเดิมก่อน redraw (จำลองแท็บที่สอง — 2 แท็บจริงทดสอบมือตาม quickstart 2.7) → "มื้อนี้ยืนยันแล้ว" · ยังมี 1 ระเบียน · หน้าแรกแสดง "กินแล้ว 08:03" (analyze G3) · "ยกเลิก" ภายใน 10 วินาที → บันทึกหาย หน้าเตือนกลับมา · พ้น 10 วินาที → แถบหาย ยกเลิกไม่ได้ (ชุดนี้รันเวลาจริง) · console error 0

## Phase 4: User Story 2 — "ยังไม่กิน" รอรอบถัดไป / รอบสุดท้ายแจ้งผู้ดูแล (P1)

**Independent Test**: quickstart 2.2–2.4 · test ✓3 ✗4 R4b

- [X] T010 [US2] test `notYet` + `visibleDue` ใน `prototype/tests/confirm.test.js`: `FR-04 ✓3 / BR-11` 08:01 → `{ action: 'WAIT', hideUntil: 08:05 }` · 08:07 → `WAIT` 08:10 · `FR-04 ✗4` 08:10 และ 08:14 → `{ action: 'NOTIFY', hideUntil: 08:15 }` · 07:59 / 08:15 → `{ action: 'NONE' }` · `R4b / clarify 24/10` `visibleDue`: ซ่อนมื้อเดียวที่กำลังเตือน → `[]` · ถึง `hideUntil` → แสดงอีก · มื้อซ้อน A, B: ซ่อน A → [B] · ซ่อน B ตอนที่ A อยู่ช่วงยืนยันช้า → `[]` (มื้อช่วงยืนยันช้าไม่เปิดหน้าเตือนเอง) · `BR-16` ซ่อน A ไม่กระทบ B · ไม่แก้ input
- [X] T011 [US2] Implement `notYet`, `visibleDue` ใน `prototype/src/modules/confirm.js` → T010 ผ่าน
- [X] T012 [US2] S2 ใน `prototype/src/screens/reminder.js`: `hidden` ระดับหน้าเว็บ + `MedMind.reminder.hide(sessionKey, until)` · มื้อที่แสดง / `dueKey` / เสียง ใช้ `confirm.visibleDue` · "ยังไม่กิน" เฉพาะมื้อ `late: false` → `notYet` → `hide` · `WAIT` → notice "จะเตือนอีกครั้ง HH:MM" · `NOTIFY` → `hide` + `offerUndo` "จะแจ้งลูกหลานว่ายังไม่ยืนยันการกินยา" (undo = เลิกซ่อน · commit = ถ้ามี `MedMind.escalation`: `addNotice(notices, session, 'UNCONFIRMED', pairingId, now)` เขียนเมื่อค่าเปลี่ยน + toast "แจ้งลูกหลานแล้ว" · ไม่มี → ไม่เขียน + "รับทราบแล้ว · ระบบแจ้งลูกหลานยังไม่พร้อมในรุ่นนี้" · research R-5, R-8) · ไม่เหลือมื้อต้องแสดง → `ctx.go('S3', { notice })` ถ้ามี S3 · ไม่มี S3 → toast + สถานะเดิม · `isStart` = จับคู่แล้ว **และ** `dueKey` ไม่ว่าง
- [X] T013 [US2] ทดสอบ Chrome: 08:01 "ยังไม่กิน" → ไปหน้าแรก + "จะเตือนอีกครั้ง 08:05" · ไม่ดึงกลับก่อน 08:05 · 08:05 หน้าเตือนขึ้นเอง + เสียง · 08:11 "ยังไม่กิน" → แถบ "จะแจ้งลูกหลาน…" + "ยกเลิก" · ยกเลิก → มื้อกลับมา ไม่มีการแจ้ง · แตะใหม่แล้วรอ 10 วินาที → ข้อความตามจริง (ก่อน FR-05: "ยังไม่พร้อมในรุ่นนี้" · ไม่มี `notices` ถูกเขียน) + ไม่มีหน้าเตือนจน 08:15 · ใส่ `escalation` จำลองใน driver → มี notice `UNCONFIRMED` 1 รายการ แม้แตะซ้ำ (ชุดนี้รันเวลาจริง)

## Phase 5: User Story 3 — หน้าแรก มื้อของวัน + ยืนยันช้า (P1)

**Independent Test**: quickstart 2.1, 2.5, 2.8 · test ✓5 ✗6

- [X] T014 [US3] test ใน `prototype/tests/confirm.test.js`: `FR-04 ✓5 / BR-15` มื้อ 08:00 (+ มื้อ 12:00) ยืนยัน 08:40 → ok `late` true · `statusOf` `TAKEN_LATE` 08:40 · `statusLabel` "กินแล้ว (ยืนยันช้า) 08:40" · ค่าขอบ 08:15 − 1 ms → `late` false · 08:15 → `late` true · `FR-04 ✗6` 11:59 ได้ · 12:00 `TOO_LATE` รายการไม่เปลี่ยน · `statusOf` 12:00 `UNCONFIRMED` · `canConfirmLate` 08:40 true / 12:00 false / มื้อยืนยันแล้ว false / กำลังเตือน false · ไม่มีมื้อถัดไป: 23:59 ได้
- [X] T015 [US3] Implement `canConfirmLate` (+ ส่วน `TOO_LATE`/`late` ถ้ายังไม่ครบ) ใน `prototype/src/modules/confirm.js` → T014 ผ่าน
- [X] T016 [US3] สร้าง `prototype/src/screens/home.js` หน้าจอ S3 ตาม [contracts/screens.md](contracts/screens.md): `id 'S3'` · title "ยาของฉันวันนี้" · covers `['FR-04', 'FR-03', 'NFR-02', 'NFR-03', 'NFR-07']` · `isStart` = จับคู่แล้ว · guard → S1 · `ctx.params.notice` → `.banner--info` · ไม่มีมื้อวันนี้ → "ยังไม่มียา ให้ผู้ดูแลเพิ่มยา" · การ์ดละมื้อเรียงเวลา: เวลา + ชื่อยา + `.status--*` + `statusLabel` · `canConfirmLate` → "กินแล้ว" xl block (primary เฉพาะปุ่มแรก) → `confirm` → เขียน + `offerUndo` (commit = แจ้ง `CONFIRMED_LATE` ตาม research R-5) · `undoBanner` บนสุด · ป้ายสถานะตามตาราง สถานะ → class ใน contracts/screens.md · ไป S2 เองเมื่อ `dueKey` เปลี่ยนเป็นค่าใหม่ที่ไม่ว่าง · ปุ่ม ghost "การเชื่อมต่อ" → S1 · เปิดบรรทัด `home.js` ใน `prototype/index.html`
- [X] T017 [US3] S2 "กินแล้ว" ของมื้อ `late: true` = ยืนยันช้า → แจ้ง `CONFIRMED_LATE` ตาม research R-5 ใน `prototype/src/screens/reminder.js` · ทดสอบ Chrome: quickstart 2.1 (รอถึงเวลา) · 2.5 (08:40 ยืนยันช้าจากหน้าแรก → "กินแล้ว (ยืนยันช้า) 08:40" ปุ่มหาย) · 2.8 (12:00 ไม่มีปุ่ม "ยังไม่ยืนยัน") · ✗5 ข้อความบนหน้าแรก · เปิดหน้ากลางรอบเตือน → เห็น S2 ก่อน · ยกเลิกจับคู่ → S1

## Phase 6: Polish

- [X] T018 [P] NFR-03 บน S2 + S3 ทุกสถานะ (Chrome): ข้อความ ≥ 18 · ชื่อยา/เวลา ≥ 24 · "กินแล้ว"/"ยังไม่กิน" ≥ 64 กว้างเต็ม · ปุ่มหลัก ≤ 1 ต่อหน้าจอ · เป้าแตะ ≥ 48 · วาดไม่วน · ไม่มีคำ "ไม่ได้กิน" ในหน้าใด · ชุด S2 ของ FR-03 (s2.js) ผ่านซ้ำ (ปรับข้อที่ปุ่มเปลี่ยนพฤติกรรม)
- [X] T019 [P] เอกสาร: `docs/03-design/architecture.md` §7 (confirm ใช้ doseSession · escalation ใช้ confirm) · §8.1 (คำสถานะอยู่ที่ `confirm.statusLabel`) · §8.3 ตาราง confirm ตาม contract + ลบแถว `statusOf` จาก doseSession + escalation `statusLabel` → ใช้ของ confirm · §9.1 แถว FR-04 · `docs/03-design/design-system.md` (S3 ทำแล้ว · S2 ปุ่มทำงาน) · SRS §7 Golden Thread แถว FR-04 · `prototype/README.md` (ลองยืนยัน) · `specs/003-reminder` ส่งต่อแล้ว (หมายเหตุใน research R-9)
- [X] T020 ตรวจ 5 ความผิดพลาดของ AI + grep (`Date.now`, `import`, `innerHTML`, สีเขียนตรง, "ไม่ได้กิน") · `reload` อยู่ใน handler เท่านั้น
- [X] T021 `node --test` + ชุด Chrome ทั้งหมด (FR-01, 02, 03, 04) ผ่าน · HANDOFF + AI log · เสนอคำสั่ง commit

## Dependencies

Setup → Foundational (สถานะ/คำ ใช้ทุก story) → US1 → US2 → US3 → Polish · `confirm.js`, `reminder.js` ทำทีละข้อ · T016 (home.js) ทำคู่ขนานกับ T012 ได้ถ้า T015 เสร็จ · T018 ∥ T019

## Coverage: AC → test

| AC / กฎ | Test | Impl |
|---|---|---|
| ✓1 · BR-10 | T004, T009 | T005, T008 |
| R1b ยกเลิก 10 วินาที (analyze D1) | T006, T009, T013 | T006, T007, T008, T012, T016 |
| ✗2 · BR-12 · NFR-07 | T004, T009 | T005, T008 |
| ✓3 · BR-11 | T010, T013 | T011, T012 |
| ✗4 · BR-11 (แจ้งผ่าน FR-05) | T010, T013 | T011, T012 |
| ✓5 · BR-15 | T014, T017 | T015, T016 |
| ✗6 · BR-15 | T014, T017 | T015, T016 |
| R4b ซ่อนหลัง "ยังไม่กิน" (clarify) | T010, T013 | T011, T012 |
| BR-14 สถานะ/คำ | T002, T017 | T003, T016 |
| BR-16 มื้อซ้อน | T010 | T011 |
| FR-03 ✗5 บนหน้าแรก | T017 | T016 |
| NFR-03 | T018 | T008, T012, T016 |
| NFR-02 | quickstart §3 (คนจริง · [ทีมกรอก]) | T008 (1 แตะ ไม่มี dialog) |
