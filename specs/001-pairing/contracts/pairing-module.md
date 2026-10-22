# Contract: โมดูล `pairing` และ `qrScan` (FR-01)

ขยายจาก `docs/03-design/architecture.md` §8.3 · เปลี่ยนสัญญานี้ต้องแก้ §8.3 ในงานเดียวกัน และแจ้งเจ้าของโมดูลที่เรียกใช้ (B, C, D, E)
<!-- เจ้าของ: A (YAR OO) · ร่างโดย Claude Code ตามคำสั่ง /speckit-plan -->

- UMD: `window.MedMind.pairing` / `window.MedMind.qrScan` และ `module.exports` · ไม่มี `import`/`export`
- ฟังก์ชันล้วน: ไม่อ่าน `Date.now()` ไม่แตะ DOM ไม่แตะ store · รับ `now` และ `random` เข้ามา · คืน object/list ใหม่ ไม่แก้ของที่รับมา
- ผิดเงื่อนไขทางธุรกิจ → `{ ok: false, reason }` · เรียกผิดรูปแบบ (เช่น `now` ไม่ใช่ตัวเลข, `code` ไม่ใช่ 6 หลัก) → `throw TypeError`
- ค่าคงที่ที่ export: `INVITE_TTL = 10 นาที` · `LOCK_LIMIT = 5` · `LOCK_WINDOW = 10 นาที` · `LOCK_DURATION = 10 นาที`

## `pairing`

| Operation | Input | Output | AC / กฎ |
|---|---|---|---|
| `ensureDevices(devices, now, random)` | `devices` = object หรือ `undefined` | `{ seniorId, caregiverId, createdAt }` เติมเฉพาะที่ขาด · ของเดิมไม่เปลี่ยน | ADR-05 · research R-5 |
| `newInvite(invites, seniorId, now, random)` | `invites` = list (ว่างได้) | `{ invite, invites }` · `invite = { code, seniorId, createdAt: now, expiresAt: now + 10 นาที, consentAt: null, usedAt: null }` · `invites` = ลบรหัสที่ `usedAt = null` ของ `seniorId` แล้วต่อ `invite` · `code` ไม่ซ้ำใน list (สุ่มใหม่ ≤ 20 ครั้ง แล้ว throw) | ✓1 · BR-01 · clarify Q4 |
| `currentInvite(invites, seniorId)` | | รหัสที่ `usedAt = null` ของ `seniorId` หรือ `null` | BR-01 |
| `isExpired(invite, now)` | | `now ≥ invite.expiresAt` | BR-01 (ค่าขอบ: นาทีที่ 10 พอดี = หมดอายุ) |
| `consent(invites, code, now)` | | `{ ok: true, invites }` (ใส่ `consentAt = now`) หรือ `{ ok: false, reason: 'NOT_FOUND' \| 'EXPIRED' \| 'USED' }` · ยินยอมซ้ำ = คง `consentAt` เดิม | BR-02 · NFR-05 |
| `pair(state, code, caregiverId, now)` | `state = { invites, pairing, pairAttempts }` | สำเร็จ: `{ ok: true, pairing, invites, pairAttempts }` · `pairing = { pairingId, seniorId, caregiverId, consentAt, pairedAt: now }` · รหัสได้ `usedAt = now` · ลบครั้งผิดของ `caregiverId` · ไม่สำเร็จ: `{ ok: false, reason, pairAttempts, retryAt? }` | ✓3 · ✗2 ✗4 ✗5 ✗8 |
| `lockedUntil(pairAttempts, caregiverId, now)` | | `retryAt` หรือ `null` | ✗8 · BR-18 |
| `minutesLeft(retryAt, now)` | | จำนวนเต็ม `ceil((retryAt − now) / นาที)` ≥ 1 | ✗8 "กรุณารอ N นาที" |
| `canAccess(pairing, caregiverId)` | | `true` เฉพาะเมื่อ `pairing` มีอยู่และ `pairing.caregiverId === caregiverId` | NFR-04 · R7 |
| `isSeniorPaired(pairing, seniorId)` | | `true` เมื่อ `pairing.seniorId === seniorId` | S1 สถานะ `PAIRED` |
| `unpair(data, pairingId)` | `data` = ชุดข้อมูลทั้งหมด §8.2 | ชุดข้อมูลใหม่: `pairing` ไม่มี · ลบทุกระเบียนที่ `pairingId` ตรงใน `mealTimes`, `medications`, `confirmations`, `notices` · ชุดอื่นคงเดิม · `pairingId` ไม่ตรง = คืนเหมือนเดิม | ✗6 · BR-17 · NFR-10 |
| `reasonText(reason, minutesLeft?)` | | ข้อความภาษาไทยตามตารางด้านล่าง | ✗2 ✗4 ✗5 ✗8 · SC-005 · research R-6 |

