"use client";

import { useEffect, useState } from "react";

type Verdict = "valid" | "invalid" | null;

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    bin += String.fromCharCode(bytes[i] as number);
  }
  return btoa(bin);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

export function SignatureDemoCard() {
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [publicKeyB64, setPublicKeyB64] = useState<string>("");
  const [message, setMessage] = useState("Hello from the TWIN tour");
  const [signatureB64, setSignatureB64] = useState<string>("");
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const kp = await crypto.subtle.generateKey(
          { name: "ECDSA", namedCurve: "P-256" },
          true,
          ["sign", "verify"],
        );
        const raw = await crypto.subtle.exportKey("raw", kp.publicKey);
        if (cancelled) return;
        setKeyPair(kp);
        setPublicKeyB64(bufToB64(raw));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Could not generate keypair: ${err.message}`
              : "Could not generate keypair",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sign() {
    if (!keyPair) return;
    setBusy(true);
    setError(null);
    setVerdict(null);
    try {
      const data = new TextEncoder().encode(message);
      const sig = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        keyPair.privateKey,
        data,
      );
      setSignatureB64(bufToB64(sig));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign failed");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!keyPair || !signatureB64) return;
    setBusy(true);
    setError(null);
    try {
      const data = new TextEncoder().encode(message);
      const ok = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        keyPair.publicKey,
        b64ToBuf(signatureB64),
        data,
      );
      setVerdict(ok ? "valid" : "invalid");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
      setVerdict("invalid");
    } finally {
      setBusy(false);
    }
  }

  function tamper() {
    // Flip the last character of the message so the existing signature no
    // longer matches. Resets verdict so the visitor has to verify again.
    if (!message) return;
    const last = message.slice(-1);
    const flipped = last === "!" ? "?" : "!";
    setMessage(message.slice(0, -1) + flipped);
    setVerdict(null);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Live signature demo
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        This runs entirely in your browser — no node call. It shows the math
        behind DID verification: a private key signs, anyone with the public
        key verifies. TWIN&apos;s contribution is publishing the{" "}
        <em>public</em> keys on IOTA, so &ldquo;anyone&rdquo; really means
        anyone, no central authority.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Public key (ECDSA P-256, generated in your browser)
          </label>
          <code className="block break-all rounded bg-slate-100 px-2 py-1.5 font-mono text-xs text-slate-700">
            {publicKeyB64 || "Generating keypair..."}
          </code>
        </div>

        <div>
          <label
            htmlFor="sigdemo-msg"
            className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500"
          >
            Message
          </label>
          <textarea
            id="sigdemo-msg"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setVerdict(null);
            }}
            rows={2}
            spellCheck={false}
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={sign}
            disabled={!keyPair || busy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            1. Sign message
          </button>
          <button
            type="button"
            onClick={verify}
            disabled={!signatureB64 || busy}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            2. Verify signature
          </button>
          <button
            type="button"
            onClick={tamper}
            disabled={!signatureB64 || busy}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            3. Tamper with message
          </button>
        </div>

        {signatureB64 && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Signature
            </label>
            <code className="block break-all rounded bg-slate-100 px-2 py-1.5 font-mono text-xs text-slate-700">
              {signatureB64}
            </code>
          </div>
        )}

        {verdict === "valid" && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <strong>Valid.</strong> The signature matches this message and this
            public key.
          </div>
        )}
        {verdict === "invalid" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Invalid.</strong> The message no longer matches the
            signature. Click &ldquo;Sign message&rdquo; again to produce a fresh
            signature for the tampered text.
          </div>
        )}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Curve note: this demo uses ECDSA P-256 because it&apos;s available in
        every browser. TWIN DIDs typically use Ed25519 — same primitive, faster
        curve. The verification in the previous card (&ldquo;DID document
        resolution&rdquo;) returns Ed25519 public keys committed to IOTA
        Rebased.
      </p>
    </section>
  );
}
