# Implementation Plan: จับคู่ผู้สูงอายุกับผู้ดูแล (Pairing)

**Branch**: `feat/pairing` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-pairing/spec.md` · ต้นฉบับ requirement: `docs/02-requirements/spec.md` FR-01, BR-01, 02, 17, 18, NFR-03, 04, 05, 09, 10
<!-- เจ้าของ: A (YAR OO) · ร่างโดย Claude Code ตามคำสั่ง /speckit-plan -->

## Summary

ผู้สูงอายุเห็น QR + รหัส 6 หลักทันทีโดยไม่ต้องกรอก กดยินยอม 1 ครั้ง · ผู้ดูแลสแกนรูป QR หรือใส่รหัส → จับคู่ 1:1 ·
ปฏิเสธพร้อมเหตุผล 5 แบบตามลำดับคงที่ · ผิด 5 ครั้งใน 10 นาที → ล็อก 10 นาที · ยกเลิกการจับคู่ = ลบข้อมูลของคู่
แนวทาง: กฎทั้งหมดเป็นฟังก์ชันล้วนใน `src/modules/pairing.js` + `qrScan.js` (รับ `now`/`random` เข้ามา, test ด้วย `node --test`) ·
หน้าจอ S1/C1 ใน `src/screens/pairing.js` อ่าน/เขียน store ของ Foundation และอัปเดตตาม `ctx.subscribe`

## Technical Context

**Language/Version**: JavaScript ES5-compatible + UMD (ไม่มี ES modules เพราะ `file://` · TEAM-PLAN ข้อ 5) · HTML/CSS

**Primary Dependencies**: Foundation (`src/core/clock|store|events.js`, `src/ui/shell.js`) · jsQR 1.4.0 (มีใน vendor แล้ว) ·
qrcode-generator 1.4.4 (เพิ่มใน vendor 22/10 · research R-1 · ADR-07)

**Storage**: store ของ Foundation (localStorage `medmind.v2`) · ชุดข้อมูล `devices`, `invites`, `pairAttempts`, `pairing` (architecture §8.2)

**Testing**: `node --test` ที่ root · `node:test` + `node:assert` เท่านั้น · ไฟล์ `prototype/tests/pairing.test.js`, `qrScan.test.js`

**Target Platform**: Chrome/Edge/Safari มือถือและเดสก์ท็อป · เปิดได้ทั้ง `file://` (ดับเบิลคลิก) และ GitHub Pages

**Project Type**: เว็บแอป prototype (ฝั่ง client อย่างเดียว ไม่มี server/DB/npm)

**Performance Goals**: อ่าน QR จากรูปมือถือ (ย่อ ≤ 1024 px) เสร็จภายใน 1 วินาที — เป้าหมายภายในทีม ไม่ใช่ NFR (วัดจริงตอน implement)

**Constraints**: ไม่อ่าน `Date.now()` ในโมดูล (ADR-02) · ใช้ token เท่านั้น · ปุ่มหลัก ≥ 64 px ข้อความ ≥ 18 px contrast ≥ 4.5:1 (NFR-03) ·
ไม่มีข้อมูลส่วนตัวใน QR/รหัส/entity (NFR-09, R8)

**Scale/Scope**: 1 ผู้สูงอายุ + 1 ผู้ดูแลต่อเบราว์เซอร์ · 2 หน้าจอ (S1, C1) · 2 โมดูล · AC 8 ข้อ

## Constitution Check

*GATE: ผ่านก่อน Phase 0 · ตรวจซ้ำหลัง Phase 1*

| หลักการ | ตรวจ | ก่อน | หลัง Phase 1 |
|---|---|---|---|
| I Golden Thread | ทุก operation/หน้าจอ/test อ้าง FR-01 + AC/BR (contracts มีคอลัมน์ AC) · S1/C1 ติด `Covers:` · ใช้รหัส SRS ไม่ตั้งใหม่ | ✅ | ✅ |
| II No gold-plating | ไม่มีหน้าเลือกบทบาท / หลายผู้ดูแล / สแกนวิดีโอสด · dependency ใหม่ 1 ตัว (ตัวสร้าง QR) มี FR-01 ✓1 บังคับ · ตรวจ integrity แล้ว · operation เสริม (`ensureDevices`, `reasonText`, ...) แต่ละตัวผูก AC | ✅ | ✅ |
| III Tests on separated logic | กฎอยู่ใน `src/modules/` รับ `now` · AC 8 ข้อ + ค่าขอบ (นาทีที่ 10, ครั้งที่ 4/5/6, ปลดล็อกพอดี) มี test · ไม่ใช้ package test | ✅ | ✅ |
| IV Evidence | ไม่มีผลทดสอบแต่ง · quickstart ข้อมือถือจริง = `[ทีมกรอก]` · AI log อัปเดต | ✅ | ✅ |
| V Safety & privacy | ไม่จับคู่ก่อนยินยอม (NFR-05) · `canAccess` (NFR-04) · `unpair` ลบข้อมูลคู่ (NFR-10) · จำกัดการเดา (BR-18) · ไม่มีข้อมูลส่วนตัว | ✅ | ✅ |
| Platform | HTML/CSS/JS ดับเบิลคลิก · ไม่มี server/DB/npm · 1 ปุ่มหลัก/สถานะ · ยกเลิกการจับคู่มี dialog ยืนยัน | ✅ | ✅ |