### ลำดับการตรวจใน `pair` (R4 · clarify Q1, Q3) — คืนเหตุผลแรกที่ไม่ผ่าน

| ลำดับ | `reason` | เงื่อนไข | เพิ่มครั้งผิด | ข้อความ (`reasonText`) |
|---|---|---|---|---|
| 0 | `LOCKED` | `lockedUntil(...) ≠ null` · **ไม่ดูรหัส** | ไม่ | "ใส่รหัสผิดหลายครั้ง กรุณารอ N นาที" (✗8 ตรงตัว) |
| 1 | `NOT_FOUND` | ไม่มี `code` นี้ใน `invites` | ใช่ | "ไม่พบรหัสนี้ กรุณาตรวจรหัสบนโทรศัพท์ของผู้สูงอายุ" |
| 2 | `EXPIRED` | `isExpired` | ใช่ | "รหัสนี้หมดอายุแล้ว ให้ผู้สูงอายุกดสร้างรหัสใหม่" |
| 3 | `USED` | `usedAt ≠ null` | ใช่ | "รหัสนี้ถูกใช้แล้ว ให้ผู้สูงอายุกดสร้างรหัสใหม่" |
| 4 | `NO_CONSENT` | `consentAt = null` | ใช่ | "รอผู้สูงอายุกดยินยอมก่อน แล้วลองอีกครั้ง" (✗2) |
| 5 | `ALREADY_PAIRED` | มี `pairing` ของ `seniorId` นี้อยู่แล้ว | ใช่ | "ผู้สูงอายุท่านนี้มีผู้ดูแลแล้ว" (✗5 ตรงตัว) |

- ผลที่ไม่สำเร็จมี `retryAt` เมื่อหลังการเรียกครั้งนี้เครื่องนั้นถูกล็อก (รวมครั้งที่ 5 ที่เพิ่งทำให้ล็อก)
- `pairAttempts` ที่คืนทุกกรณี: ตัดรายการที่ `failedAt ≤ now − 10 นาที` (NFR-09 · research R-3)

### กฎล็อก (BR-18 · research R-3)

`L` = `failedAt` ล่าสุดของ `caregiverId` · ล็อกเมื่อ จำนวนครั้งผิดของ `caregiverId` ในช่วง `(L − 10 นาที, L]` ≥ 5 **และ** `now < L + 10 นาที` → `retryAt = L + 10 นาที`

## `qrScan`

| Operation | Input | Output | AC |
|---|---|---|---|
| `qrText(code)` | รหัส 6 หลัก | `"MEDMIND:" + code` | ✓1 · ADR-07 |
| `codeFromQr(text)` | ข้อความจาก QR | รหัส 6 หลัก เมื่อรูปแบบ `^MEDMIND:\d{6}$` พอดีเท่านั้น · อื่น ๆ (null, ข้อความอื่น, URL, 5/7 หลัก) → `null` | ✗7 · R8 |
| `readQr(imageData)` | `{ data, width, height }` (ImageData) | `codeFromQr(jsQR(...).data)` หรือ `null` เมื่อไม่พบ QR | ✓3 · ✗7 |
| `qrMatrix(code)` | รหัส 6 หลัก | `boolean[][]` (แถว × คอลัมน์, `true` = โมดูลดำ) ของ QR ที่บรรจุ `qrText(code)` · ระดับแก้ผิด M · หน้าจอวาดลง canvas + ขอบเงียบ 4 โมดูล | ✓1 · test: `readQr` อ่านภาพที่วาดจากตารางนี้ได้รหัสเดิม |

- `readQr` / `qrMatrix` หา `jsQR` / `qrcode` จาก `window` ในเบราว์เซอร์ หรือ `require('../../vendor/...')` ใน node
- ข้อความ ✗7 "อ่าน QR ไม่ได้ กรุณาใส่รหัส 6 หลัก" อยู่ใน `pairing.reasonText('QR_UNREADABLE')`

## ผู้เรียกใช้นอก feature นี้

| ใคร | เรียกอะไร | เพื่อ |
|---|---|---|
| B (C2), E (C3) | `canAccess(pairing, devices.caregiverId)` | NFR-04 · FR-05 ✗7 · กลับ C1 เมื่อถูกยกเลิก ([screens.md](screens.md)) |
| C (S2), D (S3) | `isSeniorPaired(pairing, devices.seniorId)` | กลับ S1 เมื่อถูกยกเลิก |
| B, C, D, E | เก็บ `pairingId` ในทุกระเบียนของตัวเอง | ให้ `unpair` ลบได้ (NFR-10) |
