
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

type RepairRecord = {
  id: string;
  itemId: string;
  description: string;
  repairDate: string;
  cost: number | string | null;
  notes: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | undefined>;
};

export default function EditRepairPage() {
  const params = useParams<{ id: string; repairId: string }>();
  const router = useRouter();

  const itemId = params.id;
  const repairId = params.repairId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRepair() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/items/${itemId}/repairs`,
          { cache: "no-store" }
        );

        const result: ApiResponse<RepairRecord[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "ไม่สามารถโหลดประวัติการซ่อมได้"
          );
        }

        const repair = result.data.find(
          (record) => record.id === repairId
        );

        if (!repair) {
          throw new Error("ไม่พบประวัติการซ่อมนี้");
        }

        if (cancelled) return;

        setDescription(repair.description);
        setRepairDate(
          new Date(repair.repairDate).toISOString().slice(0, 10)
        );
        setCost(
          repair.cost === null || repair.cost === undefined
            ? ""
            : String(repair.cost)
        );
        setNotes(repair.notes ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRepair();

    return () => {
      cancelled = true;
    };
  }, [itemId, repairId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!description.trim()) {
      setError("กรุณากรอกรายละเอียดการซ่อม");
      return;
    }

    if (!repairDate) {
      setError("กรุณาเลือกวันที่ซ่อม");
      return;
    }

    if (cost.trim() !== "" && Number(cost) < 0) {
      setError("ค่าซ่อมต้องไม่ติดลบ");
      return;
    }

    if (cost.trim() !== "" && !Number.isFinite(Number(cost))) {
      setError("กรุณากรอกค่าซ่อมเป็นตัวเลข");
      return;
    }

    if (new Date(`${repairDate}T00:00:00`).getTime() > Date.now()) {
      setError("วันที่ซ่อมต้องไม่เป็นวันที่ในอนาคต");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/items/${itemId}/repairs/${repairId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: description.trim(),
            repairDate: new Date(
              `${repairDate}T00:00:00`
            ).toISOString(),
            cost: cost.trim() === "" ? null : Number(cost),
            notes: notes.trim() || null,
          }),
        }
      );

      const result: ApiResponse<RepairRecord> =
        await response.json();

      if (!response.ok || !result.success) {
        const fieldErrors = result.errors
          ? Object.values(result.errors).flat().filter(Boolean)
          : [];

        throw new Error(
          fieldErrors[0] ||
            result.message ||
            "ไม่สามารถบันทึกการแก้ไขได้"
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

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse space-y-4">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error && !description && !repairDate) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-xl font-bold text-gray-900">
          ไม่สามารถเปิดประวัติการซ่อมได้
        </h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => router.push(`/items/${itemId}`)}
          className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          กลับหน้ารายละเอียด
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push(`/items/${itemId}`)}
        className="mb-5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← กลับหน้ารายละเอียดสิ่งของ
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          แก้ไขประวัติการซ่อม
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          แก้ไขรายละเอียดการซ่อมของสิ่งของชิ้นนี้
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              รายละเอียดการซ่อม *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              maxLength={1000}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="เช่น เปลี่ยนแบตเตอรี่"
            />
          </div>

          <div>
            <label
              htmlFor="repairDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              วันที่ซ่อม *
            </label>
            <input
              id="repairDate"
              type="date"
              value={repairDate}
              onChange={(event) => setRepairDate(event.target.value)}
              max={new Date().toLocaleDateString("en-CA")}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="cost"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ค่าซ่อม (บาท)
            </label>
            <input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="เว้นว่างได้หากไม่มีค่าใช้จ่าย"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              หมายเหตุ
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/items/${itemId}`)}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
