
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";

async function ProfileContent() {
  await connection();

  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = session.user;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          ข้อมูลบัญชีที่ใช้เข้าสู่ระบบ KeepCare
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-6 sm:flex-row">
          {user.image ? (
            <Image
              src={user.image}
              alt="Profile picture"
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              {(user.name ?? user.email ?? "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900">
              {user.name ?? "ไม่ระบุชื่อ"}
            </h2>

            <p className="mt-1 break-all text-sm text-gray-500">
              {user.email ?? "ไม่ระบุอีเมล"}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-gray-100">
          <div className="py-4">
            <dt className="text-sm text-gray-500">
              ชื่อผู้ใช้
            </dt>

            <dd className="mt-1 font-medium text-gray-900">
              {user.name ?? "ไม่ระบุชื่อ"}
            </dd>
          </div>

          <div className="py-4">
            <dt className="text-sm text-gray-500">
              อีเมล
            </dt>

            <dd className="mt-1 break-all font-medium text-gray-900">
              {user.email ?? "ไม่ระบุอีเมล"}
            </dd>
          </div>

          <div className="py-4">
            <dt className="text-sm text-gray-500">
              User ID
            </dt>

            <dd className="mt-1 break-all font-mono text-sm text-gray-700">
              {user.id ?? "-"}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            กลับ Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4">
      <div className="h-8 w-40 rounded bg-gray-200" />
      <div className="h-64 rounded-2xl bg-gray-100" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}
