"use client";

import { useState } from "react";
import { JsonViewer } from "./JsonViewer";

type Props = {
  serviceIdentity?: string | null;
};

function decodeJwt(token: string): unknown {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Invalid JWT (missing payload segment)");
  }
  const padded = payload.padEnd(
    payload.length + ((4 - (payload.length % 4)) % 4),
    "=",
  );
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(base64);
  return JSON.parse(json);
}

export function JwtDecoderCard({ serviceIdentity }: Props) {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDecode() {
    setError(null);
    setDecoded(null);
    try {
      const payload = decodeJwt(token.trim());
      setDecoded(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode");
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Authentication & JWT sessions
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Logging into a TWIN node returns a signed JWT stored in an HttpOnly
        cookie. The payload carries the caller&apos;s DID, organization, scope
        and expiry. Paste any TWIN JWT below to inspect it (decoding is
        client-side, no network call).
      </p>

      {serviceIdentity && (
        <p className="mt-3 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800">
          This site is currently authenticated as{" "}
          <code className="font-mono">{serviceIdentity}</code> using a
          server-side service account. Browser visitors never see the token.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          placeholder="eyJhbGciOi..."
        />
        <button
          type="button"
          onClick={handleDecode}
          disabled={!token.trim()}
          className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Decode JWT payload
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {decoded !== null && (
        <div className="mt-3">
          <JsonViewer json={decoded} maxHeight="20rem" />
        </div>
      )}
    </section>
  );
}
