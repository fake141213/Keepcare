
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
  name: string;
};

type DashboardItem = {
  id: string;
  name: string;
  brand: string | null;
  model?: string | null;
  createdAt?: string;
  warrantyExpiry: string | null;
  category: Category | null;
};

type CategorySummary = {
  categoryId: string | null;
  categoryName: string;
  count: number;
};

type DashboardData = {
  summary: {
    totalItems: number;
    itemsWithWarranty: number;
    expiredWarrantyItems: number;
    nearExpiryItems: number;
  };
  itemsByCategory: CategorySummary[];
  nearExpiryItems: DashboardItem[];
  recentItems: DashboardItem[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getDateKey(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);

  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const dateKey = getDateKey(value);

  if (!dateKey) return "-";

  const [year, month, day] = dateKey.split("-").map(Number);

  // สร้างวันที่สำหรับแสดงผลโดยไม่ให้เขตเวลาทำให้วันคลาดเคลื่อน
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getWarrantyStatus(value: string | null) {
  if (!value) {
    return {
      label: "ไม่มีข้อมูล",
      className: "bg-gray-100 text-gray-600",
    };
  }

  const expiryKey = getDateKey(value);
  const todayKey = getDateKey(new Date());

  if (!expiryKey || !todayKey) {
    return {
      label: "ไม่มีข้อมูล",
      className: "bg-gray-100 text-gray-600",
    };
  }

  const daysLeft = getDayNumber(expiryKey) - getDayNumber(todayKey);

  if (daysLeft < 0) {
    return {
      label: "หมดประกันแล้ว",
      className: "bg-red-100 text-red-700",
    };
  }

  if (daysLeft <= 30) {
    return {
      label: "ใกล้หมดประกัน",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "ยังอยู่ในประกัน",
    className: "bg-green-100 text-green-700",
  };
}

function SummaryCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: number;
  description: string;
  color: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className={`mt-3 text-3xl font-bold ${color}`}>
        {value.toLocaleString("th-TH")}
      </p>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ?? "ไม่สามารถโหลดข้อมูล Dashboard ได้"
          );
        }

        if (!cancelled) {
          setData(result.data as DashboardData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>

        <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <h1 className="text-xl font-bold text-gray-900">
          โหลดข้อมูลไม่สำเร็จ
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error || "ไม่พบข้อมูล Dashboard"}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ลองอีกครั้ง
        </button>
      </section>
    );
  }

  const { summary, itemsByCategory, nearExpiryItems, recentItems } = data;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            ภาพรวมสิ่งของและการรับประกันของมึง
          </p>
        </div>

        <Link
          href="/items/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + เพิ่มสิ่งของ
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="สิ่งของทั้งหมด"
          value={summary.totalItems}
          description="จำนวนสิ่งของที่บันทึกไว้"
          color="text-blue-700"
        />

        <SummaryCard
          title="มีการรับประกัน"
          value={summary.itemsWithWarranty}
          description="สิ่งของที่ยังไม่หมดประกัน"
          color="text-green-700"
        />

        <SummaryCard
          title="ใกล้หมดประกัน"
          value={summary.nearExpiryItems}
          description="รายการที่ควรตรวจสอบ"
          color="text-amber-600"
        />

        <SummaryCard
          title="หมดประกันแล้ว"
          value={summary.expiredWarrantyItems}
          description="รายการที่หมดระยะรับประกัน"
          color="text-red-600"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              ใกล้หมดประกัน
            </h2>

            <Link
              href="/items?filter=expiring"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด
            </Link>
          </div>

          {nearExpiryItems.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-8 text-center">
              <p className="font-medium text-gray-700">
                ยังไม่มีรายการใกล้หมดประกัน
              </p>

              <p className="mt-1 text-sm text-gray-500">
                เมื่อมีรายการที่ใกล้หมดประกัน จะแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-gray-100">
              {nearExpiryItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex items-start justify-between gap-3 py-4 first:pt-2 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {item.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.brand || "ไม่ระบุแบรนด์"}
                      {item.model ? ` · ${item.model}` : ""}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      หมดประกัน: {formatDate(item.warrantyExpiry)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    ใกล้หมด
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-gray-900">
            สิ่งของแยกตามหมวดหมู่
          </h2>

          {itemsByCategory.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-8 text-center">
              <p className="font-medium text-gray-700">
                ยังไม่มีข้อมูลหมวดหมู่
              </p>

              <p className="mt-1 text-sm text-gray-500">
                เพิ่มสิ่งของเพื่อดูสรุปในส่วนนี้
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {itemsByCategory.map((category) => {
                const percentage =
                  summary.totalItems > 0
                    ? Math.min(
                        100,
                        (category.count / summary.totalItems) * 100
                      )
                    : 0;

                return (
                  <div key={category.categoryId ?? category.categoryName}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-700">
                        {category.categoryName}
                      </span>

                      <span className="text-gray-500">
                        {category.count} รายการ
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              สิ่งของที่เพิ่มล่าสุด
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              รายการสิ่งของที่บันทึกเข้าระบบล่าสุด
            </p>
          </div>

          <Link
            href="/items"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ดูสิ่งของทั้งหมด →
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="border-t border-gray-100 px-6 py-12 text-center">
            <p className="font-semibold text-gray-700">
              ยังไม่มีสิ่งของในระบบ
            </p>

            <p className="mt-2 text-sm text-gray-500">
              เริ่มต้นด้วยการเพิ่มสิ่งของชิ้นแรกของมึง
            </p>

            <Link
              href="/items/new"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              เพิ่มสิ่งของ
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-y border-gray-100 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">ชื่อสิ่งของ</th>
                  <th className="px-6 py-3 font-medium">หมวดหมู่</th>
                  <th className="px-6 py-3 font-medium">วันหมดประกัน</th>
                  <th className="px-6 py-3 font-medium">สถานะ</th>
                  <th className="px-6 py-3 font-medium">รายละเอียด</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentItems.map((item) => {
                  const status = getWarrantyStatus(item.warrantyExpiry);

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>

                        <p className="mt-1 text-gray-500">
                          {item.brand || "ไม่ระบุแบรนด์"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.category?.name ?? "ไม่มีหมวดหมู่"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(item.warrantyExpiry)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/items/${item.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          ดูรายละเอียด
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
