# Research: ยืนยันการกินยาทั้งมื้อ (004-confirm)
<!-- เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · Claude Code /speckit-plan -->

ไม่มีช่อง NEEDS CLARIFICATION เหลือใน spec · ข้อด้านล่างคือการตัดสินใจทางเทคนิคที่ spec ปล่อยให้ plan

## R-1 `confirm` คืนผลตามสัญญา architecture §8.3 · ช่วงเวลาจาก `doseSession`

- **Decision:** `confirm(confirmations, session, sessions, pairingId, now)` →
  `{ ok: true, confirmations, confirmation, late }` หรือ `{ ok: false, reason: 'ALREADY' | 'NOT_STARTED' | 'TOO_LATE' }` ·
  ตรวจตามลำดับ: มีบันทึกของ (`pairingId`, `sessionKey`) แล้ว → `ALREADY` · `now < at` → `NOT_STARTED` · `now ≥ doseSession.lateUntil(session, sessions)` → `TOO_LATE` ·
  ผ่าน → เพิ่ม `{ pairingId, sessionKey, confirmedAt: now }` · `late = now ≥ at + 15 นาที`
- **Rationale:** `ALREADY` ตรวจก่อน → แตะซ้ำหลังพ้นช่วงก็ไม่สร้างบันทึก (NFR-07) และบอกว่า "ยืนยันแล้ว" ไม่ใช่ "เลยเวลา" · ช่วงยืนยันช้าใช้ `lateUntil` ตัวเดียวกับหน้าเตือน (BR-15 อยู่ที่เดียว · 003 R-4) · `late` เป็นค่าคำนวณ ไม่เก็บ (data model)
- **Alternatives:** เก็บฟิลด์ `late` ในบันทึก — ค่าคำนวณได้จาก `confirmedAt` + `sessionKey` (กติกาวิชา: ค่าที่คำนวณได้ไม่ใช่ field)

## R-2 `notYet` คืนการกระทำ + เวลาที่ซ่อนถึง (clarify 24/10)

- **Decision:** `notYet(session, now)` → `{ action: 'WAIT', hideUntil: at + round × 5 นาที }` (รอบ 1–2) · `{ action: 'NOTIFY', hideUntil: at + 15 นาที }` (รอบ 3) · `{ action: 'NONE' }` (ไม่อยู่ในรอบเตือน)
- **Rationale:** หน้าจอต้องรู้ทั้ง "แจ้งหรือไม่" (BR-11) และ "จะเตือนอีกครั้งเมื่อไร" (R9 feedback + R4b ซ่อนถึงเมื่อไร) จากกฎเดียว · `hideUntil` = เวลาเริ่มรอบถัดไปพอดี
- **Alternatives:** คืนแค่ `'WAIT' | 'NOTIFY'` ตามสัญญาเดิม แล้วหน้าจอคำนวณเวลาเอง — กฎรอบเตือนหลุดไปอยู่ในหน้าจอ (constitution III)
- **ผลต่อสัญญา:** แก้ `architecture.md` §8.3 แถว `notYet`

## R-3 การซ่อนหลัง "ยังไม่กิน" = สถานะของหน้าเว็บ ไม่บันทึก

- **Decision:** แผนที่ `hidden { sessionKey → hideUntil }` อยู่ระดับหน้าเว็บใน `screens/reminder.js` (`MedMind.reminder.hide(sessionKey, until)`) · กรองด้วยฟังก์ชันล้วน `confirm.visibleDue(due, hidden, now)`:
  ตัดมื้อกำลังเตือนที่ `now < hidden[sessionKey]` · ไม่เหลือมื้อกำลังเตือน → `[]` (มื้อช่วงยืนยันช้าไม่เปิดหน้าเตือนเอง · clarify 003) · `MedMind.reminder.dueKey` ใช้ผลที่กรองแล้ว
- **Rationale:** clarify 24/10 "ไม่บันทึกการซ่อน" · ผลเมื่อรีเฟรช = แสดงอีกในรอบเดิม (ไม่เสียหาย · spec edge) · หน้าแรกไม่ดึงกลับหน้าเตือนระหว่างซ่อน เพราะ `dueKey` ไม่รวมมื้อที่ซ่อน · รอบถัดไปคีย์ใหม่ → หน้าเตือนขึ้นเองพร้อมเสียง
- **Alternatives:** บันทึก "ยังไม่กิน" ลง store — สร้างข้อมูลที่ไม่มี entity ใน data model และทุกแท็บซ่อนตามกัน (เกินที่ clarify ตัดสิน)

## R-4 `statusOf` + `statusLabel` อยู่ใน `confirm` (ย้ายจาก doseSession / escalation)

- **Decision:** `confirm.statusOf(session, sessions, confirmations, pairingId, now)` → `{ status, confirmedAt }` · status: `TAKEN` / `TAKEN_LATE` (มีบันทึก · ช้าเมื่อ `confirmedAt ≥ at + 15`) · `WAITING` (`now < at`) · `ALERTING` (`at ≤ now < at + 15`) · `UNCONFIRMED` (ที่เหลือ) ·
  `confirm.statusLabel(status, confirmedAt)` → "กินแล้ว 07:04" / "กินแล้ว (ยืนยันช้า) 08:40" / "กำลังเตือน" / "ยังไม่ยืนยัน" / "รอถึงเวลา" (BR-14 ตรงตัว)
