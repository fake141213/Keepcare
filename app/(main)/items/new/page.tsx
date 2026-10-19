
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Category = {
  id: string;
  name: string;
};

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export default function NewItemPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
    {}
  );

  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    serialNumber: "",
    purchasePrice: "",
    purchaseDate: "",
    warrantyExpiry: "",
    categoryId: "",
    notes: "",
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories", {
          cache: "no-store",
        });
        const result =
          (await response.json()) as ApiResult<Category[]>;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "ไม่สามารถโหลดหมวดหมู่ได้"
          );
        }

        setCategories(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการโหลดหมวดหมู่"
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    void loadCategories();
  }, []);

  function handleChange(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!form.name.trim()) {
      setFieldErrors({ name: "กรุณาระบุชื่อสิ่งของ" });
      return;
    }

    if (
      form.purchasePrice.trim() !== "" &&
      (!Number.isFinite(Number(form.purchasePrice)) ||
        Number(form.purchasePrice) < 0)
    ) {
      setFieldErrors({
        purchasePrice: "ราคาต้องเป็นตัวเลขและไม่ติดลบ",
      });
      return;
    }

    if (
      form.purchaseDate &&
      form.purchaseDate > new Date().toISOString().slice(0, 10)
    ) {
      setFieldErrors({
        purchaseDate: "วันที่ซื้อต้องไม่เป็นวันในอนาคต",
      });
      return;
    }

    if (
      form.purchaseDate &&
      form.warrantyExpiry &&
      form.warrantyExpiry < form.purchaseDate
    ) {
      setFieldErrors({
        warrantyExpiry: "วันหมดประกันต้องไม่ก่อนวันที่ซื้อ",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      serialNumber: form.serialNumber.trim() || null,
      purchasePrice:
        form.purchasePrice.trim() === ""
          ? null
          : Number(form.purchasePrice),
      purchaseDate: form.purchaseDate
        ? new Date(`${form.purchaseDate}T00:00:00.000Z`).toISOString()
        : null,
      warrantyExpiry: form.warrantyExpiry
        ? new Date(
            `${form.warrantyExpiry}T00:00:00.000Z`
          ).toISOString()
        : null,
      categoryId: form.categoryId || null,
      notes: form.notes.trim() || null,
    };

    setSaving(true);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result =
        (await response.json()) as ApiResult<{ id: string }>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "ไม่สามารถบันทึกสิ่งของได้"
        );
      }

      router.push("/items");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  function fieldError(field: string) {
    return fieldErrors[field] ? (
      <p className="mt-1 text-sm text-red-600">
        {fieldErrors[field]}
      </p>
    ) : null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/items"
          className="text-sm text-blue-700 hover:underline"
        >
          ← กลับไป My Items
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          เพิ่มสิ่งของ
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          กรอกข้อมูลสิ่งของและรายละเอียดการรับประกัน
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            ข้อมูลสิ่งของ
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                ชื่อสิ่งของ <span className="text-red-600">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="เช่น โน้ตบุ๊ก, โทรศัพท์มือถือ"
                className={inputClass}
              />
              {fieldError("name")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="brand"
                  className="text-sm font-medium text-gray-700"
                >
                  ยี่ห้อ
                </label>
                <input
                  id="brand"
                  maxLength={100}
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  placeholder="เช่น ASUS, Apple"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="text-sm font-medium text-gray-700"
                >
                  รุ่น
                </label>
                <input
                  id="model"
                  maxLength={100}
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder="ระบุรุ่นของสิ่งของ"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="serialNumber"
                className="text-sm font-medium text-gray-700"
              >
                หมายเลขซีเรียล (Serial Number)
              </label>
              <input
                id="serialNumber"
                maxLength={100}
                value={form.serialNumber}
                onChange={(e) =>
                  handleChange("serialNumber", e.target.value)
                }
                placeholder="หมายเลขประจำเครื่อง"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="text-sm font-medium text-gray-700"
              >
                หมวดหมู่
              </label>
              <select
                id="categoryId"
                value={form.categoryId}
                onChange={(e) =>
                  handleChange("categoryId", e.target.value)
                }
                disabled={loadingCategories}
                className={inputClass}
              >
                <option value="">
                  {loadingCategories
                    ? "กำลังโหลดหมวดหมู่..."
                    : "ไม่ระบุหมวดหมู่"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            ราคาและการรับประกัน
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="purchasePrice"
                className="text-sm font-medium text-gray-700"
              >
                ราคาที่ซื้อ (บาท)
              </label>
              <input
                id="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) =>
                  handleChange("purchasePrice", e.target.value)
                }
                placeholder="เช่น 25900"
                className={inputClass}
              />
              {fieldError("purchasePrice")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="purchaseDate"
                  className="text-sm font-medium text-gray-700"
                >
                  วันที่ซื้อ
                </label>
                <input
                  id="purchaseDate"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={form.purchaseDate}
                  onChange={(e) =>
                    handleChange("purchaseDate", e.target.value)
                  }
                  className={inputClass}
                />
                {fieldError("purchaseDate")}
              </div>

              <div>
                <label
                  htmlFor="warrantyExpiry"
                  className="text-sm font-medium text-gray-700"
                >
                  วันหมดประกัน
                </label>
                <input
                  id="warrantyExpiry"
                  type="date"
                  min={form.purchaseDate || undefined}
                  value={form.warrantyExpiry}
                  onChange={(e) =>
                    handleChange("warrantyExpiry", e.target.value)
                  }
                  className={inputClass}
                />
                {fieldError("warrantyExpiry")}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            หมายเหตุเพิ่มเติม
          </h2>
          <label
            htmlFor="notes"
            className="text-sm font-medium text-gray-700"
          >
            หมายเหตุ
          </label>
          <textarea
            id="notes"
            rows={4}
            maxLength={1000}
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม เช่น สภาพสิ่งของหรือร้านที่ซื้อ"
            className={inputClass}
          />
          <p className="mt-1 text-right text-xs text-gray-500">
            {form.notes.length}/1000 ตัวอักษร
          </p>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/items"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกสิ่งของ"}
          </button>
        </div>
      </form>
    </div>
  );
}
