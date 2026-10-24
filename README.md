# MedMind

ระบบเตือนกินยาและแจ้งสถานะการกินยาให้ผู้ดูแลผู้สูงอายุ — เว็บแอป prototype · วิชา Introduction to Software Engineering (15031001) · มหาวิทยาลัยแม่ฟ้าหลวง 2569

- **ผู้สูงอายุ:** "มื้อนี้ต้องกินยาอะไร และกินแล้วหรือยัง?" → เตือนตามมื้อพร้อมเสียง · แตะ "กินแล้ว" ครั้งเดียว
- **ผู้ดูแล:** "วันนี้กินยาครบทุกมื้อหรือยัง โดยไม่ต้องโทรถาม?" → แจ้งเมื่อมื้อยังไม่ยืนยันที่ T+15 · สถานะทุกมื้อของวัน

## เปิด prototype

| วิธี | ทำอย่างไร |
|---|---|
| **ดับเบิลคลิก** (ไม่ต้องติดตั้งอะไร) | เปิดไฟล์ `prototype/index.html` ใน Chrome หรือ Edge |
| **ลิงก์ออนไลน์** (ใช้บนมือถือได้) | https://yaroo393-png.github.io/MedMind_webapp/prototype/ |

หน้าเดียวแสดง 2 โทรศัพท์ (ผู้สูงอายุ · ผู้ดูแล) ที่ใช้ข้อมูลร่วมกัน · แถบด้านบนใช้เลื่อนเวลาจำลองเพื่อสาธิต (ไม่ใช่ส่วนของแอป) ·
แยกบทบาทคนละแท็บ: `?role=senior` · `?role=caregiver` · ไม่มี server ฐานข้อมูล หรือ npm · ข้อมูลอยู่ในเบราว์เซอร์และไม่ส่งออกนอกเครื่อง

**ลองครบทุก Must FR ใน 5 นาที** (รายละเอียด: [`prototype/README.md`](prototype/README.md))
1. **FR-01:** ผู้สูงอายุกด "อนุญาตให้ลูกหลานดูสถานะการกินยา" → ผู้ดูแลพิมพ์รหัส 6 หลัก → "เชื่อมต่อ"
2. **FR-02:** ผู้ดูแล "เพิ่มยาจากฉลาก" → เลือกรูปใน `prototype/samples/` → ตรวจร่าง → ตั้งเวลามื้อ → "บันทึกยา"
3. **FR-03:** แตะหน้าจอผู้สูงอายุ 1 ครั้ง (เปิดเสียง) → แถบทดลอง "ไปที่เวลา" = เวลามื้อ → หน้าเตือน + เสียง
4. **FR-04:** แตะ "กินแล้ว" → บันทึกทั้งมื้อ · กด "ยกเลิก" ได้ภายใน 10 วินาที
5. **FR-05:** "ไปที่เวลา" = เวลามื้อของวันถัดไป · ไม่กดอะไรที่ผู้สูงอายุ → "+15 นาที" → เครื่องผู้ดูแลมีแถบ "ยังไม่ยืนยันการกินยา" → "ดูสถานะ"

## รัน test

```
node --test
```

ที่ root ของ repo · Node 18 ขึ้นไป · ไม่ใช้ npm · ผลล่าสุด **214/214 ผ่าน** · อย่าใส่ path โฟลเดอร์ (`node --test prototype/tests` จะ fail)

## เอกสาร

| ขั้น | เอกสาร |
|---|---|
| M1 Charter | [`docs/01-charter/charter.md`](docs/01-charter/charter.md) · หลักฐานผู้ใช้จริง [`evidence/`](evidence/) |
| M2 SRS | [`docs/02-requirements/spec.md`](docs/02-requirements/spec.md) (FR · BR · NFR · AC · Golden Thread · AI log) · [`backlog.md`](docs/02-requirements/backlog.md) |
| M2 Design | [`architecture.md`](docs/03-design/architecture.md) (3 ชั้น · ADR · diagram · data model) · [`design-system.md`](docs/03-design/design-system.md) · [`user-flow.md`](docs/03-design/user-flow.md) |
| M3 Test | [`test-scenarios.md`](docs/04-test/test-scenarios.md) · [`usability-sus.md`](docs/04-test/usability-sus.md) · [`nfr-08-11-label-reading.md`](docs/04-test/nfr-08-11-label-reading.md) |
| M3 Report | [`final-report.md`](docs/05-report/final-report.md) · [`ai-use-statement.md`](docs/05-report/ai-use-statement.md) |
| Feature (Spec Kit) | [`specs/001-pairing`](specs/001-pairing) · [`002-label`](specs/002-label) · [`003-reminder`](specs/003-reminder) · [`004-confirm`](specs/004-confirm) · [`005-status`](specs/005-status) |
| ความคืบหน้า | [`HANDOFF.md`](HANDOFF.md) |

## โครงสร้าง prototype

```
prototype/index.html      หน้าเดียว โหลด script ตามลำดับ (ไม่มี import/export จึงเปิดแบบไฟล์ได้)
prototype/src/core/       นาฬิกาจำลอง · ที่เก็บข้อมูล · events
prototype/src/ui/         shell 2 โทรศัพท์ · design tokens · components
prototype/src/modules/    กฎของแต่ละ FR (ฟังก์ชันล้วน ทดสอบด้วย node --test)
prototype/src/screens/    หน้าจอ S1–S3 (ผู้สูงอายุ) · C1–C3 (ผู้ดูแล) ทุกหน้ามีป้าย Covers: FR-x
prototype/tests/          unit test 8 ไฟล์
prototype/vendor/         jsQR · qrcode-generator · Tesseract.js (ฝังไฟล์ภาษาไว้ อ่านฉลากได้แม้ไม่มีเน็ต)
```

## ทีม

| สมาชิก | บทบาท | Feature |
|---|---|---|
| YAR OO | Project Manager | FR-01 จับคู่ |
| Suchitra Khomdee | Requirements Analyst | FR-02 เพิ่มยาจากฉลาก |
| Takkan Khanlui | System Designer | FR-03 เตือนตามมื้อ |
| Rossatorn Sangkaew | UX/UI Designer | FR-04 ยืนยันการกินยา |
| Nichanan Lalua | QA / Tester | FR-05 แจ้งผู้ดูแล + สถานะ |

ใช้ AI (Claude Code) ช่วยร่างเอกสารและโค้ด · บันทึกทุกครั้งใน AI log (`spec.md` §8) · ทีมตรวจและตัดสินทุกข้อ

**ขอบเขต:** ไม่อ่านลายมือแพทย์ · ไม่บันทึกผลอ่านฉลากโดยไม่ผ่านการตรวจ · ไม่วินิจฉัยหรือแนะนำยา · ไม่เปลี่ยนวิธีใช้ยาเอง · ไม่แนะนำวิธีชดเชยเมื่อลืมยา
