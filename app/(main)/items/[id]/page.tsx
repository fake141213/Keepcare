
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  category: Category | null;
};

type Repair = {
  id: string;
  description: string;
  repairDate: string;
  cost: number | string | null;
  notes: string | null;
};

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
};

function formatDate(value: string | null) {
  if (!value) return "ไม่ได้ระบุ";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "ไม่ทราบวันที่";

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(value: number | string | null) {
  if (value === null || value === "") return "ไม่ได้ระบุ";

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "ไม่ได้ระบุ";

  return `${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} บาท`;
}

function getWarrantyStatus(expiry: string | null) {
  if (!expiry) {
    return {
      label: "ไม่ได้ระบุวันหมดประกัน",
      className: "bg-gray-100 text-gray-700",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = new Date(expiry);
  expiryDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiryDate.getTime())) {
    return {
      label: "ไม่ทราบสถานะประกัน",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (expiryDate < today) {
    return {
      label: "หมดประกันแล้ว",
      className: "bg-red-100 text-red-700",
    };
  }

  const daysLeft = Math.ceil(
    (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 30) {
    return {
      label: `ใกล้หมดประกัน (${daysLeft} วัน)`,
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "ยังอยู่ในประกัน",
    className: "bg-green-100 text-green-700",
  };
}

export default function ItemDetailsPage() {
  const params = useParams<{ id: string }>();
  const itemId = params.id;

  const [item, setItem] = useState<Item | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [itemResponse, repairsResponse] = await Promise.all([
        fetch(`/api/items/${itemId}`, { cache: "no-store" }),
        fetch(`/api/items/${itemId}/repairs`, {
          cache: "no-store",
        }),
      ]);

      const itemResult =
        (await itemResponse.json()) as ApiResult<Item>;

      if (!itemResponse.ok || !itemResult.success) {
        throw new Error(
          itemResult.message || "ไม่สามารถโหลดรายละเอียดสิ่งของได้"
        );
      }

      const repairsResult =
        (await repairsResponse.json()) as ApiResult<Repair[]>;

      if (!repairsResponse.ok || !repairsResult.success) {
        throw new Error(
          repairsResult.message || "ไม่สามารถโหลดประวัติการซ่อมได้"
        );
      }

      setItem(itemResult.data);
      setRepairs(repairsResult.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        <p className="text-sm text-gray-500">
          กำลังโหลดรายละเอียด...
        </p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-xl font-bold text-gray-900">
          ไม่สามารถแสดงรายละเอียดได้
        </h1>

        <p role="alert" className="mt-2 text-sm text-red-600">
          {error || "ไม่พบข้อมูลสิ่งของ"}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadDetails()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ลองอีกครั้ง
          </button>

          <Link
            href="/items"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            กลับไป My Items
          </Link>
        </div>
      </div>
    );
  }

  const warranty = getWarrantyStatus(item.warrantyExpiry);

  const details = [
    { label: "ยี่ห้อ", value: item.brand || "ไม่ได้ระบุ" },
    { label: "รุ่น", value: item.model || "ไม่ได้ระบุ" },
    {
      label: "หมายเลขซีเรียล",
      value: item.serialNumber || "ไม่ได้ระบุ",
    },
    {
      label: "หมวดหมู่",
      value: item.category?.name || "ไม่ได้ระบุ",
    },
    {
      label: "ราคาที่ซื้อ",
      value: formatMoney(item.purchasePrice),
    },
    {
      label: "วันที่ซื้อ",
      value: formatDate(item.purchaseDate),
    },
    {
      label: "วันหมดประกัน",
      value: formatDate(item.warrantyExpiry),
    },
    {
      label: "วันที่เพิ่มข้อมูล",
      value: formatDate(item.createdAt),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/items"
          className="text-sm text-blue-700 hover:underline"
        >
          ← กลับไป My Items
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {item.name}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              รายละเอียดสิ่งของและประวัติการซ่อม
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium ${warranty.className}`}
            >
              {warranty.label}
            </span>
          </div>

          <Link
            href={`/items/${item.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            แก้ไขสิ่งของ
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-semibold text-gray-900">
          ข้อมูลสิ่งของ
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.label}>
              <p className="text-sm text-gray-500">{detail.label}</p>
              <p className="mt-1 break-words font-medium text-gray-900">
                {detail.value}
              </p>
            </div>
          ))}
        </div>

        {item.notes && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-medium text-gray-500">
              หมายเหตุ
            </h3>

            <p className="mt-2 whitespace-pre-wrap break-words text-gray-800">
              {item.notes}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              ประวัติการซ่อม
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              ทั้งหมด {repairs.length} รายการ
            </p>
          </div>

          <Link
            href={`/items/${item.id}/repairs/new`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + เพิ่มประวัติการซ่อม
          </Link>
        </div>

        {repairs.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
            <p className="font-medium text-gray-700">
              ยังไม่มีประวัติการซ่อม
            </p>

            <p className="mt-1 text-sm text-gray-500">
              เมื่อมีการซ่อม สามารถเพิ่มรายละเอียดไว้ที่นี่ได้
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {repairs.map((repair) => (
              <article
                key={repair.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {repair.description}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      วันที่ซ่อม: {formatDate(repair.repairDate)}
                    </p>
                  </div>

                  <p className="font-semibold text-gray-900">
                    {formatMoney(repair.cost)}
                  </p>
                </div>

                {repair.notes && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                    {repair.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
