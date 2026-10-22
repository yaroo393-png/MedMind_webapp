# TEAM-PLAN — เขียนโค้ดใหม่ทั้งหมด แบ่ง 5 คน (Spec Kit Full path)

> กำหนดส่ง 26 ต.ค. 2569 (Charter + SRS + Design + Prototype) → ตารางวันและเจ้าของเอกสารอยู่ที่ **SCHEDULE-20-26.md** (ถ้าขัดกัน ให้ยึดไฟล์นั้น)

ตรวจกับ Spec Kit ที่ติดตั้ง (specify 1.2.3.dev0) และทดสอบ Chromium + Node 22 จริงแล้ว · ข้อที่ยังไม่ได้ทดสอบเขียนกำกับไว้

## 1. ลำดับ Full path (ต่อ 1 feature)

`constitution` ทำครั้งเดียวต่อโปรเจกต์ (เสร็จแล้ว) จากนั้นแต่ละ feature ทำตามนี้:

| # | คำสั่ง | ได้อะไร | คนต้องทำอะไร |
|---|---|---|---|
| 1 | `/speckit-specify` | `specs/NNN-ชื่อ/spec.md` | อ่าน เทียบกับ `docs/02-requirements/spec.md` ห้ามมี requirement ใหม่ |
| 2 | `/speckit-clarify` | ถามไม่เกิน 5 ข้อ แล้วเขียนคำตอบลง spec | ตอบเอง ข้อที่ไม่แน่ใจถามทีม |
| 3 | `/speckit-plan` | plan.md (+ data-model, contracts) | ตรวจว่าตรงกับ `architecture.md` และ "ไม่มี server/DB/npm" |
| 4 | `/speckit-checklist` | checklist คุณภาพของ requirement | ไล่ติ๊ก ข้อไหนไม่ผ่านแก้ spec |
| 5 | `/speckit-tasks` | tasks.md เรียงตามลำดับพึ่งพา | ตรวจว่าทุก AC มี task เขียน test |
| 6 | `/speckit-analyze` | รายงานความขัดกัน spec/plan/tasks (อ่านอย่างเดียว) | แก้ข้อ CRITICAL ก่อนไปต่อ (ขัด constitution = CRITICAL เสมอ) |
| 7 | `/speckit-implement` | โค้ด + test ตาม tasks | **อ่านทุกบรรทัด** รัน `node --test` และคลิกในเบราว์เซอร์ |
| 8 | `/speckit-converge` | เติม task ที่ยังไม่ทำลง tasks.md | ถ้ามีงานเพิ่ม รัน `/speckit-implement` อีกรอบ |

ก่อนหน้านี้ต้องมี Charter + SRS (`docs/02-requirements/spec.md`) เสร็จก่อน เพราะ step 1 ต้องอ้าง FR/AC จากไฟล์นี้

## 2. กติกาที่ทำให้ 5 คนไม่ชนกัน

- **ล็อกเลขโฟลเดอร์ล่วงหน้า:** Spec Kit ตั้งเลข `NNN` จากโฟลเดอร์ที่มีอยู่ใน branch ตัวเอง → 5 คนแยก branch จะได้ `001` ซ้ำกัน
  ให้ระบุในคำสั่ง `/speckit-specify` เสมอว่า "ใช้ feature directory `specs/00N-ชื่อ`" ตามตารางข้อ 3
- **branch ตั้งเอง:** ติดตั้งนี้ไม่มี git extension จึง **ไม่สร้าง branch ให้อัตโนมัติ** → `git checkout -b feat/ชื่อ` ก่อนเริ่มทุกครั้ง
- **1 คน = 1 โฟลเดอร์โค้ด:** ไม่แก้ไฟล์ของคนอื่น ถ้าต้องแก้ → เปิด issue/คุยก่อน
- **รอ Foundation merge ก่อน** (ข้อ 4) แล้วทุกคน branch จาก `main` ที่มี Foundation
- merge ผ่าน PR + เพื่อน review ห้าม push เข้า main

