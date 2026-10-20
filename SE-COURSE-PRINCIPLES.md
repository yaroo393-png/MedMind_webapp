# SE-COURSE-PRINCIPLES.md — หลักการวิชา Intro to Software Engineering (MFU 2569)

> สำหรับ Claude Code: อ่านไฟล์นี้ก่อนทำงานทุกครั้ง · ใช้ได้กับทุกโปรเจกต์ของวิชานี้
> สรุปจากเอกสารอาจารย์: M1–M4, week02–07, UX/UI-HCI primer, StudyMate SRS example
> รายละเอียดเต็มอยู่ใน `docs/course/` (ดูหัวข้อ 9) — **ถ้าไฟล์นี้ขัดกับเอกสารอาจารย์ → เอกสารอาจารย์ชนะ และให้แจ้งทีม**

---

## 0. วิธีใช้
- วางไฟล์นี้ที่ root ของ repo
- ใน `CLAUDE.md` ของโปรเจกต์ใส่บรรทัด: `อ่าน @SE-COURSE-PRINCIPLES.md ก่อนทำทุกงาน`
- `CLAUDE.md` = ข้อมูลเฉพาะโปรเจกต์ (ปัญหา, FR, entity) · ไฟล์นี้ = กติกาของวิชา

---

## 1. หัวใจของวิชา (5 ข้อ ต้องจำ)
1. **Golden Thread**: Problem → Requirement (FR/NFR) → Design → Prototype/Feature → Test ต้องเป็นเรื่องเดียวกัน สาวย้อนกลับได้ทุกชิ้น
   - ถ้าเส้นด้ายขาด อาจารย์ cap คะแนนส่วนหลังไว้ที่ 50%
2. **No gold-plating**: ทุก screen / ปุ่ม / entity / field / diagram / class / test ต้องมี FR หรือ NFR รองรับ ไม่มี FR = ตัดทิ้ง
3. **AI ร่าง คนตรวจ**: AI เขียนเร็วแต่ไม่รู้ว่าควรสร้างอะไรและทำไม การอ่าน การทดสอบ และการตัดสินใจคือส่วนที่ได้คะแนน
4. **เล็กที่สุดที่แก้ปัญหาจริง**: ออกแบบ interface และสถาปัตยกรรมที่เล็กที่สุดที่แก้ปัญหาผู้ใช้จริงได้ และอธิบายเหตุผลได้ทุกส่วน
5. **หลักฐาน ไม่ใช่ความเห็น**: ปัญหามาจากผู้ใช้จริง · requirement ทดสอบได้ · ผลทดสอบเป็นของจริง
   - **ห้ามแต่ง** ผลสัมภาษณ์ ผลทดสอบ หรือคำพูดผู้ใช้

---

## 2. คะแนนและสิ่งที่ส่ง (หน้า M4 = หน้ารวม)
| Milestone | ส่งอะไร | น้ำหนัก |
|---|---|---|
| M1 | Team Charter 1 หน้า | 3% (6 คะแนน) |
| M2 | SRS (12 คะแนน) + Design (12 คะแนน) | 12% (24 คะแนน) |
| M3 | Final Prototype + Demo (หลังสอบกลางภาค) | 15% (30 คะแนน) |
| M4 | Build + deploy จริง | ไม่บังคับ ไม่คิดคะแนน |

- ⚠️ หน้า M2/M3 ของแต่ละโมดูลให้น้ำหนักต่างจากหน้า M4 → ยึดหน้า M4 และให้ทีมถามอาจารย์
- ส่งทีมละ 1 ชุดใน **GitHub repo** งานทุกชิ้นต้อง commit (เป็นหลักฐานส่วนร่วม)
- **คะแนนรายคน = คะแนนทีม × factor** วัดจาก GitHub:
  - ×1.0 มีร่องรอยตรงกับบทบาทใน Charter
  - ×0.7 งานบาง หรือกระจุกช่วงท้าย
  - ×0.4 ไม่มีร่องรอย
