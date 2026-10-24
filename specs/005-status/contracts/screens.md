# Contract: หน้าจอ C3 + แถบแจ้ง + ตัวรันตามเวลา (FR-05)
<!-- เจ้าของ: E (Nichanan Lalua) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 -->

## ตัวรันระดับหน้าเว็บ — `prototype/src/screens/status.js` (research R-2)

- เริ่มหลัง shell boot (`DOMContentLoaded` · `MedMind.app` มีแล้ว) · เรียก `run()` ตอนเริ่ม + `app.clock.onChange` + `app.store.subscribe`
- `run()`: ไม่มีคู่ (`pairing` ไม่มี) → ไม่ทำ · มื้อของเมื่อวาน + วันนี้ของคู่ → `escalate` · ได้ตัวเดิม → จบ · ได้รายการใหม่ → `store.reload()` แล้วคำนวณซ้ำ → ยังต่าง → `store.set('notices', …)`
- กันเรียกซ้อนด้วย `busy` · ทำงานในทุกหน้า (ผู้สูงอายุ, ผู้ดูแล, 2 เครื่อง) ไม่ขึ้นกับหน้าจอที่เปิด

## แถบแจ้ง — `MedMind.status.noticeBanner(ctx)` (clarify 24/10 · research R-6)

- `noticeBanner(ctx, onStatus)` · ผู้ดูแลจับคู่แล้ว (`canAccess`) และมี `unseen` → `.banner--warn` + `role="status"` (implement 24/10: หน้าผู้ดูแลวาดใหม่ทุกครั้งที่เวลาเปลี่ยน `alert` จะถูกอ่านซ้ำ): บรรทัดละข้อความ "มื้อ HH:MM · " + `noticeText` (ล่าสุดก่อน) + ปุ่ม `btn--secondary btn--block` ·
  บน C3: "รับทราบ" → `markSeen` · หน้าอื่น: "ดูสถานะ" → `markSeen` + `ctx.go('C3')` · handler `store.reload()` ก่อน · เขียนเมื่อค่าเปลี่ยน
- ไม่มีข้อความที่ยังไม่กด → `null`
- กด "ดูสถานะ"/"รับทราบ" ไม่มี dialog: ข้อความยังอยู่ใน "ข้อความแจ้งวันนี้" บน C3 จึงไม่มีข้อมูลหาย (analyze D1)
- C2 (B) วางแถบนี้บนสุดของ `draw()` 1 บรรทัด (`MedMind.status ? … : null`) · C3 วางเอง

## C3 — `MedMind.screens.register({ id: 'C3', role: 'caregiver', title: 'สถานะการกินยาวันนี้', covers: ['FR-05', 'NFR-01', 'NFR-04'], isStart, render })`

- `isStart(app)` = `canAccess` · guard: ไม่จับคู่/ถูกยกเลิก → `ctx.go('C1', { notice: 'UNPAIRED' })` (§8.5 · ✗7) · `ctx.subscribe(draw)`
- ลำดับในหน้า: แถบแจ้ง → สถานะทุกมื้อ (`dailyStatus` วันนี้) → "ข้อความแจ้งวันนี้" (`noticesOf`) → ปุ่มรอง "ยาของผู้สูงอายุ" (C2) → ghost "การเชื่อมต่อ" (C1) · ไม่มีปุ่มหลัก

| สถานะ | แสดง |
|---|---|
| ไม่มีมื้อวันนี้ | `.empty`: "ยังไม่มีมื้อยาวันนี้" (✗4 ตรงตัว) + ปุ่มรอง "ยาของผู้สูงอายุ" |
| มีมื้อ | การ์ดละมื้อเรียงเวลา: เวลา (`.session-time`) · ชื่อยา (`.card__title` คั่นด้วย " · ") · ป้าย `.status--*` + `label` (ตารางสถานะ → class เดียวกับ S3 ใน `specs/004-confirm/contracts/screens.md`) |
| ข้อความแจ้งวันนี้ | ไม่มี → ไม่แสดงหัวข้อ · มี → หัวข้อ "ข้อความแจ้งวันนี้" + บรรทัดละ "HH:MM (เวลาแจ้ง) · มื้อ HH:MM · " + `noticeText` |

## แก้หน้าจอของคนอื่น

| ไฟล์ (เจ้าของ) | แก้ |
|---|---|
| `screens/medication.js` (B · C2) | covers เพิ่ม `FR-05` (analyze I1) · `isStart` = จับคู่แล้ว **และ** ยังไม่มียาของคู่ (R-7) · แถบแจ้งบนสุดของ `draw()` · ปุ่มรอง "สถานะวันนี้" → C3 ในมุมมองรายการ (มี C3 เท่านั้น) |
| `screens/reminder.js` (C · ส่วนแจ้งของ D) | ลบ `NOT_READY_TEXT` + ทางที่ไม่มี `escalation` · ต้องมี `MedMind.escalation` ตอนโหลด (R-8) |
| `index.html` | เปิดบรรทัด `<!-- E · FR-05 -->` (หลัง confirm.js) และ `<!-- E · C3 -->` |
