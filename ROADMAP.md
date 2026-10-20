# ROADMAP — MedMind v2 (ทำใหม่ทั้ง repo)

ใช้กับ Claude Code ใน VS Code · ทุกขั้น: AI ร่าง → คนอ่าน/แก้ → commit ผ่าน branch + PR ของ**เจ้าของบทบาท**
ช่อง `[ทีมกรอก]` = ข้อมูลจริงที่ AI ห้ามเดา

---

## ขั้น 0 · ตั้ง repo (PM · ทำครั้งเดียว)

1. GitHub → New repository (เช่น `MedMind-v2`) · ติ๊ก Add README · เพิ่มสมาชิกเป็น collaborator
2. Settings → Branches → Add rule `main`: Require a pull request before merging · Require approvals 1
3. VS Code → Clone repo · เปิด Terminal (PowerShell) ที่โฟลเดอร์ repo
4. ติดตั้ง uv (ครั้งแรกในเครื่อง):
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
5. ติดตั้ง Spec Kit ใน repo (Windows ใช้ script `ps`):
   ```powershell
   uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude --script ps
   ```
6. คัดไฟล์จากชุดนี้ลง repo:
   - `SE-COURSE-PRINCIPLES.md`, `CLAUDE.md`, `ROADMAP.md`, `LESSONS-FROM-V1.md` → root
   - `evidence/` → root
   - `.specify/memory/constitution.md` → ทับไฟล์ template ที่ `specify init` สร้าง
   - เอกสารอาจารย์ (M1–M4, week02–07, primer, StudyMate .docx) → `docs/course/`
7. สร้าง `.gitignore` (อย่างน้อย `.DS_Store`, `Thumbs.db`, `node_modules/`, `*.log`)
8. Branch `setup/repo` → commit → PR → เพื่อน review → merge
9. เปิด Claude ใน VS Code แล้วสั่งตรวจ:
   > อ่าน CLAUDE.md, SE-COURSE-PRINCIPLES.md และ constitution แล้วสรุปว่าเข้าใจกติกาอะไรบ้าง และ repo ยังขาดอะไร

---

## ขั้น 1 · M1 Charter (PM) → `docs/01-charter/charter.md`

v1 ขาด: Scorecard, TAM, Problem Brief, Litmus test, Gate 1–3, ชื่อ/ติดต่อผู้ใช้จริง

Prompt:
> ตาม SE-COURSE-PRINCIPLES.md หัวข้อ 3 และ docs/course/M1-*.html ร่าง charter.md จาก evidence/interviews-2569-09-04.md
> ให้มี: problem statement 4 ส่วน · หลักฐาน 2 ชั้น (ชั้น A เว้น [ทีมกรอก]) · 5 Whys · Litmus 5 ข้อ ·
> Scorecard 7 ข้อพร้อมเหตุผลทีละข้อ · TAM แบบ napkin (ตัวเลขที่ไม่มีแหล่ง = [ทีมกรอก]) · Problem Brief 8 ช่อง ·
> MVP 3–5 FR · การเข้าถึงข้อมูล · SDLC + เหตุผลจากความเสี่ยง · in/out scope · ตัววัดความสำเร็จที่วัดได้ ·
> บทบาทสมาชิก [ทีมกรอก] · ห้ามแต่งคำพูดผู้ใช้

เสร็จเมื่อ: Scorecard ≥ 15/21 และข้อ 1, 4, 5 ≥ 2 · Problem Brief ครบ 8 ช่อง · ผู้ใช้จริง 3 คนมีชื่อ/บทบาท/ช่องทางติดต่อ

---

## ขั้น 2 · M2 SRS (Requirements) → `docs/02-requirements/spec.md`, `backlog.md`

ใช้เทมเพลต Word ของอาจารย์เป็นโครง (7 ส่วน) · ห้ามเริ่มจากหน้าว่าง

Prompt:
> ตาม SE-COURSE-PRINCIPLES.md หัวข้อ 4 และ docs/course/M2-*.html + StudyMate example เขียน spec.md 7 ส่วน
> จาก charter.md · FR ≥ 5 (Must 3–5) เป็น user story + MoSCoW + ระบุปัญหาที่แก้ · Business Rules เป็นตาราง ·
> AC แบบ Given–When–Then ทั้ง happy และ edge ทุก Must FR · NFR ≥ 3 เป็นตัวเลข มี PDPA ≥ 1 ข้อ ·
> stakeholders ≥ 3 · use case names · out of scope · AI-use log · ตาราง INVEST · Golden Thread

