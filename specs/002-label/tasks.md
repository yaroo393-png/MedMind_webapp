---

description: "Task list — 002-label (FR-02)"
---

# Tasks: ถ่ายฉลากยาและสร้างข้อมูลยา (Label)

**Input**: `specs/002-label/` — [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/label-modules.md](contracts/label-modules.md) · [contracts/screens.md](contracts/screens.md) · [quickstart.md](quickstart.md)
<!-- เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-tasks -->

**Tests**: **บังคับ** (constitution III) · เขียนก่อนและต้อง fail ก่อน implement · ชื่อ test ขึ้นต้นด้วยรหัส AC/BR · `node:test` เท่านั้น

**กติกาโค้ด**: เหมือน `specs/001-pairing/tasks.md` (UMD · ไม่มี `Date.now` ในโมดูล · ไม่มี innerHTML · token เท่านั้น · กติกาหน้าจอ 1–6: render เรียกซ้ำได้ · `reload` เฉพาะในปุ่ม · เขียน store เฉพาะเมื่อค่าเปลี่ยน · ปุ่มหลัก ≤ 1 · feedback ทุกการกระทำ)
**ความเป็นส่วนตัว**: ห้ามคัดลอกข้อความจากรูปฉลากจริง (ชื่อ/HN/แพทย์) ลงไฟล์ใดใน repo · fixture ใช้ข้อมูลสมมติเท่านั้น

## Phase 1: Setup

- [X] T001 [P] สร้าง `prototype/tools/embed-ocr.js` (node · ไม่ใช้ npm): อ่าน `vendor/tesseract/lang/{tha,eng}.traineddata`, `vendor/tesseract/core/tesseract-core-lstm.wasm.js`, `vendor/tesseract/worker.min.js` → เขียน `prototype/vendor/tesseract-embed/{lang-tha,lang-eng,core,worker}.js` รูปแบบ `window.MM_OCR = window.MM_OCR || {}; window.MM_OCR["<key>"] = "<base64>";` + `README.md` (ที่มา, วิธีสร้างใหม่, ห้ามแก้มือ) · รันแล้วบันทึกขนาดไฟล์จริง · **ทำจริง:** 4 ไฟล์ รวม 11.8 MB (tha 1.36 · eng 5.23 · core 5.01 · worker 0.16)
- [X] T002 [P] สร้าง UMD เปล่า `prototype/src/modules/labelParser.js`, `prototype/src/modules/medication.js` และไฟล์ test `prototype/tests/labelParser.test.js`, `prototype/tests/medication.test.js` · `node --test` ยังผ่าน
- [X] T003 [P] สร้างข้อความฉลากสมมติ `prototype/tests/fixtures/labels.js` (ข้อมูลสมมติเท่านั้น) 8 แบบตามรูปแบบใน research R-0 (HN สมมติ `123456789`, ชื่อสมมติมีคำว่า "สมมุติ"): ก่อนนอน+คำเตือน · ก่อนอาหารไม่ระบุนาที (มีคำเพี้ยน `เข้า`) · หลังอาหาร เช้า-เย็น · ก่อนอาหาร 30 นาที · ยาเมื่อมีอาการ · ผงซอง "ดื่มบ่อยๆ" · ข้อความขยะ (อ่านไม่ได้) · บรรทัดชื่อ/HN ทั้งแบบถูกและแบบเพี้ยน (`LN :`, `UW.`)

## Phase 2: Foundational

- [X] T004 test `validMealTimes` ใน `prototype/tests/medication.test.js`: `HH:MM` 00:00/23:59 ผ่าน · `24:00`, `7:00`, `''`, ไม่มีช่อง → `MEAL_TIMES` + `fields`
- [X] T005 Implement `validMealTimes` ใน `prototype/src/modules/medication.js` → T004 ผ่าน

## Phase 3: User Story 1 — ถ่ายฉลาก → ร่าง → แก้ → บันทึก (P1) 🎯 MVP

**Independent Test**: quickstart 2.1–2.2, 2.6 · test ✓1 ✓2 ✗7

