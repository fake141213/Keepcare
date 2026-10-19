
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/category";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ตรวจสอบ Session และอ่าน Role จากฐานข้อมูล
async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  return user;
}

// ตรวจสอบสิทธิ์:
// - หมวดหมู่ส่วนกลาง: Admin เท่านั้น
// - หมวดหมู่ส่วนตัว: เจ้าของเท่านั้น
function canManageCategory(
  category: { userId: string | null },
  user: { id: string; role: string }
) {
  if (category.userId === null) {
    return user.role === "ADMIN";
  }

  return category.userId === user.id;
}

// PUT: แก้ไขชื่อและคำอธิบายหมวดหมู่
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบ",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบหมวดหมู่ที่ต้องการแก้ไข",
        },
        { status: 404 }
      );
    }

    if (!canManageCategory(existing, user)) {
      return NextResponse.json(
        {
          success: false,
          message: "คุณไม่มีสิทธิ์แก้ไขหมวดหมู่นี้",
        },
        { status: 403 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: result.data.name,
        description: result.data.description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขหมวดหมู่สำเร็จ",
      data: category,
    });
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบหมวดหมู่ที่ต้องการแก้ไข",
        },
        { status: 404 }
      );
    }

    console.error("PUT /api/categories/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถแก้ไขหมวดหมู่ได้",
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบหมวดหมู่
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบ",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบหมวดหมู่ที่ต้องการลบ",
        },
        { status: 404 }
      );
    }

    if (!canManageCategory(existing, user)) {
      return NextResponse.json(
        {
          success: false,
          message: "คุณไม่มีสิทธิ์ลบหมวดหมู่นี้",
        },
        { status: 403 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "ลบหมวดหมู่สำเร็จ",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบหมวดหมู่ที่ต้องการลบ",
        },
        { status: 404 }
      );
    }

    console.error("DELETE /api/categories/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถลบหมวดหมู่ได้",
      },
      { status: 500 }
    );
  }
}
