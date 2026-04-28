import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { twinNodeAuth } from "@/lib/server/twin-node-auth";
import { twinNodeService } from "@/lib/services/twin-node.service";
import { DidLookupCard } from "./_components/DidLookupCard";
import { FetchCard } from "./_components/FetchCard";
import { JsonViewer } from "./_components/JsonViewer";
import { JwtDecoderCard } from "./_components/JwtDecoderCard";
import { SignatureDemoCard } from "./_components/SignatureDemoCard";

// Always render on demand so the tour reflects the live node state and so
// the service-account token isn't baked into static HTML at build time.
export const dynamic = "force-dynamic";

type Prefetch<T> = { data?: T; error?: string };

async function safeCall<T>(fn: () => Promise<T>): Promise<Prefetch<T>> {
  try {
    return { data: await fn() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Request failed" };
  }
}

const NODE_URL =
  process.env.TWIN_NODE_URL || "https://kitsune.staging.twinnodes.com";

const MISSING_MODULES: { name: string; description: string; docs: string }[] = [
  {
    name: "NFT",
    description: "Mint, transfer, burn NFTs on IOTA Rebased.",
    docs: "https://github.com/twinfoundation/nft",
  },
  {
    name: "Attestation",
    description: "Issue and verify attestations linked to a DID.",
    docs: "https://github.com/twinfoundation/attestation",
  },
  {
    name: "Auditable Item Graph",
    description: "Tamper-evident graph of vertices, aliases, edges.",
    docs: "https://github.com/twinfoundation/auditable-item-graph",
  },
  {
    name: "Auditable Item Stream",
    description: "Append-only auditable streams (e.g. supply-chain events).",
    docs: "https://github.com/twinfoundation/auditable-item-stream",
  },
  {
    name: "Blob storage",
    description: "Content-addressed blob store with pluggable backends.",
    docs: "https://github.com/twinfoundation/blob-storage",
  },
  {
    name: "Wallet",
    description: "Address & balance management on IOTA Rebased.",
    docs: "https://github.com/twinfoundation/wallet",
  },
];

export default async function TwinTourPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Public, no auth needed.
  const info = await safeCall(() => twinNodeService.getNodeInfo());
  const health = await safeCall(() => twinNodeService.getHealth());

  // Server identity (only known after a successful service-account login).
  // Trigger one to populate; ignore errors (the relevant card will surface them).
  const token = await twinNodeAuth.getToken();
  const serviceIdentity = twinNodeAuth.getIdentity();
  const ownProfile = token
    ? await safeCall(() => twinNodeService.getOwnProfile(token))
    : { error: "Service account not configured (set TWIN_NODE_SERVICE_*)" };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            TWIN onboarding tour
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Explore a live TWIN node
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            This page talks to a real TWIN node running in AWS staging. Each
            section shows a capability of the TWIN stack with the raw HTTP call
            and JSON response. Click around — everything is read-only and safe.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Node endpoint:{" "}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
              {NODE_URL}
            </code>
            <span className="mx-2 text-slate-300">·</span>
            <Link
              href="/twin-showcase/login"
              className="text-blue-600 underline"
            >
              advanced: login flow demo
            </Link>
          </p>
        </header>

        <div className="space-y-6">
          {/* 1. Node identity */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              1. Node identity
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Every TWIN node exposes a public <code>/info</code> endpoint
              describing what it is and what version it runs. <code>/health</code>{" "}
              is the same idea for liveness checks.
            </p>
            <code className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              GET /info · GET /health
            </code>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  /info
                </p>
                {info.error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {info.error}
                  </div>
                ) : (
                  <JsonViewer json={info.data} maxHeight="10rem" />
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  /health
                </p>
                {health.error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {health.error}
                  </div>
                ) : (
                  <JsonViewer json={health.data} maxHeight="10rem" />
                )}
              </div>
            </div>
          </section>

          {/* 2. Auth & JWT */}
          <JwtDecoderCard serviceIdentity={serviceIdentity} />

          {/* 3. DID resolution */}
          <DidLookupCard
            defaultDid={
              serviceIdentity ||
              "did:iota:testnet:0xda31b9524d2b6d71a2222b1386b3d5d0d85182c32645b647e19700be1cbb0d0c"
            }
          />

          {/* 3b. Signature demo */}
          <SignatureDemoCard />

          {/* 4. Public profile (lazy) */}
          {serviceIdentity && (
            <FetchCard
              title="Identity profile (public)"
              description="A schema.org Person fragment exposed for every identity. Use this to display 'who is this DID' in your UI without leaking private fields."
              endpoint={`/api/twin-node/agent?id=${encodeURIComponent(serviceIdentity)}`}
              buttonLabel="Load public profile"
            />
          )}

          {/* 4b. Own (private) profile */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Identity profile (private — own)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              When you call <code>/identity/profile</code> with your own token,
              the node also returns private fields (e.g. email). Compare with
              the public version above to see the privacy boundary.
            </p>
            <code className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              GET /identity/profile
            </code>
            <div className="mt-3">
              {ownProfile.error ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {ownProfile.error}
                </div>
              ) : (
                <JsonViewer json={ownProfile.data} maxHeight="20rem" />
              )}
            </div>
          </section>

          {/* 5. Logging */}
          <FetchCard
            title="Audit log"
            description="Every request the node handles is logged. Read the last 10 entries — useful for debugging integrations and proving observability."
            endpoint="/api/twin-node/logging?pageSize=10"
            buttonLabel="Load recent logs"
          />

          {/* 6. What's not here */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              What this node does NOT expose
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              TWIN is modular — the deployment behind this page is identity-only
              for safety. Other deployments enable more modules; the API
              surfaces below all live in the wider TWIN stack:
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {MISSING_MODULES.map((mod) => (
                <li
                  key={mod.name}
                  className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3"
                >
                  <a
                    href={mod.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-slate-700 hover:text-blue-600"
                  >
                    {mod.name} →
                  </a>
                  <p className="mt-1 text-xs text-slate-500">
                    {mod.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <footer className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Want to play deeper?
            </h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              <li>
                Source for this tour:{" "}
                <code className="text-xs">node-twin-poc</code> — Next.js 16 +
                React 19, all node calls go through server-side proxies.
              </li>
              <li>
                Try the manual login flow at{" "}
                <Link
                  href="/twin-showcase/login"
                  className="text-blue-600 underline"
                >
                  /twin-showcase/login
                </Link>
                .
              </li>
              <li>
                TWIN packages:{" "}
                <a
                  href="https://github.com/twinfoundation"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  github.com/twinfoundation
                </a>
              </li>
            </ul>
          </footer>
        </div>
      </div>
    </main>
  );
}