- [X] T006 [US1] test `parseLabel` ใน `prototype/tests/labelParser.test.js`: `FR-02 ✓1` fixture ก่อนนอน → `name` = ชื่อยา (ส่วนก่อน `[`), `tabletsPerDose` 1, `timing` BEDTIME, `meals` [], `warnings` มีข้อความเตือน, `needsCheck` [] · fixture หลังอาหารเช้า-เย็น → AFTER_MEAL + [BREAKFAST, DINNER] · `เข้า` นับเป็นเช้า · `ํา` เป็น `ำ` · **SC-011/R10b**: ทุก fixture → `JSON.stringify(draft)` ไม่มีชื่อผู้ป่วย/HN/แพทย์/เลข HN · ร่างไม่มีช่องข้อความดิบ · **ทำจริง:** เขียน test ของ US1–US3 ทั้งหมดก่อนโค้ด (parser/medication เป็นฟังก์ชันก้อนเดียว) · red 43 → green
- [X] T007 [US1] test `saveMedication` / `medicationsOf` ใน `prototype/tests/medication.test.js`: `FR-02 ✓2` ร่างที่แก้ชื่อ → ยาที่บันทึกมีชื่อที่แก้ · `NFR-06` ก่อนเรียก = รายการเดิม · ไม่ผ่าน → รายการไม่เปลี่ยน · `FR-02 ✗7` (ยกเลิก = ไม่เรียก save) รายการเดิม · แก้ยาเดิมด้วย id เดิม = แทนที่ ไม่เพิ่ม · `medicationsOf` คืนเฉพาะคู่นั้น · เก็บเฉพาะฟิลด์ใน data model
- [X] T008 [US1] Implement `parseLabel`, `emptyDraft` (รูปแบบชื่อยา/ขนาด/เวลา/มื้อ/คำเตือน · whitelist ตาม research R-2, R-3) ใน `prototype/src/modules/labelParser.js` → T006 ผ่าน
- [X] T009 [US1] Implement `validateDraft` (ส่วน MISSING), `saveMedication`, `medicationsOf` ใน `prototype/src/modules/medication.js` → T007 ผ่าน
- [X] T010 [US1] Implement `prototype/src/modules/readLabel.js` (adapter): โหลด `vendor/tesseract-embed/*.js` ด้วย `<script>` ครั้งแรก · สร้าง worker จาก blob (core + worker ที่แทน `t.data`→`t.code` · แทนไม่ได้ = `UNSUPPORTED_PAGE`) · ใช้ worker ซ้ำ · รูป → canvas ย่อด้านยาว ≤ 2000 px → `recognize` · ไม่มีข้อความ = `UNREADABLE` · ไม่ส่งข้อมูลออกนอกเครื่อง · เปิด 4 บรรทัดของ B ใน `prototype/index.html`
- [X] T011 [US1] สร้าง `prototype/src/screens/medication.js` หน้าจอ C2 ตาม [contracts/screens.md](contracts/screens.md): `LIST` (ว่าง/มียา) · `READING` · `DRAFT` (ช่องทั้งหมด + เวลามื้อ + ตัวอย่าง "จะเตือนเวลา…") · บันทึก/ยกเลิก · guard `canAccess` · ปุ่ม "การเชื่อมต่อ" · เปิดบรรทัดใน `index.html` · เพิ่มปุ่ม "ยาของผู้สูงอายุ" ใน C1 สถานะเชื่อมต่อแล้ว (`prototype/src/screens/pairing.js`)
- [X] T012 [US1] สร้างรูปฉลากตัวอย่าง `prototype/samples/label-*.png` (canvas จาก fixture · ข้อมูลสมมติ) + `prototype/samples/README.md` · ทดสอบ Chrome อัตโนมัติ: ดับเบิลคลิก → เลือก `label-bedtime.png` → ร่างถูก → แก้ → บันทึก (✓1 ✓2) · ยกเลิก (✗7) · console error 0 · **ทำจริง:** Chrome ดับเบิลคลิก + OCR จริงกับฉลากตัวอย่าง: ชุด C2 ผ่าน 28 ข้อ · console error 0 · อ่าน 2.3–3.5 วินาที (เดสก์ท็อป ไม่ใช่ NFR-08)

## Phase 4: User Story 2 — ช่องอ่านไม่ได้ / ไม่รองรับ / อ่านรูปไม่ได้ (P1)

**Independent Test**: quickstart 2.3–2.5 · test ✗3 ✗4 ✗5 ✗10

