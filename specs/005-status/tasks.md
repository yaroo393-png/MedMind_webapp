---

description: "Task list — 005-status (FR-05)"
---

# Tasks: แจ้งผู้ดูแล + สถานะรายวัน (Status)

**Input**: `specs/005-status/` — [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/escalation-module.md](contracts/escalation-module.md) · [contracts/screens.md](contracts/screens.md) · [quickstart.md](quickstart.md)
<!-- เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-tasks -->

**Tests**: **บังคับ** (constitution III) · เขียนก่อนและต้อง fail ก่อน implement · ชื่อ test ขึ้นต้นด้วยรหัส AC/BR · `node:test` เท่านั้น · เวลาใน test สร้างด้วย `new Date(y, m, d, hh, mm)`

**กติกาโค้ด**: เหมือน `specs/004-confirm/tasks.md` (UMD · ไม่มี `Date.now` ในโมดูล · ไม่มี innerHTML · token เท่านั้น · draw เรียกซ้ำได้ · `reload` เฉพาะใน handler/ก่อนเขียนของตัวรัน · เขียน store เฉพาะเมื่อค่าเปลี่ยน · ปุ่มหลัก ≤ 1 ต่อหน้าจอ · ไม่มีคำ "ไม่ได้กิน") ·
ระเบียนข้อความมีแค่ `{ pairingId, sessionKey, type, sentAt, seenAt }` — "(`pairingId`, `sessionKey`, `type`) ไม่ซ้ำ (BR-13)" · `type` = `UNCONFIRMED` / `CONFIRMED_LATE` · "`UNCONFIRMED`: `at + 15 นาที ≤ sentAt < lateUntil`" · `seenAt` = ms หรือ `null`

## Phase 1: Setup

- [X] T001 สร้าง UMD เปล่า `prototype/src/modules/escalation.js` (`window.MedMind.escalation` + `module.exports` · ใน node `require('./doseSession.js')`, `require('./confirm.js')` · ในเบราว์เซอร์ใช้ `MedMind.doseSession`, `MedMind.confirm`) และ `prototype/tests/escalation.test.js` · `node --test` ยังผ่าน

## Phase 2: Foundational

- [X] T002 test `addNotice` + `noticeText` (ชนิด `UNCONFIRMED`) ใน `prototype/tests/escalation.test.js`: `BR-13` เพิ่ม `{ pairingId, sessionKey, type, sentAt: now, seenAt: null }` ไม่มีฟิลด์อื่น · ซ้ำ (`pairingId`, `sessionKey`, `type`) → คืน **ตัวเดิม** (`===`) · คู่อื่น/ชนิดอื่น → เพิ่มได้ · `noticeText` = "ยังไม่ยืนยันการกินยา" · ไม่แก้ input (freeze) · `notices` `undefined` = `[]` · ไม่ใช่ list / `now` ไม่ใช่ตัวเลข / `type` อื่น / `pairingId` ว่าง → `TypeError`
- [X] T003 Implement `addNotice`, `noticeText` (ส่วน `UNCONFIRMED`) ใน `prototype/src/modules/escalation.js` → T002 ผ่าน (จัด HH:MM ในโมดูลเอง)

## Phase 3: User Story 1 — แจ้งผู้ดูแลที่ T+15 · 1 ครั้งต่อมื้อ (P1) 🎯 MVP

**Independent Test**: quickstart 2.2–2.4, 2.7, 2.8, 2.11 · test ✓1 ✗2 ✓5

