
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/category";

// GET: ดึงหมวดหมู่ส่วนกลางและหมวดหมู่ส่วนตัวของผู้ใช้
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนดูหมวดหมู่",
        },
        { status: 401 }
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: session.user.id },
        ],
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = categories.map((category) => ({
      ...category,
      itemCount: category._count.items,
      _count: undefined,
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูลหมวดหมู่ได้",
      },
      { status: 500 }
    );
  }
}

// POST: Admin สร้างหมวดหมู่ส่วนกลาง
// User สร้างหมวดหมู่ส่วนตัว
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนเพิ่มหมวดหมู่",
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบ JSON ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const result = categorySchema.safeParse(body);

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

    // อ่าน Role จากฐานข้อมูล ไม่รับ Role จาก Request
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบบัญชีผู้ใช้",
        },
        { status: 401 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: result.data.name,
        description: result.data.description?.trim() || null,
        userId: user.role === "ADMIN" ? null : session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          user.role === "ADMIN"
            ? "เพิ่มหมวดหมู่ส่วนกลางสำเร็จ"
            : "เพิ่มหมวดหมู่ส่วนตัวสำเร็จ",
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ชื่อหมวดหมู่นี้มีอยู่แล้ว",
        },
        { status: 409 }
      );
    }

    console.error("POST /api/categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถเพิ่มหมวดหมู่ได้",
      },
      { status: 500 }
    );
  }
}
