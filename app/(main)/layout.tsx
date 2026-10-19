
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import Topbar from "@/components/Topbar";

export const instant = false;

async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // ปรับ Role จาก Session ให้เหลือค่าที่ระบบรองรับ แล้วส่งให้ Topbar
  // เพื่อแสดงเมนู Admin เฉพาะผู้ดูแล; API ยังคงตรวจสิทธิ์แยกอีกชั้น
  const role = session.user.role === "ADMIN" ? "ADMIN" : "USER";

  return (
    <>
      <Topbar role={role} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}

function LoadingLayout() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <p className="animate-pulse text-gray-500">
        กำลังตรวจสอบสถานะเข้าสู่ระบบ...
      </p>
    </main>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingLayout />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