**ผลตรวจหลัง Phase 1 — พบและแก้ใน `architecture.md` (งานเดียวกันตามหลักการ I):**
- กฎล็อกใน §8.3 นับช่วง `(now − 10, now]` ทำให้ปลดล็อกก่อนเวลา → แก้เป็นนับจากครั้งผิดล่าสุด (research R-3) และแก้ถ้อยคำ R9 ใน spec ให้ชัด
- `consent(invite, now)` → `consent(invites, code, now)` · เพิ่ม `ensureDevices`, `currentInvite`, `isExpired`, `minutesLeft`, `isSeniorPaired`, `reasonText`, `qrMatrix` · §8.1 · §8.5 ข้อตกลงหน้าจอ · ADR-07 เพิ่มตัวสร้าง QR เพิ่มข้อยกเว้นข้อความของ FR-01

## Project Structure

### Documentation (this feature)

```text
specs/001-pairing/
├── spec.md              # /speckit-specify + /speckit-clarify
├── plan.md              # ไฟล์นี้
├── research.md          # Phase 0 (R-1 … R-9)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 (วิธีตรวจ)
├── contracts/
│   ├── pairing-module.md   # สัญญาฟังก์ชัน pairing + qrScan
│   └── screens.md          # S1, C1 + ข้อตกลงกับหน้าจอของ B–E
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — ยังไม่สร้าง)
```

### Source Code (repository root)

```text
prototype/
├── index.html                 # เอาคอมเมนต์ออก 3–4 บรรทัดของ A (pairing, jsQR, qrcode, qrScan, screens/pairing)
├── src/
│   ├── modules/
│   │   ├── pairing.js         # ใหม่ · กฎ FR-01 (BR-01, 02, 17, 18 · NFR-04, 05, 10)
│   │   └── qrScan.js          # ใหม่ · QR ↔ รหัส (ADR-07)
│   ├── screens/
│   │   └── pairing.js         # ใหม่ · S1, C1
│   └── ui/app.css             # (ถ้าต้องมี component ใหม่ เช่น กล่อง QR / รหัสตัวใหญ่ → แจ้ง D เจ้าของ design-system)
├── vendor/qrcode/             # เพิ่มแล้ว: qrcode.js + LICENSE (แถวใน vendor/README.md)
└── tests/
    ├── pairing.test.js        # ใหม่ · ทุก AC ของ FR-01 + ค่าขอบ
    └── qrScan.test.js         # ใหม่ · รูปแบบข้อความ QR + อ่าน QR ไป-กลับ
```

**Structure Decision**: ใช้โครงของ Foundation ที่มีอยู่ (`src/core` · `src/ui` · `src/modules` · `src/screens` · `tests`) ตาม TEAM-PLAN ข้อ 3 ·
ไม่ใช้ `prototype/src/logic.js` ไฟล์เดียวตามที่ CLAUDE.md เขียนไว้ เพราะ Foundation แยกไฟล์ต่อเจ้าของแล้ว (ลด PR ชนกัน) →
แก้ CLAUDE.md "โครงสร้าง repo" ให้ตรงแล้ว (22/10)

## Complexity Tracking

| เพิ่มอะไร | ทำไมต้องมี | ทางที่ง่ายกว่าและเหตุที่ไม่เลือก |
|---|---|---|
| dependency ใหม่ `qrcode-generator` | FR-01 ✓1 ต้องแสดง QR · vendor มีแต่ตัวอ่าน | เขียนเอง: ผิดง่าย ยาว · ไม่มี QR: ไม่ผ่าน ✓1/✓3 (research R-1) |
| ข้อความเหตุผลอยู่ในโมดูล ไม่ใช่หน้าจอ | AC ✗5 ✗7 ✗8 กำหนดข้อความตรงตัว ต้องมี unit test | ข้อความในหน้าจอ: test อัตโนมัติไม่ได้ (research R-6) |
