# HANDOFF — MedMind v2

อัปเดตทุกครั้งที่จบงาน (คนหรือ AI) · ล่าสุดอยู่บนสุด

## 2026-10-24 — A (แทน D) + Claude Code · FR-04 `/speckit-analyze` + แก้ตามผล
- analyze: 1 CRITICAL — "กินแล้ว" และ "ยังไม่กิน" รอบ T+10 ย้อนไม่ได้แต่ไม่มีการยืนยัน (ขัดกติกาวิชา) · ผู้ใช้เลือก **ยกเลิกได้ 10 วินาที** (ไม่มี dialog · ยังแตะ 1 ครั้ง)
- แก้ SRS BR-10, BR-11 (**รอ D ยืนยัน**) · spec (R1b, SC-009, edge ปิดหน้าระหว่างช่วงยกเลิก) · research R-8 · contracts (`undoConfirm`, `offerUndo`/`undoBanner`, ตารางสถานะ→class) · data-model · quickstart · tasks 21 ข้อ (เพิ่ม 2) · AI log
- "กินแล้ว" บันทึกทันที ยกเลิก = ลบ · การแจ้งผู้ดูแลจากการแตะส่งเมื่อพ้น 10 วินาที · ปิดหน้าก่อนครบ → FR-05 แจ้งที่ T+15 แทน
- ถัดไป: `/speckit-implement`

## 2026-10-24 — A (แทน D) + Claude Code · FR-04 `/speckit-tasks` (specs/004-confirm)
- `tasks.md` 19 task: Setup 1 · Foundational 2 (สถานะ/คำ BR-14) · US1 4 · US2 4 · US3 4 · Polish 4 · test ก่อนโค้ด · ตาราง AC → test ครบ ✓1 ✗2 ✓3 ✗4 ✓5 ✗6
- ถัดไป: `/speckit-analyze` → `/speckit-implement`

## 2026-10-24 — A (แทน D) + Claude Code · FR-04 `/speckit-plan` (specs/004-confirm)
- ไฟล์: `plan.md` · `research.md` (R-1…R-7) · `data-model.md` · `contracts/confirm-module.md` · `contracts/screens.md` · `quickstart.md`
- ตัดสินทางเทคนิค: `confirm` ใช้ `lateUntil` ของ doseSession (BR-15 ที่เดียว) · `notYet` คืนเวลาที่ซ่อนถึง · การซ่อนอยู่ในหน้าเว็บ ไม่บันทึก · `statusOf`/`statusLabel` ย้ายมาไว้ `confirm` (S3 ต้องใช้ก่อน FR-05 · คำ BR-14 ที่เดียว) · แจ้งผู้ดูแลผ่าน `escalation.addNotice` เมื่อมี — ก่อน FR-05 บอกผู้สูงอายุตามจริงว่ายังไม่พร้อม · S3 หน้าแรกใหม่ · S2 isStart เฉพาะมีมื้อต้องเตือน
- ต้องแก้ตอน implement: architecture §7, §8.1, §8.3, §9.1 · reminder.js ของ C (ส่วนปุ่ม/สลับหน้า)
- ถัดไป: `/speckit-tasks` · branch `feat/confirm`

## 2026-10-24 — A (แทน D ตามที่ทีมตัดสิน) + Claude Code · FR-04 `/speckit-specify` (specs/004-confirm)
- `spec.md` + `checklists/requirements.md` (ผ่านทุกข้อ) · `.specify/feature.json` → 004-confirm · AC FR-04 ✓1 ✗2 ✓3 ✗4 ✓5 ✗6 · BR-10, 11, 12, 15, 16 · NFR-02, 03, 07 · R1–R13 + R4b
- **ตัดสินแล้ว (ผู้ใช้):** หลังแตะ "ยังไม่กิน" ซ่อนมื้อนั้นจากหน้าเตือนจนรอบถัดไป (T+10 → จนพ้น T+15) · ไม่บันทึกการซ่อน
- ขอบเขต: ข้อความแจ้งผู้ดูแล (✗4, ยืนยันช้า) เขียนโดย FR-05 · feature นี้ตัดสินว่าต้องแจ้ง · S3 หน้าแรกรับสถานะว่าง/ยังไม่ถึงเวลาจาก S2 · ไม่มี dialog ก่อน "กินแล้ว" (NFR-02) · แก้/ลบการยืนยันไม่มี FR
- branch แนะนำ `feat/confirm` (แตกจาก `feat/reminder`) · ถัดไป `/speckit-plan`

