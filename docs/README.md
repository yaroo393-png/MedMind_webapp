# เอกสาร MedMind — สารบัญ

เรียงตามลำดับงานของวิชา: **ปัญหา → Requirement → Design → Feature → Test → Report** (Golden Thread) · เริ่มจากตารางของ milestone ที่ต้องการ แล้วเปิดเฉพาะไฟล์ที่ใช้ ·
ต้นฉบับของ FR · BR · NFR · acceptance criteria มีที่เดียวคือ [`02-requirements/spec.md`](02-requirements/spec.md) — ไฟล์อื่นอ้างรหัสจากที่นั่น

## 1. ปัญหาและผู้ใช้ — M1

| ไฟล์ | เนื้อหา |
|---|---|
| [`../evidence/interviews-2569-09-04.md`](../evidence/interviews-2569-09-04.md) | หลักฐานชั้น B: บันทึกสัมภาษณ์ผู้ใช้จริง 3 คน (4/9/69 ทางโทรศัพท์) |
| [`01-charter/charter.md`](01-charter/charter.md) | Team Charter 1 หน้า (ปัญหา · ผู้ใช้จริง · MVP 5 FR · การเข้าถึงข้อมูล · SDLC · ขอบเขต · ตัววัดความสำเร็จ · บทบาท) + 5 Whys · Litmus · TAM · Scorecard · Problem Brief |

## 2. Requirements — M2 ส่วน SRS

| ไฟล์ | เนื้อหา |
|---|---|
| [`02-requirements/spec.md`](02-requirements/spec.md) | SRS: purpose · stakeholders · FR-01–08 + MoSCoW · BR-01–18 · acceptance criteria Given–When–Then 36 ข้อ · NFR-01–11 (PDPA 4 ข้อ) · use case · out of scope · Golden Thread (§7) · **AI-use log (§8)** · INVEST |
| [`02-requirements/backlog.md`](02-requirements/backlog.md) | Product backlog: DoR/DoD · ลำดับงาน + สถานะ + หลักฐาน test · งานที่ต้องใช้คนจริง · ข้อที่รอเจ้าของยืนยัน · Won't |

## 3. Design — M2 ส่วน Design

| ไฟล์ | เนื้อหา |
|---|---|
| [`03-design/user-flow.md`](03-design/user-flow.md) | แผนที่หน้าจอ · user flow 4 งานหลัก · ไทม์ไลน์ 1 มื้อ · wireframe low-fi 6 หน้าจอ + error/empty |
| [`03-design/architecture.md`](03-design/architecture.md) | 3 ชั้น · ADR-01–08 พร้อมทางเลือกที่ปฏิเสธ · Use Case · Sequence · State · ERD (tech-agnostic) · module cohesion/coupling · สัญญาข้อมูล · traceability FR → operation → entity → screen |
| [`03-design/design-system.md`](03-design/design-system.md) | tokens (สี + contrast ทุกคู่ · ตัวอักษร · ระยะ) · components + state · screen map S1–S3, C1–C3 |

## 4. Feature — Spec Kit (1 Must FR = 1 increment)

ทุกโฟลเดอร์มี `spec.md` (+ clarify) → `plan.md` · `research.md` · `data-model.md` · `contracts/` · `quickstart.md` → `tasks.md` · `checklists/`

| โฟลเดอร์ | FR | เจ้าของ |
|---|---|---|
| [`../specs/001-pairing/`](../specs/001-pairing/) | FR-01 จับคู่ | A |
| [`../specs/002-label/`](../specs/002-label/) | FR-02 เพิ่มยาจากฉลาก | B |
| [`../specs/003-reminder/`](../specs/003-reminder/) | FR-03 เตือนตามมื้อ | C |
| [`../specs/004-confirm/`](../specs/004-confirm/) | FR-04 ยืนยันการกินยา | D |
| [`../specs/005-status/`](../specs/005-status/) | FR-05 แจ้งผู้ดูแล + สถานะ | E |

โค้ดและวิธีเปิด prototype: [`../prototype/README.md`](../prototype/README.md)

## 5. Test — M3

| ไฟล์ | เนื้อหา |
|---|---|
| [`04-test/test-scenarios.md`](04-test/test-scenarios.md) | test pyramid · ผล unit test 214/214 · AC → test 36/36 · system test ในเบราว์เซอร์ · ค่าขอบ · NFR 11 ข้อ · ตารางทดสอบมือ |
| [`04-test/usability-sus.md`](04-test/usability-sus.md) | แบบฟอร์ม usability ผู้สูงอายุ (NFR-02) และผู้ดูแล · SUS · heuristic evaluation (Nielsen 10) — **รอผลจริง** |
| [`04-test/nfr-08-11-label-reading.md`](04-test/nfr-08-11-label-reading.md) | แบบฟอร์มวัดการอ่านฉลากจริง 20 ใบบนมือถือ (NFR-08, NFR-11) — **รอผลจริง** |

## 6. Report และนำเสนอ — M3

| ไฟล์ | เนื้อหา |
|---|---|
| [`05-report/final-report.md`](05-report/final-report.md) | Final report: ปัญหา · requirements · design · prototype · testing · **Golden Thread trace table** · ข้อจำกัด |
| [`05-report/ai-use-statement.md`](05-report/ai-use-statement.md) | AI-Use Statement: ใช้ AI ตรงไหน · AI ผิดตรงไหนและจับได้อย่างไร · การตัดสินของคน · ข้อมูลกับ AI |
| `06-presentation/` | Demo slides (Problem → Solution) — ยังไม่มี |

## 7. ความคืบหน้าและกติกา

| ไฟล์ | เนื้อหา |
|---|---|
| [`../HANDOFF.md`](../HANDOFF.md) | บันทึกหลังจบงานแต่ละครั้ง (ล่าสุดอยู่บน): ไฟล์ที่เปลี่ยน · FR · ผล test · สิ่งที่ยังขาด |
| [`../SE-COURSE-PRINCIPLES.md`](../SE-COURSE-PRINCIPLES.md) · [`../CLAUDE.md`](../CLAUDE.md) · [`../.specify/memory/constitution.md`](../.specify/memory/constitution.md) | กติกาวิชา · กติกาโปรเจกต์สำหรับ AI · หลักการ 5 ข้อของ Spec Kit |
| [`../ROADMAP.md`](../ROADMAP.md) · [`../TEAM-PLAN.md`](../TEAM-PLAN.md) · [`../SCHEDULE-20-26.md`](../SCHEDULE-20-26.md) · [`../LESSONS-FROM-V1.md`](../LESSONS-FROM-V1.md) | แผนงาน · การแบ่งงาน · ตารางวัน · บทเรียนจาก v1 |
| [`course/`](course/) | เอกสารอาจารย์ M1–M4 และ week02–09 (อ้างอิง ห้ามแก้ · ถ้าขัดกับไฟล์อื่น เอกสารอาจารย์ชนะ) |
