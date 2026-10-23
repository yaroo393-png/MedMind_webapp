# Specification Quality Checklist: ถ่ายฉลากยาและสร้างข้อมูลยา (Label)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-23
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Project-specific (constitution)

- [x] ทุก requirement อ้างรหัส FR/BR/NFR/AC ของ `docs/02-requirements/spec.md` ไม่ตั้งรหัสใหม่ (หลักการ I)
- [x] ไม่มี requirement ใหม่ที่ไม่ได้อยู่ใน SRS: AC ของ FR-02 ครบ 10 ข้อ (✓1 ✓2 ✗3 ✗4 ✗5 ✓6 ✗7 ✓8 ✓9 ✗10) อยู่ใน User Story 1–3
- [x] ไม่มีสิ่งใน Out of scope ของ SRS §6 · ไม่มีผลทดสอบ/ตัวเลขวัดที่แต่งขึ้น (SC-007, SC-008 = `[ทีมกรอก]`)

## Notes

- clarify 23/10 ตัดสินแล้ว 4 ข้อ: ก่อนเที่ยงคืน = บันทึกไม่ได้ · ลบยาได้ (เพิ่มใน BR-03 รอ B ยืนยัน) · ตัวอย่าง + รูปจริง · ไม่อ่านชื่อผู้ป่วย/HN (NFR-09) · ฉลากที่ขัดกันเอง = ว่าง + กรุณาตรวจสอบ ตาม BR-04 (ไม่ต้องถาม)
- spec นี้ **ไม่ระบุวิธี OCR** (พฤติกรรมเท่านั้น) · วิธีฝัง OCR ให้ทำงานตอนดับเบิลคลิกอยู่ใน plan (ADR-08 · ผลทดลอง 22/10 ใน `HANDOFF.md`)
- R11 มาจากข้อกำหนดของอาจารย์ที่ผู้ใช้แจ้ง 23/10 ("เปิดแบบดับเบิลคลิก") ไม่ใช่ FR ใหม่: ผูกกับ FR-02 ✗5 + constitution (Prototype เปิดด้วยดับเบิลคลิก)
- ข้อสังเกต: AC ✗4 ระบุข้อความ "ระบบยังไม่รองรับยาเมื่อมีอาการ" ตรงตัว · BR-07 ยังรวมยาน้ำ/ครึ่งเม็ดแต่ไม่มี AC และข้อความของสองอย่างนั้น → spec นี้ให้แจ้งสาเหตุ (ข้อความกำหนดใน plan) และต้องมี test ตาม BR-07 · ถ้าทีมต้องการเป็น AC ทางการ แก้ `docs/02-requirements/spec.md` (เจ้าของ SRS: B)
- ข้อสังเกต: ✓2 ใช้กับ "แก้ช่องแล้วบันทึก" · การแก้ยาที่บันทึกแล้ว (BR-03 "แก้ยาได้") ไม่มี AC แยก → อยู่ใน Edge Cases ตามเส้นทางเดียวกับการเพิ่ม
