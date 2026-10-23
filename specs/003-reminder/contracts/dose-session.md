# Contract: `MedMind.doseSession` (FR-03)
<!-- เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · แทนช่อง doseSession ใน architecture.md §8.3 เมื่อ implement -->

ไฟล์ `prototype/src/modules/doseSession.js` · UMD (`window.MedMind.doseSession` + `module.exports`) · ฟังก์ชันล้วน ไม่อ่าน store ไม่อ่านนาฬิกา (รับ `now`) ·
พึ่ง `medication.reminderTimes` (โหลดก่อนใน `index.html` · ใน node ใช้ `require('./medication.js')`)

| Operation | Input | Output | กฎ / AC |
|---|---|---|---|
| `dayOf(ms, offsetDays?)` | ms · จำนวนวันเลื่อน (ค่าเริ่ม 0) | `"YYYY-MM-DD"` เวลาท้องถิ่น | §8.1 · R-3 |
| `sessionsOf(medications, mealTimes, day)` | ยาของคู่นี้ · เวลามื้อ · `"YYYY-MM-DD"` | `[{ sessionKey, at, medicationIds }]` เรียงตาม `at` · ยาเวลาเดียวกันรวม · ยาที่ `reminderTimes` = `null` ถูกข้าม · ไม่มียา/ไม่มีเวลามื้อ = `[]` | BR-06 · ✓1 · ✗5 |
| `roundAt(session, now)` | | `0` ก่อน T · `1` T ≤ now < T+5 · `2` ถึงก่อน T+10 · `3` ถึงก่อน T+15 · `null` ตั้งแต่ T+15 | BR-08 · ✗2 · NFR-01 |
| `lateUntil(session, sessions)` | มื้อ · มื้อทั้งหมดของวันเดียวกัน | ms สิ้นสุดช่วงยืนยันช้า (ไม่รวม): `at` ของมื้อแรกในวันเดียวกันที่ `at > session.at + 15 นาที` · ไม่มี = 00:00 ของวันถัดไป · ไม่น้อยกว่า `session.at + 15 นาที` | BR-15 · FR-04 ✗6 · R-4 |
| `dueSessions(sessions, confirmations, pairingId, now)` | มื้อของเมื่อวาน + วันนี้ · บันทึกยืนยัน · คู่นี้ | `[{ ...session, round, late }]` เรียงตาม `at` · ตัดมื้อที่มีบันทึกยืนยันของ `pairingId` นี้ · ไม่มีมื้อรอบ 1–3 = `[]` · มี = เพิ่มมื้อที่ `at + 15 ≤ now < lateUntil` (`round: null, late: true`) | ✓3 · ✗4 · BR-16 · R6b |
| `newSoundKeys(due, played)` | ผลของ `dueSessions` · `played`: array หรือ Set ของคีย์ | คีย์ `at + '#' + round` ของมื้อ `late: false` ที่ยังไม่อยู่ใน `played` (ไม่ซ้ำ) | BR-09 · BR-16 · SC-004 |

**ข้อตกลง**
- input ผิดรูปแบบ (ไม่ใช่ array / `now` ไม่ใช่ตัวเลข / `day` ผิดรูป) → `TypeError` (§8.1 throw เฉพาะเรียกผิดรูปแบบ) · รายการว่าง/`undefined` ของ `confirmations` = ไม่มีบันทึก
- ไม่แก้ input ที่รับมา
- `lateUntil` และ `sessionsOf` ใช้ร่วมกับ FR-04 (`confirm`) และ FR-05 (`escalation`, `dailyStatus`) · `statusOf` ทำใน FR-04 (§9.1)

**Test (ชื่อขึ้นต้นด้วยรหัส)** — `prototype/tests/doseSession.test.js`
| AC / กฎ | กรณี |
|---|---|
| ✓1 · BR-06 | ยา 2 ตัวเวลา 08:00 → 1 มื้อ 2 ยา · ยาเช้า-เย็น → 2 มื้อ · เรียงเวลา · `sessionKey` ตามรูปแบบ |
| ✗5 | ไม่มียา / ไม่มีเวลามื้อ / ยาที่เวลาไม่พอ → `[]` และ `dueSessions` = `[]` ทุกนาทีของวัน |
| ✗2 · NFR-01 | ทุกนาที T−1 … T+15: 0,1×5,2×5,3×5,null · ค่าขอบ T+4:59.999 = 1, T+5 = 2, T+15 = null |
| ✓3 | มีบันทึกยืนยันของคู่นี้ → ไม่อยู่ใน `dueSessions` ทุกรอบ · บันทึกของคู่อื่น (`pairingId` อื่น) ไม่มีผล |
| ✗4 · BR-16 · R6b | A 06:45 + B 07:00 ไม่ยืนยัน · 07:00 → [A late, B รอบ 1] · `newSoundKeys` = 1 คีย์ · 06:59 → [A รอบ 3] · B ยืนยันแล้วตอน 07:20 → `[]` (ไม่มีมื้อกำลังเตือน) · A เลย `lateUntil` → ไม่แสดง |
| BR-15 | `lateUntil`: มื้อถัดไปหลัง T+15 · มื้อที่อยู่ภายใน T+15 ถูกข้าม · ไม่มี = 00:00 วันถัดไป · มื้อ 23:55 → `at + 15` |
| R-3 | มื้อ 23:55 ของเมื่อวาน: 00:00 = รอบ 2 · 00:05 = รอบ 3 · 00:10 = ไม่แสดง |
| SC-004 | วาดซ้ำในรอบเดิม = `[]` · ข้ามจากก่อน T ไป T+12 = คีย์รอบ 3 คีย์เดียว · 2 มื้อเวลาต่างกันขึ้นรอบพร้อมกัน = 2 คีย์ (หน้าจอเล่น 1 ครั้ง) |
