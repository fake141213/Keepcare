
import { z } from "zod";

// หมายเหตุเป็นข้อมูลที่ไม่จำเป็นต้องกรอก
const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().trim().max(maxLength).nullable().optional()
  );

export const repairRecordSchema = z
  .object({
    repairDate: z.iso.datetime().optional(),

    description: z
      .string()
      .trim()
      .min(1, "กรุณาระบุรายละเอียดการซ่อม")
      .max(1000, "รายละเอียดการซ่อมต้องไม่เกิน 1000 ตัวอักษร"),

    cost: z
      .number()
      .finite("ค่าซ่อมต้องเป็นตัวเลข")
      .min(0, "ค่าซ่อมต้องไม่ติดลบ")
      .nullable()
      .optional(),

    notes: optionalText(1000),
  })
  .refine(
    (data) => {
      if (!data.repairDate) return true;

      const repairDate = new Date(data.repairDate);

      return (
        !Number.isNaN(repairDate.getTime()) &&
        repairDate.getTime() <= Date.now()
      );
    },
    {
      message: "วันที่ซ่อมไม่ถูกต้องหรือเป็นวันที่ในอนาคต",
      path: ["repairDate"],
    }
  );
