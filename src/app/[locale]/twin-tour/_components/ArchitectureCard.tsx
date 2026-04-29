type Layer = {
  name: string;
  detail: string;
  tone: "browser" | "next" | "node" | "engine" | "chain";
};

const STACK: Layer[] = [
  {
    name: "Browser (this page)",
    detail:
      "Server Components render once per request (force-dynamic). Client Components handle interactivity (sign, decode, fetch).",
    tone: "browser",
  },
  {
    name: "Next.js proxy — /api/twin-node/*",
    detail:
      "Route Handlers in app/[locale]/api/twin-node/. Each one resolves a token via getTwinNodeToken(), calls the matching service method, returns { success, data }.",
    tone: "next",
  },
  {
    name: "Service-account singleton — TwinNodeAuthManager",
    detail:
      "Reads TWIN_NODE_SERVICE_EMAIL / _PASSWORD from env, logs in once, caches JWT with a 5-min refresh buffer, retries on 401. Token never reaches the browser.",
    tone: "next",
  },
  {
    name: "TWIN Node REST API",
    detail:
      "OpenAPI-described HTTP surface. Auth via Bearer JWT (EdDSA). Response envelope: { body | error }. We unwrap body in the proxy.",
    tone: "node",
  },
  {
    name: "TWIN engine — modules + connectors (factory pattern)",
    detail:
      "Components (high-level: Identity, NFT, Attestation…) delegate to Connectors (concrete impls: IOTA, file, in-memory). Modules toggle on/off via env flags — same engine binary.",
    tone: "engine",
  },
  {
    name: "IOTA Rebased testnet",
    detail:
      "DID Documents, NFT objects (when enabled), notarizations are committed here as Move objects. Public, immutable, no API key to read.",
    tone: "chain",
  },
];

const TONE_CLASS: Record<Layer["tone"], string> = {
  browser: "border-blue-300 bg-blue-50",
  next: "border-emerald-300 bg-emerald-50",
  node: "border-amber-300 bg-amber-50",
  engine: "border-violet-300 bg-violet-50",
  chain: "border-rose-300 bg-rose-50",
};

const TONE_LABEL: Record<Layer["tone"], string> = {
  browser: "Browser",
  next: "This Vercel app",
  node: "TWIN Node (HTTP)",
  engine: "TWIN engine (in-process)",
  chain: "On-chain",
};

export function ArchitectureCard() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Architecture & request flow
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Six layers between this page and the IOTA ledger. Each card below is a
        proxy hop or an engine boundary. Read top-to-bottom for an outbound
        request; bottom-to-top for the response.
      </p>

      <ol className="mt-4 space-y-2">
        {STACK.map((layer, idx) => (
          <li
            key={layer.name}
            className={`flex gap-3 rounded-md border p-3 ${TONE_CLASS[layer.tone]}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 ring-1 ring-slate-300">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {layer.name}
                </p>
                <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 ring-1 ring-slate-300">
                  {TONE_LABEL[layer.tone]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700">{layer.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trust boundary
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Between layer 3 and 4. The service password lives in this app&apos;s
            env vars; the JWT never leaves the server. Browsers see only proxy
            JSON.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Swappable layer
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Layer 5. Connectors are interface-driven — swap{" "}
            <code className="font-mono text-[11px]">IotaIdentityConnector</code>{" "}
            for an in-memory one in tests, no engine change.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Source of truth
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Layer 6. DID Documents resolve from IOTA Rebased — the node is a
            cache + auth gateway, not the canonical store.
          </p>
        </div>
      </div>

      <details className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-medium text-slate-900">
          Example: GET /api/twin-node/identity/&#123;did&#125; — full path
        </summary>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs">
          <li>
            <strong>Browser</strong> calls{" "}
            <code className="font-mono">
              fetch(&quot;/api/twin-node/identity/&lt;did&gt;&quot;)
            </code>{" "}
            (relative URL, same origin, no CORS).
          </li>
          <li>
            <strong>Next route handler</strong>{" "}
            <code className="font-mono">identity/[did]/route.ts</code>: awaits{" "}
            <code className="font-mono">params</code> (Next 16),{" "}
            <code className="font-mono">decodeURIComponent</code>, asserts{" "}
            <code className="font-mono">did:</code> prefix.
          </li>
          <li>
            <strong>Token resolver</strong>{" "}
            <code className="font-mono">getTwinNodeToken()</code>: returns the
            cached service-account JWT, refreshes if &lt; 5 min to expiry.
          </li>
          <li>
            <strong>Service method</strong>{" "}
            <code className="font-mono">
              twinNodeService.getDidDocument(did, token)
            </code>
            : issues HTTPS{" "}
            <code className="font-mono">
              GET {"{TWIN_NODE_URL}"}/identity/&lt;did&gt;
            </code>{" "}
            with{" "}
            <code className="font-mono">Authorization: Bearer &lt;jwt&gt;</code>.
          </li>
          <li>
            <strong>TWIN Node</strong> verifies JWT signature + scope, asks the{" "}
            <code className="font-mono">IdentityComponent</code> to resolve the
            DID; it delegates to{" "}
            <code className="font-mono">IotaIdentityResolverConnector</code>.
          </li>
          <li>
            <strong>IOTA Rebased</strong> returns the on-chain DID Document
            object; connector parses, component returns, REST wraps in{" "}
            <code className="font-mono">{"{ body }"}</code>.
          </li>
          <li>
            <strong>Service method</strong> unwraps{" "}
            <code className="font-mono">body</code>; <strong>route handler</strong>{" "}
            re-wraps as{" "}
            <code className="font-mono">{"{ success: true, data }"}</code>;
            browser renders.
          </li>
        </ol>
      </details>
    </section>
  );
}