## 2026-10-24 — A (แทน C ตามที่ทีมตัดสิน) + Claude Code · FR-03 analyze → implement (specs/003-reminder) — 19/19 task
- analyze: 1 CRITICAL (ปุ่ม "กินแล้ว" หลักหลายปุ่มเมื่อมื้อซ้อน ขัด constitution) + 2 MEDIUM + 4 LOW → แก้เอกสารก่อนเขียนโค้ด · ปุ่มหลักเฉพาะมื้อแรก
- ไฟล์ใหม่: `src/modules/doseSession.js` · `src/screens/reminder.js` (S2) · `tests/doseSession.test.js` (33)
- แก้: `index.html` (เปิดบรรทัดของ C) · `screens/pairing.js` (S1 ปุ่ม "หน้าเตือนกินยา" + ไป S2 เองเมื่อรอบใหม่เริ่ม) · `app.css` (`.session`, `.session-time` — **แจ้ง D**) · architecture §4.1, §7 ตารางโมดูล, §8.3, §9.1 · design-system · SRS §7 + AI log · README
- **ผลจริง:** `node --test` 151/151 · Chrome S2 35/35 · NFR-03 22/22 · ชุด FR-01/FR-02 ซ้ำผ่าน · console error 0
- **ยังขาด (คนทำ):** ฟังเสียงจริงบนมือถือ (test นับ oscillator ไม่ได้ฟัง) · NFR-02 (ผู้สูงอายุกดยืนยันใน 10 วิ) วัดหลัง FR-04 · C ตรวจ · D ตรวจ CSS
- ส่งต่อ FR-04: ลบ toast "ยังบันทึกไม่ได้ในรุ่นนี้" ใน reminder.js · ใช้ `doseSession.lateUntil` · ถ้ามี S3 ให้ใช้ `MedMind.reminder.dueKey` ไป S2
- branch: `feat/reminder` · ยังไม่ commit

## 2026-10-24 — A (แทน C) + Claude Code · FR-03 `/speckit-tasks` (specs/003-reminder)
- `tasks.md` 19 task: Setup 1 · Foundational 2 · US1 6 · US2 3 · US3 3 · Polish 4 · test ก่อนโค้ดทุก story · ตาราง AC → test ครบ ✓1 ✗2 ✓3 ✗4 ✗5
- ถัดไป: `/speckit-analyze` → `/speckit-implement`

## 2026-10-24 — A (แทน C) + Claude Code · FR-03 `/speckit-plan` (specs/003-reminder)
- ไฟล์: `plan.md` · `research.md` (R-1…R-9) · `data-model.md` · `contracts/dose-session.md` · `contracts/screens.md` · `quickstart.md`
- ตัดสินทางเทคนิค: มื้อจาก `reminderTimes` ของ FR-02 (ไม่คำนวณซ้ำ) · รอบคำนวณจากเวลา ไม่ใช้ timer · ส่งมื้อเมื่อวาน+วันนี้ (มื้อดึกข้ามเที่ยงคืน) · `lateUntil` อยู่ใน doseSession (FR-04 ใช้ร่วม) · เสียง Web Audio ไม่มีไฟล์ (ดับเบิลคลิกได้) · S2 เป็นหน้าของผู้สูงอายุหลังจับคู่ · ปุ่มก่อน FR-04 = toast ไม่เขียนข้อมูล
- ต้องแก้ตอน implement: architecture §8.3 doseSession + §9.1 · app.css `.session`/`.session-time` (แจ้ง D) · S1 ปุ่มไป S2 (pairing.js ของ A)
- ถัดไป: `/speckit-tasks` · branch `feat/reminder`

## 2026-10-24 — A (แทน C ตามที่ทีมตัดสิน) + Claude Code · FR-03 `/speckit-specify` (specs/003-reminder)
- สร้าง `specs/003-reminder/spec.md` + `checklists/requirements.md` (ผ่านทุกข้อ) · `.specify/feature.json` → 003-reminder
- อ้าง FR-03 ✓1 ✗2 ✓3 ✗4 ✗5 · BR-06, 08, 09, 16 · NFR-01, 03 · R1–R12 + R6b · ไม่มี requirement ใหม่
- **ตัดสินแล้ว (ผู้ใช้):** มื้อที่ถึง T+15 แต่ยังไม่ยืนยัน แสดงในหน้าเตือนต่อจนหมดช่วงยืนยันช้า (BR-15) เฉพาะเมื่อหน้าเตือนเปิดเพราะมีมื้ออื่นกำลังเตือน · ไม่มีเสียง (แก้ค่าขอบ ✗4 ที่ขัดกับ BR-14)
- ขอบเขต: ปุ่ม กินแล้ว/ยังไม่กิน แสดงตาม BR-09 · ผลเมื่อกด = FR-04 · แจ้งผู้ดูแลใน ✗4 = FR-05 · S2 เป็นหน้าของผู้สูงอายุหลังจับคู่จนกว่า FR-04 มี S3
- ถัดไป: `/speckit-plan` · branch แนะนำ `feat/reminder` (แตกจาก `feat/label`)

## 2026-10-23 — A + Claude Code · `/speckit-implement` 002-label (รอบหลัง analyze)
- งานของ AI ใน tasks.md ครบ (T001–T025) · เหลือ T026–T027 = งานของคน (ไม่ติ๊กแทน)
- เพิ่ม `docs/04-test/nfr-08-11-label-reading.md` แบบฟอร์มวัด NFR-08/NFR-11/SC-011 บนมือถือ 20 ใบ (ผลทุกช่อง `[ทีมกรอก]` · เจ้าของ E)
- **ตรวจพบ:** GitHub Pages ยังเสิร์ฟ branch เก่า (`prototype/src/screens/medication.js`, `pairing.js` = 404) → ผู้ใช้เปลี่ยน Pages เป็น `feat/label` แล้ว · ตรวจ 23:25 ไฟล์ FR-02 + OCR ฝังตอบ 200 · ลิงก์ที่ใช้คือ `/prototype/` (root ของ repo ไม่มีหน้า = 404 ปกติ)
- `node --test` 118/118 · branch `feat/label`

