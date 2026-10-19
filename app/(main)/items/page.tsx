
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

type Item = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchasePrice: number | string | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  notes: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data: T;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(value: Item["purchasePrice"]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getWarrantyDaysLeft(value: string | null) {
  if (!value) return null;

  const expiry = new Date(value);

  if (Number.isNaN(expiry.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) / 86400000,
  );
}

function getWarrantyStatus(value: string | null) {
  const daysLeft = getWarrantyDaysLeft(value);

  if (daysLeft === null) {
    return {
      label: "ไม่ระบุวันหมดประกัน",
      className: "bg-gray-100 text-gray-600",
    };
  }

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

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const isExpiringFilter = filter === "expiring";

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (categoryId) {
        params.set("categoryId", categoryId);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/items${query ? `?${query}` : ""}`,
        { cache: "no-store" },
      );

      const result =
        (await response.json()) as ApiResult<Item[]>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "ไม่สามารถโหลดรายการสิ่งของได้",
        );
      }

      setItems(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      );
    } finally {
      setLoading(false);
    }
  }, [search, categoryId]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories", {
        cache: "no-store",
      });

      const result =
        (await response.json()) as ApiResult<Category[]>;

      if (response.ok && result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error("Load categories error:", err);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadItems]);

  async function handleDelete(item: Item) {
    const confirmed = window.confirm(
      `ต้องการลบ "${item.name}" ใช่หรือไม่?\nการลบนี้ไม่สามารถย้อนกลับได้`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setNotice("");
      setError("");

      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "ลบสิ่งของไม่สำเร็จ");
      }

      setNotice(result.message || "ลบสิ่งของสำเร็จ");
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ลบสิ่งของไม่สำเร็จ",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // กรองรายการใกล้หมดประกัน โดยใช้เกณฑ์เดียวกับป้ายสถานะ
  const visibleItems = isExpiringFilter
    ? items.filter((item) => {
        const daysLeft = getWarrantyDaysLeft(item.warrantyExpiry);
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
      })
    : items;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            My Items
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isExpiringFilter
              ? "รายการสิ่งของที่กำลังจะหมดประกันภายใน 30 วัน"
              : "จัดการสิ่งของและตรวจสอบข้อมูลการรับประกันของมึง"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isExpiringFilter && (
            <Link
              href="/items"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ดูสิ่งของทั้งหมด
            </Link>
          )}

          <Link
            href="/items/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + เพิ่มสิ่งของ
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">
            {isExpiringFilter ? "รายการใกล้หมดประกัน" : "รายการที่พบ"}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {loading ? "—" : visibleItems.length.toLocaleString("th-TH")}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">มีข้อมูลรับประกัน</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {loading
              ? "—"
              : visibleItems
                  .filter((item) => item.warrantyExpiry)
                  .length.toLocaleString("th-TH")}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">หมวดหมู่ที่ใช้ได้</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {categories.length.toLocaleString("th-TH")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div>
            <label
              htmlFor="item-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ค้นหาสิ่งของ
            </label>

            <input
              id="item-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ชื่อ แบรนด์ รุ่น หรือ Serial Number"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="category-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              กรองตามหมวดหมู่
            </label>

            <select
              id="category-filter"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">ทุกหมวดหมู่</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(search || categoryId) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryId("");
            }}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ล้างตัวกรอง
          </button>
        )}
      </section>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadItems()}
            className="mt-2 text-sm font-semibold text-red-700 underline"
          >
            โหลดรายการอีกครั้ง
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">
            {isExpiringFilter ? "รายการใกล้หมดประกัน" : "รายการสิ่งของ"}
          </h2>

          <span className="text-sm text-gray-500">
            {loading ? "กำลังโหลด..." : `${visibleItems.length} รายการ`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-20 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              📦
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              {isExpiringFilter
                ? "ไม่มีสิ่งของที่ใกล้หมดประกัน"
                : search || categoryId
                  ? "ไม่พบสิ่งของที่ตรงกับเงื่อนไข"
                  : "มึงยังไม่มีสิ่งของในระบบ"}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {isExpiringFilter
                ? "รายการที่เหลือวันหมดประกัน 0–30 วันจะแสดงที่นี่"
                : search || categoryId
                  ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"
                  : "เพิ่มสิ่งของชิ้นแรกเพื่อเริ่มจัดการข้อมูล"}
            </p>

            {!isExpiringFilter && !search && !categoryId && (
              <Link
                href="/items/new"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + เพิ่มสิ่งของ
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleItems.map((item) => {
              const status = getWarrantyStatus(item.warrantyExpiry);

              return (
                <article
                  key={item.id}
                  className="p-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">
                          {item.name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {[item.brand, item.model]
                          .filter(Boolean)
                          .join(" · ") || "ไม่ระบุแบรนด์หรือรุ่น"}
                      </p>

                      <div className="mt-3 grid gap-x-6 gap-y-2 text-sm text-gray-500 sm:grid-cols-2 xl:grid-cols-3">
                        <p>
                          หมวดหมู่:{" "}
                          {categories.find(
                            (category) => category.id === item.categoryId,
                          )?.name ?? "ไม่มีหมวดหมู่"}
                        </p>

                        <p>ราคาซื้อ: {formatPrice(item.purchasePrice)}</p>

                        <p>วันที่ซื้อ: {formatDate(item.purchaseDate)}</p>

                        <p>
                          หมดประกัน: {formatDate(item.warrantyExpiry)}
                        </p>

                        {item.serialNumber && (
                          <p className="break-all">
                            Serial: {item.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/items/${item.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        ดูรายละเอียด
                      </Link>

                      <Link
                        href={`/items/${item.id}/edit`}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        แก้ไข
                      </Link>

                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
