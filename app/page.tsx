
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const instant = false;

function LoadingUser() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          KeepCare
        </h1>
        <p className="mt-3 animate-pulse text-gray-500">
          กำลังตรวจสอบสถานะเข้าสู่ระบบ...
        </p>
      </section>
    </main>
  );
}

async function UserSection() {
  await connection();

  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            KeepCare
          </h1>
          <p className="mt-3 text-gray-600">
            ระบบจัดการสิ่งของและการรับประกัน
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            ยินดีต้อนรับ
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            เข้าสู่ระบบเพื่อจัดการสิ่งของและตรวจสอบวันหมดประกันของคุณ
          </p>

          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: "/dashboard",
              });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-100"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.1 13.22l7.98 6.19C12.68 13.72 17.88 9.5 24 9.5z"
                  transform="translate(0 4)"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.84 46.98 24.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.88 28.59A14.4 14.4 0 0 1 10.1 24c0-1.59.27-3.13.76-4.59L2.88 13.22A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.58 10.78l8.3-6.19z"
                  transform="translate(1 0)"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.12 0-11.32-4.22-13.18-9.91l-7.98 6.19C6.27 43.32 14.38 48 24 48z"
                  transform="translate(0 -2)"
                />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          KeepCare — ดูแลสิ่งของของคุณได้ในที่เดียว
        </p>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingUser />}>
      <UserSection />
    </Suspense>
  );
}
