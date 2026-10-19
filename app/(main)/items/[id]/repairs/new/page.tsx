
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function NewRepairPage() {
  const params = useParams<{ id: string }>();
  const itemId = params.id;
  const router = useRouter();

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });

  const [description, setDescription] = useState("");
  const [repairDate, setRepairDate] = useState(today);
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  function clearFieldError(field: string) {
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

    const nextErrors: Record<string, string> = {};

    if (!description.trim()) {
      nextErrors.description = "กรุณาระบุรายละเอียดการซ่อม";
    }

    if (!repairDate) {
      nextErrors.repairDate = "กรุณาเลือกวันที่ซ่อม";
    } else if (repairDate > today) {
      nextErrors.repairDate = "วันที่ซ่อมต้องไม่เป็นวันในอนาคต";
    }

    if (
      cost.trim() !== "" &&
      (!Number.isFinite(Number(cost)) || Number(cost) < 0)
    ) {
      nextErrors.cost = "ค่าใช้จ่ายต้องเป็นตัวเลขและไม่ติดลบ";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const payload = {
      description: description.trim(),
      repairDate: `${repairDate}T00:00:00.000Z`,
      cost: cost.trim() === "" ? null : Number(cost),
      notes: notes.trim() || null,
    };

    setSaving(true);

    try {
      const response = await fetch(
        `/api/items/${itemId}/repairs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result =
        (await response.json()) as ApiResult<unknown>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "ไม่สามารถบันทึกประวัติการซ่อมได้"
        );
      }

      router.push(`/items/${itemId}`);
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
          href={`/items/${itemId}`}
          className="text-sm text-blue-700 hover:underline"
        >
          ← กลับไปหน้ารายละเอียดสิ่งของ
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          เพิ่มประวัติการซ่อม
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          บันทึกรายละเอียด วันที่ และค่าใช้จ่ายในการซ่อมสิ่งของ
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
            รายละเอียดการซ่อม
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                รายละเอียดการซ่อม{" "}
                <span className="text-red-600">*</span>
              </label>

              <textarea
                id="description"
                required
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError("description");
                }}
                placeholder="เช่น เปลี่ยนแบตเตอรี่ ซ่อมหน้าจอ ทำความสะอาดเครื่อง"
                className={inputClass}
              />

              {fieldError("description")}

              <p className="mt-1 text-right text-xs text-gray-500">
                {description.length}/1000 ตัวอักษร
              </p>
            </div>

            <div>
              <label
                htmlFor="repairDate"
                className="text-sm font-medium text-gray-700"
              >
                วันที่ซ่อม <span className="text-red-600">*</span>
              </label>

              <input
                id="repairDate"
                type="date"
                required
                max={today}
                value={repairDate}
                onChange={(e) => {
                  setRepairDate(e.target.value);
                  clearFieldError("repairDate");
                }}
                className={inputClass}
              />

              {fieldError("repairDate")}
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            ค่าใช้จ่าย
          </h2>

          <label
            htmlFor="cost"
            className="text-sm font-medium text-gray-700"
          >
            ค่าซ่อม (บาท)
          </label>

          <input
            id="cost"
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(e) => {
              setCost(e.target.value);
              clearFieldError("cost");
            }}
            placeholder="เช่น 850"
            className={inputClass}
          />

          {fieldError("cost")}

          <p className="mt-1 text-xs text-gray-500">
            หากไม่ทราบค่าใช้จ่าย สามารถเว้นว่างได้
          </p>
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
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              clearFieldError("notes");
            }}
            placeholder="เช่น ร้านที่ซ่อม รายละเอียดอะไหล่ หรือการรับประกันงานซ่อม"
            className={inputClass}
          />

          <p className="mt-1 text-right text-xs text-gray-500">
            {notes.length}/1000 ตัวอักษร
          </p>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/items/${itemId}`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกประวัติการซ่อม"}
          </button>
        </div>
      </form>
    </div>
  );
}