## 2026-10-23 — A + Claude Code · `/speckit-analyze` 002-label + แก้ตามผล
- ผล analyze: 0 CRITICAL · 1 HIGH · 7 MEDIUM · 5 LOW · coverage 23/25 (ที่ขาด = งานวัดของคน)
- แก้: `specs/002-label/spec.md` (C1 ยาเดียวมีเวลาได้ 1 แบบ · R10b รับเฉพาะรูปแบบยา · FR-01 ยังไม่ merge · รูปใหม่ต้องยกเลิกร่างก่อน · status · เรียง SC) · `plan.md` (เวลาอ่านครบทั้งระดับโมดูลและผ่านหน้าจอ) · `tasks.md` (T003 · T024 · เพิ่ม T026–T027) · `quickstart.md` (ข้อ 9 ตัดเน็ต) · SRS §7 + AI log
- test ใหม่: `labelParser.test.js` หลังอาหาร+ก่อนนอน → timing ว่าง · `node --test` 118/118
- SC-009 ตรวจจริง: Chrome ตัดเน็ต ชุด C2 ผ่าน 28/28 · request ออกนอกเครื่องจากหน้าเว็บ 0
- **ยังขาด:** T026 มือถือ + ฉลากจริง 20 ใบ (ส. 24) · T027 B ยืนยัน BR-03/BR-18 · D ตรวจ CSS
- branch: `feat/label` · ยังไม่ commit

## 2026-10-23 — A (แทน B ตามที่ทีมตัดสิน) + Claude Code · FR-02 plan → tasks → implement (specs/002-label) — 25/25 task
- **ADR-08 ยอมรับ:** อาจารย์ต้องการดับเบิลคลิก → OCR ฝังเป็น .js (`prototype/vendor/tesseract-embed/` 11.8 MB สร้างจาก `prototype/tools/embed-ocr.js`) โหลดเฉพาะครั้งแรกที่อ่านฉลาก
- ไฟล์ใหม่: `src/modules/labelParser.js` · `medication.js` · `readLabel.js` · `src/screens/medication.js` (C2) · `tests/labelParser.test.js` (21) · `medication.test.js` (23) · `tests/fixtures/labels.js` · `samples/` (ฉลากสมมติ 4 ใบ)
- แก้: `index.html` · `app.css` (`.choices/.choice`, `[hidden]` — **แจ้ง D**) · `screens/pairing.js` (C1 → ปุ่ม "ยาของผู้สูงอายุ") · architecture (ADR-08, §8.3, §9) · design-system · SRS (BR-03 ลบยา, §7, AI log) · READMEs
- **ความเป็นส่วนตัว:** OCR ทำ "HN"/คำนำหน้าเพี้ยน (เห็นจากรูปจริง) → ตัวแยกรับเฉพาะรูปแบบยา ไม่อ่านชื่อผู้ป่วย/HN/แพทย์ · ข้อความดิบไม่แสดงไม่เก็บ · รูปจริงอยู่ `real-labels/` (git ไม่เก็บ · ตรวจแล้ว repo มีข้อมูลจากรูปจริง 0 ไฟล์)
- **ผลจริง:** `node --test` 117/117 · Chrome ดับเบิลคลิก + OCR จริง: C2 28 ข้อผ่าน · NFR-03 17/17 · รูปจริง 4 ใบ ร่างถูกและไม่หลุดข้อมูลส่วนตัว (เดสก์ท็อป 3.0–8.8 วินาที — ไม่ใช่ NFR-08) · ชุด FR-01 + กล้องสดผ่านซ้ำ · console error 0
- **ยังขาด (คนต้องทำ):** วัด NFR-08/NFR-11 กับฉลากจริง 20 ใบ **บนมือถือ** (ส. 24) → `docs/04-test/` · B ยืนยัน BR-03 (ลบยา) + BR-18 · D ตรวจ CSS ใหม่ · ทดสอบมือตาม `specs/002-label/quickstart.md`
- branch: `feat/label` · ยังไม่ commit

