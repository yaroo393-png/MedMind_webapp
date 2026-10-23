# tesseract-embed — ไฟล์ OCR แบบฝัง (ห้ามแก้มือ)

สร้างจาก `prototype/vendor/tesseract/` ด้วย `node prototype/tools/embed-ocr.js` · ใช้เพื่อให้อ่านฉลากได้เมื่อเปิด prototype ด้วยดับเบิลคลิก (`file://`)
— FR-02 ✓1 ✗5 · ADR-08 · `specs/002-label/research.md` R-1

| ไฟล์ | ต้นฉบับ | ขนาด |
|---|---|---|
| `lang-tha.js` | `tesseract/lang/tha.traineddata` | 1.36 MB |
| `lang-eng.js` | `tesseract/lang/eng.traineddata` | 5.23 MB |
| `core.js` | `tesseract/core/tesseract-core-lstm.wasm.js` (ไม่ใช้ SIMD → รันได้ทุกเครื่อง) | 5.01 MB |
| `worker.js` | `tesseract/worker.min.js` | 0.16 MB |

- แต่ละไฟล์ตั้งค่า `window.MM_OCR[<ชื่อ>]` เป็น base64 ของต้นฉบับ · `src/modules/readLabel.js` โหลดเฉพาะครั้งแรกที่อ่านฉลาก
- License ตามต้นฉบับ (Apache-2.0) — ดู `../tesseract/`
- เปลี่ยนรุ่น Tesseract.js → รันสคริปต์ใหม่ และตรวจการแก้บั๊ก worker ใน `readLabel.js` (ผูกกับ 5.1.1)