- งานที่มีจุดอ่อนหนัก → **ส่งกลับให้แก้ ไม่ใช่ตก** และให้คะแนนครั้งเดียวเมื่อส่งฉบับแก้

**Rubric M3 (30 คะแนน)**
| เกณฑ์ | คะแนน |
|---|---|
| Prototype คลิก happy path ครบทุก Must FR + มี error/empty state | 12 |
| Golden Thread: ชี้ได้ว่า feature = FR-x = diagram = test | 6 |
| Demo: เล่า Problem → Solution + ตอบคำถาม "ทำไม" | 6 |
| Engineering & AI: repo สะอาด, README, บันทึกการใช้ AI ตามจริง | 6 |

**ส่งตอนท้าย:** Charter · SRS · Design · Prototype · Final report 2–3 หน้า (reuse M1–M2 + ตาราง Golden Thread) · Demo slides · AI-Use Statement

---

## 3. Phase 1 — เลือกปัญหา (M1 Charter)
**หลัก:** เริ่มจากปัญหา ไม่ใช่ไอเดียแอป

- **Pain point 4 ส่วน:** ผู้ใช้ (ใคร) + ความยาก (อะไรยาก) + บริบท (ตอนไหน) + ผลกระทบ
- **Problem statement:** `[กลุ่มผู้ใช้] ต้องการวิธี [บรรลุความต้องการ] เพราะ [ความยากปัจจุบัน] ทำให้ [ผลกระทบ]`
- **หลักฐาน 2 ชั้น (ห้ามปนกัน)**
  - ชั้น A: พิสูจน์ว่าปัญหามีจริง เช่น โพสต์ที่คนพูดถึง (บอกจำนวน), รีวิวคู่แข่ง, สถิติ data.go.th → ใช้คิด TAM แต่**ไม่นับเป็นผู้ใช้**
  - ชั้น B: **ผู้ใช้จริง 3 คน** ที่มีปัญหาจริงและติดต่อคุยได้ (แชท/โทรก็นับ)
    - ตัวเองนับได้ 1 คน
    - ห้ามนับเพื่อนในทีม 3 คน · ห้ามนับกลุ่มลอยๆ เช่น "นักศึกษาทั่วไป"
- **5 Whys** → หา root cause ไม่ใช่อาการ
- **Litmus test 5 ข้อ:**
  1. แก่นเป็นเรื่องข้อมูล/การตัดสินใจ/งานซ้ำ หรือของจริงที่ขาด (ห้อง รถ = ธงแดง)
  2. เกิดบ่อยแค่ไหน (เดือนละหลายครั้งดีกว่าปีละครั้ง)
  3. วิธีเดิม (Excel, LINE, กลุ่ม FB) แย่พอให้คนเปลี่ยนไหม
  4. ต้องมีผู้ใช้สองฝั่ง (marketplace) ไหม = ธงแดง
  5. ซอฟต์แวร์เป็นพระเอกไหม
- **ธงแดง:** marketplace 2 ฝั่ง · ไดเรกทอรี/เว็บรวมข้อมูลที่ต้องแข่งกับของฟรี · คุณค่าอยู่ที่ของจริง · ตอบไม่ได้ว่า "ทำไมคนจะเลิกใช้ FB/LINE มาใช้ของเรา"
- **TAM แบบ napkin:** คน × ความถี่/ปี × มูลค่าต่อครั้ง · TAM < ฿0.5M/ปี → ปีนบันไดปัญหา (ladder up) หาเวอร์ชันที่กว้างขึ้น
- **Scorecard 7 ข้อ (0–3 ต่อข้อ, เต็ม 21):** Real & Specific · Frequent · Painful · Software-solvable · AI adds real value · Market (TAM) · Single-player value
  - 0–9 = DROP · 10–14 = REFRAME · **15–21 = GO**
  - **ประตูบังคับ:** ข้อ 1, 4, 5 ต้อง ≥ 2 ทุกข้อ
