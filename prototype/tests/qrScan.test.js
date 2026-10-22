// FR-01 QR — รูปแบบข้อความใน QR และการอ่าน QR ไป-กลับ (✓1 ✓3 ✗7 · ADR-07)
// เจ้าของ: A (YAR OO)
// รัน: node --test (ที่ root ของ repo)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const Q = require('../src/modules/qrScan.js');

// วาดตาราง QR เป็นภาพ RGBA แบบเดียวกับที่หน้าจอวาดลง canvas (8 px/โมดูล · ขอบเงียบ 4 โมดูล)
function renderMatrix(matrix, cell = 8, quiet = 4) {
  const n = matrix.length;
  const size = (n + quiet * 2) * cell;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c]) continue;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const i = (((r + quiet) * cell + y) * size + ((c + quiet) * cell + x)) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  return { data, width: size, height: size };
}


test('ADR-07: the QR text is MEDMIND: + the 6-digit code and nothing else (no personal data · R8)', () => {
  assert.equal(Q.qrText('004213'), 'MEDMIND:004213');
  assert.throws(() => Q.qrText('4213'), TypeError);
});

test('FR-01 ✓1: qrMatrix returns a square grid of booleans (at least 21×21 modules)', () => {
  const m = Q.qrMatrix('004213');
  assert.ok(m.length >= 21);
  for (const row of m) {
    assert.equal(row.length, m.length);
    for (const cell of row) assert.equal(typeof cell, 'boolean');
  }
});

test('FR-01 ✓3: a QR drawn from qrMatrix is read back to the same code (round trip with jsQR)', () => {
  for (const code of ['004213', '999999', '000000']) {
    assert.equal(Q.readQr(renderMatrix(Q.qrMatrix(code))), code);
  }
});

test('FR-01 ✗7 / R8: only the exact MEDMIND:<6 digits> text becomes a code', () => {
  assert.equal(Q.codeFromQr('MEDMIND:123456'), '123456');
  for (const bad of [null, undefined, '', '123456', 'MEDMIND:12345', 'MEDMIND:1234567', 'medmind:123456',
    'https://x?MEDMIND:123456', ' MEDMIND:123456', 'MEDMIND:123456\n', 'MEDMIND:12345a']) {
    assert.equal(Q.codeFromQr(bad), null, JSON.stringify(bad));
  }
});

test('FR-01 ✗7: an image without a QR code reads as null (screen then asks for the 6-digit code)', () => {
  const size = 64;
  const blank = { data: new Uint8ClampedArray(size * size * 4).fill(255), width: size, height: size };
  assert.equal(Q.readQr(blank), null);
});

test('readQr rejects something that is not image data', () => {
  assert.throws(() => Q.readQr(null), TypeError);
  assert.throws(() => Q.readQr({ data: [], width: 0, height: 0 }), TypeError);
});
