
export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Topbar from "@/components/Topbar";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const role = session.user.role === "ADMIN" ? "ADMIN" : "USER";

  const [userCount, itemCount, categoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.category.count(),
  ]);

  const stats = [
    { label: "ผู้ใช้ทั้งหมด", value: userCount },
    { label: "สิ่งของทั้งหมด", value: itemCount },
    { label: "หมวดหมู่ทั้งหมด", value: categoryCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Topbar role={role} />

      <main className="mx-auto max-w-7xl p-6 md:p-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            KeepCare Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            ภาพรวมและการจัดการระบบ KeepCare
          </p>
        </header>

        {/* System statistics */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>

              <p className="mt-3 text-3xl font-bold">
                {stat.value.toLocaleString("th-TH")}
              </p>
            </div>
          ))}
        </section>

        {/* Admin management menu */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            เมนูจัดการระบบ
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            เลือกส่วนที่ต้องการจัดการ
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* User management */}
            <Link
              href="/admin/users"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">
                  จัดการผู้ใช้
                </h3>

                <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                  →
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                ตรวจสอบบัญชีผู้ใช้ อีเมล และบทบาทของผู้ใช้ในระบบ
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                เข้าสู่การจัดการผู้ใช้
              </p>
            </Link>

            {/* Data management */}
            <Link
              href="/admin/data"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">
                  จัดการข้อมูล
                </h3>

                <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                  →
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                ตรวจสอบข้อมูลสิ่งของและหมวดหมู่ที่บันทึกในระบบ
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                เข้าสู่การจัดการข้อมูล
              </p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
