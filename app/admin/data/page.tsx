export const instant = false;
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Topbar from "@/components/Topbar";

export default async function AdminDataPage() {
  const session = await auth();

  if (!session?.user) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        category: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const role = "ADMIN";

  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(date)
      : "—";

  const formatPrice = (price: { toString(): string } | null) =>
    price === null
      ? "—"
      : Number(price.toString()).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " บาท";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Topbar role={role} />

      <main className="mx-auto max-w-7xl p-6 md:p-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← กลับหน้า Admin Dashboard
          </Link>

          <p className="mt-5 text-sm font-medium text-blue-600">
            KeepCare Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold">จัดการข้อมูล</h1>
          <p className="mt-2 text-slate-600">
            ตรวจสอบข้อมูลสิ่งของและหมวดหมู่ทั้งหมดในระบบ
          </p>
        </div>

        <section className="mb-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">สิ่งของทั้งหมด</p>
            <p className="mt-3 text-3xl font-bold">
              {items.length.toLocaleString("th-TH")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">หมวดหมู่ทั้งหมด</p>
            <p className="mt-3 text-3xl font-bold">
              {categories.length.toLocaleString("th-TH")}
            </p>
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold">รายการสิ่งของ</h2>
            <p className="mt-1 text-sm text-slate-500">
              เรียงตามวันที่แก้ไขล่าสุด
            </p>
          </div>

          {items.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              ยังไม่มีข้อมูลสิ่งของในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">ชื่อสิ่งของ</th>
                    <th className="px-6 py-4 font-medium">ยี่ห้อ / รุ่น</th>
                    <th className="px-6 py-4 font-medium">เจ้าของข้อมูล</th>
                    <th className="px-6 py-4 font-medium">หมวดหมู่</th>
                    <th className="px-6 py-4 font-medium">ราคาซื้อ</th>
                    <th className="px-6 py-4 font-medium">หมดประกัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {[item.brand, item.model].filter(Boolean).join(" / ") ||
                          "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.user.name || "ไม่ระบุชื่อ"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.user.email || "ไม่มีอีเมล"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.category?.name || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatPrice(item.purchasePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(item.warrantyExpiry)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold">หมวดหมู่ทั้งหมด</h2>
            <p className="mt-1 text-sm text-slate-500">
              แสดงจำนวนสิ่งของและผู้สร้างหมวดหมู่
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              ยังไม่มีหมวดหมู่ในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">ชื่อหมวดหมู่</th>
                    <th className="px-6 py-4 font-medium">คำอธิบาย</th>
                    <th className="px-6 py-4 font-medium">ผู้สร้าง</th>
                    <th className="px-6 py-4 font-medium">จำนวนสิ่งของ</th>
                    <th className="px-6 py-4 font-medium">วันที่สร้าง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">
                        {category.name}
                      </td>
                      <td className="max-w-xs px-6 py-4 text-slate-600">
                        {category.description || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div>{category.user?.name || "หมวดหมู่ระบบ"}</div>
                        {category.user?.email && (
                          <div className="mt-1 text-xs text-slate-500">
                            {category.user.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {category._count.items.toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(category.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