## 3. แบ่งงาน 5 คน (เสนอ · ทีมตัดสินและกรอกชื่อใน Charter)

โค้ดทั้งหมดอยู่ใต้ `prototype/` (path ในตารางย่อ `p/` = `prototype/`)

| คน | Feature (ต้องตรงกับ FR ใน SRS ใหม่) | spec dir | โค้ดที่เป็นเจ้าของ | หน้าจอ | พึ่งพา |
|---|---|---|---|---|---|
| A | จับคู่ + **สแกน QR** (QR/รหัส 6 หลัก, ยินยอม, ยกเลิก = ลบข้อมูล) | `specs/001-pairing` | `p/src/modules/pairing.js` `p/src/modules/qrScan.js` `p/src/screens/pairing.js` | S1, C1 | Foundation |
| B | เพิ่มยา + **สแกนฉลาก (OCR)** (ถ่ายรูป → อ่านข้อความ → แยกเป็นร่าง → ตรวจ → บันทึก, ตั้งเวลามื้อ) | `specs/002-medication` | `p/src/modules/readLabel.js` `p/src/modules/labelParser.js` `p/src/modules/medication.js` `p/src/screens/medication.js` | C2 | Foundation |
| C | เตือนตามมื้อ (สร้างมื้อ, เตือน T / T+5 / T+10, เสียง) | `specs/003-reminder` | `p/src/modules/doseSession.js` `p/src/screens/reminder.js` | S2 | B (มีข้อมูลยา) |
| D | ยืนยันการกินยา (กินแล้ว/ยังไม่กิน, ยืนยันช้า) | `specs/004-confirm` | `p/src/modules/confirm.js` `p/src/screens/home.js` | S3 (+ปุ่มใน S2) | C (มีมื้อ) |
| E | แจ้งผู้ดูแล + สถานะรายวัน | `specs/005-status` | `p/src/modules/escalation.js` `p/src/screens/status.js` | C3 | D (มีสถานะมื้อ) |

ชื่อ FR/หน้าจอข้างต้นอิง FR-01–05 ของ v1 · ถ้า SRS ใหม่เปลี่ยน ให้แก้ตารางนี้ตาม

**งานสแกนหนักกว่าเพื่อน → แบ่งภาระ:** A ทำ QR เสร็จก่อน (jsQR โค้ดสั้น) แล้วช่วย B ทำ `labelParser.js` (แยกข้อความ OCR
เป็นช่องร่าง) · B ทำ `readLabel.js` (เรียก Tesseract.js) + หน้าจอ C2

**แก้ปัญหาพึ่งพากัน:** C, D, E ต้องใช้โครงข้อมูลของคนก่อนหน้า → ก่อนเริ่ม feature ให้เขียน "สัญญาข้อมูล" ใน
`architecture.md` (entity + ฟิลด์ + operation + input/output) ให้ครบทุกโมดูล แล้วแต่ละคนเขียนและ test ด้วยข้อมูลจำลอง
ตามสัญญาได้เลยโดยไม่ต้องรอกัน (ตรงกับหลัก cohesion/coupling ในวิชา)

## 4. Foundation (ทำก่อน · D · PR เดียว)

ทุก feature ใช้ร่วมกัน ถ้าไม่ทำก่อนจะชนกัน:
- `prototype/index.html` · แสดง 2 โทรศัพท์ (Senior / Caregiver) ในหน้าเดียวใช้ข้อมูลร่วม (หรือแบบเลือกบทบาท — ทีมตัดสินแล้วเขียน ADR)
- `prototype/src/core/store.js` เก็บข้อมูล · `clock.js` นาฬิกาจำลอง (รับเวลาจากภายนอก) · `events.js` ส่งข้อความระหว่างโมดูล
- `prototype/src/ui/tokens.css` `app.css` ตาม `design-system.md` · shell + ป้าย `Covers: FR-x` + แถบ demo
- `prototype/vendor/` คัดจากชุดเริ่มต้น (Tesseract.js, jsQR, ไฟล์ภาษาไทย) — ห้ามแก้ไฟล์ใน vendor
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / root → เปิดที่ `https://<owner>.github.io/<repo>/prototype/`
- `prototype/tests/` ตั้งต้น · ตัวอย่าง test 1 ไฟล์ · `.gitignore`
- ทุกคนต้องอ่านเข้าใจ Foundation ก่อนเริ่ม feature ของตัวเอง

