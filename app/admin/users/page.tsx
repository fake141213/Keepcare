
export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Topbar from "@/components/Topbar";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const role = session.user.role === "ADMIN" ? "ADMIN" : "USER";

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Topbar role={role} />

      <main className="mx-auto max-w-7xl p-6 md:p-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← กลับหน้า Admin Dashboard
          </Link>

          <p className="mt-5 text-sm font-medium text-blue-600">
            KeepCare Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            จัดการผู้ใช้
          </h1>

          <p className="mt-2 text-slate-600">
            ตรวจสอบบัญชีและบทบาทของผู้ใช้ในระบบ
          </p>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              ผู้ใช้ทั้งหมด
            </p>
            <p className="mt-2 text-3xl font-bold">
              {users.length.toLocaleString("th-TH")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              ผู้ดูแลระบบ
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {users
                .filter((user) => user.role === "ADMIN")
                .length.toLocaleString("th-TH")}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">
              รายชื่อบัญชีผู้ใช้
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              เรียงจากบัญชีที่สร้างล่าสุด
            </p>
          </div>

          {users.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              ยังไม่มีบัญชีผู้ใช้ในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      ผู้ใช้
                    </th>
                    <th className="px-5 py-4 font-medium">
                      อีเมล
                    </th>
                    <th className="px-5 py-4 font-medium">
                      บทบาท
                    </th>
                    <th className="px-5 py-4 font-medium">
                      วันที่สมัคร
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                              {(user.name || user.email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <span className="font-medium text-slate-900">
                            {user.name || "ไม่ระบุชื่อ"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {user.email || "ไม่ระบุอีเมล"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            user.role === "ADMIN"
                              ? "inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                              : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                          }
                        >
                          {user.role === "ADMIN"
                            ? "ADMIN"
                            : "USER"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Intl.DateTimeFormat("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(user.createdAt)}
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