## 2026-10-23 — A (แทน B ตามที่ทีมตัดสิน) + Claude Code · `/speckit-specify` + `/speckit-clarify` specs/002-label (FR-02)
- branch: `feat/label` (แตกจาก `feat/pairing`) · ไฟล์: `specs/002-label/spec.md`, `checklists/requirements.md` (ผ่านครบ) · `.gitignore` เพิ่ม `real-labels/`
- **ADR-08 ตัดสินแล้ว (A 23/10):** อาจารย์ต้องการเปิดแบบดับเบิลคลิก → OCR ต้องทำงานบน `file://` (แก้ ADR-08 ใน plan)
- clarify 4 ข้อ: ก่อนอาหาร N นาทีแล้วตกก่อนเที่ยงคืน = บันทึกไม่ได้ · **ลบยาได้ (เพิ่มใน BR-03 — B ต้องยืนยัน)** · ฉลากตัวอย่างใน `prototype/samples/` + รูปจริงสำหรับทดสอบมือ/วัด NFR · **ไม่อ่านชื่อผู้ป่วย/HN เข้าระบบ** (NFR-09 · R10b · SC-011)
- **รอ:** ผู้ใช้ส่งรูปฉลากจริง 2–3 ใบ (ปิดชื่อ/HN) เพื่อออกแบบตัวแยกข้อความ · วางรูปจริงที่ `real-labels/` (git ไม่เก็บ)
- ถัดไป: `/speckit-plan` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · เพิ่มกล้องสดสแกน QR (FR-01 ✓3 ✗7) — แก้ ADR-07
- **เหตุ:** ผู้ใช้ทดสอบบนมือถือแล้วไม่เห็นภาพกล้อง — ร่างแรกของ AI ใช้ "ถ่าย/เลือกรูป" เพราะตีความว่ากล้องสดไม่จำเป็น แต่ AC ✗7 พูดถึง "ไม่อนุญาตกล้อง" → ผู้ใช้เลือกทำกล้องสด (ตัวเลือก A)
- ไฟล์: `prototype/src/screens/pairing.js` (T039) · `app.css` `.scanner` (T040) · แก้ ADR-07, research R-2, screens.md, quickstart ข้อ 0, README, design-system §2 (T041) · `tasks.md` เพิ่ม T039–T042 · ไม่เพิ่ม dependency (jsQR เดิม) · ไม่แตะโมดูลกฎ
- **ผลจริง:** `node --test` 73/73 ผ่าน · Chrome + กล้องปลอม (วิดีโอ QR): เปิดกล้องหลัง ไม่เสียง · สแกนก่อนยินยอม = ปฏิเสธ · ยินยอมแล้ว = จับคู่ · ไฟกล้องดับหลังเจอ/จับคู่/กดปิด · เวลาจำลองเดินไม่ทำให้กล้องหาย · ล็อกแล้วปุ่ม disabled · ไม่อนุญาตกล้อง = "อ่าน QR ไม่ได้…" ไม่นับครั้งผิด · ไม่มี API = ถอยไปรูป · ชุดเดิม US1 16 · US2 17 · US3 13 · NFR-03 27 ผ่านซ้ำ · console error 0
- **ยังขาด (คนต้องทำ):** ทดสอบกล้องสดบนมือถือจริงผ่านลิงก์ HTTPS (quickstart ข้อ 0) — **ลิงก์ Pages ยังชี้ `feat/foundation` ต้อง push `feat/pairing` แล้วสลับ Pages ไป branch นั้น ไม่งั้นมือถือเห็นเวอร์ชันเก่าที่ไม่มีหน้าจับคู่เลย** · ผลทดสอบมือถือ = `[ทีมกรอก]` · ข้อจำกัดที่ยังไม่ได้ทดสอบ: iOS Safari (กล้องหลัง/autoplay)
- branch: `feat/pairing` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · `/speckit-implement` 001-pairing (FR-01) — ทำครบ 38/38 task
- ไฟล์ใหม่: `prototype/src/modules/pairing.js` · `qrScan.js` · `prototype/src/screens/pairing.js` (S1, C1) · `prototype/tests/pairing.test.js` (44) · `qrScan.test.js` (6)
- แก้: `index.html` (เปิด 5 บรรทัดของ A) · `tokens.css` (`--qr-size`) · `app.css` (`.qr`, `.invite-code`, `.field__input--code` — **แจ้ง D**) ·
  `design-system.md` §2 + §3 · `architecture.md` §8.3 + §9 · SRS §7 Golden Thread แถว FR-01 · `prototype/README.md` (วิธีลองจับคู่) · specs/001 (tasks, research, contracts, data-model)
- FR/NFR: FR-01 ✓1 ✗2 ✓3 ✗4 ✗5 ✗6 ✗7 ✗8 · BR-01, 02, 17, 18 · NFR-03, 04, 05, 09, 10
- **ผล test จริง:** `node --test` → **73/73 ผ่าน** (Foundation 23 + FR-01 50) · Chrome headless อัตโนมัติ: US1 16/16 · US2 17/17 · US3 13/13 · NFR-03/ปุ่มหลัก/render ไม่วน 27/27 · console error 0
- **บั๊กที่ test จับได้ระหว่างทำ:** กฎ "ตัดครั้งผิดที่เก่ากว่า 10 นาที" (ที่ AI เขียนใน plan) ทำให้ปลดล็อกก่อนเวลา → แก้เป็น 20 นาที + อธิบายใน research R-3
- เบี่ยงจาก tasks: ทำ `canAccess`/`isSeniorPaired` ก่อนหน้าจอ (หน้าจอต้องใช้) · T023 ไม่ต้องแก้
- **ยังขาด (คนต้องทำ):**
  - ทดสอบมือโดยคนตาม `specs/001-pairing/quickstart.md` โดยเฉพาะข้อ 4 (2 แท็บจริง) และข้อ 3.4 (สแกนจากมือถือจริงผ่าน GitHub Pages + จับเวลา) → จดผลจริง
  - D: ตรวจ class/token ใหม่ใน `app.css`/`tokens.css` · B, C, D, E: หน้าจอของตัวเองต้องทำตาม `architecture.md` §8.5
  - ปุ่มหลัก S1 ข้อความยาว ขึ้น 2 บรรทัด (ใช้ได้ ผ่าน NFR-03) → พิจารณาตอน professional pass
