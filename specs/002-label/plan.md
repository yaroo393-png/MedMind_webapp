# Implementation Plan: ถ่ายฉลากยาและสร้างข้อมูลยา (Label)

**Branch**: `feat/label` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: `specs/002-label/spec.md` · ต้นฉบับ requirement: `docs/02-requirements/spec.md` FR-02, BR-03–07, NFR-06, 08, 09, 11
<!-- เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-plan -->

## Summary

ผู้ดูแลถ่าย/เลือกรูปฉลาก → อ่านในเครื่องด้วย OCR (ทำงานทั้งดับเบิลคลิกและลิงก์เว็บ) → ตัวแยกข้อความรับเฉพาะรูปแบบยาที่รู้จัก (ไม่อ่านชื่อผู้ป่วย/HN) →
ร่างที่ช่องอ่านไม่ได้เป็น "กรุณาตรวจสอบ" → ผู้ดูแลแก้ + ตั้งเวลามื้อ → บันทึกเมื่อผ่านเงื่อนไขเท่านั้น · เวลาเตือนคำนวณจากคำสั่งบนฉลาก · ลบยาได้เมื่อยืนยัน

## Technical Context

**Language/Version**: JavaScript (UMD · ไม่มี ES modules) · HTML/CSS
**Primary Dependencies**: Foundation · FR-01 `pairing.canAccess` · Tesseract.js 5.1.1 (มีใน vendor แล้ว · ไม่แก้ไฟล์) + ไฟล์ฝัง base64 ที่สร้างจากมัน (research R-1)
**Storage**: store ของ Foundation · `medications`, `mealTimes` (architecture §8.2)
**Testing**: `node --test` (`labelParser`, `medication`) · Chrome headless อัตโนมัติสำหรับ `readLabel` + หน้าจอ (สคริปต์ใน scratchpad ไม่ commit)
**Target Platform**: Chrome/Edge เดสก์ท็อปแบบดับเบิลคลิก (ข้อกำหนดอาจารย์) · มือถือผ่าน GitHub Pages
**Project Type**: เว็บแอป prototype ฝั่ง client
**Performance Goals**: NFR-08 ร่างภายใน 10 วินาที ≥ 18/20 ฉลากจริงบนมือถือ — วัดจริง ส. 24 · เดสก์ท็อป 4 ใบจริงใช้ 1.5–4.2 วินาที (research R-0 · ไม่ใช่ผลวัด NFR)
**Constraints**: ไม่ส่งรูป/ข้อความออกนอกเครื่อง · ไม่เก็บรูป/ข้อความดิบ · ไม่มีชื่อผู้ป่วย/HN ในร่าง (R10b) · token เท่านั้น · NFR-03
**Scale/Scope**: 1 หน้าจอ (C2) · 3 โมดูล · AC 10 ข้อ · ยาต่อคู่หลักสิบรายการ

## Constitution Check

| หลักการ | ตรวจ | ก่อน | หลัง Phase 1 |
|---|---|---|---|
| I Golden Thread | ใช้รหัส SRS · C2 ติด `Covers: FR-02` · contracts มีคอลัมน์ AC · แก้ BR-03 ใน SRS ก่อน (clarify) | ✅ | ✅ |
| II No gold-plating | ไม่มีความถี่/วันเริ่ม–สิ้นสุด/หน้าตั้งค่าแยก · ไม่มีปุ่มฉลากตัวอย่าง (ใช้ไฟล์ใน `samples/`) · "ลบยา" มาจาก BR-03 ที่แก้แล้ว · ไฟล์ฝัง OCR มาจาก R11 (ข้อกำหนดอาจารย์) ไม่ใช่ dependency ใหม่ | ✅ | ✅ (BR-03 รอ B ยืนยัน) |
| III Tests on separated logic | กฎใน `labelParser`/`medication` ฟังก์ชันล้วน · ทุก AC มี test · ค่าขอบ: 00:00 พอดี, นาที 1/120, จำนวนเม็ด 0/1/20/21, ข้อความว่าง | ✅ | ✅ |
| IV Evidence | ผลรูปจริงใน research R-0 เป็นผลรันจริง ระบุว่าไม่ใช่ผลวัด NFR · NFR-08/11 = `[ทีมกรอก]` | ✅ | ✅ |
| V Safety & privacy | บันทึกเมื่อกดเท่านั้น (NFR-06) · ห้ามเดา (BR-04) · whitelist ไม่อ่านชื่อ/HN (R-3) · OCR ในเครื่อง (ADR-03) · ทางสำรองกรอกเอง (✗5) · รูปจริงไม่เข้า repo (`.gitignore`) | ✅ | ✅ |
| Platform | ดับเบิลคลิกได้ (R11 · ADR-08 แก้) · ไม่มี server/npm (สคริปต์สร้างไฟล์ฝังรันด้วย node ครั้งเดียว ผลลัพธ์ commit · ไม่ต้องรันตอนเปิดแอป) | ✅ | ✅ |

