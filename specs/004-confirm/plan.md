# Implementation Plan: ยืนยันการกินยาทั้งมื้อ (Confirm)

**Branch**: `feat/confirm` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: `specs/004-confirm/spec.md` · ต้นฉบับ requirement: `docs/02-requirements/spec.md` FR-04, BR-10, 11, 12, 14, 15, 16 · NFR-02, 03, 07
<!-- เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-plan -->

## Summary

โมดูล `confirm` (ฟังก์ชันล้วน) ตัดสิน: ยืนยันได้ไหม/ตรงเวลาหรือช้า (ใช้ช่วงยืนยันช้าของ `doseSession`) · "ยังไม่กิน" รอหรือแจ้ง + ซ่อนถึงเมื่อไร · สถานะ BR-14 และคำของสถานะ ·
หน้าเตือน S2 ได้ปุ่มที่ทำงานจริง · หน้าแรก S3 ใหม่แสดงมื้อของวันพร้อมสถานะและยืนยันช้า · การแจ้งผู้ดูแลส่งต่อ FR-05 ผ่าน `escalation.addNotice` เมื่อมี

## Technical Context

**Language/Version**: JavaScript (UMD · ไม่มี ES modules) · HTML/CSS
**Primary Dependencies**: Foundation · FR-01 `isSeniorPaired` · FR-02 `medicationsOf` · FR-03 `doseSession` (`sessionsOf`, `roundAt`, `lateUntil`, `dueSessions`) + `MedMind.reminder` · FR-05 `escalation.addNotice` (ถ้ามี) · ไม่มีไลบรารีใหม่
**Storage**: เขียน `confirmations` (เจ้าของ) · `notices` ผ่าน FR-05 · อ่าน `devices`, `pairing`, `medications`, `mealTimes`
**Testing**: `node --test` (`confirm.test.js`) · Chrome headless อัตโนมัติสำหรับ S2/S3 (สคริปต์ใน scratchpad ไม่ commit · ขั้นตอนมือใน quickstart)
**Target Platform**: Chrome/Edge เดสก์ท็อปแบบดับเบิลคลิก · มือถือผ่าน GitHub Pages
**Project Type**: เว็บแอป prototype ฝั่ง client
**Performance Goals**: NFR-02 ยืนยันได้ใน 1 แตะ (วัดกับคนจริง = `[ทีมกรอก]`)
**Constraints**: NFR-03 · NFR-07 (1 ระเบียนต่อมื้อ) · token เท่านั้น · ไม่มีคำ "ไม่ได้กิน" · ไม่บอกว่า "แจ้งแล้ว" ถ้ายังไม่ได้แจ้ง
**Scale/Scope**: 1 หน้าจอใหม่ (S3) + ปุ่มใน S2 · 1 โมดูล (6 ฟังก์ชัน) · AC 6 ข้อ

## Constitution Check

| หลักการ | ตรวจ | ก่อน | หลัง Phase 1 |
|---|---|---|---|
| I Golden Thread | ใช้รหัส SRS · S3 ติด `Covers: FR-04` · contract มีคอลัมน์ AC · แก้ architecture §7, §8.1, §8.3, §9.1 ในงานเดียวกัน (R-2, R-4) | ✅ | ✅ |
| II No gold-plating | ไม่มีแก้/ลบการยืนยัน · ไม่มี dialog · ไม่ยืนยันทีละยา · ไม่มีประวัติย้อนหลังหลายวัน (S3 = วันนี้) · `canConfirmLate`/`visibleDue` แยกกฎออกจากหน้าจอ ไม่ใช่ฟีเจอร์ใหม่ | ✅ | ✅ |
| III Tests on separated logic | กฎใน `confirm` ฟังก์ชันล้วน รับ `now` · ทุก AC มี test · ค่าขอบ T−1, T, T+15−1ms, T+15, มื้อถัดไป−1, มื้อถัดไปพอดี, 23:59 · ว่าง (ไม่มีบันทึก) · ตัดออก (บันทึกของคู่อื่น) | ✅ | ✅ |
| IV Evidence | NFR-02 = `[ทีมกรอก]` · ไม่แสดง "แจ้งลูกหลานแล้ว" ถ้ายังไม่มี FR-05 (R-5) | ✅ | ✅ |
| V Safety & privacy | "ยังไม่ยืนยัน" ไม่ใช่ "ไม่ได้กิน" · บันทึกผูก `pairingId` · `unpair` ลบได้ (FR-01 ทำแล้ว) · ยืนยันล่วงหน้าไม่ได้ | ✅ | ✅ |
| Platform | ดับเบิลคลิกได้ · ไม่มี server/npm | ✅ | ✅ |

**ผลตรวจหลัง Phase 1 — แก้ `architecture.md` ในงานเดียวกัน:** §8.1 คำสถานะอยู่ที่ `confirm.statusLabel` · §8.3 ตาราง `confirm` ตาม [contracts/confirm-module.md](contracts/confirm-module.md) (`notYet` คืน object, เพิ่ม `visibleDue`, `statusOf`, `statusLabel`, `canConfirmLate`) และลบแถว `statusOf` จาก doseSession · `escalation` ใช้ `confirm.statusLabel` · §7 ตารางโมดูล: `confirm` ใช้ `doseSession` · `escalation` ใช้ `confirm` · §9.1 แถว FR-04 · ERD ไม่เปลี่ยน

## Project Structure

```text
specs/004-confirm/   spec · plan · research (R-1…R-7) · data-model · contracts/{confirm-module,screens}.md · quickstart · checklists/ · tasks (ถัดไป)

prototype/
├── index.html                      # เปิดบรรทัดของ D: modules/confirm.js (หลัง doseSession.js) + screens/home.js
├── src/modules/confirm.js          # ใหม่ · ยืนยัน/ยังไม่กิน/ซ่อน/สถานะ/คำสถานะ (BR-10–12, 14, 15)
├── src/screens/home.js             # ใหม่ · S3 หน้าแรกผู้สูงอายุ
├── src/screens/reminder.js         # แก้ · ปุ่มทำงานจริง · hide · isStart · ไป S3 (ไฟล์ของ C · ส่วนปุ่มของ D)
└── tests/confirm.test.js           # ใหม่
```

**Structure Decision**: ตาม TEAM-PLAN ข้อ 3 (เจ้าของ D: `confirm.js`, `screens/home.js`, ปุ่มใน S2) · แก้ `reminder.js` ของ C เฉพาะส่วนปุ่ม/การสลับหน้า และระบุในเอกสาร

## Complexity Tracking

ไม่มีส่วนที่ขัด constitution