- branch: `feat/pairing` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · `/speckit-analyze` 001-pairing + แก้ตามผล
- ผล analyze: CRITICAL 0 · HIGH 3 · MEDIUM 4 · LOW 6 · coverage 100% (16 requirement / 38 task)
- แก้แล้ว 12 ข้อ:
  - `tasks.md` เพิ่ม "กติกาหน้าจอ S1/C1" 6 ข้อ: render เรียกซ้ำได้ผลเดิม · ห้าม `store.reload()` ใน render (ไม่งั้นวนไม่จบ) · เขียน store เฉพาะเมื่อค่าเปลี่ยน · สี canvas จาก token · ปุ่มหลัก ≤ 1 · feedback ทุกการกระทำ
  - T013 ไม่เปิด script หน้าจอก่อนมีไฟล์ (กัน 404) · T014 toast "สร้างรหัสใหม่แล้ว" · T015 ปุ่ม "เชื่อมต่อ" เป็นปุ่มรอง + ไปหน้าแรกผู้ดูแลหลังจับคู่ · T026 จับเวลาอ่าน QR · T037 grep สีเขียนตรง/`reload` ใน render + ตรวจ render ไม่วน
  - spec Assumptions อ้าง contracts แทนรายชื่อเก่า · data-model: Devices = SENIOR + CAREGIVER · ปุ่ม "สร้างรหัสใหม่" ทั้ง 2 สถานะรอ · รหัส 6 หลักใช้ `--text-2xl` ตาม design-system · research R-7 ชี้ชัดว่า reload เฉพาะในปุ่ม
- ไม่แก้ (ตามที่ตัดสินแล้ว): E2 — `NO_CONSENT` นับเป็นครั้งผิดตาม BR-18 "ทุกเหตุผล" → **B ควรรู้ตอนยืนยัน BR-18** (ผู้ดูแลที่กดซ้ำระหว่างรอยินยอม 5 ครั้งจะถูกล็อก)
- ถัดไป: `/speckit-implement` · branch: `feat/pairing` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · `/speckit-tasks` specs/001-pairing (FR-01)
- ไฟล์: `specs/001-pairing/tasks.md` — 38 task (Setup 3 · Foundational 2 · US1 11 · US2 10 · US3 5 · Polish 7) · test บังคับตาม constitution III เขียนก่อน implement
- ตาราง AC → test task ครบ ✓1–✗8 · MVP = Phase 1–3 (จับคู่ด้วยรหัส) แต่ demo M3 ต้องครบทั้ง 3 story (P1 ทั้งหมด)
- ถัดไป: `/speckit-analyze` → `/speckit-implement` · branch: `feat/pairing` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · `/speckit-plan` specs/001-pairing (FR-01)
- ไฟล์ใหม่: `specs/001-pairing/plan.md` · `research.md` · `data-model.md` · `contracts/pairing-module.md` · `contracts/screens.md` · `quickstart.md`
- แก้: `architecture.md` §8.1 (ข้อยกเว้น `reasonText`) · §8.3 (**กฎล็อกนับจากครั้งผิดล่าสุด** — แบบเดิมปลดล็อกก่อนเวลา · `consent(invites, code, now)` · operation เสริม) · `spec.md` 001 R9 (ถ้อยคำ) · SRS AI log
- ตรวจ: Mermaid 9 รูป (architecture 8 + data-model 1) เรนเดอร์ผ่าน · test: ยังไม่มี (ยังไม่เขียนโค้ด)
- **ตัดสินแล้ว (ผู้ใช้ให้ AI "เลือกแนวทางที่ถูกต้องที่สุด"):**
  - เพิ่ม `prototype/vendor/qrcode/qrcode.js` (qrcode-generator 1.4.4, MIT) + LICENSE · sha512 ตรง registry · สร้าง→อ่านกลับด้วย jsQR ผ่าน ·
    บันทึกใน vendor/README, TEAM-PLAN ข้อ 4, ADR-07 · สัญญา `qrSvg` → `qrMatrix` (วาดลง canvas เพราะ shell ห้าม innerHTML)
  - ข้อตกลงหน้าจอเป็น `architecture.md` §8.5 (บังคับ B, C, D, E)
  - CLAUDE.md โครงสร้าง repo แก้ให้ตรง Foundation · constitution 1.0.0 → 1.0.1 (PATCH หลักการ III ชี้ `src/modules/`)
- ยังขาด: B–E รับทราบ §8.5 · ทีมอนุมัติ constitution 1.0.1 ใน PR · test 23/23 ผ่าน (Foundation · ยังไม่มีของ FR-01)
- ถัดไป: `/speckit-tasks` · branch: `feat/pairing` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · `/speckit-clarify` specs/001-pairing (FR-01)
- ถาม 4 ข้อ: ลำดับเหตุผลปฏิเสธ · อีกฝั่งเห็นอะไรเมื่อถูกยกเลิก · จำกัดการเดารหัส (→ **BR-18 + AC ✗8 ใหม่**) · สร้างรหัสใหม่ = รหัสเดิมเป็นโมฆะ (→ เพิ่มใน BR-01)
- ไฟล์: `specs/001-pairing/spec.md` (Clarifications, Edge Cases, R1/R4/R9, PairAttempt, SC-007, Assumptions) · `checklists/requirements.md` ·
  `docs/02-requirements/spec.md` (BR-01, BR-18, FR-01 ✗8, AI log) · `docs/03-design/architecture.md` (PAIR_ATTEMPT, Seq 4.3 LOCKED, สัญญา `pair`/`lockedUntil`/`newInvite`)
- **สัญญาเปลี่ยน:** `newInvite(invites, seniorId, now, random)` → `{ invite, invites }` · `pair(state={invites,pairing,pairAttempts}, ...)`
- **ต้องตัดสิน:** B (เจ้าของ SRS) ยืนยัน BR-18/✗8 และส่วนเพิ่มของ BR-01 — เพิ่มหลังเวลาล็อก FR/AC → แจ้งทีม
- test: ไม่มี (เอกสาร) · ถัดไป: `/speckit-plan`
- branch: `feat/pairing` · ยังไม่ commit

