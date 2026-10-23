# Data Model: Label (FR-02)

**Source**: `docs/03-design/architecture.md` §6 (MEDICATION, MEAL_TIMES) · §8.2 (`medications`, `mealTimes`) — ไม่ตั้ง entity ใหม่
<!-- เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 -->

ไม่มีชื่อผู้ป่วย HN ชื่อแพทย์ วันที่จ่ายยา ชื่อโรงพยาบาล หรือข้อความดิบจากฉลากในทุก entity (NFR-09 · R10b) · ไม่เก็บรูป

## Entities

| Entity (ชุดข้อมูล) | ฟิลด์ | กฎตรวจ | ที่มา |
|---|---|---|---|
| **MealTimes** (`mealTimes`: object เดียวต่อคู่) | `pairingId` · `breakfast` · `lunch` · `dinner` · `bedtime` (ข้อความ `"HH:MM"`) | ทุกช่องรูปแบบ `HH:MM` 00:00–23:59 · ตั้งครั้งแรกตอนเพิ่มยา แก้ได้ | BR-06 · ✓6 |
| **Medication** (`medications`: list) | `medicationId` · `pairingId` · `name` · `tabletsPerDose` · `timing` (`AFTER_MEAL` / `BEFORE_MEAL` / `BEDTIME`) · `meals` (list ของ `BREAKFAST` / `LUNCH` / `DINNER` · ว่างเมื่อ `BEDTIME`) · `minutesBefore` (เฉพาะ `BEFORE_MEAL`) · `warnings` · `contraindications` (ข้อความ หรือ `null`) · `savedAt` | `name` ไม่ว่าง ≤ 100 ตัวอักษร · `tabletsPerDose` จำนวนเต็ม 1–20 · `meals` ≥ 1 เมื่อไม่ใช่ `BEDTIME` · `minutesBefore` จำนวนเต็ม 1–120 เมื่อ `BEFORE_MEAL` · เวลาเตือนทุกค่า ≥ 00:00 | BR-04–07 · NFR-06 |

**ค่าคำนวณ ไม่เก็บ:** เวลาเตือนของยา (`reminderTimes`) · สถานะ "กรุณาตรวจสอบ" · ยาไม่รองรับ

## Draft (ร่าง — ไม่เก็บ อยู่ในหน้าจอจนบันทึก/ยกเลิก)

| ช่อง | ค่า | ว่างได้? |
|---|---|---|
| `name` | ข้อความ หรือ `null` | `null` = กรุณาตรวจสอบ (บังคับ) |
| `tabletsPerDose` | จำนวนเต็ม หรือ `null` | `null` = กรุณาตรวจสอบ (บังคับ) |
| `timing` | `AFTER_MEAL` / `BEFORE_MEAL` / `BEDTIME` / `null` | `null` = กรุณาตรวจสอบ (บังคับ) |
| `meals` | list หรือ `null` | `null` เมื่อเวลาอิงมื้อแต่แยกมื้อไม่ได้ |
| `minutesBefore` | จำนวนเต็ม หรือ `null` | `null` + `BEFORE_MEAL` = กรุณาตรวจสอบ (✗10) |
| `warnings` · `contraindications` | ข้อความ หรือ `null` | ว่างได้ ไม่เตือน (BR-05) |
| `unsupported` | `null` / `AS_NEEDED` / `NOT_TABLET` / `HALF_TABLET` | ไม่ `null` = บันทึกไม่ได้ (BR-07 · ✗4) |
| `needsCheck` | list ชื่อช่องที่แยกไม่ได้ | — |
| `found` | จำนวนช่องที่แยกได้ | `0` = อ่านไม่ได้ (✗5 · research R-4) |

## สถานะหน้าจอ C2

| สถานะ | เงื่อนไข | ปุ่มหลัก |
|---|---|---|
| `LIST` | ปกติ (ไม่มียา = สถานะว่าง "ยังไม่มียา") | "เพิ่มยาจากฉลาก" |
| `READING` | กำลังอ่านรูป | — ("กรอกเอง" ปุ่มรอง) |
| `DRAFT` | มีร่าง (จากรูป / ฟอร์มว่าง) | "บันทึกยา" (disabled จนผ่าน `validateDraft`) · "ยกเลิก" ปุ่มรอง |
| ไม่มีคู่ | `!canAccess` | → `ctx.go('C1', { notice: 'UNPAIRED' })` (architecture §8.5) |
