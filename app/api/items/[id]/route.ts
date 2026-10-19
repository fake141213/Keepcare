
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemUpdateSchema } from "@/lib/validations/item";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: ดึงรายละเอียดสิ่งของของผู้ใช้ที่ล็อกอิน
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนดูรายละเอียดสิ่งของ",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ ID ของสิ่งของ",
        },
        { status: 400 }
      );
    }

    const item = await prisma.item.findFirst({
      where: {
        id,
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
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสิ่งของ หรือคุณไม่มีสิทธิ์ดูข้อมูล",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("GET /api/items/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงรายละเอียดสิ่งของได้",
      },
      { status: 500 }
    );
  }
}

// PUT: แก้ไขสิ่งของของผู้ใช้ที่ล็อกอิน
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนแก้ไขสิ่งของ",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ ID ของสิ่งของ",
        },
        { status: 400 }
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

    const result = itemUpdateSchema.safeParse(body);

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

    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        purchaseDate: true,
        warrantyExpiry: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสิ่งของ หรือคุณไม่มีสิทธิ์แก้ไข",
        },
        { status: 404 }
      );
    }

    const purchaseDate =
      data.purchaseDate !== undefined
        ? data.purchaseDate === null
          ? null
          : new Date(data.purchaseDate)
        : existingItem.purchaseDate;

    const warrantyExpiry =
      data.warrantyExpiry !== undefined
        ? data.warrantyExpiry === null
          ? null
          : new Date(data.warrantyExpiry)
        : existingItem.warrantyExpiry;

    if (purchaseDate && purchaseDate.getTime() > Date.now()) {
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

    const updateData: Prisma.ItemUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.brand !== undefined) {
      updateData.brand = data.brand;
    }

    if (data.model !== undefined) {
      updateData.model = data.model;
    }

    if (data.serialNumber !== undefined) {
      updateData.serialNumber = data.serialNumber;
    }

    if (data.purchasePrice !== undefined) {
      updateData.purchasePrice = data.purchasePrice;
    }

    if (data.purchaseDate !== undefined) {
      updateData.purchaseDate = purchaseDate;
    }

    if (data.warrantyExpiry !== undefined) {
      updateData.warrantyExpiry = warrantyExpiry;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.categoryId !== undefined) {
      if (data.categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        const category = await prisma.category.findFirst({
          where: {
            id: data.categoryId,
            OR: [
              { userId: null },
              { userId: session.user.id },
            ],
          },
          select: {
            id: true,
          },
        });

        if (!category) {
          return NextResponse.json(
            {
              success: false,
              message:
                "ไม่พบหมวดหมู่ หรือคุณไม่มีสิทธิ์ใช้หมวดหมู่นี้",
            },
            { status: 400 }
          );
        }

        updateData.category = {
          connect: { id: category.id },
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลที่ต้องการแก้ไข",
        },
        { status: 400 }
      );
    }

    const item = await prisma.item.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: updateData,
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
      message: "แก้ไขสิ่งของสำเร็จ",
      data: item,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสิ่งของ หรือคุณไม่มีสิทธิ์แก้ไข",
        },
        { status: 404 }
      );
    }

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

    console.error("PUT /api/items/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถแก้ไขสิ่งของได้",
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบเฉพาะสิ่งของของผู้ใช้ที่ล็อกอิน
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนลบสิ่งของ",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ ID ของสิ่งของ",
        },
        { status: 400 }
      );
    }

    const result = await prisma.item.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสิ่งของ หรือคุณไม่มีสิทธิ์ลบ",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบสิ่งของสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถลบสิ่งของได้",
      },
      { status: 500 }
    );
  }
}
