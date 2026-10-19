
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemSchema } from "@/lib/validations/item";

// GET: ดึง ค้นหา และกรองสิ่งของของผู้ใช้ที่ล็อกอิน
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนดูรายการสิ่งของ",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId")?.trim() || "";

    const where: Prisma.ItemWhereInput = {
      userId: session.user.id,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
              { model: { contains: search, mode: "insensitive" } },
              {
                serialNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        brand: true,
        model: true,
        serialNumber: true,
        purchasePrice: true,
        purchaseDate: true,
        warrantyExpiry: true,
        notes: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
      filters: {
        search,
        categoryId: categoryId || null,
      },
    });
  } catch (error) {
    console.error("GET /api/items error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงรายการสิ่งของได้",
      },
      { status: 500 }
    );
  }
}

// POST: สร้างสิ่งของใหม่
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนเพิ่มสิ่งของ",
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

    const result = itemSchema.safeParse(body);

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
    const now = new Date();

    const purchaseDate = data.purchaseDate
      ? new Date(data.purchaseDate)
      : null;

    const warrantyExpiry = data.warrantyExpiry
      ? new Date(data.warrantyExpiry)
      : null;

    if (
      purchaseDate &&
      purchaseDate.getTime() > now.getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "วันที่ซื้อไม่ควรเป็นวันที่ในอนาคต",
        },
        { status: 400 }
      );
    }

    if (
      purchaseDate &&
      warrantyExpiry &&
      warrantyExpiry < purchaseDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "วันหมดประกันต้องไม่อยู่ก่อนวันที่ซื้อ",
        },
        { status: 400 }
      );
    }

    // หมวดหมู่ต้องเป็นหมวดหมู่ส่วนกลางหรือของผู้ใช้คนนี้
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [
            { userId: null },
            { userId: session.user.id },
          ],
        },
        select: { id: true },
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "ไม่พบหมวดหมู่ หรือคุณไม่มีสิทธิ์ใช้หมวดหมู่นี้",
          },
          { status: 400 }
        );
      }
    }

    const item = await prisma.item.create({
      data: {
        name: data.name,
        brand: data.brand ?? null,
        model: data.model ?? null,
        serialNumber: data.serialNumber ?? null,
        purchasePrice: data.purchasePrice,
        purchaseDate,
        warrantyExpiry,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        brand: true,
        model: true,
        serialNumber: true,
        purchasePrice: true,
        purchaseDate: true,
        warrantyExpiry: true,
        notes: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มสิ่งของสำเร็จ",
        data: item,
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
          message: "ข้อมูลบางรายการซ้ำกับข้อมูลเดิม",
        },
        { status: 409 }
      );
    }

    console.error("POST /api/items error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถเพิ่มสิ่งของได้",
      },
      { status: 500 }
    );
  }
}
