# vendor — ไลบรารีภายนอก (ห้ามแก้ไฟล์ในโฟลเดอร์นี้)

ใช้เฉพาะระบบสแกน (อาจารย์กำหนดให้ทำ) · เก็บในเครื่อง ไม่โหลดจาก CDN · ไม่ใช้ npm ตอนรันแอป

| ไฟล์ | ที่มา | License | ใช้ทำ |
|---|---|---|---|
| `tesseract/tesseract.min.js`, `tesseract/worker.min.js` | npm `tesseract.js@5.1.1` (`dist/`) | Apache-2.0 | OCR ในเบราว์เซอร์ |
| `tesseract/core/*.wasm.js` | npm `tesseract.js-core@5.1.1` | Apache-2.0 | ตัวประมวลผล OCR (WebAssembly) |
| `tesseract/lang/tha.traineddata`, `eng.traineddata` | github.com/tesseract-ocr/tessdata_fast (branch main) | Apache-2.0 | ข้อมูลภาษาไทย/อังกฤษ |
| `jsqr/jsQR.js` | npm `jsqr@1.4.0` (`dist/`) | Apache-2.0 | อ่าน QR จากรูป |

ทดสอบแล้ว (20 ต.ค. 2569, Chromium, ไม่ต่ออินเทอร์เน็ต): OCR ใช้ได้เมื่อเปิดผ่าน http(s) เท่านั้น · QR ใช้ได้ทั้งสองแบบ
วิธีเรียกใช้: ดู `TEAM-PLAN.md` ข้อ 5.1