- **Problem Brief 8 ช่อง:** ปัญหา 1 ประโยค · root cause · วิธีเดิม + ทำไมไม่ดี · TAM · ความถี่ · ซอฟต์แวร์เป็นพระเอกตรงไหน · ถ้าเอาแอปออกยังแก้ได้ไหม · ผู้ใช้จริง 3 คน
- **Charter ต้องมี:** ปัญหา · ผู้ใช้จริง 3 คน (Gate 1) · MVP 3–5 FR (Gate 2) · การเข้าถึงข้อมูล (Gate 3) · SDLC ที่เลือก + เหตุผล · ขอบเขต in/out · ตัววัดความสำเร็จที่วัดได้ · บทบาทสมาชิก
- **เลือก SDLC ตามความเสี่ยง:** เช่น ถ้าความเสี่ยงหลักคือ "ผู้ใช้จะใช้ได้จริงไหม" → Agile/iterative ทดสอบ prototype กับผู้ใช้ซ้ำ

---

## 4. Phase 2 — Requirements (M2 ส่วน SRS)
**หลัก:** requirement = **สัญญาที่ทดสอบได้** ไม่ใช่ความต้องการลอยๆ

- **FR ต้องทดสอบได้:**
  - ❌ "ระบบควรเตือนผู้ใช้"
  - ✅ "ถ้างานยังไม่เสร็จและครบกำหนดใน 1 วัน ระบบจะส่งการเตือน"
- **เขียนแบบ user story:** `ในฐานะ [บทบาท] ฉันต้องการ [ทำอะไร] เพื่อ [ประโยชน์]` · ทุก FR ระบุว่าแก้ปัญหาข้อไหน
- **MoSCoW:** Must 3–5 ข้อ = MVP · FR ≥ 5 ข้อ
- **NFR ≥ 3 ข้อ ต้องเป็นตัวเลข** (ตาม metric ของ Sommerville: เวลาตอบสนอง, ความพร้อมใช้, เวลาเรียนรู้ ฯลฯ)
  - ❌ "เตือนเร็ว" → ✅ "ภายใน 1 นาทีจากเวลาที่ตั้ง"
  - ❌ "เป็นส่วนตัว" → ✅ "นักศึกษาเห็นเฉพาะงานของตัวเอง"
  - ต้องมี **≥ 1 ข้อด้าน PDPA/ความเป็นส่วนตัว**
  - Usability ก็เป็น NFR ที่มีตัวเลข เช่น "4 ใน 5 คนทำงานหลักได้ใน X วินาที"
- **Acceptance criteria แบบ Given–When–Then** ให้ทุก Must FR ทั้ง **happy path และทางที่ผิด/ขอบ (edge)**
- **INVEST:** Independent · Negotiable · Valuable · Estimable · Small · Testable
- **Requirement ≠ Feature ≠ Backlog:** requirement = ต้องทำงานอย่างไร (ทดสอบได้) · feature = หัวข้อว่าทำอะไร · backlog = ทำอะไรก่อนหลัง
- **SRS 7 ส่วน** (ใช้เทมเพลต Word ของอาจารย์ ห้ามเริ่มจากหน้าว่าง):
  1. Purpose & scope
  2. Stakeholders ≥ 3
  3. FR (+ MoSCoW + G-W-T)
  4. NFR (ตัวเลข)
  5. ชื่อ Use Case
  6. Out-of-scope
  7. AI-use log
  - ส่วนที่เว้นว่าง = ตก
- **Validate:** ถูกระบบไหม · ไม่ขัดกัน ไม่มีช่องโหว่ · สร้างและทดสอบได้จริงไหม
- **Privacy by design:** เก็บน้อยที่สุด · บอกว่าใช้ทำอะไร · ลบได้อย่างปลอดภัย · ไม่ส่งข้อมูลที่ไม่จำเป็นให้ AI
- **Fail safely:** ทุกจุดที่พึ่งบริการภายนอก/AI ต้องมีทางสำรอง (fallback) และให้ผู้ใช้แก้/ยืนยันก่อนบันทึก

---