- [X] T013 [US2] test ใน `prototype/tests/labelParser.test.js`: `FR-02 ✗3` ขาดจำนวนเม็ด/ชื่อยา → `null` + อยู่ใน `needsCheck` (ไม่เดา) · ก่อน+หลังอาหารพร้อมกัน → `timing` null · `…งอาหาร` (คำถูกบัง) → `timing` null · `FR-02 ✗10` ก่อนอาหารไม่มีนาที → `minutesBefore` null + needsCheck · "ก่อนอาหาร 30 นาที" → 30 · "ครึ่งชั่วโมง" → 30 · `FR-02 ✗4 / BR-07` เมื่อมีอาการ → `AS_NEEDED` · ซอง/ช้อน/มล. → `NOT_TABLET` · ½/ครึ่งเม็ด/0.5 → `HALF_TABLET` · `FR-02 ✗5` ข้อความว่าง/ขยะ → `found` 0 · `emptyDraft` = ทุกช่องบังคับใน needsCheck
- [X] T014 [US2] test `validateDraft` ใน `prototype/tests/medication.test.js`: ลำดับ UNSUPPORTED → MISSING → MEAL_TIMES → BEFORE_MIDNIGHT · ✗3 ขาดช่องบังคับ → MISSING + fields · ค่าขอบ `tabletsPerDose` 0/1/20/21/1.5 · `minutesBefore` 0/1/120/121 · ชื่อว่าง/ช่องว่างล้วน · ✗4 AS_NEEDED → UNSUPPORTED · `UNSUPPORTED_TEXT.AS_NEEDED` = "ระบบยังไม่รองรับยาเมื่อมีอาการ" ตรงตัว · ✗10 BEFORE_MEAL ไม่มีนาที → MISSING `minutesBefore`
- [X] T015 [US2] Implement ส่วนที่เหลือของ `parseLabel` + `validateDraft` + `UNSUPPORTED_TEXT` → T013, T014 ผ่าน
- [X] T016 [US2] C2: ช่องใน needsCheck = `.field--invalid` + "กรุณาตรวจสอบ" · banner ยาไม่รองรับ · `readLabel` ล้มเหลว หรือ `found` 0 → banner warn + ฟอร์มว่างทันที (✗5) · "กรอกเอง" ระหว่างอ่าน · ปุ่มบันทึก disabled จนผ่าน
- [X] T017 [US2] ทดสอบ Chrome อัตโนมัติ: `label-before-meal.png` (✗10) · `label-as-needed.png` (✗4) · รูปที่ไม่ใช่ฉลาก (✗5) · ตรวจว่าชื่อสมมติ/HN สมมติไม่ปรากฏในหน้าจอและ store (SC-011) · **รูปจริง 4 ใบใน `real-labels/`** (เฉพาะในเครื่อง ผลไม่เข้า repo ยกเว้นสรุปที่ไม่มีข้อมูลส่วนตัว) · **ทำจริง:** รูปจริง 4 ใบผ่านหน้าจอแอป: ร่างถูกตามที่ควร (ครบ / ไม่รองรับ / ต้องใส่นาที / อ่านไม่ได้) · ข้อมูลส่วนตัวจริงบนจอ+storage 0 ครั้ง · สรุปใน research R-0 (ไม่มีข้อมูลส่วนตัว)

## Phase 5: User Story 3 — เวลาเตือนจากฉลาก + ลบยา (P1)

**Independent Test**: quickstart 2.2–2.3, 2.7 · test ✓6 ✓8 ✓9 + BR-03 ลบ

- [X] T018 [US3] test `reminderTimes` ใน `prototype/tests/medication.test.js`: `FR-02 ✓6` หลังอาหารเช้า + เช้า 07:00 → ["07:00"] · `✓8` ก่อนอาหารเช้า 30 → ["06:30"] · `✓9` ก่อนนอน + 21:00 → ["21:00"] · หลายมื้อเรียงเวลา · มื้อเวลาซ้ำไม่ซ้ำค่า · **clarify Q1** เช้า 00:30−30 = ["00:00"] ใช้ได้ · 00:29−30 → null และ `validateDraft` = BEFORE_MIDNIGHT ["BREAKFAST"] · ข้อมูลไม่พอ → null
- [X] T019 [US3] test `removeMedication`: ลบตาม id · id ไม่พบ = เดิม · ไม่แก้ input · ลบตัวสุดท้าย = []
- [X] T020 [US3] Implement `reminderTimes`, ส่วน BEFORE_MIDNIGHT/MEAL_TIMES ของ `validateDraft`, `removeMedication` → T018, T019 ผ่าน
- [X] T021 [US3] C2: เวลาเตือนในการ์ดยาและในร่าง ("จะเตือนเวลา …") · ลบยา + dialog danger + toast · ทดสอบ Chrome: ✓6 ✓8 ✓9 · ลบ/ยกเลิกลบ

## Phase 6: Polish