- [X] T004 [US1] test `escalate` ใน `prototype/tests/escalation.test.js`: `FR-05 ✓1` ยืนยัน 08:12 → 08:15 คืนตัวเดิม · `FR-05 ✗2 / BR-13 / NFR-01` ไม่ยืนยัน → 08:15 ได้ 1 รายการ `UNCONFIRMED` `sentAt` 08:15 `seenAt` null · ค่าขอบ 08:15 − 1 ms ไม่มี · lateUntil (12:00) ไม่สร้าง · 11:59 สร้าง · มื้อ 23:50 (เมื่อวาน) → 00:05 สร้าง · `FR-05 ✓5` มี `UNCONFIRMED` แล้ว → ตัวเดิม · `escalate` ซ้ำ 5 ครั้ง → 1 รายการ · `BR-16` มื้อ 06:45 + 07:00 → ที่ 07:15 ได้ 2 · ยืนยัน 07:00 → 06:45 ยังถูกแจ้ง · เวลากระโดด 07:00 → 12:30: มื้อ 08:00 ไม่สร้าง มื้อ 12:00 สร้าง · `NFR-04` บันทึกยืนยัน/ข้อความของคู่อื่นไม่นับ · ไม่แก้ input
- [X] T005 [US1] Implement `escalate` ใน `prototype/src/modules/escalation.js` ตาม [contracts/escalation-module.md](contracts/escalation-module.md) (ช่วง `at + 15 ≤ now < doseSession.lateUntil(session, sessions)` · ไม่มีอะไรเพิ่ม → ตัวเดิม) → T004 ผ่าน
- [X] T006 [US1] test + implement `unseen`, `markSeen` ใน `prototype/tests/escalation.test.js`, `prototype/src/modules/escalation.js`: `R11 / clarify 24/10` `unseen` เฉพาะคู่นี้ `seenAt` null ล่าสุดก่อน · `markSeen` ใส่ `seenAt: now` เฉพาะคู่นี้ · ไม่มีที่ยังไม่กด → ตัวเดิม · ไม่แก้ input (test ก่อน → fail → implement)
- [X] T007 [US1] ตัวรันระดับหน้าเว็บใน `prototype/src/screens/status.js` ตาม research R-2: หลัง shell boot · `run()` ตอนเริ่ม + `app.clock.onChange` + `app.store.subscribe` · มื้อของเมื่อวาน + วันนี้ของคู่ (`pairing` มี) → `escalate` · ตัวเดิม → จบ · ใหม่ → `store.reload()` + คำนวณซ้ำ → ยังต่าง → `store.set('notices', …)` · กันเรียกซ้อนด้วย `busy` · เปิดบรรทัด `escalation.js` (หลัง `confirm.js`) และ `screens/status.js` ใน `prototype/index.html`
- [X] T008 [US1] แถบแจ้ง `MedMind.status.noticeBanner(ctx)` ใน `prototype/src/screens/status.js` ตาม [contracts/screens.md](contracts/screens.md) (`.banner--warn` `role="alert"` · บรรทัด "มื้อ HH:MM · " + `noticeText` · ปุ่มรอง "ดูสถานะ" → `reload` + `markSeen` + `ctx.go('C3')` · บน C3 "รับทราบ") + วางบนสุดของ `draw()` ใน `prototype/src/screens/medication.js` (C2 · B) 1 บรรทัด
- [X] T009 [US1] ฝั่งผู้สูงอายุ `prototype/src/screens/reminder.js` ตาม research R-8: ลบ `NOT_READY_TEXT` + ทางที่ไม่มี `MedMind.escalation` · ตรวจตอนโหลดให้มี `MM.escalation` · `notifyCaregiver` → `addNotice` + toast "แจ้งลูกหลานแล้ว"
- [X] T010 [US1] ทดสอบ Chrome (สคริปต์ใน scratchpad): ผู้ดูแลอยู่หน้ายา (C2) → 08:14 ไม่มีแถบ · 08:15 แถบ "มื้อ 08:00 · ยังไม่ยืนยันการกินยา" ขึ้นเองโดยไม่กด · ร่างที่กรอกอยู่ใน C2 ไม่หาย · ข้อความ 1 รายการแม้เวลาเปลี่ยนซ้ำ · `✓1` ยืนยัน 08:12 → 08:15 ไม่มีแถบ · `✓5` "ยังไม่กิน" 08:11 → รอ 10 วินาที (เวลาจริง) → 1 รายการ + ผู้สูงอายุเห็น "แจ้งลูกหลานแล้ว" → 08:15 ไม่เพิ่ม · หน้าเฉพาะผู้สูงอายุ (`?role=senior`) ผ่าน T+15 → ยังมีข้อความ (ตัวรันไม่ขึ้นกับหน้าจอ) · console error 0

## Phase 4: User Story 2 — หน้าสถานะรายวัน C3 (P1)

**Independent Test**: quickstart 2.1, 2.6, 2.9, 2.10 · test ✓3 ✗4 ✗7

