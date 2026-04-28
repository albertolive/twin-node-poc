"use client";

import { useState } from "react";
import { JsonViewer } from "./JsonViewer";

type ApiResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

type Props = {
  defaultDid: string;
};

export function DidLookupCard({ defaultDid }: Props) {
  const [did, setDid] = useState(defaultDid);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    if (!did.startsWith("did:")) {
      setError("Must be a DID (e.g. did:iota:testnet:0x...)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/twin-node/identity/${encodeURIComponent(did)}`,
      );
      const body = (await res.json()) as ApiResponse;
      if (body.success) {
        setData(body.data);
      } else {
        setError(body.error || `HTTP ${res.status}`);
        setData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        DID document resolution
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Every TWIN identity is a W3C-standard{" "}
        <a
          href="https://www.w3.org/TR/did-core/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          DID
        </a>
        . Resolve any DID into its full DID Document — verification methods,
        services, revocation bitmap.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          spellCheck={false}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          placeholder="did:iota:testnet:0x..."
        />
        <button
          type="button"
          onClick={lookup}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Resolving..." : "Resolve DID"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        GET /identity/&#123;did&#125;
      </p>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data !== null && (
        <div className="mt-3">
          <JsonViewer json={data} />
        </div>
      )}
    </section>
  );
}
