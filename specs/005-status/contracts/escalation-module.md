# Contract: `MedMind.escalation` (FR-05)
<!-- เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · แทนช่อง escalation ใน architecture.md §8.3 เมื่อ implement -->

ไฟล์ `prototype/src/modules/escalation.js` · UMD (`window.MedMind.escalation` + `module.exports`) · ฟังก์ชันล้วน รับ `now` ·
พึ่ง `doseSession` (`lateUntil`, `dayOf`) และ `confirm` (`statusOf`, `statusLabel`) · ใน node `require('./doseSession.js')`, `require('./confirm.js')`

| Operation | Input | Output | กฎ / AC |
|---|---|---|---|
| `addNotice(notices, session, type, pairingId, now)` | `type` = `'UNCONFIRMED' \| 'CONFIRMED_LATE'` | รายการใหม่ + `{ pairingId, sessionKey, type, sentAt: now, seenAt: null }` · มี (`pairingId`, `sessionKey`, `type`) แล้ว → **รายการเดิม (ตัวเดิม)** | BR-13 · ✓5 · BR-15 |
| `escalate(sessions, confirmations, notices, pairingId, now)` | มื้อของเมื่อวาน + วันนี้ | เพิ่ม `UNCONFIRMED` ให้ทุกมื้อที่ `at + 15 ≤ now < lateUntil` และไม่มีบันทึกยืนยันของคู่นี้ · ไม่มีอะไรเพิ่ม → รายการเดิม (ตัวเดิม) | BR-13, 16 · ✓1 ✗2 ✓5 · NFR-01 |
| `noticeText(notice, confirmations)` | | "ยังไม่ยืนยันการกินยา" · "ยืนยันการกินยาแล้ว เวลา HH:MM" (`confirmedAt` ของคู่+มื้อ · ไม่พบ = ไม่มีเวลา) · ไม่มีคำว่า "ไม่ได้กิน" | BR-13, BR-15 · ✗2 ✓6 |
| `dailyStatus(sessions, confirmations, pairingId, now)` | มื้อของวันนี้ | `[{ sessionKey, at, medicationIds, status, confirmedAt, label }]` เรียงตามเวลา · ไม่มีมื้อ = `[]` | BR-14 · ✓3 ✗4 |
| `noticesOf(notices, pairingId, now)` | | ข้อความของคู่นี้ที่ `dayOf(sentAt)` = วันนี้ · ล่าสุดก่อน | R10 · NFR-04 |
| `unseen(notices, pairingId)` | | ข้อความของคู่นี้ที่ `seenAt` = `null` · ล่าสุดก่อน | R11 (clarify) |
| `markSeen(notices, pairingId, now)` | | ใส่ `seenAt: now` ให้ทุกรายการที่ยังไม่กดของคู่นี้ · ไม่มี → รายการเดิม (ตัวเดิม) | R11 |

**ข้อตกลง**: ไม่แก้ input · `notices`/`confirmations`/`sessions` `undefined`/`null` = `[]` · ไม่ใช่ list → `TypeError` · `now` ไม่ใช่ตัวเลข → `TypeError` · `type` อื่น → `TypeError` · `pairingId` ว่าง → `TypeError` (addNotice)

**Test** — `prototype/tests/escalation.test.js`
| AC / กฎ | กรณี |
|---|---|
| ✓1 | ยืนยัน 08:12 → `escalate` ที่ 08:15 คืนรายการเดิม (ตัวเดิม) |
| ✗2 · BR-13 | ไม่ยืนยัน → 08:15 ได้ 1 รายการ `UNCONFIRMED` `sentAt` 08:15 `seenAt` null · `noticeText` = "ยังไม่ยืนยันการกินยา" |
| ค่าขอบ | 08:15 − 1 ms → ไม่มี · 08:15 → มี · `lateUntil` (12:00) → ไม่สร้าง · 11:59 → สร้าง · มื้อ 23:50 → 00:05 วันถัดไปสร้าง |
| ✓5 · BR-13 | มี `UNCONFIRMED` จาก "ยังไม่กิน" 08:10 แล้ว → 08:15 รายการเดิม · `escalate` ซ้ำ 5 ครั้ง → 1 รายการ · `addNotice` ซ้ำ → ตัวเดิม |
| BR-16 | มื้อ 06:45 + 07:00 ไม่ยืนยัน → ที่ 07:15 ได้ 2 รายการ · ยืนยัน 07:00 → มื้อ 06:45 ยังถูกแจ้ง |
| เวลากระโดด | 07:00 → 12:30 มื้อ 08:00 (lateUntil 12:00) ไม่สร้าง · มื้อ 12:00 → สร้าง |
| ✓6 · BR-15 | `CONFIRMED_LATE` + บันทึก 08:40 → "ยืนยันการกินยาแล้ว เวลา 08:40" · มี `UNCONFIRMED` อยู่แล้ว → `addNotice` `CONFIRMED_LATE` ยังเพิ่ม (ชนิดต่างกัน) |
| ✓3 · BR-14 | `dailyStatus` 12:30: 08:00 ยืนยัน 08:03 → `TAKEN` "กินแล้ว 08:03" · 12:00 → `UNCONFIRMED` · 18:00 → `WAITING` "รอถึงเวลา" · เรียงเวลา · label ตรงกับ `confirm.statusLabel` |
| ✗4 | ไม่มีมื้อ → `dailyStatus` = `[]` |
| NFR-04 · ✗7 | ข้อความ/บันทึกของคู่อื่นไม่ถูกนับใน `escalate`, `noticesOf`, `unseen`, `markSeen`, `dailyStatus` |
| R11 | `unseen` ล่าสุดก่อน · `markSeen` ใส่เวลาเฉพาะคู่นี้ · ไม่มีที่ยังไม่กด → ตัวเดิม |
| R13 | ทุกผลของ `noticeText` และ `label` ไม่มี "ไม่ได้กิน" |
| ข้อตกลง | ไม่แก้ input (freeze) · input ผิดรูป → `TypeError` |