**ผลตรวจหลัง Phase 1 — ต้องแก้ใน `architecture.md` งานเดียวกัน:** ADR-08 จาก "เสนอ" → "ยอมรับ (ดับเบิลคลิกเป็นหลัก)" · §8.3 สัญญา `labelParser`/`medication`/`readLabel` ตาม [contracts/label-modules.md](contracts/label-modules.md) (เพิ่ม `unsupported`, `found`, `emptyDraft`, `validMealTimes`, `removeMedication`, `medicationsOf`, `BEFORE_MIDNIGHT`, `saveMedication` รับ `mealTimes`) · ERD MEDICATION ไม่เปลี่ยน

## Project Structure

```text
specs/002-label/   spec · plan · research (R-0…R-7) · data-model · contracts/{label-modules,screens}.md · quickstart · checklists/ · tasks (ถัดไป)

prototype/
├── index.html                      # เปิด 4 บรรทัดของ B (tesseract.min.js, labelParser, readLabel, medication) + screens/medication.js
├── src/modules/labelParser.js      # ใหม่ · ข้อความ → ร่าง (BR-04, 05, 07 · R10b)
├── src/modules/medication.js       # ใหม่ · ตรวจ/บันทึก/ลบ/เวลาเตือน (BR-03–07 · NFR-06)
├── src/modules/readLabel.js        # ใหม่ · adapter OCR (ADR-03, ADR-08)
├── src/screens/medication.js       # ใหม่ · C2
├── src/screens/pairing.js          # แก้เล็กน้อย: C1 เชื่อมต่อแล้ว → ปุ่ม "ยาของผู้สูงอายุ"
├── tools/embed-ocr.js              # ใหม่ · สร้างไฟล์ฝังจาก vendor/tesseract (รัน node ครั้งเดียว)
├── vendor/tesseract-embed/         # ใหม่ · lang-tha.js, lang-eng.js, core.js, worker.js (สร้างจากสคริปต์ · ห้ามแก้มือ)
├── samples/                        # ใหม่ · รูปฉลากตัวอย่าง 4 ใบ (ข้อมูลสมมติ) + ข้อความ fixture
└── tests/labelParser.test.js · medication.test.js
real-labels/                        # รูปฉลากจริง · git ไม่เก็บ
```

**Structure Decision**: ตาม Foundation + TEAM-PLAN ข้อ 3 (เจ้าของ B) · `tools/` ใหม่เพราะไฟล์ฝังต้องสร้างซ้ำได้จากต้นฉบับ (ตรวจย้อนได้ ไม่ใช่ไฟล์ปริศนา 12 MB)

## Complexity Tracking

| เพิ่มอะไร | ทำไม | ทางง่ายกว่าและเหตุที่ไม่เลือก |
|---|---|---|
| ไฟล์ฝัง OCR ~12 MB + สคริปต์สร้าง | อาจารย์ต้องการดับเบิลคลิก และ `file://` โหลดไฟล์ภาษาไม่ได้ (R-1) | ลิงก์เว็บอย่างเดียว: ไม่ตรงข้อกำหนด · กรอกเองอย่างเดียว: ไม่ผ่าน ✓1 |
| แก้บั๊ก Tesseract.js ในหน่วยความจำ | worker 5.1.1 พังเมื่อส่งข้อมูลภาษาเป็น bytes (spike 22/10) | แก้ไฟล์ vendor: ห้ามแก้ (TEAM-PLAN) · อัปเกรดรุ่น: ไม่มีเวลาทดสอบใหม่ |
