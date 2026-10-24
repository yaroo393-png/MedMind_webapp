# Product Backlog — MedMind

<!-- เจ้าของ: B (Suchitra Khomdee · SRS ส่วนกลาง) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · อัปเดต 25/10/69 -->

**Product Owner:** [ทีมกรอก] · **SDLC:** Agile แบบ iterative — 1 Must FR = 1 increment (Charter §5) · **ต้นฉบับ requirement:** [`spec.md`](spec.md)

> **Requirement ≠ Feature ≠ Backlog** — requirement (FR/BR/NFR/AC) อยู่ใน `spec.md` · backlog นี้บอกแค่ **ทำอะไรก่อนหลัง สถานะ และหลักฐานว่าเสร็จ** ·
> ไม่ตั้งรหัส requirement ใหม่ (constitution I) — ทุกแถวอ้างรหัสใน `spec.md`

---

## 1. Definition of Ready / Done

| | เกณฑ์ (constitution · SE-COURSE-PRINCIPLES หัวข้อ 9) |
|---|---|
| **Ready** — เริ่มทำได้เมื่อ | ผู้ใช้และคุณค่าชัด (user story + ปัญหาที่แก้) · มี AC แบบ Given–When–Then ทั้ง happy และ edge · เห็นความเสี่ยง · ชิ้นเล็กพอสำหรับ 1 increment |
| **Done** — ปิดได้เมื่อ | ผ่าน AC และ `node --test` (ผลรันจริง) · คลิก happy + error/empty state ใน prototype แบบดับเบิลคลิก · console ไม่มี error · ผ่านเช็ก privacy (constitution V) · `architecture.md`, `design-system.md`, Golden Thread (`spec.md` §7) อัปเดต · AI log อัปเดต · review แล้วและ merge ผ่าน PR |

---

## 2. Product backlog (เรียงตามลำดับทำ)

| ลำดับ | รายการ | MoSCoW | ปัญหาที่แก้ | Increment · Spec Kit | สถานะ | หลักฐานว่าเสร็จ (รันจริง) | เจ้าของ |
|---|---|---|---|---|---|---|---|
| 0 | Foundation: shell 2 เครื่อง · นาฬิกาจำลอง · ที่เก็บข้อมูล · tokens | (รองรับทุก FR · ADR-02, ADR-06) | demo 2 ฝั่งได้โดยไม่มี server | `feat/foundation` · PR #3 | ✅ Done 22/10 | `foundation.test.js` 23 test | D |
| 1 | **FR-01** จับคู่ Senior–Caregiver (QR / รหัส 6 หลัก · ยินยอมก่อน · ยกเลิก = ลบข้อมูล) | Must | ผู้สูงอายุไม่สะดวกสมัครบัญชี · ผู้ดูแลไม่อยู่ด้วย | `specs/001-pairing` · PR #5, #6 | ✅ Done 22/10 | `pairing.test.js` + `qrScan.test.js` 50 test (AC ✓1–✗8) | A |
| 2 | **FR-02** เพิ่มยาจากฉลาก → ร่าง → ผู้ดูแลตรวจ → บันทึก | Must | ผู้ดูแลกรอกข้อมูลยาเองยาก | `specs/002-label` · PR #7 | ✅ Done 23/10 | `labelParser.test.js` + `medication.test.js` 45 test (AC ✓1–✗10) | B |
| 3 | **FR-03** เตือนตามมื้อ ยาทั้งมื้อหน้าเดียว + เสียง · เตือนซ้ำ T+5, T+10 | Must | ลืมกินยา · ปิดเสียงเตือนแล้วลืม | `specs/003-reminder` · PR #8 | ✅ Done 24/10 | `doseSession.test.js` 33 test (AC ✓1–✗5) | C |
| 4 | **FR-04** "กินแล้ว" 1 แตะ ทั้งมื้อ · "ยังไม่กิน" · ยืนยันช้า · ยกเลิก 10 วินาที | Must | จำไม่ได้ว่ากินแล้วหรือยัง | `specs/004-confirm` · PR #9 | ✅ Done 24/10 | `confirm.test.js` 33 test (AC ✓1–✗6) | D |
| 5 | **FR-05** แจ้งผู้ดูแลที่ T+15 (1 ครั้ง/มื้อ) · แจ้งเมื่อยืนยันช้า · สถานะรายวัน | Must | ต้องโทร/LINE ถาม ~5–6 ครั้ง/สัปดาห์ | `specs/005-status` · PR #10 (spec–tasks) + PR ถัดไป (โค้ด) | 🟡 โค้ดเสร็จ รอ merge | `escalation.test.js` 30 test (AC ✓1–✗7) | E |
| 6 | FR-06 ผู้ดูแลหลายคนต่อผู้สูงอายุ | Should | ติดประชุมโทรไม่ได้ ให้คนที่ว่างดูแทน | — | ⬜ หลัง MVP · ต้องเขียน AC + แก้ BR-02 ก่อน (DoR) | — | [ทีมกรอก] |
| 7 | FR-07 รายการยาทั้งหมดของผู้สูงอายุ | Could | "มื้อนี้ต้องกินยาอะไร" โดยไม่รอเตือน | — | ⬜ หลัง MVP · S3 แสดงยาของทุกมื้อวันนี้แล้วบางส่วน — ทบทวนว่ายังต้องมีหรือไม่ | — | [ทีมกรอก] |
| 8 | FR-08 รูปยาบนหน้าเตือน | Could | หยิบยาถูกเม็ด | — | ⬜ หลัง MVP · ต้องมีแหล่งรูปที่เชื่อถือได้ | — | [ทีมกรอก] |

