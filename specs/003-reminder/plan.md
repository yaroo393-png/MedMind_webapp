# Implementation Plan: เตือนเมื่อถึงมื้อยา (Reminder)

**Branch**: `feat/reminder` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: `specs/003-reminder/spec.md` · ต้นฉบับ requirement: `docs/02-requirements/spec.md` FR-03, BR-06, 08, 09, 16 (+ BR-15 สำหรับ R6b) · NFR-01, 03
<!-- เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-plan -->

## Summary

มื้อยาของวันคำนวณจากเวลาเตือนของยาแต่ละตัว (`reminderTimes` ของ FR-02) รวมยาเวลาเดียวกันเป็นมื้อเดียว → รอบเตือน 1–3 คำนวณจาก T และเวลาจำลอง →
หน้า S2 ของผู้สูงอายุเปิดค้างอยู่หลังจับคู่ วาดใหม่ทุกครั้งที่เวลา/ข้อมูลเปลี่ยน แสดงทุกมื้อที่กำลังเตือน (+ มื้อในช่วงยืนยันช้าตาม clarify) แยกหัวข้อ ·
เสียงสร้างในหน้า 1 ครั้งต่อรอบต่อเวลาเตือน หลังแตะหน้าจอครั้งแรก · feature นี้อ่านข้อมูลอย่างเดียว

## Technical Context

**Language/Version**: JavaScript (UMD · ไม่มี ES modules) · HTML/CSS
**Primary Dependencies**: Foundation (clock, store, shell) · FR-01 `pairing.isSeniorPaired` · FR-02 `medication.reminderTimes`, `medicationsOf` · Web Audio ของเบราว์เซอร์ (ไม่มีไลบรารีใหม่)
**Storage**: อ่าน `devices`, `pairing`, `medications`, `mealTimes`, `confirmations` · **ไม่เขียน**
**Testing**: `node --test` (`doseSession.test.js`) · Chrome headless อัตโนมัติสำหรับหน้าจอ (สคริปต์ใน scratchpad ไม่ commit · ขั้นตอนมือใน quickstart)
**Target Platform**: Chrome/Edge เดสก์ท็อปแบบดับเบิลคลิก · มือถือผ่าน GitHub Pages
**Project Type**: เว็บแอป prototype ฝั่ง client
**Performance Goals**: NFR-01 รอบที่ T, T+5, T+10 ตรงนาที (คำนวณจากเวลา ไม่ใช่ timer) · วาดใหม่ทันทีเมื่อนาฬิกาจำลองเปลี่ยน
**Constraints**: NFR-03 · token เท่านั้น · ไม่เขียน store · ไม่โหลดไฟล์จากภายนอก (เสียงสร้างในหน้า) · เตือนเฉพาะขณะหน้าเปิด (ADR-01)
**Scale/Scope**: 1 หน้าจอ (S2) · 1 โมดูล (6 ฟังก์ชัน) · AC 5 ข้อ · มื้อต่อวันหลักหน่วย

## Constitution Check

| หลักการ | ตรวจ | ก่อน | หลัง Phase 1 |
|---|---|---|---|
| I Golden Thread | ใช้รหัส SRS · S2 ติด `Covers: FR-03` · contract มีคอลัมน์ AC · แก้ §8.3 ของ architecture ในงานเดียวกัน (R-5) | ✅ | ✅ |
| II No gold-plating | ไม่มีเลื่อนเตือน/ปิดเสียง/รูปยา · สถานะ `IDLE` มีข้อความเดียว (มื้อถัดไป) ไม่ใช่รายการมื้อของวัน (นั่นคือ S3 ของ FR-04) · `lateUntil` มาจาก clarify + BR-15 · `dayOf`/`newSoundKeys` แยกกฎออกจากหน้าจอ (III) ไม่ใช่ฟีเจอร์ใหม่ | ✅ | ✅ |
| III Tests on separated logic | กฎทั้งหมดใน `doseSession` ฟังก์ชันล้วน รับ `now` · ทุก AC มี test · ค่าขอบ: T−1, T, T+4:59, T+5, T+10, T+15 พอดี · มื้อข้ามเที่ยงคืน · ไม่มียา · บันทึกของคู่อื่น | ✅ | ✅ |
| IV Evidence | ไม่มีผลวัดในงานนี้ · NFR-02 (usability หน้าเตือน) วัดกับผู้ใช้จริงทีหลัง = `[ทีมกรอก]` | ✅ | ✅ |
| V Safety & privacy | ไม่เขียนข้อมูล · แสดงเฉพาะยาของคู่นี้ (`pairingId`) · ไม่จับคู่ = กลับ S1 · ไม่มีข้อความแนะนำชดเชยยา (Out of scope) | ✅ | ✅ |
| Platform | ดับเบิลคลิกได้ (ไม่มีไฟล์เสียง) · ไม่มี server/npm | ✅ | ✅ |

**ผลตรวจหลัง Phase 1 — ต้องแก้ใน `architecture.md` งานเดียวกัน:** §8.3 `doseSession` ตาม [contracts/dose-session.md](contracts/dose-session.md)
(`dueSessions` รับ `pairingId` และคืน `round`/`late` · เพิ่ม `dayOf`, `newSoundKeys` · นิยาม `lateUntil` ชัด) · §9.1 แถว FR-03 เพิ่ม `lateUntil` · ERD ไม่เปลี่ยน

## Project Structure

```text
specs/003-reminder/   spec · plan · research (R-1…R-9) · data-model · contracts/{dose-session,screens}.md · quickstart · checklists/ · tasks (ถัดไป)

prototype/
├── index.html                      # เปิดบรรทัดของ C: modules/doseSession.js (หลัง medication.js) + screens/reminder.js
├── src/modules/doseSession.js      # ใหม่ · มื้อ/รอบ/มื้อที่ต้องเตือน/ช่วงยืนยันช้า/คีย์เสียง (BR-06, 08, 15, 16)
├── src/screens/reminder.js         # ใหม่ · S2 (EMPTY / IDLE / ALERT + เสียง)
├── src/screens/pairing.js          # แก้เล็กน้อย: S1 เชื่อมต่อแล้ว → ปุ่ม "หน้าเตือนกินยา"
├── src/ui/app.css                  # เพิ่ม .session, .session-time (แจ้ง D)
└── tests/doseSession.test.js       # ใหม่
```

**Structure Decision**: ตาม TEAM-PLAN ข้อ 3 (เจ้าของ C: `doseSession.js`, `screens/reminder.js`) · แก้ไฟล์ของ A (`pairing.js`) และ D (`app.css`) เล็กน้อยแบบเดียวกับ FR-02 และระบุเจ้าของในเอกสาร

## Complexity Tracking

ไม่มีส่วนที่ขัด constitution
