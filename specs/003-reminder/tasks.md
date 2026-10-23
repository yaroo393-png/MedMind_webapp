---

description: "Task list — 003-reminder (FR-03)"
---

# Tasks: เตือนเมื่อถึงมื้อยา (Reminder)

**Input**: `specs/003-reminder/` — [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/dose-session.md](contracts/dose-session.md) · [contracts/screens.md](contracts/screens.md) · [quickstart.md](quickstart.md)
<!-- เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-tasks -->

**Tests**: **บังคับ** (constitution III) · เขียนก่อนและต้อง fail ก่อน implement · ชื่อ test ขึ้นต้นด้วยรหัส AC/BR · `node:test` เท่านั้น · เวลาใน test สร้างด้วย `new Date(y, m, d, hh, mm)` (เวลาท้องถิ่น)

**กติกาโค้ด**: เหมือน `specs/002-label/tasks.md` (UMD · ไม่มี `Date.now` ในโมดูล · ไม่มี innerHTML · token เท่านั้น · render เรียกซ้ำได้ · ไม่เรียก `reload` ใน draw · ปุ่มหลัก ≤ 1 ต่อมื้อ · feedback ทุกการกระทำ) ·
**feature นี้ไม่เขียน store เลย** (data-model)

## Phase 1: Setup

- [ ] T001 สร้าง UMD เปล่า `prototype/src/modules/doseSession.js` (`window.MedMind.doseSession` + `module.exports` · ใน node `require('./medication.js')` · ในเบราว์เซอร์ใช้ `MedMind.medication`) และ `prototype/tests/doseSession.test.js` · `node --test` ยังผ่าน

## Phase 2: Foundational

- [ ] T002 test `dayOf` ใน `prototype/tests/doseSession.test.js`: `dayOf(ms)` = `"YYYY-MM-DD"` เวลาท้องถิ่น · `dayOf(ms, -1)` = เมื่อวาน (ข้ามเดือน/ปี: 1 ม.ค. → 31 ธ.ค.) · 23:59 กับ 00:00 คนละวัน · `ms` ไม่ใช่ตัวเลข → `TypeError`
- [ ] T003 Implement `dayOf` ใน `prototype/src/modules/doseSession.js` → T002 ผ่าน

## Phase 3: User Story 1 — ถึงเวลามื้อ เห็นยาทั้งมื้อในหน้าเดียว + เสียง (P1) 🎯 MVP

**Independent Test**: quickstart 2.1–2.3 · test ✓1 ✗5

