
import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string({
      error: "ชื่อหมวดหมู่ต้องเป็นข้อความ",
    })
    .trim()
    .min(1, "กรุณาระบุชื่อหมวดหมู่")
    .max(50, "ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร"),

  description: z
    .string()
    .trim()
    .max(1000, "คำอธิบายต้องไม่เกิน 1,000 ตัวอักษร")
    .optional()
    .or(z.literal("")),
});
