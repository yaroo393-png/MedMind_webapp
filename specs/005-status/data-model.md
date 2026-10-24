# Data Model: แจ้งผู้ดูแล + สถานะรายวัน (005-status)
<!-- เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · ตาม architecture.md §6, §8 -->

feature นี้เป็นผู้เขียน `notices` (CAREGIVER_NOTICE) ผู้เดียว · FR-04 (S2/S3) สร้างข้อความผ่าน `escalation.addNotice` ของ feature นี้

## เขียน

**CaregiverNotice** — ชุดข้อมูล `notices` (list)
| ฟิลด์ | ค่า | กฎ |
|---|---|---|
| `pairingId` | id ของคู่ | NFR-04 · `unpair` ลบได้ (BR-17 · NFR-10) |
| `sessionKey` | `"YYYY-MM-DD@HH:MM"` ของมื้อ | (`pairingId`, `sessionKey`, `type`) ไม่ซ้ำ (BR-13) |
| `type` | `UNCONFIRMED` / `CONFIRMED_LATE` | BR-13 · BR-15 |
| `sentAt` | ms เวลาจำลองตอนสร้าง | `UNCONFIRMED`: `at + 15 นาที ≤ sentAt < lateUntil` (R-1) |
| `seenAt` | ms หรือ `null` | **ใหม่** · ผู้ดูแลกด "ดูสถานะ"/"รับทราบ" (clarify 24/10 · research R-3) |

ไม่มีฟิลด์อื่น · ตัวข้อความ = คำนวณจาก `type` + `confirmedAt` ของบันทึกยืนยัน (R-4)

## อ่าน

`devices`, `pairing` (FR-01) · `medications`, `mealTimes` (FR-02) · มื้อ/ช่วงยืนยันช้าจาก `doseSession` (FR-03) · `confirmations` + สถานะ/คำจาก `confirm` (FR-04)

## ค่าที่คำนวณ (ไม่เก็บ)

| ค่า | จาก | ใช้ที่ |
|---|---|---|
| สถานะ + คำของทุกมื้อวันนี้ | `escalation.dailyStatus` (ใช้ `confirm.statusOf` / `statusLabel`) | C3 |
| ข้อความแจ้ง | `escalation.noticeText` | C3 · แถบแจ้ง |
| ข้อความของวันนี้ / ที่ยังไม่กด | `escalation.noticesOf` / `unseen` | C3 · แถบแจ้ง |

## การเปลี่ยนสถานะของข้อความ

```
(ไม่มี) ─T+15 ยังไม่ยืนยัน และก่อน lateUntil / "ยังไม่กิน" รอบ T+10 พ้น 10 วินาที─▶ UNCONFIRMED (seenAt null) ─กด "ดูสถานะ"/"รับทราบ"─▶ seenAt = เวลา
(ไม่มี) ─ยืนยันช้า พ้น 10 วินาที─▶ CONFIRMED_LATE (seenAt null) ─กด─▶ seenAt = เวลา
ทุกสถานะ ─ยกเลิกการจับคู่─▶ ถูกลบ
```