## 2026-10-22 — A + Claude Code · `/speckit-specify` specs/001-pairing (FR-01)
- ไฟล์: `specs/001-pairing/spec.md` · `specs/001-pairing/checklists/requirements.md` · `.specify/feature.json`
- FR/NFR: FR-01 (AC ✓1 ✗2 ✓3 ✗4 ✗5 ✗6 ✗7) · BR-01, 02, 17 · NFR-04, 05, 10 · ไม่มี requirement ใหม่ · ไม่มี [NEEDS CLARIFICATION]
- ตีความที่ไม่มี AC รองรับ 2 ข้อ (ใน Assumptions): "สร้างรหัสใหม่ทำให้รหัสเดิมเป็นโมฆะ" · "ยกเลิกแล้วไม่ยืนยัน = ไม่เปลี่ยนอะไร" → ถ้าทีมต้องการเป็น AC ทางการ แก้ `docs/02-requirements/spec.md`
- ตัวเลือกที่ไม่ได้พิมพ์คำอธิบายหลัง `/speckit-specify` → ใช้ prompt ต้นแบบ TEAM-PLAN ข้อ 6
- ถัดไป: `/speckit-clarify` → `/speckit-plan` → `/speckit-checklist` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`
- branch: `feat/pairing` (แตกจาก `design/architecture`) · ยังไม่ commit

## 2026-10-22 — A + Claude Code · เปิด GitHub Pages
- ลิงก์: https://yaroo393-png.github.io/MedMind_webapp/prototype/ (+ `?role=senior`, `?role=caregiver`) · ตรวจแล้ว: หน้าและไฟล์ src ตอบ 200
- ตั้งค่า: Settings → Pages → branch `feat/foundation` / root (ชั่วคราว) · **ต้องเปลี่ยนเป็น `main` หลัง merge** ไม่งั้นลิงก์ค้างเวอร์ชันเก่า
- ไฟล์: `prototype/README.md` (ใส่ลิงก์) · branch: ยังไม่ commit
- ยังขาด: ทดสอบสแกน QR/ถ่ายฉลากบนมือถือจริงผ่านลิงก์นี้ (SCHEDULE พฤ./ส.) · คำตอบอาจารย์เรื่องส่งลิงก์แทนดับเบิลคลิก (ADR-08)

## 2026-10-22 — A (YAR OO) แทน C + Claude Code · architecture.md v1.0 + สัญญาข้อมูล
- ไฟล์: `docs/03-design/architecture.md` (ใหม่) · `spec.md` §7 (คอลัมน์ Design) + §8 (AI log)
- เนื้อหา: 3 ชั้น + deployment · ADR-01–08 พร้อมทางเลือกที่ปฏิเสธ · Use Case (UC-1–7) · Sequence 4.1 เตือน→ยืนยัน→แจ้ง, 4.2 เพิ่มยา, 4.3 จับคู่ ·
  State มื้อยา · ERD 8 entity · module/coupling · **§8 สัญญาข้อมูล: ชื่อชุดข้อมูลใน store + operation (input/output/AC) ของทุกโมดูล A–E** · coverage + traceability
- ต่างจาก v1: ตัดฟิลด์ความถี่/วันเริ่ม–สิ้นสุด (gold-plating) · ค่าที่คำนวณได้ไม่เป็นฟิลด์ (เวลาเตือน, สถานะ, รอบ) · DOSE_SESSION เป็นค่าคำนวณ ไม่ใช่ entity ที่เก็บ · consentAt อยู่ที่ InviteCode
- ตรวจ: Mermaid 8 รูปเรนเดอร์ผ่าน (mermaid 10.9.1 ใน Chrome headless) · test: ไม่มี (เอกสาร)
- ยังขาด / ต้องตัดสิน:
  - **ADR-08 สถานะ "เสนอ":** รอ B, D ยืนยันวิธี OCR แบบดับเบิลคลิก + คำตอบอาจารย์เรื่องลิงก์ GitHub Pages (A)
  - เจ้าของโมดูลแต่ละคนตรวจสัญญา §8.3 ของตัวเองก่อน `/speckit-plan` · เปลี่ยนสัญญาต้องแจ้งทุกคน
  - §8.4 ใครเรียก `escalate` ตามเวลา: C กับ E ตกลงตอน implement
- branch / PR: ยังไม่ commit · แนะนำ branch `design/architecture`

## 2026-10-22 — A (YAR OO) แทน D + Claude Code · Foundation ของ prototype
- ไฟล์ใหม่: `prototype/index.html` · `prototype/README.md` · `prototype/src/core/{events,clock,store}.js` · `prototype/src/ui/{tokens.css,app.css,shell.js}` ·
  `prototype/tests/foundation.test.js` · `docs/03-design/design-system.md` (v0.1) · `.gitignore`
- แก้: `CLAUDE.md` (คำสั่ง test → `node --test` ที่ root) · `spec.md` §8 (AI log)
- FR/NFR ที่ครอบ: ใช้ร่วม FR-01–05 · NFR-01 (นาฬิกาจำลอง) · NFR-03 (token ขนาด/สี) · NFR-09/10 (store.reset ลบข้อมูล) · SRS §2.2 (2 โทรศัพท์ไม่มี server)
- test: `node --test` **23/23 ผ่าน** (Node 24.22, รันจริง) · ใส่ path `node --test prototype/tests` = fail (ตามที่ TEAM-PLAN เตือน)
- ตรวจในเบราว์เซอร์ (Chrome headless, `file://`): ไม่มี error ใน console · 2 โทรศัพท์ + ป้าย Covers แสดง · +5 นาทีทำงาน · toast · dialog ล้างข้อมูลโฟกัส "ยกเลิก" ·
  จอ 622 px สลับแท็บได้ ไม่ล้นจอ (Chrome headless บังคับกว้างขั้นต่ำ 504 px — ยังไม่ได้ลองจอ 360–390 px จริง)
