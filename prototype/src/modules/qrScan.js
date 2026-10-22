/* qrScan — แปลงรหัสเชิญ ↔ QR (FR-01 ✓1 ✓3 ✗7 · ADR-07)
   QR บรรจุ "MEDMIND:<รหัส 6 หลัก>" เท่านั้น ไม่มีข้อมูลส่วนตัว (R8) · ไม่แตะ DOM — หน้าจอเป็นผู้วาด canvas และอ่านรูป
   ใช้ jsQR (อ่าน) และ qrcode-generator (สร้าง) จาก prototype/vendor/ · สัญญา: specs/001-pairing/contracts/pairing-module.md
   เจ้าของ: A (YAR OO) */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.MedMind = root.MedMind || {}; root.MedMind.qrScan = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // เบราว์เซอร์: ไลบรารีโหลดด้วย <script> ก่อนไฟล์นี้ (index.html) · node --test: require จาก vendor
  function decoder() {
    if (typeof window !== 'undefined' && typeof window.jsQR === 'function') return window.jsQR;
    if (typeof require === 'function') return require('../../vendor/jsqr/jsQR.js');
    throw new Error('jsQR not loaded — check index.html');
  }

  function encoder() {
    if (typeof window !== 'undefined' && typeof window.qrcode === 'function') return window.qrcode;
    if (typeof require === 'function') return require('../../vendor/qrcode/qrcode.js');
    throw new Error('qrcode not loaded — check index.html');
  }

  var PREFIX = 'MEDMIND:';

  function assertCode(code) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new TypeError('code must be a string of exactly 6 digits');
  }

  function qrText(code) {
    assertCode(code);
    return PREFIX + code;
  }

  // ข้อความจาก QR → รหัส · ไม่ใช่รูปแบบของเราพอดี → null (ไม่เดา · ✗7)
  function codeFromQr(text) {
    if (typeof text !== 'string') return null;
    var m = /^MEDMIND:(\d{6})$/.exec(text);
    return m ? m[1] : null;
  }

  // ตาราง QR (true = โมดูลดำ) ให้หน้าจอวาดลง canvas เอง (shell ห้าม innerHTML) · ระดับแก้ผิด M
  function qrMatrix(code) {
    var qr = encoder()(0, 'M');  // 0 = เลือกขนาดเล็กสุดที่พอ
    qr.addData(qrText(code));
    qr.make();
    var n = qr.getModuleCount();
    var rows = [];
    for (var r = 0; r < n; r++) {
      var row = [];
      for (var c = 0; c < n; c++) row.push(qr.isDark(r, c));
      rows.push(row);
    }
    return rows;
  }

  // imageData = { data: RGBA, width, height } จาก canvas · ไม่พบ QR หรือไม่ใช่ QR ของเรา → null (✗7)
  function readQr(imageData) {
    if (!imageData || !imageData.data || !(imageData.width > 0) || !(imageData.height > 0)) {
      throw new TypeError('imageData must have data, width and height');
    }
    var found = decoder()(imageData.data, imageData.width, imageData.height);
    return found ? codeFromQr(found.data) : null;
  }

  return { PREFIX: PREFIX, qrText: qrText, codeFromQr: codeFromQr, qrMatrix: qrMatrix, readQr: readQr };
});
