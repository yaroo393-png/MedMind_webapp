# HANDOFF — MedMind v2

อัปเดตทุกครั้งที่จบงาน (คนหรือ AI) · ล่าสุดอยู่บนสุด

## 2026-10-22 — A + Claude Code · เปิด GitHub Pages
- ลิงก์: https://yaroo393-png.github.io/MedMind_webapp/prototype/ (+ `?role=senior`, `?role=caregiver`) · ตรวจแล้ว: หน้าและไฟล์ src ตอบ 200
- ตั้งค่า: Settings → Pages → branch `feat/foundation` / root (ชั่วคราว) · **ต้องเปลี่ยนเป็น `main` หลัง merge** ไม่งั้นลิงก์ค้างเวอร์ชันเก่า
- ไฟล์: `prototype/README.md` (ใส่ลิงก์) · branch: ยังไม่ commit
- ยังขาด: ทดสอบสแกน QR/ถ่ายฉลากบนมือถือจริงผ่านลิงก์นี้ (SCHEDULE พฤ./ส.) · คำตอบอาจารย์เรื่องส่งลิงก์แทนดับเบิลคลิก (ADR-08)

## 2026-10-22 — A (YAR OO) แทน C + Claude Code · architecture.md v1.0 + สัญญาข้อมูล
- ไฟล์: `docs/03-design/architecture.md` (ใหม่) · `spec.md` §7 (คอลัมน์ Design) + §8 (AI log)
- เนื้อหา: 3 ชั้น + deployment · ADR-01–08 พร้อมทางเลือกที่ปฏิเสธ · Use Case (UC-1–7) · Sequence 4.1 เตือน→ยืนยัน→แจ้ง, 4.2 เพิ่มยา, 4.3 จับคู่ ·
  State มื้อยา · ERD 8 entity · module/coupling · **§8 สัญญาข้อมูล: ชื่อชุดข้อมูลใน store + operation (input/output/AC) ของทุกโมดูล A–E** · coverage + traceability
- ต่างจาก v1: ตัดฟิลด์ความถี่/วันเริ่ม–สิ้นสุด (gold-plating) · ค่าที่คำนวณได้ไม่เป็นฟิลด์ (เวลาเตือน, สถานะ, รอบ) · DOSE_SESSION เป็นค่าคำนวณ ไม่ใช่ entity ที่เก็บ · consentAt อยู่ที่ InviteCode
- ตรวจ: Mermaid 8 รูปเรนเดอร์ผ่าน (mermaid 10.9.1 ใน Chrome headless) · test: ไม่มี (เอกสาร)
- ยังขาด / ต้องตัดสิน:
  - **ADR-08 สถานะ "เสนอ":** รอ B, D ยืนยันวิธี OCR แบบดับเบิลคลิก + คำตอบอาจารย์เรื่องลิงก์ GitHub Pages (A)
  - เจ้าของโมดูลแต่ละคนตรวจสัญญา §8.3 ของตัวเองก่อน `/speckit-plan` · เปลี่ยนสัญญาต้องแจ้งทุกคน
  - §8.4 ใครเรียก `escalate` ตามเวลา: C กับ E ตกลงตอน implement
- branch / PR: ยังไม่ commit · แนะนำ branch `design/architecture`

## 2026-10-22 — A (YAR OO) แทน D + Claude Code · Foundation ของ prototype
- ไฟล์ใหม่: `prototype/index.html` · `prototype/README.md` · `prototype/src/core/{events,clock,store}.js` · `prototype/src/ui/{tokens.css,app.css,shell.js}` ·
  `prototype/tests/foundation.test.js` · `docs/03-design/design-system.md` (v0.1) · `.gitignore`
- แก้: `CLAUDE.md` (คำสั่ง test → `node --test` ที่ root) · `spec.md` §8 (AI log)
- FR/NFR ที่ครอบ: ใช้ร่วม FR-01–05 · NFR-01 (นาฬิกาจำลอง) · NFR-03 (token ขนาด/สี) · NFR-09/10 (store.reset ลบข้อมูล) · SRS §2.2 (2 โทรศัพท์ไม่มี server)
- test: `node --test` **23/23 ผ่าน** (Node 24.22, รันจริง) · ใส่ path `node --test prototype/tests` = fail (ตามที่ TEAM-PLAN เตือน)
- ตรวจในเบราว์เซอร์ (Chrome headless, `file://`): ไม่มี error ใน console · 2 โทรศัพท์ + ป้าย Covers แสดง · +5 นาทีทำงาน · toast · dialog ล้างข้อมูลโฟกัส "ยกเลิก" ·
  จอ 622 px สลับแท็บได้ ไม่ล้นจอ (Chrome headless บังคับกว้างขั้นต่ำ 504 px — ยังไม่ได้ลองจอ 360–390 px จริง)