- **เพิ่ม (ตามที่ผู้ใช้ขอ):** เปิดแยกหน้า `index.html?role=senior` / `?role=caregiver` + ลิงก์ "เปิด:" บนแถบทดลอง · ซิงก์ข้อมูล เวลาจำลอง และการล้างข้อมูลข้ามแท็บ
  · ทดสอบจริง (Chrome headless, 2 iframe จาก `file://`): ฝั่งผู้ดูแลเห็นข้อมูลที่ฝั่งผู้สูงอายุเขียน · เวลา 16:51 → 16:56 ตามกัน · ล้างข้อมูลแล้วอีกฝั่งกลับหน้าแรก · ไม่มี error
  · ข้อควรระวังของ feature: ทุกหน้ารันกฎพร้อมกัน → ผลของกฎต้องเก็บใน store แบบทำซ้ำไม่เพิ่ม (README ส่วน "เขียนหน้าจอ")
- **ทีมยืนยันแทน D (22/10):** reference app + token สีตาม `design-system.md`
- ยังขาด / ต้องตัดสิน:
  - **ADR (C):** แสดง 2 โทรศัพท์ในหน้าเดียว + เปิดแยกหน้าได้ (เลือกแล้วใน Foundation) vs หน้าเลือกบทบาท · นาฬิกาจำลอง · OCR แบบ `file://` (ดูรายการ OCR ด้านล่าง)
  - **GitHub Pages:** Settings → Pages → Deploy from branch `main` / root (ต้องทำหลัง merge · เจ้าของ repo)
  - `user-flow.md` + wireframe (D) ยังไม่มี
  - สัญญาข้อมูล (ชื่อชุดข้อมูลใน store + ฟิลด์) ใน `architecture.md` (C) — feature ต้องรอหรือใช้ข้อมูลจำลอง
- branch / PR: ยังไม่ commit · แนะนำ branch `feat/foundation` แยกจาก `srs/spec` (SRS commit แล้วที่ `c6d9df5`)

## 2026-10-22 — A (YAR OO) แทน B + Claude Code · ร่าง SRS v1.0
- **การตัดสินใจของทีม (22/10):** A ทำงานที่เหลือของทุกคนในบัญชี A และระบุเจ้าของส่วนไว้ในไฟล์ (คอมเมนต์ `<!-- เจ้าของ ... -->`)
  · ความเสี่ยงที่ทีมรับทราบ: คะแนนรายคนคิดจาก commit ในบัญชีตัวเอง (ไม่มีร่องรอย = ×0.4) และขัด constitution ข้อ "สมาชิก commit งานตามบทบาท"
- ไฟล์ที่เปลี่ยน: `docs/02-requirements/spec.md` (ใหม่) · `HANDOFF.md`
- FR/NFR ที่ครอบ: FR-01–08 (Must 5) · BR-01–17 · NFR-01–11 · UC-1–7
- ต่างจาก v1: AC ใหม่ FR-01 ✗7 · FR-03 ✗5 · FR-05 ✗7 (ทางสำรอง/ว่าง) · NFR-11 (จาก Charter §7) · NFR-08/11 วัดได้จริงเทอมนี้ · ตัด SHOULD-01..09 ที่ไม่มีหลักฐาน · SDLC = Agile
- test: ไม่มี (งานเอกสาร)
- ยังขาด / ต้องตัดสิน: เจ้าของ FR แต่ละข้อตรวจ AC · backlog.md (B) · ล็อก FR/AC (เลยเที่ยงพฤหัสแล้ว — PM กำหนดเวลาใหม่) · ช่อง "ทีมแก้/ตรวจอะไร" ใน AI log
- branch / PR: `srs/spec` (แตกจาก `m1/charter`) · ยังไม่ commit
- AI log: ย้ายแถว 21–22/10 เข้า `spec.md` §8 แล้ว

## 2026-10-22 — A (PM) + Claude Code · ทดลอง OCR แบบเปิดดับเบิลคลิก (`file://`) · เกี่ยวกับ FR-02 (เจ้าของ: B) · vendor (D) · ADR (C)
- ผล (รันจริง Chrome headless บน Windows, ไฟล์ทดลองอยู่ใน scratchpad ไม่อยู่ใน repo): **อ่านข้อความไทย 3 บรรทัดจาก canvas ถูกทั้งหมด ~0.45 วินาที**
  `"พาราเซตามอล 500 มก.\nครั้งละ 1 เม็ด หลังอาหาร\nเช้า กลางวัน เย็น"`