`node --test` รวมทั้งหมด 214/214 ผ่าน (รันจริง 24/10/69 บน branch `feat/status`) · ขั้นตอนลองแต่ละ FR: `prototype/README.md`

---

## 3. Validation backlog — ต้องใช้คนจริง (AI วัดแทนไม่ได้)

ผลที่ยังไม่ได้วัดเขียน "ยังไม่ได้วัด" · ห้ามแต่งตัวเลข (constitution IV)

| รายการ | วัดอะไร | เกณฑ์ (จาก `spec.md`) | แบบฟอร์ม | สถานะ | ผล |
|---|---|---|---|---|---|
| NFR-02 usability | ผู้สูงอายุจริง 5 คน think-aloud ยืนยันจากหน้าเตือน + SUS | ≥ 4/5 คนยืนยันได้ใน 10 วินาที | `docs/04-test/` [ทีมกรอก] | ⬜ ยังไม่ได้วัด | [ทีมกรอก] |
| NFR-08, NFR-11 อ่านฉลาก | ฉลากจริง 20 ใบบนมือถือ | ตาม NFR-08/11 ใน `spec.md` | [`docs/04-test/nfr-08-11-label-reading.md`](../04-test/nfr-08-11-label-reading.md) | ⬜ ยังไม่ได้วัด | [ทีมกรอก] |
| FR-05 SC-008 | ผู้ดูแลจริงตอบ "วันนี้กินครบไหม" จากหน้าสถานะโดยไม่โทรถาม | ตอบถูกโดยไม่โทร | `docs/04-test/` [ทีมกรอก] | ⬜ ยังไม่ได้วัด | [ทีมกรอก] |
| FR-01 ข้าม 2 มือถือ | สแกน QR จากอีกเครื่องจริง | จับคู่สำเร็จ (✓3) | quickstart `specs/001-pairing` | ⬜ ยังไม่ได้ทดสอบ | [ทีมกรอก] |
| FR-03 เสียงบนมือถือจริง | ได้ยินเสียงเตือนหลังแตะหน้าจอครั้งแรก | BR-09 | quickstart `specs/003-reminder` | ⬜ ยังไม่ได้ทดสอบ | [ทีมกรอก] |
| FR-04, FR-05 2 แท็บจริง | ยืนยัน/แจ้งจาก 2 แท็บพร้อมกัน | 1 ระเบียนต่อมื้อ (NFR-07 · BR-13) | quickstart 004 §2.7 · 005 §2.11 | ⬜ ยังไม่ได้ทดสอบ (มีแบบจำลองอัตโนมัติแล้ว) | [ทีมกรอก] |
| Heuristic evaluation | Nielsen 10 ข้อ โดยทีมอื่น + ระดับความรุนแรง | — (เกณฑ์วิชา หัวข้อ 7) | `docs/04-test/` [ทีมกรอก] | ⬜ ยังไม่ได้ทำ | [ทีมกรอก] |