## 5. ข้อจำกัดทางเทคนิคที่ตรวจแล้ว (ไม่มี server/DB)

1. **ห้ามใช้ ES modules (`import`/`export`)**: ทดสอบใน Chromium แล้ว เปิดผ่านไฟล์ (`file://`) โดน CORS บล็อก (`origin 'null'`) หน้าเว็บไม่ทำงาน
   → ใช้ `<script src>` ธรรมดา + แต่ละไฟล์เขียนแบบ UMD: ผูกเข้า `window.MedMind.ชื่อโมดูล` และ `module.exports` พร้อมกัน เพื่อให้ `node --test` ใช้ไฟล์เดียวกันได้
2. **รัน test:** `node --test` ที่ root (ไม่ใส่ path) · ทดสอบแล้วบน Node 22 · ใส่ path โฟลเดอร์จะ fail
3. **ข้ามเครื่องไม่ sync ถ้าไม่มี server**: ผู้สูงอายุกับผู้ดูแลคนละเครื่องไม่เห็นข้อมูลกัน · การแจ้งเตือนทำงานเฉพาะตอนเปิดหน้าเว็บค้างไว้
   · `localStorage` **ทดสอบแล้ว:** 2 แท็บในเบราว์เซอร์เดียวกัน (แม้เปิดจาก `file://`) อ่านข้อมูลกันได้และได้ storage event ทันที · ข้ามโปรไฟล์/เครื่องไม่ได้ · ทดสอบเฉพาะ Chromium
4. **ไลบรารีใช้ได้เฉพาะ 2 ตัวสำหรับสแกน + ตัวสร้าง QR** (มี FR รองรับ + อาจารย์กำหนด · `qrcode-generator` เพิ่ม 22/10/69 เพราะ FR-01 ✓1 ต้องแสดง QR — ADR-07): เก็บเป็นไฟล์ใน `prototype/vendor/` ไม่ใช้ npm/CDN
   ไลบรารีอื่นต้องมี FR/NFR + ทีมอนุมัติ (constitution หลักการ II)

## 5.1 ระบบสแกน (ทดสอบแล้วใน Chromium โดยไม่ต่ออินเทอร์เน็ต ใช้ไฟล์ใน vendor)

| | เปิดดับเบิลคลิก (`file://`) | เปิดผ่านเว็บ (`http(s)`: Live Server / GitHub Pages) |
|---|---|---|
| OCR ฉลากไทย (Tesseract.js 5.1.1 + `tha` + `eng`) | ❌ โหลดไฟล์ภาษาไม่ได้ (`Failed to fetch`) | ✅ อ่านฉลากทดสอบ 4 บรรทัดถูกทั้งหมด ~1 วินาที |
| QR (jsQR 1.4.0) | ✅ จากรูปที่ผู้ใช้เลือก/ถ่าย (รูปจาก path ในโค้ดโดน canvas tainted) | ✅ |

- ฉลากทดสอบเป็นภาพตัวพิมพ์คมชัด · **ยังไม่ได้ทดสอบกับรูปถ่ายฉลากจริง** → B ต้องเก็บรูปฉลากจริง ≥ 10 ใบ (พฤหัส) และ 20 ใบ (เสาร์) วัด NFR การอ่านฉลาก
- ถ่ายรูป: `<input type="file" accept="image/*" capture="environment">` (มือถือเปิดกล้องหลัง · คอมเลือกไฟล์) · มือถือต้องเปิดผ่าน HTTPS (GitHub Pages)
- **ทางสำรอง (บังคับ):** เปิดแบบ `file://` หรือ OCR ล้มเหลว → แจ้ง "เปิดผ่านลิงก์เว็บเพื่อสแกน" + ให้กรอกเอง / เลือกฉลากตัวอย่าง · QR อ่านไม่ได้ → ใส่รหัส 6 หลัก
- **ผล OCR = ร่างเท่านั้น:** `labelParser.js` แยก ชื่อยา · จำนวนเม็ด ("ครั้งละ N เม็ด") · เวลา ("หลังอาหาร", "ก่อนอาหาร N นาที", "ก่อนนอน", มื้อเช้า/กลางวัน/เย็น) · ข้อควรระวัง
  ช่องที่แยกไม่ได้ = ว่าง + "กรุณาตรวจสอบ" (ห้ามเดา) · `labelParser.js` เป็นฟังก์ชันล้วน test ด้วย `node --test` ได้ (ใส่ข้อความ → ได้ร่าง)