## 5. Phase 3 — Modeling (UML)
- **Use Case diagram (บังคับ):**
  - เส้น association = actor ↔ use case เท่านั้น
  - `«include»` / `«extend»` = use case ↔ use case เท่านั้น **ห้ามปนกัน** และห้ามต่อ actor ด้วย include
  - include = พฤติกรรมที่ต้องเกิดเสมอ/ใช้ร่วม · extend = เกิดแบบมีเงื่อนไข
  - ตั้งชื่อ use case เป็น**การกระทำ** (กริยา) ไม่ใช่หัวข้อ
  - แยก primary actor กับ system (secondary) actor
- **Class / entity diagram:**
  - คำนาม → กล่อง · ใส่แค่ attribute (method มาตอน design)
  - อ่าน multiplicity ว่า "X หนึ่งตัวมี Y กี่ตัว" ทุกเส้น
  - ค่าที่คำนวณได้ (เช่น "อีกกี่วันครบกำหนด") **ไม่ใช่ field**
- **Activity diagram** = ลำดับ + ทางแยก · **Sequence diagram** = ใครส่งข้อความหาใคร (ใช้ `alt` แสดงทางเลือก)
- **ทุกวงรี ทุกกล่อง ต้องผูกกับ FR จริง** · ใส่ป้าย FR ในไดอะแกรม
- Diagram ≥ 2: Use Case + (class หรือ sequence หรือ state)

---

## 6. Phase 4 — Design (M2 ส่วน Design / M3 design doc)
- **3 ระดับ:** Architecture → Detailed design → UX/UI (Golden Thread เดียวกัน แค่ซูมต่างกัน)
- **ออกแบบสถาปัตยกรรม 4 ขั้น:** อ่าน NFR (quality attributes) → แบ่งส่วนหลัก → เลือก style → วาด component/deployment
- **Style:** Layered (N-tier) · Client-Server · MVC · **เลือกขนาดเล็กที่สุดที่พอ** (monolith ก่อน microservices)
- **High cohesion, low coupling:** 1 module ทำ 1 งาน · module พันกันน้อยที่สุด
- **`architecture.md`:** 3 ชั้น (Presentation / Logic / Data) + data model **tech-agnostic** (entity, fields, ความสัมพันธ์, operations)
  - ❌ ห้ามรั่วเทคโนโลยี (โค้ด Firestore/SDK) · ✅ "entity X มีฟิลด์..."
- **ADR 3 บรรทัด:** Context (FR/NFR ไหนบังคับให้เลือก) · Decision · Consequence + **ทางเลือกที่ปฏิเสธและเหตุผล** (= ประกันตอนสอบปากเปล่า)
- **Traceability table:** FR → operation → entity → screen
- **Coverage:** design ครอบทุก Must/High FR · ไม่มี FR ไร้ที่อยู่ (homeless FR) · ไม่มีส่วนเกิน
  - ใช้ตรวจแทน `/sync-check` ของ starter kit อาจารย์
- **Interface design:** แต่ละส่วนสัญญาอะไรกับส่วนอื่น (input/output ของ operation)

---

## 7. Phase 5 — UX/UI + Prototype
**ขั้นตอน UI 4 ขั้น:** User flow (งานหลัก วาดก่อนทำหน้าจอ) → Wireframe → Design system → Prototype

**`design-system.md`** = tokens (สี, ฟอนต์, ระยะ) + components ที่ใช้ซ้ำ · ทุกหน้าจอใช้ token เท่านั้น

