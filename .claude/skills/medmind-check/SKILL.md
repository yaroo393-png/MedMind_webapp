---
name: "medmind-check"
description: "ตรวจ repo MedMind เทียบเกณฑ์อาจารย์ (checklist M1/M2/M3, design smells, rubric M3, Golden Thread) แบบอ่านอย่างเดียว"
argument-hint: "ขอบเขต (ไม่บังคับ): all | charter | srs | design | prototype | submit"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

ค่าเริ่มต้น = `all` · **ห้ามแก้ไฟล์** — รายงานอย่างเดียว ผู้ใช้เป็นคนสั่งแก้

## แหล่งเกณฑ์ (อ่านจริงก่อนตรวจ)

- `SE-COURSE-PRINCIPLES.md` หัวข้อ 2 (rubric M3), 3–8, 11 (checklist ก่อนส่ง)
- เอกสารอาจารย์ใน `docs/course/` ที่ตรงกับขอบเขต (M1, M2, M3, M4) — ถ้าขัดกับไฟล์อื่น เอกสารอาจารย์ชนะ
- `.specify/memory/constitution.md` (หลักการ I–V)

## ตรวจอะไร

1. **ไฟล์ครบ**: charter.md · spec.md · backlog.md · architecture.md · design-system.md · user-flow.md · prototype ·
   tests · docs/04-test · final-report.md · ai-use-statement.md · slides · README · HANDOFF.md
2. **M1 Charter**: problem statement 4 ส่วน · หลักฐาน 2 ชั้น · ผู้ใช้จริง 3 คน (ชื่อ/บทบาท/ติดต่อ) · 5 Whys · Litmus 5 ข้อ ·
   Scorecard 7 ข้อ ≥ 15/21 และข้อ 1, 4, 5 ≥ 2 · TAM · Problem Brief 8 ช่อง · MVP 3–5 FR · Gate 1–3 · SDLC + เหตุผล ·
   in/out scope · ตัววัดวัดได้ · บทบาทสมาชิก
3. **M2 SRS**: 7 ส่วนไม่มีช่องว่าง · FR ≥ 5 (Must 3–5) เป็น user story โยงปัญหา · AC Given–When–Then happy + edge ทุก Must FR ·
   NFR ≥ 3 มีตัวเลข + PDPA ≥ 1 · stakeholders ≥ 3 · INVEST · Golden Thread · AI log
4. **M2/M3 Design**: 3 ชั้น low coupling · ADR มีทางเลือกที่ปฏิเสธ · diagram ≥ 2 (Use Case บังคับ) ติดป้าย FR ตรงข้อความ ·
   data model tech-agnostic ครอบทุก FR · traceability FR → operation → entity → screen + บันทึก AI · design-system มี tokens +
   components · **10 design smells** ของคู่มือ M3 (ระบุจุดที่เจอ)
5. **Prototype**: คลิก happy path ครบทุก Must FR · error/empty ≥ 1 ต่อ Must FR · ป้าย `Covers: FR-x` ทุกหน้าจอ ·
   ไม่มีค่าสี/ขนาดเขียนตรง (magic values) · ไม่มี `import`/`export` · สแกนฉลาก + QR มีทางสำรอง · NFR usability (ขนาด, contrast)
6. **Test**: ทุก AC มี test ≥ 1 ตัว (ทำตารางจับคู่ AC ↔ ชื่อ test) · รัน `node --test` แล้วรายงานผลจริง · empty/excluded/boundary
7. **Golden Thread**: ตารางใน spec.md, README, final report ตรงกันทุกช่อง · ไม่มีหน้าจอ/entity/field/test ที่ไม่มี FR (gold-plating)
8. **Engineering & AI**: README บอกวิธีเปิด + รัน test · repo ไม่มีไฟล์ขยะ · AI log ครบทุกวันที่มี commit จาก AI ·
   ทุกสมาชิกมี commit ตามบทบาท (`git shortlog -sne --all`)

## รายงาน

- ตาราง: เกณฑ์ · ผ่าน / บางส่วน / ไม่ผ่าน · หลักฐาน (ไฟล์:บรรทัด) · ต้องแก้อะไร · เจ้าของ (ตาม TEAM-PLAN)
- ให้คะแนน Scorecard design M3 (0–2 ต่อข้อ, เต็ม 20) พร้อมเหตุผลทีละข้อ
- เรียงสิ่งที่ต้องแก้ตาม "ลำดับตัดงาน" ใน `SCHEDULE-20-26.md` (สำคัญสุดก่อน)
- ข้อที่ตรวจไม่ได้ (ไม่มีไฟล์ / ต้องทดสอบกับคนจริง) เขียนว่า "ตรวจไม่ได้" พร้อมเหตุผล ห้ามเดาว่าผ่าน
