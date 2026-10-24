# Data Model: ยืนยันการกินยาทั้งมื้อ (004-confirm)
<!-- เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · ตาม architecture.md §6, §8 -->

ERD ไม่เปลี่ยน · feature นี้เป็นผู้เขียน `confirmations` (DOSE_CONFIRMATION) ผู้เดียว

## เขียน

**DoseConfirmation** — ชุดข้อมูล `confirmations` (list)
| ฟิลด์ | ค่า | กฎ |
|---|---|---|
| `pairingId` | id ของคู่ | NFR-04 · `unpair` ลบได้ (BR-17 · NFR-10) |
| `sessionKey` | `"YYYY-MM-DD@HH:MM"` ของมื้อ | คู่ (`pairingId`, `sessionKey`) ไม่ซ้ำ (NFR-07 · BR-12) |
| `confirmedAt` | ms เวลาที่แตะ "กินแล้ว" | `at ≤ confirmedAt < lateUntil` (BR-10, BR-15) |

ไม่มีฟิลด์อื่น · "ยืนยันช้า" = `confirmedAt ≥ at + 15 นาที` (คำนวณ ไม่เก็บ)

## เขียนผ่าน FR-05 (เมื่อมี `escalation`)

`notices` ด้วย `escalation.addNotice(..., 'UNCONFIRMED' | 'CONFIRMED_LATE', ...)` — รูปแบบระเบียนเป็นของ FR-05 (§8.2) · feature นี้ไม่สร้างระเบียนเอง

## อ่าน

`devices`, `pairing` (FR-01) · `medications`, `mealTimes` (FR-02) · มื้อ/รอบ/ช่วงยืนยันช้าจาก `doseSession` (FR-03)

## ค่าที่คำนวณ (ไม่เก็บ)

| ค่า | จาก | ใช้ที่ |
|---|---|---|
| `status` `WAITING` / `ALERTING` / `TAKEN` / `TAKEN_LATE` / `UNCONFIRMED` + `confirmedAt` | `confirm.statusOf` | S3 · FR-05 |
| ข้อความสถานะ (BR-14) | `confirm.statusLabel` | S3 · C3 (FR-05) |
| `hideUntil` | `confirm.notYet` | S2 ซ่อนมื้อ |

ลบระเบียนยืนยัน: เฉพาะ `confirm.undoConfirm` ภายใน 10 วินาทีหลังแตะ (BR-10 · R-8)

## ค่าในหน่วยความจำของหน้าเว็บ (ไม่เก็บ)

- `hidden { sessionKey → hideUntil }` (R-3) · หายเมื่อรีเฟรช/ปิดหน้า
- การแตะที่ยังยกเลิกได้ 1 รายการ `{ text, undo, commit, timer }` (R-8) · ปิดหน้า = ไม่ commit (การแจ้งที่รอไม่ถูกส่ง · ดู spec edge)

## การเปลี่ยนสถานะของมื้อ (`architecture.md` §5)

```
รอถึงเวลา ─T─▶ กำลังเตือน ─"กินแล้ว"─▶ กินแล้ว (+เวลา)
                   │ "ยังไม่กิน" รอบ 1–2 → ซ่อนจนรอบถัดไป (ยังกำลังเตือน)
                   │ "ยังไม่กิน" รอบ 3 → แจ้งผู้ดูแล (FR-05) + ซ่อนจน T+15
                   └─T+15─▶ ยังไม่ยืนยัน ─"กินแล้ว" ก่อน lateUntil─▶ กินแล้ว (ยืนยันช้า) (+เวลา · แจ้งผู้ดูแล FR-05)
                                        └─ถึง lateUntil─▶ คง "ยังไม่ยืนยัน" (ยืนยันไม่ได้)
```