ตรวจ: `/speckit-analyze` ใช้ไม่ได้กับ SRS โดยตรง → สั่ง Claude ตรวจตาม checklist M2 ในหัวข้อ 11

เสร็จเมื่อ: SRS 7 ส่วนไม่มีช่องว่าง · ทุก FR โยงกลับปัญหา · ผ่าน INVEST

---

## ขั้น 3 · M2 Design → `docs/03-design/`

ลำดับ: user-flow.md + wireframe → architecture.md → design-system.md

Prompt (architecture):
> ตาม SE-COURSE-PRINCIPLES.md หัวข้อ 5–6 และ M3-designing-the-system.html เขียน architecture.md:
> 3 ชั้นผูก FR · ADR (Context/Decision/Consequence + ทางเลือกที่ปฏิเสธ) · Use Case diagram (บังคับ) +
> sequence + state + ERD แบบ tech-agnostic ติดป้าย FR ทุกกล่อง · ตาราง FR → operation → entity → screen ·
> coverage ไม่มี homeless FR ไม่มีส่วนเกิน · Mermaid ทุก diagram

Prompt (design system):
> เขียน design-system.md: tokens (สี ฟอนต์ ระยะสเกล 4·8·16·24·32 เงา มุม) · components ที่ใช้ซ้ำพร้อม state ·
> screen map หน้าจอ ↔ FR · error/empty state ต่อ Must FR · contrast ทุกคู่สี ≥ 4.5:1 · หลบ AI-look

เสร็จเมื่อ: checklist M2 Design ในหัวข้อ 11 ผ่าน

---

## ขั้น 4 · Prototype + Unit test (Spec Kit) → `prototype/`, `specs/`

1 Must FR = 1 feature ของ Spec Kit · แบ่งเจ้าของตามบทบาท · ทำ FR ตามลำดับ SDLC ที่เลือกใน Charter

```text
/speckit-specify  FR-03 แจ้งเตือนเมื่อถึงมื้อยา — อ้าง AC ใน docs/02-requirements/spec.md ห้ามตั้ง requirement ใหม่
/speckit-clarify
/speckit-plan     HTML/CSS/JS ไม่มี server/npm · กฎใน prototype/src/logic.js · test ด้วย node --test
/speckit-tasks
/speckit-analyze
/speckit-implement
```

กติกา:
- test ก่อนหรือพร้อมกฎ: ทุก AC (✓/✗) มี test ≥ 1 ตัว · ครอบ empty / excluded / boundary
- ทุกหน้าจอมีป้าย `Covers: FR-x` · ใช้ token เท่านั้น
- ห้ามเพิ่มฟีเจอร์ที่ไม่มี FR (v1 พลาดเรื่องความถี่ — ดู LESSONS)
- ก่อน merge: `node --test prototype/tests` ผ่าน · คลิก happy + error/empty ของ FR นั้นในเบราว์เซอร์ · ไม่มี error ใน console

เสร็จเมื่อ: ครบทุก Must FR + error/empty state · test ผ่านทั้งหมด (ผลจริง)

---

## ขั้น 5 · Validation → `docs/04-test/`

- Test scenarios ตาม AC พร้อมผลจริง
- Heuristic evaluation (Nielsen 10) โดยทีมอื่น พร้อมระดับความรุนแรง
- Usability test ผู้ใช้จริง 5 คน think-aloud + SUS → วัด NFR usability
- ผลที่ยังไม่ได้วัด เขียนว่า "ยังไม่ได้วัด" พร้อมเหตุผล

---

## ขั้น 6 · ส่งงาน → `docs/05-report/`, `docs/06-presentation/`, README

- Final report 2–3 หน้า reuse M1–M2 + ตาราง Golden Thread (ทุกช่องมีของจริง)
- AI-Use Statement จาก AI log · reflection/contribution ให้สมาชิกเขียนเอง
- Demo slides: Problem → Solution → Golden Thread → Live demo → Testing → AI reflection
- README: วิธีเปิด prototype · วิธีรัน test · สถานะจริง

ตรวจก่อนส่ง: checklist M3 ในหัวข้อ 11 ของ SE-COURSE-PRINCIPLES.md

---

## ทุกครั้งที่ใช้ Claude
- เริ่ม: "อ่าน CLAUDE.md และ HANDOFF.md ก่อน"
- จบ: "อัปเดต HANDOFF.md และเพิ่มแถว AI log ใน spec.md (ช่องทีมแก้อะไร เว้นให้ฉันกรอก)"
- ก่อน commit: อ่าน diff ทุกบรรทัด · commit message มีรหัส FR/NFR