- [X] T022 [P] NFR-03/ปุ่มหลัก/render ไม่วน บน C2 ทุกสถานะ (Chrome) · class ใหม่ (ถ้ามี) ใน `app.css` + `design-system.md` §2 แจ้ง D · **ทำจริง:** Chrome 17/17 (ข้อความ ≥ 18 · ชื่อยา 24 · ปุ่มหลัก 64 กว้างเต็ม · เป้าแตะ ≥ 48 · ไม่วาดซ้ำวน) · เพิ่ม `.choices/.choice` + `[hidden]` ใน app.css
- [X] T023 [P] เอกสาร: `design-system.md` §3 (C2 ทำแล้ว) · SRS §7 Golden Thread แถว FR-02 · `architecture.md` §9 · `prototype/README.md` (ลองเพิ่มยา) · `vendor/README.md` (tesseract-embed)
- [X] T024 ตรวจ 5 ความผิดพลาดของ AI + grep (`Date.now`, `import`, `innerHTML`, สีเขียนตรง) + ตรวจว่าไม่มีชื่อ/HN จากรูปจริงใน repo (`git grep` คำจากรูปจริงที่ปิดบังไว้ — ตรวจในเครื่อง ไม่พิมพ์ออก) · **ทำจริง:** ข้อมูลส่วนตัวจากรูปจริงใน repo = 0 ไฟล์ · ไม่พบ Date.now/import/innerHTML/สีเขียนตรง · reload 2 จุดในปุ่มบันทึก/ลบ · **SC-009 (analyze G2):** ชุด C2 บน Chrome แบบตัดเน็ต (proxy ปิด + DNS ปิด) ผ่าน 28/28 อ่านฉลากได้ · net-log ของหน้าเว็บมี request ออกนอกเครื่อง 0 ครั้ง (มีแค่ preconnect ของ Chrome เอง ไม่ใช่ของแอป)
- [X] T025 `node --test` + ชุด Chrome ทั้งหมด (FR-01 + FR-02) ผ่าน · HANDOFF + AI log · เสนอคำสั่ง commit · **ทำจริง:** `node --test` 117/117 · ชุด FR-01 ซ้ำ 16/17/13 + กล้องสด ผ่าน (ปรับสคริปต์เพราะหลังจับคู่ไปหน้า C2 ตามสัญญา) · HANDOFF + AI log อัปเดต

## Phase 7: งานของคน (หลัง analyze 23/10)

- [ ] T026 **(คนทำ · ส. 24)** มือถือผ่าน GitHub Pages (HTTPS · R11, SC-006): อ่านฉลากจริง 20 ใบ → จดเวลาส่งรูป → เห็นร่าง (NFR-08 · SC-007) · ชื่อยาตรงฉลาก (NFR-11 · SC-008) · ชื่อผู้ป่วย/HN ไม่โผล่ (SC-011) · ลองรูปที่อ่านไม่ได้ 1 ใบ (✗5) → จดใน `docs/04-test/nfr-08-11-label-reading.md` (แบบฟอร์มพร้อม · ช่องผล `[ทีมกรอก]`) · ห้ามจดชื่อ/HN จริง · **ก่อนวัด:** ตั้ง GitHub Pages ให้เสิร์ฟ branch ที่มี FR-02 (ตรวจ 23/10 23:25: Pages เสิร์ฟ `feat/label` แล้ว · ไฟล์ FR-02 + OCR ฝังตอบ 200)
- [ ] T027 **(B)** ยืนยัน BR-03 (ลบยา) + BR-18 ใน PR ก่อน merge (constitution: requirement ใหม่ต้องทีมอนุมัติ) · **(D)** ตรวจ `.choices/.choice` + `[hidden]` ใน `app.css`

## Dependencies

Setup → Foundational → US1 → (US2 ∥ US3 หลัง T009) → Polish · ไฟล์เดียวกันทำทีละข้อ (`labelParser.js`, `medication.js`, `screens/medication.js`) · T010 ต้องมี T001

## Coverage: AC → test

| AC / กฎ | Test | Impl |
|---|---|---|
| ✓1 · BR-04 · NFR-06 | T006, T012 | T008, T010, T011 |
| ✓2 · NFR-06 | T007, T012 | T009, T011 |
| ✗3 · BR-04, 05 (รวมเวลา 2 แบบในยาเดียว · analyze C1) | T013, T014 | T015, T016 |
| ✗4 · BR-07 | T013, T014, T017 | T015, T016 |
| ✗5 · ADR-03, 08 | T013, T017 | T010, T016 |
| ✓6 ✓8 ✓9 · BR-06 | T018, T021 | T020 |
| ✗7 | T007, T012 | T011 |
| ✗10 | T013, T014, T017 | T015 |
| BR-03 ลบ | T019, T021 | T020 |
| NFR-09 · R10b · SC-009, SC-011 | T006, T017, T024, T026 | T008, T010 |
| NFR-08 · NFR-11 · R11 มือถือ | T026 | T001, T010 |
