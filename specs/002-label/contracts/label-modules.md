# Contract: โมดูล `labelParser`, `medication`, `readLabel` (FR-02)

ขยายจาก `docs/03-design/architecture.md` §8.3 · เปลี่ยนสัญญาต้องแก้ §8.3 ในงานเดียวกัน · FR-03 (C) เรียก `reminderTimes`
<!-- เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 -->

- `labelParser`, `medication` = UMD ฟังก์ชันล้วน (ไม่แตะ DOM/store/เวลาเครื่อง) · test ด้วย `node --test`
- `readLabel` = adapter (ADR-03) แตะเบราว์เซอร์ได้ ไม่มีกฎของ FR · test อัตโนมัติด้วยเบราว์เซอร์ (headless) ไม่ใช่ `node --test`
- ผิดเงื่อนไข → `{ ok: false, reason, fields }` · เรียกผิดรูปแบบ → `TypeError`

## `labelParser`

| Operation | Input | Output | AC / กฎ |
|---|---|---|---|
| `parseLabel(text)` | ข้อความจาก OCR (ว่างได้) | `Draft` ตาม [data-model.md](../data-model.md) · ช่องที่แยกไม่ได้ = `null` + อยู่ใน `needsCheck` · ไม่มีช่องข้อความดิบ | ✓1 ✗3 ✗4 ✗10 · BR-04, BR-07 · R10b · research R-2, R-3 |
| `emptyDraft()` | | Draft ว่างทุกช่อง · `needsCheck` = ช่องบังคับทั้งหมด · `found = 0` | ✗5 (กรอกเอง) |

## `medication`

| Operation | Input | Output | AC / กฎ |
|---|---|---|---|
| `validMealTimes(mealTimes)` | `{ breakfast, lunch, dinner, bedtime }` | `{ ok: true }` หรือ `{ ok: false, reason: 'MEAL_TIMES', fields }` (ช่องที่ไม่ใช่ `HH:MM`) | BR-06 · ✓6 |
| `reminderTimes(med, mealTimes)` | ยา/ร่างที่ผ่าน + เวลามื้อ | `["HH:MM", …]` เรียง ไม่ซ้ำ · ข้อมูลไม่พอหรือมีค่าตกก่อน 00:00 → `null` | BR-06 · ✓6 ✓8 ✓9 · clarify Q1 |
| `validateDraft(draft, mealTimes)` | | `{ ok: true }` หรือ `{ ok: false, reason, fields }` · `reason` ตามลำดับ: `'UNSUPPORTED'` (`fields: [ชนิด]`) → `'MISSING'` (ช่องบังคับว่าง/ผิดรูปแบบ) → `'MEAL_TIMES'` → `'BEFORE_MIDNIGHT'` (`fields`: มื้อที่ตกก่อน 00:00) | BR-04, 05, 06, 07 · ✗3 ✗4 ✗10 |
| `saveMedication(list, draft, mealTimes, pairingId, now, medicationId)` | | ผ่าน → `{ ok: true, medications, medication }` (ต่อท้าย หรือแทนที่ `medicationId` เดิมเมื่อแก้) · ไม่ผ่าน → ผลของ `validateDraft` และ **ไม่เปลี่ยนรายการ** · เก็บเฉพาะฟิลด์ใน data model (ตัดค่าว่างของ `minutesBefore` เมื่อไม่ใช่ `BEFORE_MEAL`, `meals` เมื่อ `BEDTIME`) | ✓2 · NFR-06 |
| `removeMedication(list, medicationId)` | | รายการใหม่ที่ไม่มียานั้น · ไม่พบ = รายการเดิม | BR-03 · clarify Q2 |
| `medicationsOf(list, pairingId)` | | ยาของคู่นี้เท่านั้น | NFR-04 |
| `UNSUPPORTED_TEXT[kind]` | `AS_NEEDED` / `NOT_TABLET` / `HALF_TABLET` | `AS_NEEDED` = "ระบบยังไม่รองรับยาเมื่อมีอาการ" (✗4 ตรงตัว) · `NOT_TABLET` = "ระบบยังไม่รองรับยาน้ำ ยาผง หรือยาที่ไม่ใช่เม็ด" · `HALF_TABLET` = "ระบบยังไม่รองรับยาครึ่งเม็ด" | ✗4 · BR-07 |

## `readLabel` (adapter · ADR-03, ADR-08)

`readLabel(file, onProgress?)` → `Promise<{ ok: true, text } | { ok: false, reason: 'UNSUPPORTED_PAGE' | 'UNREADABLE' }>`

- โหลดไฟล์ OCR แบบฝัง (research R-1) ครั้งแรกที่เรียก · เปิด worker ครั้งเดียวแล้วใช้ซ้ำ
- `UNSUPPORTED_PAGE` = โหลด OCR ไม่ได้ในหน้านี้ (ไม่มีไฟล์ฝัง / แก้บั๊ก worker ไม่ได้ / เบราว์เซอร์ไม่รองรับ) · `UNREADABLE` = ถอดรหัสรูปไม่ได้ หรือไม่มีข้อความ
- ไม่ส่งรูปหรือข้อความออกนอกเครื่อง · ไม่เก็บรูป/ข้อความ · คืน `text` ให้ผู้เรียกส่งต่อ `parseLabel` ทันที
- ข้อความเหตุผลบนหน้าจอ: `UNSUPPORTED_PAGE` = "อ่านฉลากในหน้านี้ไม่ได้ กรุณากรอกข้อมูลยาเอง" · `UNREADABLE` (หรือ `found = 0`) = "อ่านฉลากไม่ได้ ลองถ่ายให้ชัดและตรงขึ้น หรือกรอกข้อมูลยาเอง"