- **Rationale:** สถานะ TAKEN/TAKEN_LATE มาจากบันทึกยืนยันซึ่งเป็น entity ของ FR-04 · หน้าแรก S3 (FR-04) ต้องใช้คำ BR-14 ก่อน FR-05 มี · คำต้องตรงทุกที่ (§8.1) → ฟังก์ชันเดียว FR-05 (`dailyStatus`, หน้า C3) เรียกตัวนี้
- **Alternatives:** คงไว้ที่ `escalation.statusLabel` (E) — S3 ต้องรอ FR-05 หรือเขียนคำซ้ำเอง (คำ 2 ที่ไม่ตรงกันได้)
- **ผลต่อสัญญา:** architecture §8.1 (คำสถานะอยู่ที่ `confirm.statusLabel`) · §8.3 ย้ายแถว `statusOf` จาก doseSession ไป confirm · `escalation.dailyStatus/statusLabel` ใช้ของ confirm · §7 ตารางโมดูล: `escalation` ใช้ `confirm` ด้วย

## R-5 การแจ้งผู้ดูแลส่งต่อ FR-05 ผ่าน `escalation.addNotice`

- **Decision:** S2 เมื่อ `notYet` = `NOTIFY` และ S2/S3 เมื่อ `confirm` ได้ `late: true` → ถ้ามี `MedMind.escalation` เรียก `addNotice(notices, session, 'UNCONFIRMED' | 'CONFIRMED_LATE', pairingId, now)` แล้วเขียน `notices` เมื่อค่าเปลี่ยน + toast "แจ้งลูกหลานแล้ว" ·
  ยังไม่มี (ก่อน FR-05) → ไม่เขียน และ toast บอกตามจริง "รับทราบแล้ว · ระบบแจ้งลูกหลานยังไม่พร้อมในรุ่นนี้"
- **Rationale:** entity CAREGIVER_NOTICE เป็นของ E (§8.2) · ห้ามบอกผู้สูงอายุว่า "แจ้งแล้ว" ทั้งที่ยังไม่มีการแจ้ง (constitution IV/V) · `addNotice` ซ้ำไม่เพิ่ม (BR-13 1 ครั้งต่อมื้อ) จึงแตะ "ยังไม่กิน" ซ้ำได้
- **Alternatives:** เขียนระเบียนแจ้งเองใน FR-04 — ทำงานของ FR-05 ซ้อน และนิยามระเบียนสองที่
- **ส่งต่อ FR-05:** ลบ toast "ยังไม่พร้อมในรุ่นนี้" เมื่อ `escalation` โหลดแล้ว (ทางนี้จะไม่ถูกใช้อยู่แล้ว)

## R-6 หน้าแรก S3 + การสลับกับ S2

- **Decision:** S3 (`screens/home.js`) `isStart` = จับคู่แล้ว · S2 `isStart` = จับคู่แล้ว **และ** `dueKey` ไม่ว่าง (เปิดหน้าเว็บกลางรอบเตือน → เห็นหน้าเตือนก่อน) ·
  S3 ไป S2 เองเมื่อ `dueKey` เปลี่ยนเป็นค่าใหม่ที่ไม่ว่าง (แบบเดียวกับ S1 · 003) · S2 ไม่มีมื้อต้องแสดง → `ctx.go('S3', { notice })` ถ้ามี S3 (เก็บสถานะว่าง/ยังไม่ถึงเวลาของ S2 ไว้เป็นทางสำรองเมื่อไม่มี S3) ·
  S3 แสดงมื้อของ **วันนี้** เรียงเวลา: เวลา · ชื่อยาในมื้อ · ป้ายสถานะ (`.status--*` + `statusLabel`) · มื้อ `UNCONFIRMED` ที่ยังอยู่ในช่วงยืนยันช้า มีปุ่ม "กินแล้ว" (primary เฉพาะปุ่มแรก) · ไม่มียา → "ยังไม่มียา ให้ผู้ดูแลเพิ่มยา" · ปุ่ม ghost "การเชื่อมต่อ" → S1
- **Rationale:** AC ✓5 "กดจากหน้าแรก" + FR-03 ✗5 "หน้าแรกแสดง…" · ไม่แก้ shell (§8.5 ปฏิเสธ hook ทั้งแอป) · มื้อของเมื่อวานพ้นช่วงยืนยันช้าตอน 00:00 แล้ว (lateUntil) จึงไม่ต้องแสดง
- **Alternatives:** รวม S2+S3 เป็นหน้าเดียว — ขัด architecture (S2 FR-03, S3 FR-04) และหน้าเตือนต้องเป็นหน้าเรียบที่มีแค่มื้อที่ต้องทำตอนนี้ (NFR-02 ≤ 10 วินาที)

## R-7 ปุ่มบน S2 (แทน toast ชั่วคราวของ 003 R-9)

- **Decision:** "กินแล้ว" → `store.reload()` → `confirm(...)` → ok: เขียน `confirmations` + toast "บันทึกแล้ว: กินแล้ว HH:MM" (ช้า: "กินแล้ว (ยืนยันช้า) HH:MM" + แจ้งตาม R-5) · `ALREADY` → toast "มื้อนี้ยืนยันแล้ว" ไม่เขียน · `TOO_LATE` → toast "เลยเวลายืนยันมื้อนี้แล้ว" ·
  "ยังไม่กิน" (เฉพาะมื้อกำลังเตือน · มื้อช่วงยืนยันช้าไม่มีปุ่มนี้) → `notYet` → `hide` → toast "จะเตือนอีกครั้ง HH:MM" หรือแจ้งตาม R-5 · ไม่มี dialog (spec R11)
- **Rationale:** feedback ทุกการกระทำ · `reload` ก่อนเขียนกันข้อมูลเก่าจากอีกแท็บ (กติกาหน้าจอ) · ไม่เขียนถ้าไม่เปลี่ยน
- **Alternatives:** dialog ยืนยันก่อนบันทึก — เพิ่มขั้นตอนให้ผู้สูงอายุ (NFR-02) ทั้งที่กดซ้ำไม่มีผลเสีย