- วิธีที่ใช้ได้ (Tesseract.js 5.1.1 ใน `prototype/vendor/` · ไม่แก้ไฟล์ vendor):
  1. แปลง `tha/eng.traineddata`, `worker.min.js`, `core/tesseract-core-simd-lstm.wasm.js` เป็นไฟล์ `.js` ที่เก็บ base64 แล้วโหลดด้วย `<script src>`
  2. ส่งภาษาเป็น `[{code:'tha', data:Uint8Array}, ...]` แทนการ fetch · `cacheMethod:'none'`
  3. สร้าง worker จาก Blob เดียว = core + worker · `workerBlobURL:false` (เปิดจาก `file://` โหลด worker/core แยกไฟล์ไม่ได้)
  4. แก้บั๊ก 5.1.1 ในหน่วยความจำ: ตอน initialize ใช้ `t.data` แทน `t.code` → replace ข้อความใน worker ก่อนสร้าง Blob
- ที่ล้มเหลวระหว่างทาง: `importScripts` จาก `file://` ถูกบล็อก · `importScripts` blob ของหน้าเว็บจากใน worker ถูกบล็อก · initialize ล้มเพราะบั๊กข้อ 4
- ข้อจำกัด: ยังไม่ทดสอบกับรูปถ่ายฉลากจริง · Edge/Firefox/มือถือ · หน้าโหลด base64 ~12 MB · การแก้ข้อ 4 ผูกกับ 5.1.1 · กล้องบนมือถือยังต้องใช้ GitHub Pages (มือถือเปิดไฟล์ดับเบิลคลิกไม่ได้)
- ต้องตัดสิน: B + D ว่าจะใช้วิธีนี้เป็นทางสำรองสำหรับ `file://` ไหม · C เขียน ADR (ทางเลือก: วิธีนี้ / GitHub Pages อย่างเดียว / กรอกเอง)
- AI log: 2026-10-22 · A · Claude Code (Opus 5.5) · ขอหาวิธีให้ OCR ทำงานตอนดับเบิลคลิก · ได้วิธีข้างบน + ผลทดสอบจริง · ทีมแก้/ตรวจ: [ผู้ใช้กรอก] · บทเรียน: [ผู้ใช้กรอก]

## 2026-10-21 — A (PM) + Claude Code · ร่าง M1 Charter
- ไฟล์ที่เปลี่ยน: `docs/01-charter/charter.md` (ใหม่) · `HANDOFF.md`
- FR/NFR ที่ครอบ: ร่าง MVP FR-01–FR-05 (จาก v1 · รหัสสุดท้ายรอ `spec.md` ของ B) · ตัววัด "≥ 4/5 คนยืนยันใน 10 วินาที" (NFR usability จาก v1)
- test: ไม่มี (งานเอกสาร)
- ตามหลังตาราง: Charter ควรเริ่ม อ. 20 และร่างครบ พ. 21 → วันนี้ได้ร่างแรก ยังต้องกรอก `[ทีมกรอก]`
- ยังขาด / ต้องตัดสิน:
  - ชื่อ + ช่องทางติดต่อผู้ใช้จริง 3 คน (Gate 1 · rubric ข้อ 2) → ถามอาจารย์ว่าเก็บนอก repo ได้ไหม (PDPA)
  - หลักฐานชั้น A + ตัวเลข TAM พร้อมแหล่ง (Scorecard ข้อ 6 ยังว่าง · รวมตอนนี้ 14 + ข้อ 6 ต้อง ≥ 15)
  - ทีมยืนยันคะแนน Scorecard ทุกข้อ · คำตัดสิน GO · ชื่อสมาชิก + บทบาท · เป้าหมายตัววัด
  - 5 Whys ข้อ 5 ต้องยืนยันกับผู้ให้สัมภาษณ์ 2
  - M1 กำหนด Charter "1 หน้า" → ส่วนที่ 1 คือหน้าที่ส่ง · ส่วนที่ 2 เป็นงานรองรับ (ทีมตัดสินว่าแนบหรือไม่)
  - งานอื่นของ A วันนี้: ถามอาจารย์เรื่องส่งลิงก์ GitHub Pages · `/speckit-specify` 001-pairing รอ `spec.md` (B)
- branch / PR: `m1/charter` · ยังไม่ commit
- AI log (ย้ายเข้า `spec.md` §AI log เมื่อ B สร้างไฟล์):

| วันที่ | ใคร | เครื่องมือ | ขออะไร | ได้อะไร | ทีมแก้/ตรวจอะไร | บทเรียน |
|---|---|---|---|---|---|---|
| 2026-10-21 | A | Claude Code (Opus 5.5) · `/medmind-next A` | ร่าง Charter ตาม ROADMAP ขั้น 1 + M1 จากผลสัมภาษณ์ | `charter.md` ส่วน Charter 1 หน้า + 5 Whys, Litmus, TAM (ว่าง), Scorecard ที่ AI เสนอ, Problem Brief | [ผู้ใช้กรอก] | [ผู้ใช้กรอก] |

## [YYYY-MM-DD] — [ใคร] · [งานอะไร]
- ไฟล์ที่เปลี่ยน:
- FR/NFR ที่ครอบ:
- test: [ผลจริง เช่น node --test 12/12 ผ่าน] หรือ "ยังไม่มี"
- ยังขาด / ต้องตัดสิน:
- branch / PR:

## สถานะรวม
| ขั้น | สถานะ |
|---|---|
| 0 ตั้ง repo | ☐ |
| 1 M1 Charter | ☐ |
| 2 M2 SRS | ☐ |
| 3 M2 Design | ☐ |
| 4 Prototype + test | ☐ |
| 5 Validation | ☐ |
| 6 ส่งงาน | ☐ |
