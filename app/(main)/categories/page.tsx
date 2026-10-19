
"use client";

import { useCallback, useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  userId: string | null;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        cache: "no-store",
      });
      const result: ApiResponse<Category[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "โหลดหมวดหมู่ไม่สำเร็จ");
      }

      setCategories(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEdit(category: Category) {
    setName(category.name);
    setDescription(category.description ?? "");
    setEditingId(category.id);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    if (trimmedName.length > 50) {
      setError("ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร");
      return;
    }

    if (trimmedDescription.length > 1000) {
      setError("คำอธิบายต้องไม่เกิน 1,000 ตัวอักษร");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/categories/${editingId}` : "/api/categories",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description: trimmedDescription,
          }),
        }
      );

      const result: ApiResponse<Category> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "บันทึกหมวดหมู่ไม่สำเร็จ");
      }

      const wasEditing = editingId !== null;

      resetForm();
      setMessage(wasEditing ? "แก้ไขหมวดหมู่สำเร็จ" : "เพิ่มหมวดหมู่สำเร็จ");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?\n\nสิ่งของในหมวดหมู่นี้จะยังอยู่ แต่จะไม่มีหมวดหมู่กำกับ`
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "ลบหมวดหมู่ไม่สำเร็จ");
      }

      if (editingId === category.id) resetForm();

      setMessage(`ลบหมวดหมู่ "${category.name}" สำเร็จ`);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const sharedCategories = categories.filter(
    (category) => category.userId === null
  );

  const personalCategories = categories.filter(
    (category) => category.userId !== null
  );

  function renderCategoryList(items: Category[], shared: boolean) {
    if (items.length === 0) {
      return (
        <p className="px-5 py-8 text-center text-sm text-gray-500">
          ยังไม่มีหมวดหมู่{shared ? "ส่วนกลาง" : "ส่วนตัว"}
        </p>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {items.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5L20 13.5 13.5 20 4 10.5v-5Z"
                  />
                  <circle cx="7.5" cy="7.5" r="1" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-gray-900">
                  {category.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {shared ? "หมวดหมู่ส่วนกลาง" : "หมวดหมู่ส่วนตัว"}
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                  {category.description?.trim()
                    ? category.description
                    : "ยังไม่มีคำอธิบายหมวดหมู่นี้"}
                </p>

                <span className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {category.itemCount ?? 0} รายการ
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 sm:self-center">
              <button
                type="button"
                onClick={() => startEdit(category)}
                disabled={saving || deletingId !== null}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                แก้ไข
              </button>

              <button
                type="button"
                onClick={() => void handleDelete(category)}
                disabled={saving || deletingId !== null}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === category.id ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">จัดการข้อมูล</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          หมวดหมู่
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          จัดหมวดหมู่สิ่งของ พร้อมคำอธิบาย เพื่อให้ค้นหาและจัดการได้ง่ายขึ้น
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {editingId
            ? "แก้ไขชื่อและคำอธิบาย แล้วกดบันทึก"
            : "กรอกชื่อและคำอธิบายของหมวดหมู่ที่ต้องการเพิ่ม"}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ชื่อหมวดหมู่
            </label>

            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์"
              maxLength={50}
              required
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-gray-700"
              >
                คำอธิบายหมวดหมู่
              </label>

              <span className="text-xs text-gray-400">
                {description.length}/1000
              </span>
            </div>

            <textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="อธิบายว่าหมวดหมู่นี้ใช้จัดเก็บสิ่งของประเภทไหน..."
              maxLength={1000}
              rows={3}
              disabled={saving}
              className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "กำลังบันทึก..."
                : editingId
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มหมวดหมู่"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">หมวดหมู่ทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {categories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">หมวดหมู่ส่วนตัว</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {personalCategories.length}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">หมวดหมู่ส่วนกลาง</h2>
          <p className="mt-1 text-sm text-gray-500">
            หมวดหมู่ที่ใช้ร่วมกันตามสิทธิ์ของระบบ
          </p>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            กำลังโหลดหมวดหมู่...
          </p>
        ) : (
          renderCategoryList(sharedCategories, true)
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">หมวดหมู่ส่วนตัว</h2>
          <p className="mt-1 text-sm text-gray-500">
            หมวดหมู่ที่คุณสร้างขึ้นเอง
          </p>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            กำลังโหลดหมวดหมู่...
          </p>
        ) : (
          renderCategoryList(personalCategories, false)
        )}
      </section>

      {!loading && categories.length === 0 && !error && (
        <p className="text-center text-sm text-gray-500">
          ยังไม่มีหมวดหมู่ ลองเพิ่มหมวดหมู่แรกของคุณได้เลย
        </p>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => void loadCategories()}
          disabled={loading}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          รีเฟรชข้อมูล
        </button>
      </div>
    </div>
  );
}
