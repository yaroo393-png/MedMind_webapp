# Contract: `MedMind.confirm` (FR-04)
<!-- เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · แทนช่อง confirm ใน architecture.md §8.3 เมื่อ implement -->

ไฟล์ `prototype/src/modules/confirm.js` · UMD (`window.MedMind.confirm` + `module.exports`) · ฟังก์ชันล้วน รับ `now` ·
พึ่ง `doseSession` (`roundAt`, `lateUntil`) · ใน node `require('./doseSession.js')`

| Operation | Input | Output | กฎ / AC |
|---|---|---|---|
| `confirm(confirmations, session, sessions, pairingId, now)` | บันทึกเดิม · มื้อ · มื้อของวันเดียวกัน · คู่ · เวลา | `{ ok: true, confirmations, confirmation, late }` หรือ `{ ok: false, reason }` · ลำดับ: `ALREADY` → `NOT_STARTED` (`now < at`) → `TOO_LATE` (`now ≥ lateUntil`) · `late` = `now ≥ at + 15 นาที` · ไม่ผ่าน = ไม่มีรายการใหม่ | BR-10, 12, 15 · ✓1 ✗2 ✓5 ✗6 · NFR-07 |
| `notYet(session, now)` | | `{ action: 'WAIT', hideUntil }` รอบ 1–2 (`hideUntil` = เวลาเริ่มรอบถัดไป) · `{ action: 'NOTIFY', hideUntil: at + 15 }` รอบ 3 · `{ action: 'NONE' }` นอกรอบ | BR-11 · ✓3 ✗4 |
| `visibleDue(due, hidden, now)` | ผลของ `doseSession.dueSessions` · `{ sessionKey: hideUntil }` | `due` ที่ตัดมื้อกำลังเตือนที่ `now < hidden[key]` · ไม่เหลือมื้อกำลังเตือน → `[]` | R4b · clarify 24/10 |
| `statusOf(session, sessions, confirmations, pairingId, now)` | | `{ status, confirmedAt }` · `TAKEN` / `TAKEN_LATE` (มีบันทึก · ช้าเมื่อ `confirmedAt ≥ at + 15`) · `WAITING` (`now < at`) · `ALERTING` (`now < at + 15`) · `UNCONFIRMED` · `confirmedAt` = `null` เมื่อไม่มีบันทึก | BR-14 · §5 |
| `statusLabel(status, confirmedAt)` | | "กินแล้ว HH:MM" · "กินแล้ว (ยืนยันช้า) HH:MM" · "กำลังเตือน" · "ยังไม่ยืนยัน" · "รอถึงเวลา" · ไม่มีคำว่า "ไม่ได้กิน" | BR-14 · BR-13 |
| `canConfirmLate(session, sessions, confirmations, pairingId, now)` | | `true` เมื่อ `statusOf` = `UNCONFIRMED` และ `now < lateUntil` (หน้าแรกแสดงปุ่ม) | BR-15 · ✓5 ✗6 |

**ข้อตกลง**: ไม่แก้ input · input ผิดรูป (`confirmations`/`sessions` ไม่ใช่ list ที่ไม่ใช่ `undefined`/`null`, `now` ไม่ใช่ตัวเลข) → `TypeError` · `confirmations` `undefined`/`null` = `[]`

**Test** — `prototype/tests/confirm.test.js`
| AC / กฎ | กรณี |
|---|---|
| ✓1 · BR-10 | 08:03 ยืนยันมื้อ 08:00 → 1 ระเบียน `confirmedAt` 08:03 · `late` false · `doseSession.dueSessions` หลังจากนั้นไม่มีมื้อนี้ (หยุดเตือน) |
| ✗2 · BR-12 · NFR-07 | ยืนยันซ้ำ 5 ครั้ง (ทั้งก่อนและหลัง T+15) → `ALREADY` · รายการ 1 ระเบียน เวลาเดิม · บันทึกของคู่อื่นที่ `sessionKey` เดียวกันไม่ทำให้ `ALREADY` |
| ✓3 · BR-11 | รอบ 1 (08:01) → `WAIT` hideUntil 08:05 · รอบ 2 (08:07) → `WAIT` 08:10 |
| ✗4 · BR-11 | รอบ 3 (08:10, 08:14) → `NOTIFY` hideUntil 08:15 · ก่อน T / ตั้งแต่ T+15 → `NONE` |
| ✓5 · BR-15 | 08:40 ยืนยัน → ok `late` true · `statusOf` → `TAKEN_LATE` 08:40 · `statusLabel` "กินแล้ว (ยืนยันช้า) 08:40" |
| ✗6 · BR-15 | มื้อถัดไป 12:00: 11:59 ได้ · 12:00 `TOO_LATE` รายการไม่เปลี่ยน · `statusOf` 12:00 = `UNCONFIRMED` · `canConfirmLate` false |
| ค่าขอบ | 07:59 `NOT_STARTED` · 08:00 ได้ (ตรงเวลา) · 08:15 − 1 ms ตรงเวลา · 08:15 ช้า · ไม่มีมื้อถัดไป: 23:59 ได้ |
| BR-16 | ยืนยัน A ไม่ทำให้ B ยืนยัน · `notYet` ของ A ไม่กระทบ `visibleDue` ของ B |
| R4b | `visibleDue`: ซ่อน A (กำลังเตือน) ที่เหลือ B → [B] (+ มื้อช่วงยืนยันช้า) · ซ่อนมื้อเดียวที่กำลังเตือน → `[]` · ถึง `hideUntil` → แสดงอีก |
| BR-14 | `statusOf` ทั้ง 5 แบบ · `statusLabel` ตรงตัว 5 แบบ · ไม่มี "ไม่ได้กิน" |
