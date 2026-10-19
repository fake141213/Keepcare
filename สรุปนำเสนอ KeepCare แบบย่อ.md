# KeepCare — สรุปนำเสนอแบบย่อ

## ภาพรวม

KeepCare เป็นเว็บสำหรับจัดการสิ่งของส่วนตัว ข้อมูลการรับประกัน หมวดหมู่ และประวัติการซ่อม ผู้ใช้เข้าสู่ระบบด้วย Google และข้อมูลสิ่งของจะถูกจำกัดตามบัญชีผู้ใช้

## โครงสร้างและไฟล์สำคัญ

```text
app/
├─ page.tsx                         หน้าเข้าสู่ระบบ Google
├─ (main)/
│  ├─ layout.tsx                    ตรวจ session สำหรับหน้าหลัก
│  ├─ items/page.tsx                รายการ ค้นหา กรอง และลบสิ่งของ
│  ├─ items/new/page.tsx            เพิ่มสิ่งของ
│  ├─ items/[id]/page.tsx           รายละเอียดและประวัติซ่อม
│  ├─ items/[id]/edit/page.tsx      แก้ไขสิ่งของ
│  └─ categories/page.tsx           จัดการหมวดหมู่
├─ admin/                            หน้าสำหรับ ADMIN
└─ api/
   ├─ items/route.ts                 อ่านรายการและเพิ่มสิ่งของ
   ├─ items/[id]/route.ts            อ่าน แก้ไข และลบสิ่งของ
   ├─ items/[id]/repairs/route.ts    อ่านและเพิ่มประวัติซ่อม
   ├─ items/[id]/repairs/[repairId]/route.ts
   │                                  แก้ไขและลบประวัติซ่อม
   ├─ categories/route.ts            อ่านและเพิ่มหมวดหมู่
   └─ categories/[id]/route.ts       แก้ไขและลบหมวดหมู่

auth.ts                              ตั้งค่า NextAuth, Google และ session
lib/validations/                     กติกาตรวจข้อมูลด้วย Zod
lib/prisma.ts                        เชื่อม Prisma กับ PostgreSQL
prisma/schema.prisma                 โครงสร้างและความสัมพันธ์ข้อมูล
```

## คุณสมบัติที่ยืนยันจากโค้ด

- **CRUD:** สิ่งของ หมวดหมู่ และประวัติซ่อมมี API อ่าน/เพิ่ม/แก้ไข/ลบตามตารางด้านล่าง
- **Validation:** `lib/validations/item.ts` ตรวจชื่อ ราคา และวันที่; `category.ts` ตรวจชื่อ/คำอธิบาย; `repair-record.ts` ตรวจรายละเอียด ค่าใช้จ่าย และวันที่ซ่อม API ใช้ `safeParse` และตอบข้อผิดพลาดโดยไม่บันทึกข้อมูลเมื่อไม่ผ่าน
- **Authentication:** `auth.ts` ใช้ Google ผ่าน NextAuth และกำหนดข้อมูล `id`/`role` ใน session; `app/(main)/layout.tsx` ส่งผู้ไม่มี session กลับหน้าแรก
- **Authorization:** API จำกัดสิ่งของด้วย `userId` จาก session; หน้า `/admin` ตรวจ role เป็น `ADMIN`; API หมวดหมู่ตรวจเจ้าของ หรือกำหนดให้ Admin เท่านั้นจัดการหมวดหมู่ส่วนกลาง
- **Search + Filter:** หน้า `app/(main)/items/page.tsx` ส่ง `search` และ `categoryId` ไป `GET /api/items`; API ค้นในชื่อ แบรนด์ รุ่น และ Serial Number พร้อมจำกัดผลตามผู้ใช้ ส่วนตัวกรอง `filter=expiring` กรองฝั่งหน้าเว็บหลังโหลดข้อมูลแล้ว

## API หลัก

| Method | Endpoint | หน้าที่ |
|---|---|---|
| GET, POST | `/api/items` | อ่านรายการ / เพิ่มสิ่งของ |
| GET, PUT, DELETE | `/api/items/[id]` | อ่านรายละเอียด / แก้ไข / ลบสิ่งของ |
| GET, POST | `/api/categories` | อ่าน / เพิ่มหมวดหมู่ |
| PUT, DELETE | `/api/categories/[id]` | แก้ไข / ลบหมวดหมู่ |
| GET, POST | `/api/items/[id]/repairs` | อ่าน / เพิ่มประวัติซ่อม |
| PUT, DELETE | `/api/items/[id]/repairs/[repairId]` | แก้ไข / ลบประวัติซ่อม |

ใน API route handlers ที่ตรวจสอบ **ไม่พบ `PATCH`**; หน้าผู้ดูแลอ่านข้อมูลผ่าน Server Component โดยตรง ไม่พบ API แยกสำหรับจัดการผู้ใช้

## ลำดับสาธิตประมาณ 5 นาที

1. **เข้าสู่ระบบ:** เปิดหน้าแรกแล้วใช้ Google Login — อธิบายว่า NextAuth สร้าง session
2. **CRUD:** เปิด `/items` เพิ่มรายการ เปิดรายละเอียด แก้ไข แล้วลบรายการทดสอบ — ชี้หน้าแบบฟอร์มและ `app/api/items/...`
3. **Validation:** ลองส่งชื่อว่าง ราคาติดลบ หรือวันหมดประกันก่อนวันซื้อ — ชี้ `lib/validations/item.ts` และผลตอบกลับจาก API
4. **Search + Filter:** ค้นชื่อหรือแบรนด์ เลือกหมวดหมู่ — อธิบาย query string `search`/`categoryId`; ตัวกรองประกันใกล้หมดทำในหน้าเว็บ
5. **Authorization และ API:** อธิบายว่า API ใช้ `userId` จาก session; ถ้ามีบัญชีทดสอบ USER/ADMIN ให้ลองเปิดหน้า `/admin` และชี้เงื่อนไข role
6. **ประวัติซ่อม:** จากรายละเอียดสิ่งของเพิ่มประวัติ และชี้ API ที่รองรับ GET/POST/PUT/DELETE

### สคริปต์สรุปสั้น

> “KeepCare ช่วยจัดการสิ่งของส่วนตัวและประวัติการซ่อม ผู้ใช้เข้าสู่ระบบด้วย Google ข้อมูลจะถูกจำกัดตามเจ้าของ มีการตรวจสอบข้อมูลทั้งก่อนส่งและที่ API และสามารถค้นหาด้วยชื่อ แบรนด์ รุ่น หรือ Serial Number พร้อมกรองตามหมวดหมู่ได้”

**หมายเหตุ:** ค่าใช้จ่ายในระบบเป็นค่าซ่อม ไม่ใช่ระบบบันทึกรายจ่ายทั่วไป และจากโค้ดที่ตรวจสอบไม่พบโมดูลลูกค้า