---

## 4. ข้อที่รอเจ้าของ requirement ยืนยัน (ก่อน merge ครั้งสุดท้าย)

| ข้อ | เปลี่ยนอะไร | ที่มา | รอใคร |
|---|---|---|---|
| BR-03 | ลบยาได้ (clarify 002) | `specs/002-label` | B |
| BR-18 | ล็อกการเดารหัส 10 นาทีหลังผิด 5 ครั้ง (clarify 001) | `specs/001-pairing` | B (เจ้าของ SRS) |
| BR-10, BR-11 | ยกเลิกได้ 10 วินาทีหลังแตะ (analyze 004) | `specs/004-confirm` | D |
| BR-13 | ไม่แจ้งย้อนหลังเกินช่วงยืนยันช้า (plan 005 R-1) | `specs/005-status` | E |

---

## 5. งานส่งมอบถึง 26/10/69 (SCHEDULE-20-26)

| งาน | ไฟล์ | สถานะ |
|---|---|---|
| Charter | `docs/01-charter/charter.md` | ✅ (PR #1) |
| SRS 7 ส่วน + Golden Thread + AI log | `docs/02-requirements/spec.md` | ✅ อัปเดตทุก increment |
| Backlog | ไฟล์นี้ | ✅ 25/10 |
| Architecture + ADR + diagram | `docs/03-design/architecture.md` | ✅ อัปเดตถึง FR-05 |
| Design system | `docs/03-design/design-system.md` | ✅ |
| User flow + wireframe | `docs/03-design/user-flow.md` | ✅ 25/10 |
| Prototype ครบ Must FR + error/empty | `prototype/` | 🟡 รอ merge โค้ด FR-05 |
| Test scenarios + ผลจริง + usability/SUS | `docs/04-test/test-scenarios.md` · `usability-sus.md` | ✅ ส่วนอัตโนมัติ 25/10 (36/36 AC มี test · 214/214) · ⬜ ส่วนคน [ทีมกรอก] |
| Final report 2–3 หน้า | `docs/05-report/final-report.md` | ✅ ร่าง 25/10 · ⬜ reflection + ส่วนร่วม + ภาพหน้าจอ [ทีมกรอก] |
| README วิธีรัน (root) | `README.md` | ✅ 25/10 |
| AI-Use Statement | `docs/05-report/ai-use-statement.md` | ✅ ร่าง 25/10 · ⬜ ความเห็นทีม + ลงชื่อยืนยัน [ทีมกรอก] |
| Demo slides | `docs/06-presentation/` | ⬜ |

---

## 6. Won't (รอบนี้)

จาก `spec.md` §3.6 และ §6 — ไม่อยู่ใน backlog เพราะเสี่ยงต่อผู้ใช้หรือไม่มีหลักฐานจากผู้ใช้

- ยาเมื่อมีอาการ · ยาน้ำ · ยาครึ่งเม็ด (BR-07) · ความถี่รายวัน / วันเริ่ม–สิ้นสุด (ไม่มีหลักฐาน · `LESSONS-FROM-V1.md`)
- เตือน/แจ้งเมื่อปิดหน้าเว็บ (push, LINE, SMS) — ต้องมี server = งาน M4 ไม่คิดคะแนน (ADR-01)
- OCR ลายมือแพทย์ · บันทึกผลอ่านฉลากโดยไม่ตรวจ · AI วินิจฉัย/แนะนำยา · ระบบเปลี่ยนวิธีใช้ยาเอง · แนะนำวิธีชดเชยเมื่อลืมยา
