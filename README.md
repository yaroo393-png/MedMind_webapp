# MedMind — ระบบเตือนกินยาและแจ้งสถานะให้ผู้ดูแลผู้สูงอายุ

![Prototype](https://img.shields.io/badge/prototype-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-0b6e4f)
![Server](https://img.shields.io/badge/server-none%20(double--click)-555555)
![Tests](https://img.shields.io/badge/tests-node%20--test-339933)
![Node](https://img.shields.io/badge/node-%E2%89%A5%2018-339933)
![Spec Kit](https://img.shields.io/badge/Spec%20Kit-1.2.2-24292f)

เว็บแอป prototype ของวิชา Introduction to Software Engineering (15031001) · มหาวิทยาลัยแม่ฟ้าหลวง ปีการศึกษา 2569 · ทีม MedMind

ผู้สูงอายุที่กินยาประจำจำไม่ได้ว่ามื้อนี้กินแล้วหรือยัง และลูกหลานต้องโทร/LINE ถามประมาณ 5–6 ครั้งต่อสัปดาห์ (สัมภาษณ์ผู้ใช้จริง 3 คน · [`evidence/`](evidence/)) · MedMind ตอบ 2 คำถาม:

- **ผู้สูงอายุ:** "มื้อนี้ต้องกินยาอะไร และกินแล้วหรือยัง?" → เตือนตามมื้อพร้อมเสียง ยาทั้งมื้อในหน้าเดียว · แตะ "กินแล้ว" ครั้งเดียว · ไม่มีบัญชี ไม่ต้องพิมพ์
- **ผู้ดูแล:** "วันนี้กินยาครบทุกมื้อหรือยัง โดยไม่ต้องโทรถาม?" → เพิ่มยาจากรูปฉลาก · แจ้งเมื่อมื้อยังไม่ยืนยันที่ T+15 · สถานะทุกมื้อของวัน

| Must FR | ทำอะไร | หน้าจอ |
|---|---|---|
| FR-01 | จับคู่ผู้สูงอายุ–ผู้ดูแลด้วย QR หรือรหัส 6 หลัก · ต้องยินยอมก่อน · ยกเลิก = ลบข้อมูลของคู่ | S1 · C1 |
| FR-02 | ถ่ายฉลากยา → ระบบร่าง → ผู้ดูแลตรวจ/แก้ → บันทึก | C2 |
| FR-03 | เตือนตามมื้อ + เสียง · เตือนซ้ำ T+5, T+10 | S2 |
| FR-04 | "กินแล้ว" 1 แตะ = ยืนยันทั้งมื้อ · ยกเลิกได้ 10 วินาที · ยืนยันช้าได้ถึงมื้อถัดไป | S2 · S3 |
| FR-05 | แจ้งผู้ดูแลที่ T+15 ถ้ายังไม่ยืนยัน (1 ครั้งต่อมื้อ) + สถานะรายวัน | C3 |

---

## โครงสร้าง repo

```
MedMind_webapp/
├── README.md                 หน้านี้
├── evidence/                 หลักฐานผู้ใช้จริง (บันทึกสัมภาษณ์ 4/9/69)
├── docs/                     เอกสารส่งงาน เรียงตาม milestone — สารบัญ docs/README.md
│   ├── 01-charter/           M1 Team Charter
│   ├── 02-requirements/      M2 SRS (spec.md) · backlog
│   ├── 03-design/            M2 architecture · design system · user flow + wireframe
│   ├── 04-test/              M3 test scenarios · usability/SUS · NFR-08/11
│   ├── 05-report/            M3 final report · AI-Use Statement
│   ├── 06-presentation/      M3 demo slides
│   └── course/               เอกสารอาจารย์ (อ้างอิง ห้ามแก้)
├── specs/                    งานของ Spec Kit 1 Must FR = 1 โฟลเดอร์ (spec → plan → tasks)
│   ├── 001-pairing/          FR-01
│   ├── 002-label/            FR-02
│   ├── 003-reminder/         FR-03
│   ├── 004-confirm/          FR-04
│   └── 005-status/           FR-05
├── prototype/                แอป (เปิดด้วยดับเบิลคลิก)
│   ├── index.html            หน้าเดียว โหลด script ตามลำดับ
│   ├── src/core/             นาฬิกาจำลอง · ที่เก็บข้อมูล · events
│   ├── src/ui/               shell 2 โทรศัพท์ · design tokens · components
│   ├── src/modules/          กฎของแต่ละ FR (ฟังก์ชันล้วน)
│   ├── src/screens/          หน้าจอ S1–S3 (ผู้สูงอายุ) · C1–C3 (ผู้ดูแล)
│   ├── tests/                unit test 8 ไฟล์
│   ├── samples/              รูปฉลากยาตัวอย่าง (ข้อมูลสมมติ)
│   ├── tools/                สคริปต์ฝังไฟล์ OCR (ไม่ต้องรันตอนใช้แอป)
│   └── vendor/               ไลบรารีภายนอก (ห้ามแก้)
├── HANDOFF.md                บันทึกความคืบหน้าหลังจบงานแต่ละครั้ง (ล่าสุดอยู่บน)
├── CLAUDE.md                 กติกาโปรเจกต์สำหรับ AI coding agent
├── SE-COURSE-PRINCIPLES.md   กติกาวิชา (สรุปจากเอกสารอาจารย์)
├── ROADMAP.md · TEAM-PLAN.md · SCHEDULE-20-26.md · LESSONS-FROM-V1.md   แผนงานของทีม
└── .specify/ · .claude/      ตั้งค่า Spec Kit และ constitution
```

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี | เหตุผล |
|---|---|---|
| หน้าจอ | HTML · CSS (design tokens) · JavaScript แบบ UMD ไม่มี framework | เปิดด้วยดับเบิลคลิกได้ ไม่ต้องมี server/npm (เกณฑ์ M3 · ADR-08) |
| เสียงเตือน | Web Audio API (สร้างเสียงในหน้า ไม่มีไฟล์เสียง) | ทำงานแบบไฟล์ได้ · เล่นหลังแตะหน้าจอครั้งแรกตามกติกาเบราว์เซอร์ |
| ข้อมูล | localStorage ของเบราว์เซอร์ | ไม่มี server (ADR-01, ADR-06) · ข้อมูลไม่ออกนอกเครื่อง (NFR-09) |
| อ่านฉลากยา | Tesseract.js 5.1.1 (OCR ในเครื่อง ฝังภาษาไทย/อังกฤษไว้ในไฟล์) | ไม่ส่งรูปออกนอกเครื่อง · ใช้ได้แม้ไม่มีเน็ต (ADR-03) |
| QR | qrcode-generator 1.4.4 (สร้าง) · jsQR 1.4.0 (อ่าน) | FR-01 · ตรวจ integrity แล้ว ไม่มี dependency (`prototype/vendor/README.md`) |
| ทดสอบ | `node:test` ของ Node.js (ไม่มี package ภายนอก) | กฎทุกข้อทดสอบได้โดยไม่เปิดเบราว์เซอร์ |
| เอกสาร / diagram | Markdown · Mermaid | แสดงผลบน GitHub ได้ทันที |
| กระบวนการ | GitHub Spec Kit 1.2.2 · Claude Code | 1 Must FR = 1 increment (specify → plan → tasks → analyze → implement) |
| เผยแพร่ | GitHub Pages | ลองบนมือถือได้ |

## เปิดและใช้งาน (Quick Start)

### 1. เปิด prototype

| วิธี | ทำอย่างไร |
|---|---|
| **ดับเบิลคลิก** (ไม่ต้องติดตั้งอะไร) | เปิดไฟล์ `prototype/index.html` ใน Chrome หรือ Edge |
| **ลิงก์ออนไลน์** (ใช้บนมือถือได้) | https://yaroo393-png.github.io/MedMind_webapp/prototype/ |

### 2. หน้าจอที่เห็น

หน้าเดียวแสดง 2 โทรศัพท์ (ผู้สูงอายุ · ผู้ดูแล) ใช้ข้อมูลร่วมกัน · **แถบด้านบนใช้สาธิตเท่านั้น** (เลื่อนเวลาจำลอง +1/+5/+15 นาที · ไปที่เวลา · ล้างข้อมูล) ·
แยกบทบาทคนละแท็บ: `?role=senior` · `?role=caregiver` (ซิงก์กันผ่านเบราว์เซอร์เดียวกัน)

### 3. ลองครบทุก Must FR ใน 5 นาที

1. **FR-01:** ผู้สูงอายุกด "อนุญาตให้ลูกหลานดูสถานะการกินยา" → ผู้ดูแลพิมพ์รหัส 6 หลัก → "เชื่อมต่อ"
2. **FR-02:** ผู้ดูแล "เพิ่มยาจากฉลาก" → เลือกรูปใน `prototype/samples/` → ตรวจร่าง → ตั้งเวลามื้อ → "บันทึกยา"
3. **FR-03:** แตะหน้าจอผู้สูงอายุ 1 ครั้ง (เปิดเสียง) → "ไปที่เวลา" = เวลามื้อ → หน้าเตือน + เสียง
4. **FR-04:** แตะ "กินแล้ว" → บันทึกทั้งมื้อ · กด "ยกเลิก" ได้ภายใน 10 วินาที
5. **FR-05:** "ไปที่เวลา" = เวลามื้อของวันถัดไป · ไม่กดอะไรที่ผู้สูงอายุ → "+15 นาที" → เครื่องผู้ดูแลมีแถบ "ยังไม่ยืนยันการกินยา" → "ดูสถานะ"

ขั้นตอนละเอียดต่อ FR และ error/empty state: [`prototype/README.md`](prototype/README.md) · `specs/00N-*/quickstart.md`

## การทดสอบ

```
node --test
```

ที่ root ของ repo · Node 18 ขึ้นไป · ไม่ใช้ npm · อย่าใส่ path โฟลเดอร์ (`node --test prototype/tests` จะ fail)

| ชั้น | ผล | เอกสาร |
|---|---|---|
| Unit test 8 ไฟล์ | **214/214 ผ่าน** (รันจริง 25/10/69) · ทุก acceptance criterion 36/36 มี test | [`test-scenarios.md`](docs/04-test/test-scenarios.md) |
| System test ในเบราว์เซอร์ | ทุก Must FR ผ่าน · console error 0 | [`test-scenarios.md`](docs/04-test/test-scenarios.md) §4 |
| ผู้ใช้จริง (NFR-02 · SUS · ฉลากจริง 20 ใบ) | ยังไม่ได้วัด | [`usability-sus.md`](docs/04-test/usability-sus.md) · [`nfr-08-11-label-reading.md`](docs/04-test/nfr-08-11-label-reading.md) |

## ข้อมูลสำหรับทดลอง

- **ไม่มีบัญชีผู้ใช้หรือรหัสผ่าน** — ระบุตัวด้วยรหัสเครื่องที่สุ่มขึ้น (ADR-05) · เปิดครั้งแรกได้รหัสเชิญ 6 หลักทันที
- **ฉลากยาตัวอย่าง** (ข้อมูลสมมติ ไม่มีชื่อผู้ป่วยจริง) ใน `prototype/samples/`: หลังอาหาร · ก่อนอาหาร · ก่อนนอน · ยาเมื่อมีอาการ (กรณีระบบไม่รองรับ)
- **เริ่มใหม่:** ปุ่ม "ล้างข้อมูลทั้งหมด" บนแถบทดลอง (มี dialog ยืนยัน)
- **ฉลากจริง** เก็บในโฟลเดอร์ `real-labels/` ที่ git ไม่เก็บเท่านั้น · ห้าม commit (NFR-09)

## เอกสารประกอบ

สารบัญเต็มเรียงตาม milestone: [`docs/README.md`](docs/README.md)

1. **M1** [Team Charter](docs/01-charter/charter.md) · [หลักฐานผู้ใช้จริง](evidence/interviews-2569-09-04.md)
2. **M2 SRS** [spec.md](docs/02-requirements/spec.md) (FR · BR · NFR · acceptance criteria · Golden Thread · AI log) · [backlog](docs/02-requirements/backlog.md)
3. **M2 Design** [architecture](docs/03-design/architecture.md) · [design system](docs/03-design/design-system.md) · [user flow + wireframe](docs/03-design/user-flow.md)
4. **Feature** [specs/](specs/) (spec · plan · contracts · tasks ต่อ FR)
5. **M3 Test** [test scenarios](docs/04-test/test-scenarios.md) · [usability/SUS](docs/04-test/usability-sus.md)
6. **M3 Report** [final report](docs/05-report/final-report.md) · [AI-Use Statement](docs/05-report/ai-use-statement.md) · [demo slides](docs/06-presentation/slides.html)
7. **ความคืบหน้า** [HANDOFF.md](HANDOFF.md)

## ทีม

| สมาชิก | GitHub | บทบาท | Feature |
|---|---|---|---|
| YAR OO | [@yaroo393-png](https://github.com/yaroo393-png) | Project Manager | FR-01 จับคู่ |
| Suchitra Khomdee | [@Khaiwann](https://github.com/Khaiwann) | Requirements Analyst | FR-02 เพิ่มยาจากฉลาก |
| Takkan Khanlui | [@V31311](https://github.com/V31311) | System Designer | FR-03 เตือนตามมื้อ |
| Rossatorn Sangkaew | [@IDK-SleepyBro](https://github.com/IDK-SleepyBro) | UX/UI Designer | FR-04 ยืนยันการกินยา |
| Nichanan Lalua | [@KaidangSuk](https://github.com/KaidangSuk) | QA / Tester | FR-05 แจ้งผู้ดูแล + สถานะ |

**การใช้ AI:** ใช้ Claude Code ร่างเอกสารและโค้ดตามกติกาใน `CLAUDE.md` · บันทึกทุกครั้งใน AI log (`spec.md` §8) · สรุปใน [AI-Use Statement](docs/05-report/ai-use-statement.md) · ทีมตรวจและตัดสินทุกข้อ

**ขอบเขต (ไม่ทำ):** อ่านลายมือแพทย์ · บันทึกผลอ่านฉลากโดยไม่ผ่านการตรวจ · วินิจฉัยหรือแนะนำยา · เปลี่ยนวิธีใช้ยาเอง · แนะนำวิธีชดเชยเมื่อลืมยา ·
เตือนเมื่อปิดหน้าเว็บ (ต้องมี server · M4)