- [ ] T004 [US1] test `sessionsOf` + `dueSessions` รอบ 1 + `newSoundKeys` ใน `prototype/tests/doseSession.test.js`: `FR-03 ✓1 / BR-06` ยา 2 ตัวหลังอาหารเช้า + เช้า 08:00 → มื้อเดียว `sessionKey` `"2026-10-24@08:00"`, `medicationIds` 2 ตัวตามลำดับรายการ, `at` = 08:00 · ยาเช้า-เย็น → 2 มื้อเรียงเวลา · ยาที่ `reminderTimes` = `null` ถูกข้าม · 08:00 → `dueSessions` = [มื้อ 08:00 `round` 1 `late` false] · 07:59 → `[]` · `newSoundKeys(due, [])` = 1 คีย์ · `FR-03 ✗5` ไม่มียา / `mealTimes` ไม่มี → `sessionsOf` `[]` และ `dueSessions` `[]` ทุกนาทีของวัน (00:00–23:59) · ไม่แก้ input
- [ ] T005 [US1] Implement `sessionsOf`, `roundAt`, `dueSessions` (ส่วนกรองยืนยัน + รอบ 1–3), `newSoundKeys` ใน `prototype/src/modules/doseSession.js` ตาม [contracts/dose-session.md](contracts/dose-session.md) → T004 ผ่าน · เปิดบรรทัด `doseSession.js` ใน `prototype/index.html` (หลัง `medication.js`)
- [ ] T006 [US1] สร้าง `prototype/src/screens/reminder.js` หน้าจอ S2 ตาม [contracts/screens.md](contracts/screens.md): `isStart` = จับคู่แล้ว · guard → S1 · `EMPTY` ("ยังไม่มียา ให้ผู้ดูแลเพิ่มยา" ตรงตัว) / `IDLE` ("ยังไม่ถึงเวลากินยา" + "มื้อถัดไป HH:MM" / "วันนี้ไม่มีมื้อยาแล้ว") / `ALERT` (หัวข้อเวลา + การ์ดยา: ชื่อ, "ครั้งละ N เม็ด", ข้อควรระวัง/ข้อห้ามใช้เมื่อมี + "กินแล้ว" primary xl + "ยังไม่กิน" secondary xl) · ไม่มีรูปยา · ปุ่มก่อน FR-04 = toast "ยังบันทึกไม่ได้ในรุ่นนี้" ไม่เขียน store · ปุ่ม ghost "การเชื่อมต่อ" → S1 · มื้อของเมื่อวาน+วันนี้ (`dayOf(now,-1)`, `dayOf(now,0)`) จาก `medicationsOf(..., pairingId)` และ `mealTimes` ที่ `pairingId` ตรง · `confirmations` ไม่มี = `[]` · เปิดบรรทัด `reminder.js` ใน `prototype/index.html`
- [ ] T007 [US1] เสียงใน `prototype/src/screens/reminder.js` (research R-7): ฟัง `pointerdown`/`keydown` บน `document` ครั้งแรก → สร้าง `AudioContext` + `resume()` · เล่นเสียงสั้น 3 จังหวะด้วย `OscillatorNode` เมื่อ `newSoundKeys` ไม่ว่าง · เพิ่มคีย์ลง `played` ทุกครั้ง (เล่นได้หรือไม่ได้) · ยังไม่แตะ + `ALERT` → `.banner--warn` "แตะหน้าจอ 1 ครั้งเพื่อเปิดเสียงเตือน" · `onCleanup` ถอด listener + ปิด context · ไม่มีเสียงในเบราว์เซอร์ (ไม่มี `AudioContext`) = เตือนด้วยภาพตามปกติ ไม่ error
- [ ] T008 [US1] S1 สถานะเชื่อมต่อแล้ว: ปุ่มรอง "หน้าเตือนกินยา" → `ctx.go('S2')` เมื่อมี S2 ลงทะเบียน ใน `prototype/src/screens/pairing.js` (แบบเดียวกับ C1 → C2) · เพิ่ม `.session` (กลุ่มมื้อ: ระยะ `--space-*`, เส้นคั่นจาก token) + `.session-time` (`--text-2xl` bold) ใน `prototype/src/ui/app.css`
- [ ] T009 [US1] ทดสอบ Chrome อัตโนมัติ (ดับเบิลคลิก · สคริปต์ใน scratchpad): จับคู่ → ✗5 ข้อความตรงตัว + เลื่อนเวลาไม่เตือน · ผู้ดูแลเพิ่มยา 2 ตัว 08:00 → 07:59 `IDLE` "มื้อถัดไป 08:00" · 08:00 `ALERT` ยา 2 ตัวครบช่อง + 2 ปุ่ม + เล่นเสียง 1 ครั้ง (นับการเรียกเล่นเสียง) · กดปุ่ม = toast + store ไม่เปลี่ยน · ผู้ดูแลลบยา → หายจาก S2 · ยกเลิกจับคู่ → S1 · console error 0

## Phase 4: User Story 2 — เตือนซ้ำ T+5 / T+10 เฉพาะมื้อที่ยังไม่ยืนยัน (P1)

**Independent Test**: quickstart 2.4 · test ✗2 ✓3 NFR-01

- [ ] T010 [US2] test ใน `prototype/tests/doseSession.test.js`: `FR-03 ✗2 / NFR-01` ทุกนาที T−1 … T+15 ของ `roundAt` = 0, 1×5, 2×5, 3×5, null · ค่าขอบ T+5 นาที − 1 ms = 1 · T+5 = 2 · T+10 = 3 · T+15 = null · `dueSessions` ที่ 08:05 / 08:10 = รอบ 2 / 3 · `newSoundKeys` คีย์ใหม่ทุกรอบ · `SC-004` วาดซ้ำในรอบเดิม (played มีคีย์แล้ว) = `[]` · กระโดด 07:59 → 08:12 = คีย์รอบ 3 คีย์เดียว · `FR-03 ✓3` มีบันทึกยืนยัน `{ pairingId, sessionKey }` ของคู่นี้ → ไม่อยู่ใน `dueSessions` ทุกนาที · บันทึกของ `pairingId` อื่น → ยังเตือน · `R-3` มื้อ 23:55 เมื่อวาน: 00:00 รอบ 2 · 00:05 รอบ 3 · 00:10 ไม่แสดง · `confirmations` ไม่ใช่ array/`undefined` = ไม่มีบันทึก · `now` ไม่ใช่ตัวเลข → `TypeError`
- [ ] T011 [US2] ทำ `roundAt`/`dueSessions` ให้ T010 ผ่านทั้งหมดใน `prototype/src/modules/doseSession.js`
- [ ] T012 [US2] S2 หัวข้อมื้อตามรอบ: รอบ 1 "ถึงเวลากินยา" · รอบ 2 "เตือนซ้ำครั้งที่ 1" · รอบ 3 "เตือนซ้ำครั้งที่ 2" ใน `prototype/src/screens/reminder.js` · ทดสอบ Chrome: 08:00 → +5 → +5 ได้หัวข้อถูกและเสียงรอบละ 1 ครั้ง · +1 นาทีในรอบเดิม = ไม่มีเสียงเพิ่ม · ใส่บันทึกยืนยันจำลองใน store (แทน FR-04) → หน้าเตือนหาย เป็น `IDLE`