**เช็กลิสต์ UI (M3):**
- Usability เขียนเป็น NFR มีตัวเลข
- 1 หน้าจอ = ปุ่มหลัก 1 อัน · visual hierarchy ชัด
- **Signifiers:** ของที่แตะได้ต้องดูแตะได้ · **feedback** ทุกการกระทำ
- **Constraints:** การกระทำที่ย้อนไม่ได้ต้องยืนยัน · ทำให้กรอกข้อมูลผิดไม่ได้
- **Craft:** สเกลระยะ 4·8·16·24·32 · ฟอนต์ ≤ 2 · สีเน้น 1 สี · contrast ≥ 4.5:1
- C.R.A.P (Contrast, Repetition, Alignment, Proximity) · Gestalt · recognition > recall · Fitts (ปุ่มสำคัญใหญ่/ใกล้) · Hick (ตัวเลือกน้อย)
- **Nielsen 10 heuristics** → heuristic evaluation (โดยทีมอื่น) พร้อมระดับความรุนแรง
- **Accessibility POUR:** Perceivable · Operable · Understandable · Robust
- **ทุกหน้าจอ/ปุ่ม สาวกลับไป FR/NFR ได้** · ไม่มีหน้าจอที่ requirement ไม่ได้ขอ
- Usability test: ผู้ใช้ 5 คน think-aloud · ให้ทำงานจริงก่อน แล้วตอบ **SUS** (10 ข้อ → คะแนน /100)

**หลบ "AI look" (ห้ามใช้ค่า default ทั้งหน้า):**
- gradient ม่วง→ฟ้า · ฟอนต์ default/Inter ไม่ได้เลือก · ทุกอย่างอยู่กลางคอลัมน์เดียว + hero ใหญ่
- การ์ดมน + glassmorphism + เงาทุกชิ้น · emoji แทน icon · ข้อความ generic/lorem ipsum
- ทุกอย่างน้ำหนักเท่ากัน · กริดการ์ด 3 ใบเหมือนกัน
- **Professional pass:** ตรวจหา default → เลือกแอปจริง 1 ตัวเป็น reference (บอก 3 สิ่งที่เขาทำแต่เรายังไม่ทำ) → สั่ง AI ให้หลบ default → เทียบก่อน/หลัง

**Prototype:**
- HTML คลิกได้ **เปิดในเบราว์เซอร์ได้ ไม่ต้องมี server/DB** · ข้อมูลจำลอง
- คลิก happy path ครบ **ทุก Must FR** + **error/empty state** อย่างน้อย 1 ต่อ Must FR
- ทุกหน้าจอระบุ FR ที่ครอบ (เช่น แถบ `Covers: FR-x`)
- README บอกวิธีเปิด

---

## 8. Phase 6 — Construction, Git, Testing
**Construction 5 ข้อ:** ลดความซับซ้อน (อ่านง่าย > ฉลาด) · รองรับการเปลี่ยนแปลง · สร้างให้ตรวจง่าย (testable, ตาม convention, มี log) · reuse · ตาม standard
- ตั้งชื่อให้บอกว่าเก็บอะไร · ฟังก์ชันเล็ก แยก logic ออกจาก UI ให้ทดสอบได้

**Git (ทุกคนต้องทำ):**
- main ถูก protect · **ห้าม commit ตรงเข้า main**
- 1 งาน = 1 branch สั้นๆ → Pull Request → เพื่อน review → merge บ่อยๆ
- commit เล็ก ข้อความบอกว่า "ทำอะไร เพราะอะไร" · **ทุกคน commit งานของตัวเอง**
- conflict เป็นเรื่องปกติ: อ่าน เลือก แล้ว commit

**AI coding loop:** Prompt (FR + กติกา + context file) → Generate → **อ่านทุกบรรทัด** → ทดสอบ → Commit (ต้องอธิบายทุกบรรทัดได้)

**AI ผิดพลาด 5 แบบ (ต้องดักเสมอ):**
| แบบ | วิธีจับ |
|---|---|
| Hallucinated API (เรียกฟังก์ชัน/ไลบรารีที่ไม่มีจริง) | รันจริง + เช็กเอกสารจริง |
| Missing edge cases (พังตอนว่าง/null/ใหญ่มาก) | ทดสอบขอบเขตเอง |
| Over-engineering (เพิ่ม config/layer ที่ไม่มี FR) | ไม่มี FR = ตัด |
| Untrusted dependency (แนะนำ package แปลกๆ) | ตรวจก่อนเพิ่ม (ความเสี่ยง supply chain) |
| Silent wrong logic (รันได้แต่ผิด) | อ่านเทียบกับ acceptance criteria |

