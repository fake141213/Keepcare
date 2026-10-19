
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { repairRecordSchema } from "@/lib/validations/repair-record";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: ดูประวัติการซ่อมของสิ่งของ
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ตรวจสอบว่าสิ่งของเป็นของผู้ใช้คนนี้
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

    const repairs = await prisma.repairRecord.findMany({
      where: { itemId: item.id },
      orderBy: [
        { repairDate: "desc" },
        { id: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: repairs,
      total: repairs.length,
    });
  } catch (error) {
    console.error("GET repairs error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงประวัติการซ่อมได้",
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มประวัติการซ่อม
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ตรวจสอบความเป็นเจ้าของสิ่งของ
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

    const result = repairRecordSchema.safeParse(body);

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

    // ตรวจสอบและแปลงวันที่ก่อนบันทึก
    const repairDate = data.repairDate
      ? new Date(data.repairDate)
      : new Date();

    if (Number.isNaN(repairDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "วันที่ซ่อมไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (repairDate.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "วันที่ซ่อมไม่ควรเป็นวันที่ในอนาคต",
        },
        { status: 400 }
      );
    }

    const repair = await prisma.repairRecord.create({
      data: {
        itemId: item.id,
        description: data.description,
        repairDate,
        cost: data.cost ?? null,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มประวัติการซ่อมสำเร็จ",
        data: repair,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST repairs error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถเพิ่มประวัติการซ่อมได้",
      },
      { status: 500 }
    );
  }
}
