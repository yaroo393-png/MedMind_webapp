# SCHEDULE 20–26 ต.ค. 2569 — ส่ง Charter + SRS + Design + Prototype ครบชุด

ใช้คู่กับ `TEAM-PLAN.md` (ลำดับ Full path, กติกาไม่ชนกัน, ข้อจำกัดไม่มี server) · เช็กลิสต์ "เสร็จเมื่อ" อยู่ใน `SE-COURSE-PRINCIPLES.md` หัวข้อ 11
แอปจริง (server/push/OCR จริง) **ไม่ทำก่อนวันที่ 26** — เป็น M4 ไม่คิดคะแนน

## หลักการลดเวลา
1. **ล็อก baseline วันนี้:** FR 5 ข้อ + BR + AC จาก v1 = ร่างตั้งต้น (ตัวแทนของ `spec.md` ใหม่) feature owner เริ่ม specify ได้ทันที ไม่ต้องรอ SRS ฉบับสมบูรณ์
2. **ห้ามเปลี่ยน FR/AC หลังพฤหัส 22 ต.ค. เที่ยง** ถ้าต้องเปลี่ยน → PR แก้ `spec.md` + แจ้งเจ้าของ feature ทุกคน
3. **ทำเอกสารขนานกับโค้ด** แต่ละคนมีทั้ง feature และเอกสาร 1 ชิ้น (ตารางด้านล่าง)
4. เอกสารทุกชิ้นเขียนจาก v1 เป็นร่าง + เติมส่วนที่ v1 ขาด (ดู `LESSONS-FROM-V1.md`) ห้ามคัดมาทั้งก้อนโดยไม่อ่าน

## ใครทำอะไร (เสนอ · ทีมกรอกชื่อ)

| คน | Feature (spec dir) | เอกสารที่เป็นเจ้าของ | ไฟล์ |
|---|---|---|---|
| A (PM) | จับคู่ + สแกน QR `specs/001-pairing` (เสร็จแล้วช่วย B ทำ `labelParser.js`) | **Charter (M1)** + รายงาน + README | `docs/01-charter/charter.md` `docs/05-report/final-report.md` |
| B | เพิ่มยา + สแกนฉลาก (OCR) `specs/002-medication` | **SRS ส่วนกลาง** (purpose, stakeholders ≥ 3, NFR ตัวเลข + PDPA, use case names, out of scope, AI log, INVEST, Golden Thread) | `docs/02-requirements/spec.md` `backlog.md` |
| C | เตือนตามมื้อ `specs/003-reminder` | **architecture.md** (3 ชั้น, ADR + ทางเลือกที่ปฏิเสธ, data model tech-agnostic, สัญญา operation, Use Case + sequence + state + ERD, traceability) | `docs/03-design/architecture.md` |
| D | ยืนยันการกินยา `specs/004-confirm` | **Foundation** (+ vendor + GitHub Pages) + design-system + user flow + wireframe | `prototype/src/core/` `prototype/src/ui/` `prototype/vendor/` `docs/03-design/design-system.md` `user-flow.md` |
| E | แจ้งผู้ดูแล + สถานะ `specs/005-status` | **test + ส่งงาน**: test scenarios, heuristic eval, usability/SUS, slides, AI-Use Statement | `docs/04-test/` `docs/06-presentation/` `docs/05-report/ai-use-statement.md` |

เจ้าของ feature เขียน **FR + AC (Given–When–Then ทั้ง happy และ edge) ของ feature ตัวเอง** ลง `spec.md` (ส่วน FR) ผ่าน PR ของตัวเอง

## ตารางวัน

| วัน | ต้องเสร็จ | ไม่เสร็จ = ตัดอะไร |
|---|---|---|
| **อ. 20** (คืนนี้) | push repo · เชิญสมาชิก · ตั้ง rule `main` · ล็อกตารางข้างบน · A เริ่ม Charter · D เริ่ม Foundation · C เริ่มสัญญาข้อมูล · ทุกคนอ่าน `CLAUDE.md` + constitution | — |
| **พ. 21** | **Foundation + vendor + GitHub Pages merge ก่อนเที่ยง** (D) · **A ถามอาจารย์: ส่งลิงก์ GitHub Pages ได้ไหม** (OCR ใช้ไม่ได้ตอนดับเบิลคลิก) · B ลอง OCR กับรูปที่ทดสอบผ่าน Live Server · **สัญญาข้อมูล merge ก่อนเที่ยง** (C) · Charter ร่างครบ (A) · SRS ส่วนกลางร่างครบ (B) · ทุกคนรัน `specify` → `clarify` → `plan` ของ feature ตัวเอง · FR + AC ของแต่ละ feature อยู่ใน `spec.md` | ตัดตัววัด/TAM ที่ไม่มีข้อมูล ใส่ `[ทีมกรอก]` |
| **พฤ. 22** | **ล็อก FR/AC เที่ยง** · B เก็บรูปฉลากยาจริง ≥ 10 ใบ ลอง OCR บนมือถือผ่าน GitHub Pages จดผลจริง · A ทำ QR เสร็จ · Charter + SRS ผ่านเช็กลิสต์ M1/M2 · `checklist` → `tasks` → `analyze` → `implement` (A, B ก่อน) · architecture.md ครบ diagram | — |
| **ศ. 23** | implement ต่อ + test ตาม AC · merge A, B, C · design-system + user-flow + wireframe ครบ · ส่ง Charter + SRS ให้เพื่อน review | ตัด diagram ส่วนเกิน เหลือ Use Case + sequence + state |
| **ส. 24** | merge D, E · วัด NFR การอ่านฉลากกับฉลากจริง 20 ใบ (ผลจริง) · ทดสอบสแกน QR จับคู่ข้าม 2 มือถือ (ถ่ายรูป QR จากอีกเครื่อง) · integration ทั้งวงจร · error/empty state ครบ · `node --test` ผ่านทั้งหมด · `converge` · ซ้อม demo 4 นาที · heuristic evaluation (ขอทีมอื่น) · usability test | usability < 5 คน → เขียน "ยังไม่ได้วัด/ทดสอบกับ n คน" ตามจริง |
| **อา. 25** | final report 2–3 หน้า + Golden Thread (ทุกช่องมีของจริง) · AI-Use Statement · README · slides · ซ้อม demo รอบ 2 · **freeze 18:00** | ตัดความสวยของ slides ไม่ตัด Golden Thread |
| **จ. 26** | ตรวจครั้งสุดท้าย (เช็กลิสต์ M2 + M3 หัวข้อ 11) · ส่ง | — |

## ลำดับตัดงาน ถ้าเวลาไม่พอ (ตัดจากล่างขึ้นบน)
1. prototype คลิกครบ Must FR + error/empty state · สแกนฉลาก + QR ทำงานผ่านลิงก์เว็บ พร้อมทางสำรอง (กรอกเอง / รหัส 6 หลัก)
2. test ทุก AC + ตาราง Golden Thread ครบ
3. Charter, SRS, Design ผ่านเช็กลิสต์ (ไม่มีช่องว่าง)
4. ทุกคนตอบได้ว่า FR ไหนอยู่หน้าจอไหน (ซ้อมแล้ว)
5. README, AI log, repo สะอาด
6. usability test / SUS · heuristic evaluation (ถ้าทำไม่ได้ เขียนตรง ๆ ว่ายังไม่ได้วัด)

## ห้ามทำก่อนส่ง
แอปจริง · ฟีเจอร์ที่ไม่มี FR (เช่น ความถี่/วันที่) · เปลี่ยน FR หลังล็อก · แต่งผลสัมภาษณ์/ผลทดสอบ · push เข้า `main`
