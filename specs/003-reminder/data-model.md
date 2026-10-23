# Data Model: เตือนเมื่อถึงมื้อยา (003-reminder)
<!-- เจ้าของ: C (Takkan Khanlui) · ร่างโดย A ตามที่ทีมตัดสิน 23/10/69 · ตาม architecture.md §6, §8 -->

feature นี้**ไม่เขียนข้อมูลใดลง store** · อ่านอย่างเดียว · ไม่มี entity ใหม่ · ERD ไม่เปลี่ยน

## อ่าน (ของ feature อื่น)

| ชุดข้อมูล | ฟิลด์ที่ใช้ | เจ้าของ | ใช้ทำอะไร |
|---|---|---|---|
| `devices` | `seniorId` | FR-01 | ตรวจว่าเป็นผู้สูงอายุที่จับคู่แล้ว (NFR-04 · §8.5) |
| `pairing` | `pairingId`, `seniorId` | FR-01 | `isSeniorPaired` · กรองยา/บันทึกยืนยันของคู่นี้ |
| `medications` | `medicationId`, `pairingId`, `name`, `tabletsPerDose`, `warnings`, `contraindications` + ฟิลด์เวลา (ผ่าน `reminderTimes`) | FR-02 | สร้างมื้อ (BR-06) · แสดงยาในมื้อ (BR-09) |
| `mealTimes` | `pairingId`, `breakfast`, `lunch`, `dinner`, `bedtime` | FR-02 | ส่งให้ `reminderTimes` · ใช้เฉพาะเมื่อ `pairingId` ตรง |
| `confirmations` | `pairingId`, `sessionKey` | FR-04 | มื้อที่ยืนยันแล้วไม่เตือน (✓3) · ยังไม่มี = `[]` |

## ค่าที่คำนวณ (ไม่เก็บ)

**DoseSession** — ผลของ `sessionsOf`
| ฟิลด์ | ค่า | กฎ |
|---|---|---|
| `sessionKey` | `"YYYY-MM-DD@HH:MM"` (วันของมื้อ + T) | §8.1 · ไม่ซ้ำในวันเดียวกัน |
| `at` | ms ของ T ในวันนั้น (เวลาท้องถิ่น) | ADR-02 |
| `medicationIds` | `medicationId[]` ของยาที่ `reminderTimes` มีเวลา T · เรียงตามลำดับในรายการยา | BR-06 รวมมื้อ |

**DueSession** — ผลของ `dueSessions` = DoseSession + 
| ฟิลด์ | ค่า | กฎ |
|---|---|---|
| `round` | `1` / `2` / `3` (กำลังเตือน) หรือ `null` (ช่วงยืนยันช้า) | BR-08 · R-2 |
| `late` | `false` กำลังเตือน · `true` เลย T+15 แต่ยังอยู่ในช่วงยืนยันช้า | R6b · clarify 23/10 |

## สถานะของมื้อที่ feature นี้เกี่ยว (`architecture.md` §5)

```
รอถึงเวลา ──T──▶ กำลังเตือน รอบ 1 ──T+5──▶ รอบ 2 ──T+10──▶ รอบ 3 ──T+15──▶ ยังไม่ยืนยัน (แสดงใน S2 ขณะมีมื้ออื่นเตือน จนถึง lateUntil)
                         └─ มีบันทึกยืนยัน (FR-04) ─▶ ออกจากหน้าเตือน
```

## ค่าในหน่วยความจำของหน้า S2 (ไม่เก็บ)

- `played` — ชุดคีย์เสียงที่เล่นแล้ว `at#round` (R-6) · หายเมื่อปิด/รีเฟรชหน้า (รีเฟรชในรอบเดิม = เล่นอีก 1 ครั้ง ยอมรับได้: ผู้ใช้เพิ่งแตะหน้า)
- สถานะ "แตะแล้ว" ของเสียง (R-7)