**Testing:**
- Verification = สร้างถูกวิธีไหม · Validation = สร้างสิ่งที่ถูกไหม
- **Unit test:** input ที่รู้ → ผลที่คาดหวัง · ทดสอบ 1 ฟังก์ชันแยกเดี่ยว · เร็ว ชี้จุดพังได้
- **ทุก acceptance criterion → test อย่างน้อย 1 ตัว**
- **Equivalence partitioning** (กลุ่มที่ทำงานเหมือนกัน ทดสอบ 1 ค่าต่อกลุ่ม) + **Boundary value analysis** (ที่ขอบ และเลยขอบ: `≤` vs `<`, off-by-one)
- **Test pyramid:** unit เยอะที่ฐาน → integration → system/release → acceptance (ผู้ใช้จริง)
- Test ที่ดี: ชื่อเป็นประโยคบอกสิ่งที่ควรเกิด · 1 เหตุผลที่จะพัง · ไม่ทดสอบแค่ happy path
- AI มักพลาดกรณี: **ว่าง** · **ถูกตัดออก** (เช่น งานที่เสร็จแล้วต้องไม่ถูกเตือน) · **ขอบเขตพอดี**

---

## 9. Process + การใช้ AI
- **4 กิจกรรมหลัก:** Specification → Development (design + construction) → Validation → Evolution
- เลือก process model ตามบริบท: Waterfall / Incremental / Reuse / Agile (Scrum: Product Owner, Scrum Master, Dev Team, Product/Sprint Backlog)
- **Definition of Ready:** ผู้ใช้และคุณค่าชัด · มี acceptance criteria · ข้อมูลพร้อม · เห็นความเสี่ยง · ชิ้นเล็กพอ
- **Definition of Done:** review แล้ว · ผ่าน acceptance criteria · ผ่านเช็ก privacy/security · เอกสารอัปเดต · ผู้เกี่ยวข้องยอมรับ
- **Agentic workflow:**
  1. แบ่ง milestone/checkpoint ชัด
  2. เขียน context file (เช่น `architecture.md`, `CLAUDE.md`) **ก่อน**โค้ด
  3. Loop: Prompt → Generate → Review & Steer (ส่ง error log กลับจนผ่าน)
  4. Deploy: เริ่มจากทางที่ทดสอบได้เร็วที่สุด (localhost/free tier) ก่อน
- **AI-use log:** จดตามจริงทุกครั้ง (วันที่, ใคร, เครื่องมือ, ใช้ทำอะไร, คนตรวจ/แก้อะไร) · ใน SRS §7 และ AI-Use Statement ตอนท้าย

---

## 10. กฎสำหรับ Claude Code (สรุปเป็นคำสั่ง)
1. ก่อนสร้าง/แก้อะไร ถามตัวเองว่า "ผูกกับ FR/NFR ไหน" → ไม่มีคำตอบ = ไม่ทำ แล้วแจ้งทีม
2. ใส่ ID ของ FR/NFR ในทุก screen, diagram, entity/field, operation, test, commit message
3. FR ต้องทดสอบได้ · NFR ต้องเป็นตัวเลข · ทุก Must FR มี G-W-T ทั้ง happy และ edge
4. Data model เขียนแบบ tech-agnostic ใน design doc · ห้ามมีโค้ด DB/SDK
5. ทุกการตัดสินใจสำคัญ → ADR 3 บรรทัด พร้อมทางเลือกที่ปฏิเสธ
6. Prototype: HTML/CSS/JS เปิดด้วยดับเบิลคลิก · ไม่มี server/DB/npm · ใช้ design tokens · ครบทุก Must FR + error/empty state · ติดป้าย FR ทุกหน้าจอ
7. แยก logic ออกจาก UI ให้ทดสอบได้ · ทุก acceptance criterion มี unit test · ทดสอบ empty / excluded / boundary
8. UI: ตาม checklist หัวข้อ 7 · หลบ AI-look · ภาษาของ UI ตามผู้ใช้เป้าหมาย
9. **ห้ามแต่ง** ผลสัมภาษณ์ ผลทดสอบ คำพูดผู้ใช้ หรือแหล่งอ้างอิง → เว้นช่อง `[ทีมกรอก]` แทน
10. ห้ามเขียนส่วน reflection/contribution แทนทีม → เว้นช่องไว้
11. ห้าม push ตรงเข้า main · ห้ามรันคำสั่งที่ทำให้ประวัติหาย (`push --force`) · เสนอ branch + commit message ให้ทีมรันเอง
12. จบงานแต่ละครั้ง: สรุปไฟล์ที่เปลี่ยน + FR ที่ครอบ + สิ่งที่ยังขาด → อัปเดต `HANDOFF.md` และ AI-use log
13. ไม่แน่ใจ requirement หรือเกณฑ์ → อ่านเอกสารใน `docs/course/` ก่อน ถ้ายังไม่ชัด → ถามทีม อย่าเดา

