
import { z } from "zod";

// ฟิลด์ข้อความที่ไม่จำเป็นต้องกรอก
const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().trim().max(maxLength).nullable().optional()
  );

// Schema พื้นฐาน ใช้ร่วมกันทั้งการเพิ่มและแก้ไข
const itemBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อสิ่งของ")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),

  brand: optionalText(100),
  model: optionalText(100),
  serialNumber: optionalText(100),

  purchasePrice: z
    .number()
    .finite("ราคาต้องเป็นตัวเลข")
    .min(0, "ราคาต้องไม่ติดลบ")
    .nullable()
    .optional(),

  purchaseDate: z.iso.datetime().nullable().optional(),
  warrantyExpiry: z.iso.datetime().nullable().optional(),

  notes: optionalText(1000),

  categoryId: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().nullable().optional()
  ),
});

// ตรวจสอบความถูกต้องของวันที่
const validateItemDates = <
  T extends {
    purchaseDate?: string | null;
    warrantyExpiry?: string | null;
  },
>(
  data: T,
  ctx: z.RefinementCtx
) => {
  if (data.purchaseDate) {
    const purchaseDate = new Date(data.purchaseDate);

    if (
      Number.isNaN(purchaseDate.getTime()) ||
      purchaseDate.getTime() > Date.now()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "วันที่ซื้อไม่ถูกต้องหรือเป็นวันที่ในอนาคต",
        path: ["purchaseDate"],
      });
    }
  }

  if (data.warrantyExpiry) {
    const warrantyExpiry = new Date(data.warrantyExpiry);

    if (Number.isNaN(warrantyExpiry.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "วันหมดประกันไม่ถูกต้อง",
        path: ["warrantyExpiry"],
      });
    }
  }

  if (
    data.purchaseDate &&
    data.warrantyExpiry &&
    new Date(data.warrantyExpiry).getTime() <
      new Date(data.purchaseDate).getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      message: "วันหมดประกันต้องไม่อยู่ก่อนวันที่ซื้อ",
      path: ["warrantyExpiry"],
    });
  }
};

// POST: เพิ่มสิ่งของ โดยต้องมีชื่อ
export const itemSchema = itemBaseSchema.superRefine(
  validateItemDates
);

// PUT: แก้เฉพาะฟิลด์ที่ส่งมา
export const itemUpdateSchema = itemBaseSchema
  .partial()
  .superRefine(validateItemDates);
