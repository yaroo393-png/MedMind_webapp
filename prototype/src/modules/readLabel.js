/* readLabel — adapter อ่านข้อความจากรูปฉลากด้วย OCR ในเครื่อง (FR-02 ✓1 ✗5 · ADR-03, ADR-08 · NFR-09)
   คืนได้แค่ "ข้อความดิบ" หรือ "สาเหตุที่อ่านไม่ได้" · กฎแยกร่างอยู่ใน labelParser (test ได้) · ไฟล์นี้ใช้ในเบราว์เซอร์เท่านั้น
   เปิดแบบดับเบิลคลิก (file://) ได้: โหลดไฟล์ OCR ที่ฝังเป็น .js (vendor/tesseract-embed/) เฉพาะครั้งแรกที่อ่าน
   แล้วสร้าง worker จาก blob ของ core + worker (research R-1) · ไม่ส่งรูป/ข้อความออกนอกเครื่อง · ไม่เก็บรูป/ข้อความ
   สัญญา: specs/002-label/contracts/label-modules.md · เจ้าของ: B (Suchitra Khomdee) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 */
(function (window, document) {
  'use strict';

  var MM = window.MedMind = window.MedMind || {};
  var EMBED_DIR = 'vendor/tesseract-embed/';
  var EMBEDS = ['lang-tha', 'lang-eng', 'core', 'worker'];
  var MAX_SIDE = 2000;  // ย่อรูปมือถือให้อ่านเร็วขึ้น แต่ยังเห็นตัวอักษรเล็กบนฉลาก
  // Tesseract.js 5.1.1: worker อ่านข้อมูลภาษาที่ส่งเป็น bytes ผิดช่อง (t.data แทน t.code) → แก้ในหน่วยความจำ ไม่แก้ไฟล์ vendor (ADR-08)
  var WORKER_BUG = 'return"string"==typeof t?t:t.data';
  var WORKER_FIX = 'return"string"==typeof t?t:t.code';

  var embedsLoading = null;
  var workerReady = null;
  var progressListener = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('cannot load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadEmbeds() {
    if (!embedsLoading) {
      embedsLoading = Promise.all(EMBEDS.map(function (name) {
        return window.MM_OCR && window.MM_OCR[name] ? null : loadScript(EMBED_DIR + name + '.js');
      })).then(function () {
        EMBEDS.forEach(function (name) {
          if (!window.MM_OCR || typeof window.MM_OCR[name] !== 'string') throw new Error('missing embedded ' + name);
        });
      });
      embedsLoading.catch(function () { embedsLoading = null; });  // ลองใหม่ได้ครั้งหน้า
    }
    return embedsLoading;
  }

  function bytes(b64) {
    var s = window.atob(b64);
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function workerUrl() {
    var src = new TextDecoder().decode(bytes(window.MM_OCR.worker));
    var fixed = src.replace(WORKER_BUG, WORKER_FIX);
    if (fixed === src) throw new Error('Tesseract worker patch not applied — version changed?');
    return URL.createObjectURL(new Blob([bytes(window.MM_OCR.core), '\n', fixed], { type: 'text/javascript' }));
  }

  // worker เดียว ใช้ซ้ำทุกครั้ง (สร้างครั้งแรกใช้เวลาหลายวินาที)
  function getWorker() {
    if (!workerReady) {
      workerReady = loadEmbeds().then(function () {
        if (typeof window.Tesseract === 'undefined') throw new Error('Tesseract not loaded — check index.html');
        return window.Tesseract.createWorker([
          { code: 'tha', data: bytes(window.MM_OCR['lang-tha']) },
          { code: 'eng', data: bytes(window.MM_OCR['lang-eng']) }
        ], 1, {
          workerPath: workerUrl(), workerBlobURL: false, cacheMethod: 'none', gzip: false,
          logger: function (m) { if (progressListener) progressListener(m); }
        });
      });
      workerReady.catch(function () { workerReady = null; });
    }
    return workerReady;
  }

  // รูป → canvas (ย่อด้านยาวสุด ≤ 2000 px) · URL ของรูปคืนทุกครั้ง · รูปไม่ถูกเก็บ
  function imageToCanvas(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('not an image')); };
      img.src = url;
    });
  }

  // { ok: true, text } | { ok: false, reason: 'UNSUPPORTED_PAGE' | 'UNREADABLE' } — ไม่ reject
  function readLabel(file, onProgress) {
    if (!file || typeof file.size !== 'number') return Promise.resolve({ ok: false, reason: 'UNREADABLE' });
    var stage = 'engine';
    progressListener = typeof onProgress === 'function' ? onProgress : null;
    return getWorker().then(function (worker) {
      stage = 'image';
      return imageToCanvas(file).then(function (canvas) {
        stage = 'recognize';
        return worker.recognize(canvas);
      });
    }).then(function (result) {
      var text = result && result.data && result.data.text;
      return typeof text === 'string' && text.trim() !== '' ? { ok: true, text: text } : { ok: false, reason: 'UNREADABLE' };
    }, function (err) {
      console.warn('[readLabel] ' + stage + ' failed', err && err.message);
      return { ok: false, reason: stage === 'engine' ? 'UNSUPPORTED_PAGE' : 'UNREADABLE' };
    }).then(function (r) {
      progressListener = null;
      return r;
    });
  }

  // ข้อความบนหน้าจอเมื่ออ่านไม่ได้ (FR-02 ✗5)
  var REASON_TEXT = {
    UNSUPPORTED_PAGE: 'อ่านฉลากในหน้านี้ไม่ได้ กรุณากรอกข้อมูลยาเอง',
    UNREADABLE: 'อ่านฉลากไม่ได้ ลองถ่ายให้ชัดและตรงขึ้น หรือกรอกข้อมูลยาเอง'
  };

  MM.readLabel = { readLabel: readLabel, REASON_TEXT: REASON_TEXT };
})(window, document);
