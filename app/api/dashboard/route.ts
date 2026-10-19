
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TIME_ZONE = "Asia/Bangkok";
const DAY_MS = 24 * 60 * 60 * 1000;

function getThailandDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

// ข้อมูลวันที่จากฟอร์มถูกเก็บเป็น Date ที่เวลา 00:00 UTC
// จึงใช้ขอบเขต UTC เพื่อเปรียบเทียบวันปฏิทินที่บันทึกไว้
function dateKeyToUtcDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบ",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ใช้วันที่ปัจจุบันตามประเทศไทย
    const todayKey = getThailandDateKey(new Date());
    const tomorrowKey = addDaysToDateKey(todayKey, 1);
    const afterThirtyDaysKey = addDaysToDateKey(todayKey, 31);

    // ใช้ช่วงเวลาแบบ [เริ่มต้น, สิ้นสุด)
    // เพื่อให้ครอบคลุมทุกเวลาของวันโดยไม่ต้องกำหนด 23:59:59.999
    const today = dateKeyToUtcDate(todayKey);
    const tomorrow = dateKeyToUtcDate(tomorrowKey);
    const afterThirtyDays = dateKeyToUtcDate(afterThirtyDaysKey);

    const [
      totalItems,
      itemsWithWarranty,
      expiredWarrantyItems,
      nearExpiryItems,
      categoryGroups,
      recentItems,
    ] = await Promise.all([
      // สิ่งของทั้งหมดของผู้ใช้
      prisma.item.count({
        where: { userId },
      }),

      // มีวันหมดประกันตั้งแต่วันนี้เป็นต้นไป
      prisma.item.count({
        where: {
          userId,
          warrantyExpiry: {
            gte: today,
          },
        },
      }),

      // หมดประกันก่อนวันนี้
      prisma.item.count({
        where: {
          userId,
          warrantyExpiry: {
            lt: today,
          },
        },
      }),

      // หมดประกันตั้งแต่วันนี้จนถึงภายใน 30 วัน
      prisma.item.findMany({
        where: {
          userId,
          warrantyExpiry: {
            gte: today,
            lt: afterThirtyDays,
          },
        },
        select: {
          id: true,
          name: true,
          brand: true,
          model: true,
          warrantyExpiry: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { warrantyExpiry: "asc" },
          { id: "asc" },
        ],
      }),

      // จำนวนสิ่งของแยกตามหมวดหมู่
      prisma.item.groupBy({
        by: ["categoryId"],
        where: { userId },
        _count: {
          _all: true,
        },
      }),

      // สิ่งของที่เพิ่มล่าสุด 5 รายการ
      prisma.item.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          brand: true,
          createdAt: true,
          warrantyExpiry: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        take: 5,
      }),
    ]);

    // แปลงรหัสหมวดหมู่เป็นชื่อ
    const categoryIds = categoryGroups
      .map((group) => group.categoryId)
      .filter((id): id is string => id !== null);

    const categories = categoryIds.length
      ? await prisma.category.findMany({
          where: {
            id: { in: categoryIds },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const categoryMap = new Map(
      categories.map((category) => [
        category.id,
        category.name,
      ])
    );

    const itemsByCategory = categoryGroups.map((group) => ({
      categoryId: group.categoryId,
      categoryName: group.categoryId
        ? categoryMap.get(group.categoryId) ?? "ไม่ทราบหมวดหมู่"
        : "ไม่มีหมวดหมู่",
      count: group._count._all,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalItems,
          itemsWithWarranty,
          expiredWarrantyItems,
          nearExpiryItems: nearExpiryItems.length,
        },
        itemsByCategory,
        nearExpiryItems,
        recentItems,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูล Dashboard ได้",
      },
      { status: 500 }
    );
  }
}