- **เพิ่ม (ตามที่ผู้ใช้ขอ):** เปิดแยกหน้า `index.html?role=senior` / `?role=caregiver` + ลิงก์ "เปิด:" บนแถบทดลอง · ซิงก์ข้อมูล เวลาจำลอง และการล้างข้อมูลข้ามแท็บ
  · ทดสอบจริง (Chrome headless, 2 iframe จาก `file://`): ฝั่งผู้ดูแลเห็นข้อมูลที่ฝั่งผู้สูงอายุเขียน · เวลา 16:51 → 16:56 ตามกัน · ล้างข้อมูลแล้วอีกฝั่งกลับหน้าแรก · ไม่มี error
  · ข้อควรระวังของ feature: ทุกหน้ารันกฎพร้อมกัน → ผลของกฎต้องเก็บใน store แบบทำซ้ำไม่เพิ่ม (README ส่วน "เขียนหน้าจอ")
- **ทีมยืนยันแทน D (22/10):** reference app + token สีตาม `design-system.md`
- ยังขาด / ต้องตัดสิน:
  - **ADR (C):** แสดง 2 โทรศัพท์ในหน้าเดียว + เปิดแยกหน้าได้ (เลือกแล้วใน Foundation) vs หน้าเลือกบทบาท · นาฬิกาจำลอง · OCR แบบ `file://` (ดูรายการ OCR ด้านล่าง)
  - **GitHub Pages:** Settings → Pages → Deploy from branch `main` / root (ต้องทำหลัง merge · เจ้าของ repo)
  - `user-flow.md` + wireframe (D) ยังไม่มี
  - สัญญาข้อมูล (ชื่อชุดข้อมูลใน store + ฟิลด์) ใน `architecture.md` (C) — feature ต้องรอหรือใช้ข้อมูลจำลอง
- branch / PR: ยังไม่ commit · แนะนำ branch `feat/foundation` แยกจาก `srs/spec` (SRS commit แล้วที่ `c6d9df5`)

## 2026-10-22 — A (YAR OO) แทน B + Claude Code · ร่าง SRS v1.0
- **การตัดสินใจของทีม (22/10):** A ทำงานที่เหลือของทุกคนในบัญชี A และระบุเจ้าของส่วนไว้ในไฟล์ (คอมเมนต์ `<!-- เจ้าของ ... -->`)
  · ความเสี่ยงที่ทีมรับทราบ: คะแนนรายคนคิดจาก commit ในบัญชีตัวเอง (ไม่มีร่องรอย = ×0.4) และขัด constitution ข้อ "สมาชิก commit งานตามบทบาท"
- ไฟล์ที่เปลี่ยน: `docs/02-requirements/spec.md` (ใหม่) · `HANDOFF.md`
- FR/NFR ที่ครอบ: FR-01–08 (Must 5) · BR-01–17 · NFR-01–11 · UC-1–7
- ต่างจาก v1: AC ใหม่ FR-01 ✗7 · FR-03 ✗5 · FR-05 ✗7 (ทางสำรอง/ว่าง) · NFR-11 (จาก Charter §7) · NFR-08/11 วัดได้จริงเทอมนี้ · ตัด SHOULD-01..09 ที่ไม่มีหลักฐาน · SDLC = Agile
- test: ไม่มี (งานเอกสาร)
- ยังขาด / ต้องตัดสิน: เจ้าของ FR แต่ละข้อตรวจ AC · backlog.md (B) · ล็อก FR/AC (เลยเที่ยงพฤหัสแล้ว — PM กำหนดเวลาใหม่) · ช่อง "ทีมแก้/ตรวจอะไร" ใน AI log
- branch / PR: `srs/spec` (แตกจาก `m1/charter`) · ยังไม่ commit
- AI log: ย้ายแถว 21–22/10 เข้า `spec.md` §8 แล้ว

## 2026-10-22 — A (PM) + Claude Code · ทดลอง OCR แบบเปิดดับเบิลคลิก (`file://`) · เกี่ยวกับ FR-02 (เจ้าของ: B) · vendor (D) · ADR (C)
- ผล (รันจริง Chrome headless บน Windows, ไฟล์ทดลองอยู่ใน scratchpad ไม่อยู่ใน repo): **อ่านข้อความไทย 3 บรรทัดจาก canvas ถูกทั้งหมด ~0.45 วินาที**
  `"พาราเซตามอล 500 มก.\nครั้งละ 1 เม็ด หลังอาหาร\nเช้า กลางวัน เย็น"`
- วิธีที่ใช้ได้ (Tesseract.js 5.1.1 ใน `prototype/vendor/` · ไม่แก้ไฟล์ vendor):
  1. แปลง `tha/eng.traineddata`, `worker.min.js`, `core/tesseract-core-simd-lstm.wasm.js` เป็นไฟล์ `.js` ที่เก็บ base64 แล้วโหลดด้วย `<script src>`
  2. ส่งภาษาเป็น `[{code:'tha', data:Uint8Array}, ...]` แทนการ fetch · `cacheMethod:'none'`
  3. สร้าง worker จาก Blob เดียว = core + worker · `workerBlobURL:false` (เปิดจาก `file://` โหลด worker/core แยกไฟล์ไม่ได้)
  4. แก้บั๊ก 5.1.1 ในหน่วยความจำ: ตอน initialize ใช้ `t.data` แทน `t.code` → replace ข้อความใน worker ก่อนสร้าง Blob
