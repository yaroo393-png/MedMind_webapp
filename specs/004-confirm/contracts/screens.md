# Contract: หน้าจอ S2 (ปุ่ม) + S3 หน้าแรกผู้สูงอายุ (FR-04)
<!-- เจ้าของ: D (Rossatorn Sangkaew) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 -->

## S2 — แก้ `prototype/src/screens/reminder.js` (ของ C · ส่วนปุ่มเป็นของ D)

- `isStart(app)` = จับคู่แล้ว **และ** `MedMind.reminder.dueKey(app)` ไม่ว่าง (R-6)
- มื้อที่แสดง = `confirm.visibleDue(dueSessions(...), hidden, now)` · `dueKey` และเสียงใช้ผลเดียวกัน
- ไม่มีมื้อต้องแสดง → มี S3 → `ctx.go('S3', { notice })` · ไม่มี S3 → สถานะว่าง/ยังไม่ถึงเวลาเดิม (ทางสำรอง)
- `MedMind.reminder.hide(sessionKey, until)` — เก็บใน `hidden` ระดับหน้าเว็บ

**ยกเลิกได้ 10 วินาที (research R-8):** `MedMind.reminder.offerUndo({ text, undo, commit })` · `undoBanner()` แสดงบนสุดของ S2 และ S3 (`.banner--info` ข้อความ + ปุ่ม `btn--secondary` "ยกเลิก" สูง ≥ 48) · การแตะใหม่ commit ของเดิมทันที · หมดเวลา → commit + banner หาย

| ปุ่ม | แสดงเมื่อ | กดแล้ว (ใน handler: `store.reload()` ก่อน) |
|---|---|---|
| "กินแล้ว" | ทุกมื้อที่แสดง (primary เฉพาะมื้อแรก) | `confirm(...)` · ok → `store.set('confirmations', …)` + `offerUndo` ข้อความ "บันทึกแล้ว: " + `statusLabel` (undo = `undoConfirm` · commit = แจ้ง `CONFIRMED_LATE` ถ้า `late` ตาม R-5) · `ALREADY` → toast "มื้อนี้ยืนยันแล้ว" · `TOO_LATE` → toast "เลยเวลายืนยันมื้อนี้แล้ว" · `NOT_STARTED` ไม่เกิดบน S2 |
| "ยังไม่กิน" | เฉพาะมื้อกำลังเตือน (`late: false`) | `notYet` · `WAIT` → `hide` + ไป S3 ถ้าไม่เหลือมื้อ, notice "จะเตือนอีกครั้ง HH:MM" · `NOTIFY` → `hide` + `offerUndo` ข้อความ "จะแจ้งลูกหลานว่ายังไม่ยืนยันการกินยา" (undo = เลิกซ่อน · commit = แจ้ง `UNCONFIRMED` ตาม R-5 → toast "แจ้งลูกหลานแล้ว" หรือ "ยังไม่พร้อมในรุ่นนี้" ก่อน FR-05) |

- ลบ toast ชั่วคราว "ยังบันทึกไม่ได้ในรุ่นนี้" (003 R-9)

## S3 — ใหม่ `prototype/src/screens/home.js`

เรียกในเอกสารว่า "หน้าแรก (S3)" · `MedMind.screens.register({ id: 'S3', role: 'senior', title: 'ยาของฉันวันนี้', covers: ['FR-04', 'FR-03', 'NFR-02', 'NFR-03', 'NFR-07'], isStart, render })`

- `isStart(app)` = จับคู่แล้ว · guard: ไม่จับคู่ → `ctx.go('S1')` (§8.5)
- ไป S2 เองเมื่อ `dueKey` เปลี่ยนเป็นค่าใหม่ที่ไม่ว่าง (คีย์ที่มีอยู่ตอนเปิดหน้าไม่ดึงกลับ · แบบ S1 ของ 003)
- `ctx.params.notice` → `.banner--info` บนสุด (feedback จาก S2)

| สถานะ | แสดง |
|---|---|
| ไม่มีมื้อวันนี้ | `.empty`: "ยังไม่มียา ให้ผู้ดูแลเพิ่มยา" (FR-03 ✗5 ตรงตัว) |
| มีมื้อ | การ์ดละมื้อ เรียงเวลา: เวลา (`.card__title`) · ชื่อยาในมื้อ (คั่นด้วย " · ") · ป้ายสถานะ + `statusLabel` · `canConfirmLate` → ปุ่ม "กินแล้ว" `btn--xl btn--block` (primary เฉพาะปุ่มแรก) |

| สถานะ | class ป้าย |
|---|---|
| `TAKEN`, `TAKEN_LATE` | `.status--taken` |
| `ALERTING` | `.status--alerting` |
| `UNCONFIRMED` | `.status--unconfirmed` |
| `WAITING` | `.status--waiting` |

- ปุ่ม ghost "การเชื่อมต่อ" → S1 · ปุ่มหลัก ≤ 1 ต่อหน้าจอ
- "กินแล้ว" ใน S3 = ยืนยันช้า → เขียน + `offerUndo` "บันทึกแล้ว: กินแล้ว (ยืนยันช้า) HH:MM" (commit = แจ้ง `CONFIRMED_LATE` ตาม R-5) · `TOO_LATE` (แตะพอดีตอนหมดช่วง) → toast เหตุผล
- เปิดบรรทัด `<!-- D · S3 -->` และ `<!-- D · FR-04 -->` ใน `index.html`

## ส่งต่อ FR-05
- C3 ใช้ `confirm.statusOf` / `statusLabel` (ไม่เขียนคำซ้ำ)
- เมื่อ `escalation` โหลด ทาง "ยังไม่พร้อมในรุ่นนี้" จะไม่ถูกใช้ → ลบออกใน FR-05
