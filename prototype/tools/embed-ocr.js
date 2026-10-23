// embed-ocr — สร้างไฟล์ OCR แบบฝัง เพื่อให้อ่านฉลากได้เมื่อเปิด prototype ด้วยดับเบิลคลิก (file://)
// FR-02 ✓1 ✗5 · ADR-08 · specs/002-label/research.md R-1
// file:// บล็อกการโหลดไฟล์ภาษา/worker ด้วย fetch/importScripts แต่ <script src> ใช้ได้
// → ห่อไฟล์จาก vendor/tesseract/ (ไม่แก้ต้นฉบับ) เป็น .js ที่เก็บข้อมูลเป็น base64 ใน window.MM_OCR
// รัน: node prototype/tools/embed-ocr.js (ครั้งเดียว · ผลลัพธ์ commit · แอปไม่ต้องใช้ node)
// เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'vendor', 'tesseract');
const out = path.join(root, 'vendor', 'tesseract-embed');

// core แบบไม่ใช้ SIMD → รันได้ทุกเครื่อง (research R-1)
const files = [
  ['lang-tha', path.join(src, 'lang', 'tha.traineddata')],
  ['lang-eng', path.join(src, 'lang', 'eng.traineddata')],
  ['core', path.join(src, 'core', 'tesseract-core-lstm.wasm.js')],
  ['worker', path.join(src, 'worker.min.js')]
];

fs.mkdirSync(out, { recursive: true });
for (const [key, file] of files) {
  const b64 = fs.readFileSync(file).toString('base64');
  const body = '/* สร้างโดย prototype/tools/embed-ocr.js จาก ' + path.relative(root, file).replace(/\\/g, '/') + ' — ห้ามแก้มือ */\n' +
    'window.MM_OCR = window.MM_OCR || {};\nwindow.MM_OCR[' + JSON.stringify(key) + '] = "' + b64 + '";\n';
  const target = path.join(out, key + '.js');
  fs.writeFileSync(target, body);
  console.log(key.padEnd(9), (fs.statSync(target).size / 1024 / 1024).toFixed(2), 'MB');
}
