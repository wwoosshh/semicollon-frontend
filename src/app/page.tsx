"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Status = { ok: boolean; detail: string };

export default function Home() {
  const [backend, setBackend] = useState<Status | null>(null);
  const [db, setDb] = useState<Status | null>(null);

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => setBackend({ ok: d.status === "ok", detail: JSON.stringify(d) }))
      .catch((e) => setBackend({ ok: false, detail: String(e) }));
    fetch(`${API}/health/db`)
      .then((r) => r.json())
      .then((d) => setDb({ ok: d.db === "ok", detail: JSON.stringify(d) }))
      .catch((e) => setDb({ ok: false, detail: String(e) }));
  }, []);

  return (
    <main className="mx-auto mt-16 max-w-md p-6">
      <h1 className="mb-1 text-2xl font-bold">세미콜론</h1>
      <p className="mb-6 text-sm text-gray-500">연결 상태 점검</p>
      <div className="space-y-3 text-sm">
        <Row label="API URL" value={API ?? "(NEXT_PUBLIC_API_URL 미설정)"} ok={!!API} />
        <Row label="백엔드 /health" value={backend?.detail ?? "확인 중…"} ok={backend ? backend.ok : null} />
        <Row label="DB /health/db" value={db?.detail ?? "확인 중…"} ok={db ? db.ok : null} />
      </div>
    </main>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean | null }) {
  const color = ok === null ? "bg-gray-300" : ok ? "bg-green-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 rounded border p-3">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="w-28 font-medium">{label}</span>
      <span className="flex-1 break-all text-gray-600">{value}</span>
    </div>
  );
}
