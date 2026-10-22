# Specification Quality Checklist: จับคู่ผู้สูงอายุกับผู้ดูแล (Pairing)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-22
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
- [x] ไม่มี requirement ใหม่ที่ไม่ได้อยู่ใน SRS: AC ของ FR-01 ครบ 8 ข้อ (✓1 ✗2 ✓3 ✗4 ✗5 ✗6 ✗7 ✗8) อยู่ใน User Story 1–3 · ✗8/BR-18 เพิ่มใน SRS ก่อน (clarify 22/10)
- [x] ไม่มีสิ่งใน Out of scope ของ SRS §6

## Notes

- "สร้างรหัสใหม่ทำให้รหัสเดิมเป็นโมฆะ" ย้ายจาก Assumptions เข้า BR-01 แล้ว (clarify 22/10) · เหลือตีความที่ไม่มี AC รองรับ 1 ข้อ (ยกเลิกแล้วไม่ยืนยัน = ไม่เปลี่ยน) บันทึกใน Assumptions และต้องมี test ตามตีความนั้น → ถ้าทีมต้องการให้เป็น AC ทางการ ให้เพิ่มใน `docs/02-requirements/spec.md` ผ่าน PR (เจ้าของ SRS: B)
- ข้อสังเกต: FR-01 ✓1 บอกว่า QR และรหัสแสดง "โดยไม่ต้องพิมพ์" · ✗4 รวม 3 สาเหตุ (ผิด/หมดอายุ/ใช้แล้ว) ไว้ AC เดียว → spec นี้แยกเป็นข้อความ 5 แบบตาม R4 เพื่อให้ทดสอบได้
