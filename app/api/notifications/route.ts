
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // กำหนดช่วงวันสำหรับตรวจสอบประกัน
    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const expiryLimit = new Date(today);
    expiryLimit.setDate(expiryLimit.getDate() + 30);
    expiryLimit.setHours(23, 59, 59, 999);

    const [expiredItems, expiringItems] = await Promise.all([
      // สิ่งของที่ประกันหมดก่อนวันนี้
      prisma.item.findMany({
        where: {
          userId,
          warrantyExpiry: {
            lt: today,
          },
        },
        select: {
          id: true,
          name: true,
          brand: true,
          warrantyExpiry: true,
        },
        orderBy: [
          { warrantyExpiry: "desc" },
          { id: "asc" },
        ],
      }),

      // สิ่งของที่ประกันหมดตั้งแต่วันนี้ถึงสิ้นวันในอีก 30 วัน
      prisma.item.findMany({
        where: {
          userId,
          warrantyExpiry: {
            gte: today,
            lte: expiryLimit,
          },
        },
        select: {
          id: true,
          name: true,
          brand: true,
          warrantyExpiry: true,
        },
        orderBy: [
          { warrantyExpiry: "asc" },
          { id: "asc" },
        ],
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          expired: expiredItems.length,
          expiringSoon: expiringItems.length,
          total: expiredItems.length + expiringItems.length,
        },
        notifications: [
          ...expiredItems.map((item) => ({
            ...item,
            status: "expired" as const,
            message: "ประกันหมดอายุแล้ว",
          })),
          ...expiringItems.map((item) => ({
            ...item,
            status: "expiring_soon" as const,
            message: "ประกันใกล้หมดอายุ",
          })),
        ],
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูลการแจ้งเตือนได้",
      },
      { status: 500 }
    );
  }
}