- [X] T011 [US2] test `dailyStatus` + `noticesOf` ใน `prototype/tests/escalation.test.js`: `FR-05 ✓3 / BR-14` ที่ 12:30 มื้อ 08:00 (ยืนยัน 08:03) → `TAKEN` "กินแล้ว 08:03" · 12:00 → `UNCONFIRMED` "ยังไม่ยืนยัน" · 18:00 → `WAITING` "รอถึงเวลา" · ยืนยัน 08:40 → "กินแล้ว (ยืนยันช้า) 08:40" · 12:05 → "กำลังเตือน" · เรียงเวลา · `label` เท่ากับ `confirm.statusLabel` ทุกแถว · `FR-05 ✗4` ไม่มีมื้อ → `[]` · `noticesOf` เฉพาะคู่นี้ + `sentAt` วันนี้ ล่าสุดก่อน · `FR-05 ✗7 / NFR-04` คู่อื่นไม่ปรากฏ · ไม่มี "ไม่ได้กิน"
- [X] T012 [US2] Implement `dailyStatus`, `noticesOf` ใน `prototype/src/modules/escalation.js` → T011 ผ่าน
- [X] T013 [US2] หน้าจอ C3 ใน `prototype/src/screens/status.js` ตาม [contracts/screens.md](contracts/screens.md): `id 'C3'` · title "สถานะการกินยาวันนี้" · covers `['FR-05', 'NFR-01', 'NFR-04']` · `isStart` = `canAccess` · guard → `ctx.go('C1', { notice: 'UNPAIRED' })` · แถบแจ้ง ("รับทราบ") → การ์ดละมื้อ (เวลา `.session-time` · ชื่อยา `.card__title` · `.status--*` + `label` ตามตาราง สถานะ → class ของ S3) → "ข้อความแจ้งวันนี้" (`noticesOf` · "HH:MM · มื้อ HH:MM · " + `noticeText`) → ปุ่มรอง "ยาของผู้สูงอายุ" → ghost "การเชื่อมต่อ" · ไม่มีมื้อ → `.empty` "ยังไม่มีมื้อยาวันนี้" + ปุ่มรอง "ยาของผู้สูงอายุ" · ไม่มีปุ่มหลัก · `ctx.subscribe(draw)`
- [X] T014 [US2] C2 ใน `prototype/src/screens/medication.js` (B) ตาม research R-7: `isStart` = จับคู่แล้ว **และ** ยังไม่มียาของคู่ · มุมมองรายการเพิ่มปุ่มรอง "สถานะวันนี้" → C3 (เมื่อมี C3) · แจ้ง B ใน HANDOFF
- [X] T015 [US2] ทดสอบ Chrome: หลังจับคู่ผู้ดูแลอยู่ C2 (ไม่มียา) · เพิ่มยา → "สถานะวันนี้" → C3 Covers FR-05 · มื้อ 08:00/12:00 "รอถึงเวลา" · 08:05 "กำลังเตือน" · ผู้สูงอายุ "กินแล้ว" → C3 เปลี่ยนเองเป็น "กินแล้ว 08:05" · ข้อความแจ้งวันนี้เรียงล่าสุดก่อน · "ดูสถานะ" จาก C2 → C3 + แถบหาย (ทั้งหลัง redraw) · ลบยาทั้งหมด → "ยังไม่มีมื้อยาวันนี้" · `isStart`: มียา → C3 · ยกเลิกจับคู่ → C1 ไม่เห็นข้อมูล (`✗7`) · console error 0

## Phase 5: User Story 3 — แจ้งเมื่อยืนยันช้า (P1)

**Independent Test**: quickstart 2.5 · test ✓6

- [X] T016 [US3] test ใน `prototype/tests/escalation.test.js`: `FR-05 ✓6 / BR-15` `noticeText(CONFIRMED_LATE, confirmations)` กับบันทึก 08:40 → "ยืนยันการกินยาแล้ว เวลา 08:40" · ไม่พบบันทึก → "ยืนยันการกินยาแล้ว" · บันทึกของคู่อื่นไม่ใช้ · มี `UNCONFIRMED` แล้ว → `addNotice` `CONFIRMED_LATE` ยังเพิ่ม · ซ้ำ → ตัวเดิม · ไม่มี "ไม่ได้กิน"
- [X] T017 [US3] Implement ส่วน `CONFIRMED_LATE` ของ `noticeText` ใน `prototype/src/modules/escalation.js` → T016 ผ่าน
- [X] T018 [US3] ทดสอบ Chrome (เวลาจริง): 08:15 แจ้งแล้ว → 08:40 ผู้สูงอายุ "กินแล้ว" บนหน้าแรก → ก่อน 10 วินาทียังไม่มีข้อความ → พ้น 10 วินาที แถบผู้ดูแล "มื้อ 08:00 · ยืนยันการกินยาแล้ว เวลา 08:40" + C3 "กินแล้ว (ยืนยันช้า) 08:40" · ยืนยันช้าแล้วกด "ยกเลิก" → ไม่มีข้อความ (SC-003)

