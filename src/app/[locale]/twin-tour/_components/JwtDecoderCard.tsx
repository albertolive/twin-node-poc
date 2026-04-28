"use client";

import { useState } from "react";
import { JsonViewer } from "./JsonViewer";

type Props = {
  serviceIdentity?: string | null;
};

// Demo JWT (HS256 over a fake key — payload is illustrative only).
// Decoding is base64-only so the signature doesn't need to verify.
const SAMPLE_JWT =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJkaWQ6aW90YTp0ZXN0bmV0OjB4ZGEzMWI5NTI0ZDJiNmQ3MWEyMjIyYjEzODZiM2Q1ZDBkODUxODJjMzI2NDViNjQ3ZTE5NzAwYmUxY2JiMGQwYyIsIm9yZyI6ImRpZDppb3RhOnRlc3RuZXQ6MHg0YzZiZjk5ZTZkMDQ2NWFiYzM0NmIzMGNiYTJjZjg5OTEyOTkyZjk3MWE1ZTA1MjY4YWU5ZmY1MGFiZTVlNzg1IiwiZXhwIjoxNzc3MzcxNTI3LCJzY29wZSI6InRlbmFudC1hZG1pbiJ9." +
  "NbkPZuGmMi3l8yd0ptWm5HxFA5dW8Ou6vrmD-NukfEqFByimp6kf0RpiQ7WmeyaLOGHO9LZ4_o59s74j5CVQAw";

function decodeJwt(token: string): unknown {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `Not a JWT: expected 3 dot-separated segments, got ${parts.length}. JWTs look like 'eyJ...HEADER.eyJ...PAYLOAD.SIGNATURE'.`,
    );
  }
  const payload = parts[1];
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
      <p className="mt-2 text-xs text-slate-500">
        A JWT has three base64url segments joined by dots:{" "}
        <code>eyJ...HEADER.eyJ...PAYLOAD.SIGNATURE</code>. A bare DID is{" "}
        <em>not</em> a JWT — it&apos;s what you&apos;ll find inside the{" "}
        <code>sub</code> claim.
      </p>

      {serviceIdentity && (
        <p className="mt-3 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800">
          This site is currently authenticated as{" "}
          <code className="font-mono">{serviceIdentity}</code> using a
          server-side service account. Browser visitors never see the token —
          use the sample below to see what one looks like.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          placeholder="eyJhbGciOi...HEADER.eyJzdWIi...PAYLOAD.SIGNATURE"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDecode}
            disabled={!token.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Decode JWT payload
          </button>
          <button
            type="button"
            onClick={() => setToken(SAMPLE_JWT)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Load sample token
          </button>
        </div>
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
