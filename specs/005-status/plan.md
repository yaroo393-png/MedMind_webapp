# Implementation Plan: แจ้งผู้ดูแล + สถานะรายวัน (Status)

**Branch**: `feat/status` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: `specs/005-status/spec.md` · ต้นฉบับ requirement: `docs/02-requirements/spec.md` FR-05, BR-11, 13, 14, 15, 16 · NFR-01, 04
<!-- เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-plan -->

## Summary

โมดูล `escalation` (ฟังก์ชันล้วน) ตัดสิน: มื้อไหนต้องแจ้ง "ยังไม่ยืนยัน" (T+15 ถึงก่อนสิ้นช่วงยืนยันช้า · 1 ครั้งต่อมื้อต่อชนิด) · ข้อความแจ้ง · สถานะรายวันของคู่ (ใช้คำจาก `confirm`) · ข้อความที่ผู้ดูแลยังไม่กดดู ·
ตัวรันระดับหน้าเว็บเรียก `escalate` ทุกครั้งที่เวลา/ข้อมูลเปลี่ยนในทุกหน้า · หน้าใหม่ C3 สถานะวันนี้ + ข้อความแจ้งวันนี้ · แถบแจ้งค้างบนทุกหน้าผู้ดูแลจนกด (clarify) ·
ฝั่งผู้สูงอายุ (FR-04) แจ้งได้จริงแทนข้อความ "ยังไม่พร้อม"

## Technical Context

**Language/Version**: JavaScript (UMD · ไม่มี ES modules) · HTML/CSS
**Primary Dependencies**: Foundation · FR-01 `canAccess` · FR-02 `medicationsOf` · FR-03 `doseSession` (`sessionsOf`, `dayOf`, `lateUntil`) · FR-04 `confirm` (`statusOf`, `statusLabel`) + `MedMind.reminder` (ตัวเรียกแจ้งจากการแตะ) · ไม่มีไลบรารีใหม่
**Storage**: เขียน `notices` (เจ้าของ) · อ่าน `devices`, `pairing`, `medications`, `mealTimes`, `confirmations`
**Testing**: `node --test` (`escalation.test.js`) · Chrome headless อัตโนมัติสำหรับ C3/แถบ/ตัวรัน (สคริปต์ใน scratchpad ไม่ commit · ขั้นตอนมือใน quickstart)
**Target Platform**: Chrome/Edge เดสก์ท็อปแบบดับเบิลคลิก · มือถือผ่าน GitHub Pages
**Project Type**: เว็บแอป prototype ฝั่ง client
**Performance Goals**: NFR-01 ข้อความเกิดในการเปลี่ยนเวลาครั้งเดียวกับที่ถึง T+15 (ขณะหน้าเว็บเปิด)
**Constraints**: NFR-04 (กรองด้วยคู่) · BR-13 (1 ครั้งต่อมื้อ · ไม่มี "ไม่ได้กิน") · token เท่านั้น · ไม่มีคู่สีใหม่ · เขียน store เฉพาะเมื่อเปลี่ยน + reload ก่อนเขียน
**Scale/Scope**: 1 หน้าจอใหม่ (C3) + แถบใน C2 + ตัวรัน · 1 โมดูล (7 ฟังก์ชัน) · AC 7 ข้อ

## Constitution Check

| หลักการ | ตรวจ | ก่อน | หลัง Phase 1 |
|---|---|---|---|
| I Golden Thread | ใช้รหัส SRS · C3 ติด `Covers: FR-05` · contract มีคอลัมน์ AC · แก้ architecture §6 (`seenAt`), §8.3, §8.4, §9.1 ในงานเดียวกัน | ✅ | ✅ |
| II No gold-plating | ไม่มี push/LINE · ไม่มีประวัติหลายวัน · ไม่มีผู้ดูแลหลายคน · `seenAt` มีเพราะ clarify R11 (แถบค้างจนกด) · `unseen`/`markSeen`/`noticesOf` แยกกฎออกจากหน้าจอ ไม่ใช่ฟีเจอร์ใหม่ | ✅ | ✅ |
| III Tests on separated logic | กฎใน `escalation` ฟังก์ชันล้วน รับ `now` · ทุก AC มี test · ค่าขอบ T+15−1ms, T+15, lateUntil−1, lateUntil, ข้ามเที่ยงคืน · ว่าง (ไม่มีมื้อ) · ตัดออก (ยืนยันแล้ว, คู่อื่น) | ✅ | ✅ |
| IV Evidence | SC-008 = `[ทีมกรอก]` · ไม่แต่งผลผู้ดูแล | ✅ | ✅ |
| V Safety & privacy | "ยังไม่ยืนยันการกินยา" ไม่ใช่ "ไม่ได้กิน" · ข้อความผูก `pairingId` · `unpair` ลบได้ (FR-01 ทำแล้ว) · ไม่จับคู่ไม่เห็นข้อมูล | ✅ | ✅ |
| Platform | ดับเบิลคลิกได้ · ไม่มี server/npm · แจ้ง = ในหน้าเว็บ (ADR-01) | ✅ | ✅ |

**ผลตรวจหลัง Phase 1 — แก้ `architecture.md` ในงานเดียวกัน:** §6 CAREGIVER_NOTICE เพิ่ม `seenAt` (R-3) · §8.3 ตาราง `escalation` ตาม [contracts/escalation-module.md](contracts/escalation-module.md) (`noticeText` รับ `confirmations` · `dailyStatus` รับ `pairingId` · เพิ่ม `noticesOf`, `unseen`, `markSeen`) ·
§8.4 ตัวรันระดับหน้าเว็บใน `status.js` (R-2) · §9.1 แถว FR-05 · ERD ความสัมพันธ์ไม่เปลี่ยน

## Project Structure

```text
specs/005-status/   spec · plan · research (R-1…R-8) · data-model · contracts/{escalation-module,screens}.md · quickstart · checklists/ · tasks (ถัดไป)

prototype/
├── index.html                      # เปิดบรรทัดของ E: modules/escalation.js (หลัง confirm.js) + screens/status.js
├── src/modules/escalation.js       # ใหม่ · แจ้ง/สถานะรายวัน/ข้อความ/ที่ยังไม่กด (BR-13–16)
├── src/screens/status.js           # ใหม่ · C3 + แถบแจ้ง + ตัวรันตามเวลา
├── src/screens/medication.js       # แก้ (B) · isStart เมื่อยังไม่มียา · แถบแจ้ง · ปุ่ม "สถานะวันนี้"
├── src/screens/reminder.js         # แก้ (C/D) · ลบทาง "ยังไม่พร้อมในรุ่นนี้"
└── tests/escalation.test.js        # ใหม่
```

**Structure Decision**: ตาม TEAM-PLAN ข้อ 3 (เจ้าของ E: `escalation.js`, `screens/status.js`, C3) · แก้ไฟล์ของ B และ C/D เฉพาะจุดใน [contracts/screens.md](contracts/screens.md) และระบุในเอกสาร

## Complexity Tracking

ไม่มีส่วนที่ขัด constitution