- ที่ล้มเหลวระหว่างทาง: `importScripts` จาก `file://` ถูกบล็อก · `importScripts` blob ของหน้าเว็บจากใน worker ถูกบล็อก · initialize ล้มเพราะบั๊กข้อ 4
- ข้อจำกัด: ยังไม่ทดสอบกับรูปถ่ายฉลากจริง · Edge/Firefox/มือถือ · หน้าโหลด base64 ~12 MB · การแก้ข้อ 4 ผูกกับ 5.1.1 · กล้องบนมือถือยังต้องใช้ GitHub Pages (มือถือเปิดไฟล์ดับเบิลคลิกไม่ได้)
- ต้องตัดสิน: B + D ว่าจะใช้วิธีนี้เป็นทางสำรองสำหรับ `file://` ไหม · C เขียน ADR (ทางเลือก: วิธีนี้ / GitHub Pages อย่างเดียว / กรอกเอง)
- AI log: 2026-10-22 · A · Claude Code (Opus 5.5) · ขอหาวิธีให้ OCR ทำงานตอนดับเบิลคลิก · ได้วิธีข้างบน + ผลทดสอบจริง · ทีมแก้/ตรวจ: [ผู้ใช้กรอก] · บทเรียน: [ผู้ใช้กรอก]

## 2026-10-21 — A (PM) + Claude Code · ร่าง M1 Charter
- ไฟล์ที่เปลี่ยน: `docs/01-charter/charter.md` (ใหม่) · `HANDOFF.md`
- FR/NFR ที่ครอบ: ร่าง MVP FR-01–FR-05 (จาก v1 · รหัสสุดท้ายรอ `spec.md` ของ B) · ตัววัด "≥ 4/5 คนยืนยันใน 10 วินาที" (NFR usability จาก v1)
- test: ไม่มี (งานเอกสาร)
- ตามหลังตาราง: Charter ควรเริ่ม อ. 20 และร่างครบ พ. 21 → วันนี้ได้ร่างแรก ยังต้องกรอก `[ทีมกรอก]`
- ยังขาด / ต้องตัดสิน:
  - ชื่อ + ช่องทางติดต่อผู้ใช้จริง 3 คน (Gate 1 · rubric ข้อ 2) → ถามอาจารย์ว่าเก็บนอก repo ได้ไหม (PDPA)
  - หลักฐานชั้น A + ตัวเลข TAM พร้อมแหล่ง (Scorecard ข้อ 6 ยังว่าง · รวมตอนนี้ 14 + ข้อ 6 ต้อง ≥ 15)
  - ทีมยืนยันคะแนน Scorecard ทุกข้อ · คำตัดสิน GO · ชื่อสมาชิก + บทบาท · เป้าหมายตัววัด
  - 5 Whys ข้อ 5 ต้องยืนยันกับผู้ให้สัมภาษณ์ 2
  - M1 กำหนด Charter "1 หน้า" → ส่วนที่ 1 คือหน้าที่ส่ง · ส่วนที่ 2 เป็นงานรองรับ (ทีมตัดสินว่าแนบหรือไม่)
  - งานอื่นของ A วันนี้: ถามอาจารย์เรื่องส่งลิงก์ GitHub Pages · `/speckit-specify` 001-pairing รอ `spec.md` (B)
- branch / PR: `m1/charter` · ยังไม่ commit
- AI log (ย้ายเข้า `spec.md` §AI log เมื่อ B สร้างไฟล์):

| วันที่ | ใคร | เครื่องมือ | ขออะไร | ได้อะไร | ทีมแก้/ตรวจอะไร | บทเรียน |
|---|---|---|---|---|---|---|
| 2026-10-21 | A | Claude Code (Opus 5.5) · `/medmind-next A` | ร่าง Charter ตาม ROADMAP ขั้น 1 + M1 จากผลสัมภาษณ์ | `charter.md` ส่วน Charter 1 หน้า + 5 Whys, Litmus, TAM (ว่าง), Scorecard ที่ AI เสนอ, Problem Brief | [ผู้ใช้กรอก] | [ผู้ใช้กรอก] |

## [YYYY-MM-DD] — [ใคร] · [งานอะไร]
- ไฟล์ที่เปลี่ยน:
- FR/NFR ที่ครอบ:
- test: [ผลจริง เช่น node --test 12/12 ผ่าน] หรือ "ยังไม่มี"
- ยังขาด / ต้องตัดสิน:
- branch / PR:

## สถานะรวม
| ขั้น | สถานะ |
|---|---|
| 0 ตั้ง repo | ☐ |
| 1 M1 Charter | ☐ |
| 2 M2 SRS | ☐ |
| 3 M2 Design | ☐ |
| 4 Prototype + test | ☐ |
| 5 Validation | ☐ |
| 6 ส่งงาน | ☐ |