## Phase 6: Polish

- [X] T019 [P] UI + ชุดเดิม (Chrome): C3 และ C2 ที่มีแถบ ข้อความ ≥ 18 px · เป้าแตะ ≥ 48 · ปุ่มหลัก ≤ 1 · วาดไม่วน (ไม่มี mutation 1.5 วินาทีเมื่อไม่มีอะไรเปลี่ยน) · ไม่มีคำ "ไม่ได้กิน" ทุกหน้า · รันชุดเดิมซ้ำ: FR-01 (us1–us3, polish) · FR-02 (c2, c2polish) · FR-03 (s2v4, s2polishv4) · FR-04 (s4 · ปรับข้อ "ยังไม่พร้อมในรุ่นนี้" เป็น "แจ้งลูกหลานแล้ว" และไม่ใช้ escalation จำลองแล้ว)
- [X] T020 [P] เอกสาร: `docs/03-design/architecture.md` §6 ERD `seenAt` (FR-05 R11) · §4.1 sequence (ตัวรัน · แถบ) · §8.3 ตาราง escalation ตาม contract · §8.4 ตัวรันระดับหน้าเว็บ · §9.1 แถว FR-05 · `docs/03-design/design-system.md` (C3 ทำแล้ว · แถบแจ้งผู้ดูแล) · SRS §7 Golden Thread แถว FR-05 · `prototype/README.md` (ลองแจ้งผู้ดูแล) · `specs/004-confirm/research.md` R-5 ส่งต่อแล้ว
- [X] T021 ตรวจ 5 ความผิดพลาดของ AI + grep (`Date.now`, `import`, `innerHTML`, สีเขียนตรง, "ไม่ได้กิน", "ยังไม่พร้อมในรุ่นนี้") · `reload` อยู่ใน handler/ก่อนเขียนของตัวรันเท่านั้น
- [X] T022 `node --test` + ชุด Chrome ทั้งหมด (FR-01–05) ผ่าน · HANDOFF + AI log · เสนอคำสั่ง commit

## Dependencies

Setup → Foundational (`addNotice`, `noticeText` ใช้ทุก story) → US1 → US2 → US3 → Polish · `escalation.js`, `status.js`, `medication.js` ทำทีละข้อ · T008 ปุ่ม "ดูสถานะ" ไป C3 (T013) — ก่อนมี C3 ใช้ `ctx.go` ได้แต่ shell แจ้งไม่พบหน้า จึงทดสอบปุ่มใน T015 · T019 ∥ T020

## Parallel

- T019 ∥ T020 เท่านั้น (task อื่นแก้ไฟล์เดียวกันจึงทำต่อกัน · analyze F1)

## Implementation Strategy

MVP = US1 (ผู้ดูแลได้รับแจ้งจริง ตอบ "ไม่ต้องโทรถาม") · US2 เพิ่มภาพรวมของวัน · US3 ปิดวงจรข้อความ · ทุก story ทดสอบแยกได้ด้วย test ของตัวเองก่อนหน้าจอ

## Coverage: AC → test

| AC / กฎ | Test | Impl |
|---|---|---|
| ✓1 | T004, T010 | T005, T007 |
| ✗2 · BR-13 · NFR-01 | T002, T004, T010 | T003, T005, T007, T008 |
| ✓3 · BR-14 | T011, T015 | T012, T013 |
| ✗4 | T011, T015 | T012, T013 |
| ✓5 · BR-11, 13 | T004, T010 | T005, T009 |
| ✓6 · BR-15 | T016, T018 | T017 |
| ✗7 · NFR-04 | T004, T011, T015 | T012, T013 |
| BR-16 มื้อซ้อน | T004 | T005 |
| R6 ตัวรันทุกหน้า | T010 | T007 |
| R11 แถบค้างจนกด (clarify) | T006, T010, T015 | T006, T008 |
| R14 ฝั่งผู้สูงอายุ | T010, T019 | T009 |
| R7 หน้าแรกผู้ดูแล | T015 | T014 |
| SC-008 ผู้ดูแลจริง | quickstart §3 ([ทีมกรอก]) | — |
