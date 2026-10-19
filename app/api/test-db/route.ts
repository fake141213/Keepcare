
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany();

    return NextResponse.json({
      success: true,
      message: "เชื่อมต่อ Neon PostgreSQL สำเร็จ",
      categories,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอ่านข้อมูลจากฐานข้อมูลได้",
      },
      { status: 500 }
    );
  }
}
