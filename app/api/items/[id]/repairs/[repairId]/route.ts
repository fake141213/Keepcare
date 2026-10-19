
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { repairRecordSchema } from "@/lib/validations/repair-record";

type RepairRouteContext = {
  params: Promise<{ id: string; repairId: string }>;
};

// Schema สำหรับแก้ไขเฉพาะฟิลด์ที่ส่งมา
const repairUpdateSchema = z
  .object({
    repairDate: repairRecordSchema.shape.repairDate.optional(),
    description: repairRecordSchema.shape.description.optional(),
    cost: repairRecordSchema.shape.cost,
    notes: z
      .string()
      .trim()
      .max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.repairDate !== undefined ||
      data.description !== undefined ||
      data.cost !== undefined ||
      data.notes !== undefined,
    {
      message: "กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งรายการ",
    }
  )
  .refine(
    (data) => {
      if (data.repairDate === undefined) return true;

      const date = new Date(data.repairDate);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getTime() <= Date.now()
      );
    },
    {
      message: "วันที่ซ่อมไม่ถูกต้องหรือเป็นวันที่ในอนาคต",
      path: ["repairDate"],
    }
  );

// PUT: แก้ไขประวัติการซ่อม
export async function PUT(
  request: Request,
  { params }: RepairRouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id, repairId } = await params;

    // ตรวจสอบว่าอุปกรณ์เป็นของผู้ใช้คนนี้
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสิ่งของนี้" },
        { status: 404 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "รูปแบบ JSON ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const result = repairUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // สร้างข้อมูลเฉพาะฟิลด์ที่ผู้ใช้ส่งมา
    const updateData: Prisma.RepairRecordUpdateManyMutationInput = {};

    if (data.repairDate !== undefined) {
      updateData.repairDate = new Date(data.repairDate);
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.cost !== undefined) {
      updateData.cost = data.cost;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.trim() || null;
    }

    // แก้ไขเฉพาะประวัติที่อยู่ภายใต้อุปกรณ์ของผู้ใช้
    const updated = await prisma.repairRecord.updateMany({
      where: {
        id: repairId,
        itemId: item.id,
      },
      data: updateData,
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบประวัติการซ่อมนี้" },
        { status: 404 }
      );
    }

    const updatedRepair = await prisma.repairRecord.findFirst({
      where: {
        id: repairId,
        itemId: item.id,
      },
    });

    if (!updatedRepair) {
      return NextResponse.json(
        { success: false, message: "ไม่พบประวัติการซ่อมนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขประวัติการซ่อมสำเร็จ",
      data: updatedRepair,
    });
  } catch (error) {
    console.error("PUT repair error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถแก้ไขประวัติการซ่อมได้",
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบประวัติการซ่อม
export async function DELETE(
  _request: Request,
  { params }: RepairRouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id, repairId } = await params;

    // ตรวจสอบว่าอุปกรณ์เป็นของผู้ใช้คนนี้
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสิ่งของนี้" },
        { status: 404 }
      );
    }

    // ลบเฉพาะประวัติการซ่อมของอุปกรณ์นี้
    const deleted = await prisma.repairRecord.deleteMany({
      where: {
        id: repairId,
        itemId: item.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบประวัติการซ่อมนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบประวัติการซ่อมสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE repair error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถลบประวัติการซ่อมได้",
      },
      { status: 500 }
    );
  }
}
