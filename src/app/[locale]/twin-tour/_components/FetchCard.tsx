"use client";

import { useState } from "react";
import { JsonViewer } from "./JsonViewer";

type ApiResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

type Props = {
  title: string;
  description: string;
  endpoint: string;
  buttonLabel: string;
  prefetched?: unknown;
  prefetchedError?: string | null;
};

export function FetchCard({
  title,
  description,
  endpoint,
  buttonLabel,
  prefetched,
  prefetchedError,
}: Props) {
  const [data, setData] = useState<unknown>(prefetched);
  const [error, setError] = useState<string | null>(prefetchedError ?? null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const body = (await res.json()) as ApiResponse;
      if (body.success) {
        setData(body.data);
      } else {
        setError(body.error || `HTTP ${res.status}`);
        setData(undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          <code className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            GET {endpoint}
          </code>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : buttonLabel}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data !== undefined && <JsonViewer json={data} />}
    </section>
  );
}