## Phase 5: User Story 3 — มื้อซ้อนกันแยกหัวข้อ เสียงครั้งเดียว (P1)

**Independent Test**: quickstart 2.5 · test ✗4 BR-15 R6b

- [ ] T013 [US3] test ใน `prototype/tests/doseSession.test.js`: `BR-15` `lateUntil` = `at` ของมื้อแรกในวันเดียวกันที่ `at > T+15` · มื้อที่อยู่ภายใน T+15 ถูกข้าม · ไม่มี = 00:00 วันถัดไป · มื้อ 23:55 → T+15 (ช่วงว่าง) · `FR-04 ✗6` ค่าขอบ: มื้อ 08:00 + มื้อ 12:00 → 12:00 · `FR-03 ✗4 / BR-16 / R6b` A 06:45 + B 07:00 ไม่ยืนยัน: 06:59 = [A รอบ 3] · 07:00 = [A `late` true `round` null, B รอบ 1] เรียงเวลา · `newSoundKeys` = 1 คีย์ (B) · B ยืนยันแล้ว ตอน 07:20 = `[]` (ไม่มีมื้อกำลังเตือน แม้ A ยังอยู่ช่วงยืนยันช้า) · มื้อ C 07:30 เตือน + A เลย `lateUntil` แล้ว → A ไม่แสดง · 2 มื้อเวลาต่างกันขึ้นรอบพร้อมกัน (กระโดดเวลา) = 2 คีย์
- [ ] T014 [US3] Implement `lateUntil` + ส่วนมื้อช่วงยืนยันช้าของ `dueSessions` ใน `prototype/src/modules/doseSession.js` → T013 ผ่าน
- [ ] T015 [US3] S2: มื้อ `late` หัวข้อ "เลยเวลาแล้ว ยังไม่ยืนยัน" ไม่มีเสียง · หลายมื้อเรียงเวลา ปุ่มแยกต่อมื้อ · เล่นเสียง 1 ครั้งต่อการวาดแม้มีหลายคีย์ ใน `prototype/src/screens/reminder.js` · ทดสอบ Chrome: ✗4 ตาม quickstart 2.5 (2 หัวข้อ · ปุ่ม 2 ชุด · เสียง 1 ครั้ง)

## Phase 6: Polish

- [ ] T016 [P] NFR-03 บน S2 ทุกสถานะ (Chrome): ปุ่ม "กินแล้ว"/"ยังไม่กิน" สูง ≥ 64 px กว้างเต็มจอ · ชื่อยา ≥ 24 px · ข้อความ ≥ 18 px · เป้าแตะ ≥ 48 · ปุ่มหลัก 1 ต่อมื้อ · วาดซ้ำไม่วน · contrast ของ class ใหม่ ≥ 4.5:1
- [ ] T017 [P] เอกสาร: `docs/03-design/architecture.md` §8.3 `doseSession` ตาม contract + §9.1 แถว FR-03 (เพิ่ม `dayOf`, `lateUntil`, `newSoundKeys`) · `docs/03-design/design-system.md` (S2 ทำแล้ว · `.session`/`.session-time` แจ้ง D) · SRS §7 Golden Thread แถว FR-03 · `prototype/README.md` (ลองการเตือน)
- [ ] T018 ตรวจ 5 ความผิดพลาดของ AI + grep (`Date.now`, `import`, `innerHTML`, สีเขียนตรง, `store.set` ใน reminder.js = 0) · ข้อความ "ไม่ได้กิน" ไม่ปรากฏ
- [ ] T019 `node --test` + ชุด Chrome ทั้งหมด (FR-01 + FR-02 + FR-03) ผ่าน · HANDOFF + AI log · เสนอคำสั่ง commit

## Dependencies

Setup → Foundational → US1 → US2 → US3 → Polish · `doseSession.js` และ `reminder.js` ทำทีละข้อ (ไฟล์เดียวกัน) · T016 ∥ T017 · US2/US3 ใช้ `sessionsOf` จาก US1

## Coverage: AC → test

| AC / กฎ | Test | Impl |
|---|---|---|
| ✓1 · BR-06, BR-09 | T004, T009 | T005, T006, T007 |
| ✗2 · BR-08 · NFR-01 | T010, T012 | T011, T012 |
| ✓3 · BR-08 | T010, T012 | T011 |
| ✗4 · BR-16 · R6b (clarify) | T013, T015 | T014, T015 |
| ✗5 | T004, T009 | T005, T006 |
| BR-15 (`lateUntil`) | T013 | T014 |
| R-3 มื้อข้ามเที่ยงคืน | T010 | T011 |
| SC-004 เสียง | T004, T010, T013, T012 | T005, T007 |
| NFR-03 | T016 | T006, T008 |
| NFR-04 (guard) | T009 | T006 |