- ตั้งค่า Tesseract ที่ทดสอบแล้ว (path สัมพันธ์กับ `prototype/index.html`):

```js
const worker = await Tesseract.createWorker('tha+eng', 1, {
  workerPath: 'vendor/tesseract/worker.min.js',
  corePath: 'vendor/tesseract/core',
  langPath: 'vendor/tesseract/lang',
  gzip: false
});
const { data } = await worker.recognize(fileFromInput);   // File จาก <input type="file">
await worker.terminate();
```

- jsQR: วาดรูปลง canvas → `jsQR(imageData.data, width, height)` → ได้ `.data` (ข้อความใน QR) หรือ `null`
- ทดสอบเครื่องตัวเอง: VS Code ปุ่ม **Go Live** (Live Server) เปิดเป็น `http://127.0.0.1:5500/prototype/` — ใช้ตอนพัฒนาเท่านั้น ไม่ใช่ server ของแอป
- **ถามอาจารย์ (A ถาม พ. 21):** เกณฑ์เขียน "เปิดด้วยดับเบิลคลิก" แต่ OCR ใช้ได้เมื่อเปิดผ่านลิงก์เว็บ → ส่งลิงก์ GitHub Pages ได้ไหม (ไม่มี server/DB ของทีม)
- ADR ที่ต้องเขียน (C): OCR ในเบราว์เซอร์ vs cloud OCR (ปฏิเสธ: ต้องมี server เก็บ API key + ส่งข้อมูลยาออกไปภายนอก) · GitHub Pages vs ดับเบิลคลิกอย่างเดียว

## 6. Prompt ต้นแบบ (แก้เฉพาะ [ ])

```text
/speckit-specify ฟีเจอร์ [ชื่อ] ตาม FR-[xx] ใน docs/02-requirements/spec.md
ใช้ feature directory specs/00N-[ชื่อ] · ใช้ AC ✓/✗ เดิมทุกข้อ ห้ามเพิ่ม requirement
ผู้ใช้: [Senior/Caregiver] · หน้าจอ: [รหัส] · ขอบเขตโค้ด: [ไฟล์ที่เป็นเจ้าของ]
```
```text
/speckit-plan HTML/CSS/JS ล้วน ไม่มี server/DB/npm · ไม่ใช้ ES modules ·
กฎอยู่ใน prototype/src/modules/[ไฟล์].js แบบ UMD แยกจาก UI · test ด้วย node --test ·
ใช้ token ใน prototype/src/ui/tokens.css เท่านั้น · โครงข้อมูลตาม docs/03-design/architecture.md
[ถ้าเป็นงานสแกน: อ่าน TEAM-PLAN.md ข้อ 5.1 · ใช้ไลบรารีใน prototype/vendor/ เท่านั้น · ต้องมีทางสำรองเมื่อสแกนไม่ได้]
```

## 7. งานที่ไม่ใช่โค้ด (ต้องมีเจ้าของ · commit ผ่านบัญชีตัวเอง)

Charter · SRS · architecture.md + diagram · design-system.md + user-flow · test scenarios + usability/SUS · final report ·
demo slides · AI-Use Statement · README — เสนอให้แต่ละคนรับ 1–2 ชิ้นนอกเหนือจาก feature แล้วบันทึกใน Charter (`[ทีมกรอก]`)