---

## 11. Checklist ก่อนส่งแต่ละ milestone
**M1 Charter**
- [ ] Scorecard ≥ 15/21 · ข้อ 1, 4, 5 ≥ 2
- [ ] Problem Brief ครบ 8 ช่อง
- [ ] ผู้ใช้จริง 3 คน มีชื่อ/บทบาท + ช่องทางติดต่อ
- [ ] MVP 3–5 FR · การเข้าถึงข้อมูล · SDLC + เหตุผล · ตัววัดความสำเร็จ

**M2 SRS + Design**
- [ ] SRS 7 ส่วนไม่มีช่องว่าง · FR ≥ 5 (Must 3–5) · NFR ≥ 3 มีตัวเลข + PDPA · G-W-T happy + edge
- [ ] ทุก FR โยงกลับไปหาปัญหาได้ · ผ่าน INVEST
- [ ] Architecture 3 ชั้นผูก FR · ADR · Diagram ≥ 2 (Use Case + 1) ติดป้าย FR
- [ ] Data model ครบสำหรับ MVP ไม่รั่วเทค · design-system.md · traceability table

**M3 Final**
- [ ] Prototype เปิดในเบราว์เซอร์ได้ · ครบทุก Must FR + error/empty state · ป้าย FR ทุกหน้าจอ
- [ ] Test scenarios + unit tests (ผลจริง) · usability test กับผู้ใช้จริง
- [ ] ตาราง Golden Thread · Final report 2–3 หน้า · Demo slides · AI-Use Statement
- [ ] README บอกวิธีเปิด · ทุกคนมี commit ตามบทบาท

---

## 12. แผนที่เอกสารอาจารย์ (`docs/course/`)
| หัวข้อ | ไฟล์ |
|---|---|
| เลือกปัญหา, Scorecard, TAM, Gate, Charter | `M1-choosing-your-problem.html`, `week02-activity-concept-discovery.html` |
| SRS 7 ส่วน, rubric M2 | `M2-writing-the-srs.html`, `Intro2SE-Week03-StudyMate-SRS-Example.docx` |
| Design doc, ADR, design system, M3 rubric | `M3-designing-the-system.html` |
| Checklist การส่ง, rubric รวม, factor รายคน, ตัวอย่าง report | `M4-final-project.html` |
| SDLC, process, Agile/Scrum, DoR/DoD, case study | `week02-*.html` |
| Requirements (FR/NFR, metric, validation) | `week03-requirements-swebok.html` |
| UML (use case, class, activity) | `week04-modeling-uml.html` |
| Architecture, cohesion/coupling, sequence | `week05-design.html` |
| UI principles, AI-look, professional pass | `week05-ui-design-principles.html`, `ux-ui-hci-primer-standalone.html` |
| Construction, Git, AI coding | `week06-construction.html` |
| Unit testing, EP/BVA, SUS | `week07-unit-testing.html` |
