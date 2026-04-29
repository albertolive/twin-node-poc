# TWIN Onboarding Tour — Technical Presentation Script

Audience: **engineers**. They want architecture, contracts between layers,
and the why behind design decisions — not feature tours.

URL: <https://twin-node-poc.vercel.app/twin-tour>
Repo: <https://github.com/albertolive/twin-node-poc>

Total: **~25 min** + Q&A. Open the repo in a second tab so you can jump to
files when asked.

---

## Setup checklist (1 min, on your own)

- Tour open and warm; `/info` prefetched.
- Repo open at `src/app/[locale]/twin-tour/page.tsx` in a second tab.
- DevTools Network panel ready — you'll open it during Section 2.
- Console clear.

---

## 0. Frame the session (1 min)

> "I built this in a day on top of an existing Next.js scaffold and pointed
> it at our staging TWIN node. Goal: one URL where you can read the whole
> stack — proxy code, request flow, on-chain data — without me handing you a
> diagram. Everything you'll see is real: real testnet, real DIDs, real JWT.
> The only thing I'm hiding from your browser is the service-account
> password.
>
> Plan: walk top-to-bottom through six layers, then look at three concrete
> request paths. Stop me anywhere."

---

## 1. Architecture card — the six layers (5 min) ⭐ START HERE

**Click each card top-to-bottom as you talk.**

> "Layer 1 — **Browser**. Server Components do the prefetch on the server,
> Client Components do interactivity. The page is `force-dynamic` so the
> service token never gets baked into static HTML at build time. That's a
> Next 16 detail but it matters: `dynamic = "force-dynamic"` was the
> difference between safe and a leaked admin JWT.
>
> Layer 2 — **Next.js proxy routes**. Every `/api/twin-node/*` you see in
> Network is a Route Handler in `app/[locale]/api/twin-node/`. They're thin:
> resolve a token, call the service method, wrap the result. They exist for
> two reasons: same-origin (no CORS), and they let me strip the JWT before
> JSON reaches the client.
>
> Layer 3 — **Service-account singleton**. `TwinNodeAuthManager`. Reads env
> vars, logs in once on first request, caches the JWT, refreshes 5 min
> before `exp`. It also handles the race: concurrent requests share one
> in-flight login Promise instead of all hitting `/login` at once. Standard
> double-checked-locking pattern with a `Promise` instead of a mutex.
>
> Layer 4 — **TWIN Node REST API**. OpenAPI-described HTTP. Bearer JWT
> (EdDSA, not RS256 — they picked Edwards curves because of native IOTA
> alignment). Wire envelope is `{ body }` on success, `{ error }` on
> failure. Notice we strip the envelope in the service layer; the engine
> contract leaks otherwise.
>
> Layer 5 — **Engine, modules, connectors**. This is the part of TWIN
> people don't immediately see. It's a factory pattern:
> *Components* are the public-facing interfaces (`IIdentityComponent`,
> `INftComponent`); *Connectors* are the concrete implementations. A
> Component holds a reference to a Connector chosen at boot time. So
> `IotaIdentityConnector` writes DIDs to IOTA, `EntityStorageIdentityConnector`
> writes them to a file. Same Component interface. Tests use the latter,
> staging uses the former. **This is why TWIN talks to IOTA but isn't
> coupled to IOTA.**
>
> Layer 6 — **IOTA Rebased**. The chain is the source of truth for DID
> Documents and (when enabled) NFT objects, notarizations, hierarchies. The
> node is a cache + auth gateway in front of it. If the node disappeared
> tomorrow, your DIDs would still resolve — anyone can read the chain
> directly with the IOTA SDK."

**Now point at the three sidebars below the layers.**

> "Three things I want you to remember from this:
>
> 1. **Trust boundary** is between layer 3 and 4 — that's where the
>    password lives, that's where the JWT lives. Everything below assumes
>    the JWT is valid; everything above never sees it.
> 2. **Swappable layer** is layer 5 — the connector interface is the
>    seam. Pluggability is built in.
> 3. **Source of truth** is layer 6. The node *serves* DIDs, it doesn't
>    *own* them."

**Click the `<details>` "Example: GET /identity/{did} — full path"**

> "Concrete walkthrough of one request path. Seven hops. Read it now or
> later — it's there for reference."

---

## 2. Section 1 — `/info` and `/health` (2 min)

> "Two endpoints. `/info` is the discovery contract: tell me which version,
> which features. We use this to decide which UI cards to render — if the
> node doesn't enable `nft`, we don't show NFT actions. `/health` is the
> liveness check. Notice they don't require auth. They're the only two
> endpoints that don't.
>
> Implementation note: the prefetch happens in the Server Component
> render. If `/info` fails, the card surfaces the error in red but the rest
> of the page renders. We wrap each prefetch in `safeCall()` — pattern is
> repeated for `/health` and own-profile. Look at `page.tsx` line 16."

**Cmd-click to open `page.tsx` in the repo tab.** Show the `safeCall` helper.

---

## 3. Section 2 — JWT decoder, but actually the auth flow (3 min)

**Open DevTools → Network → click "Load sample token" → "Decode JWT".**

> "Three things to notice in the decoded payload:
>
> - `sub` is a DID, not a UUID. *The subject of every authenticated call
>   is a public, resolvable identifier.* You can paste it into the next
>   card and pull the public keys.
> - `org` and `scope` — TWIN's authorization model is claim-based. The
>   node enforces scopes per-route. Service token has `tenant-admin`.
> - `exp` is short — minutes, not days. Refresh is mandatory. That's why
>   `TwinNodeAuthManager` exists.
>
> Auth flow in this app, end to end:
>
> 1. First request hits a route handler.
> 2. Handler calls `getTwinNodeToken()` (in `lib/server/session.ts`).
> 3. That asks `TwinNodeAuthManager.getToken()`.
> 4. If cache empty or expiring: triggers `login()` against the node, awaits.
> 5. Token cached in module-scope memory (Vercel serverless: per-instance
>    cache, cold-start re-auths — fine for low traffic).
> 6. Service method called with the bearer token.
>
> What you **don't see** in Network: the JWT. The browser only sees proxy
> JSON. If a future feature needs the user to act *as themselves* — not as
> the service account — the route handler reads `twin_node_token` from an
> HttpOnly cookie instead. Same proxy shape."

---

## 4. Section 3 — DID resolution (3 min)

**Click "Resolve DID" with the prefilled service-account DID.**

> "Three keys to look at in the response:
>
> - `verificationMethod[]` — array of public keys with their key IDs.
>   Anyone in the world can fetch this without authentication. *Reading
>   from the chain is permissionless.*
> - `service[]` — discovery endpoints. TWIN puts profile and revocation
>   here; you can add custom services for your domain.
> - The whole document is a Move object on IOTA Rebased. The connector
>   serializes/deserializes it. There's no off-chain database holding the
>   canonical version.
>
> Architectural consequence: **resolution is censorship-resistant**. If our
> staging node is down, you can still resolve this DID through any other
> TWIN node, or through a raw IOTA SDK call. That's the property the chain
> buys us. The node is a *convenience* layer, not a *trust* layer."

**Optional: paste a malformed DID, show the 400.**

> "Error model: the node returns `{ error: { name, message, source } }`.
> The proxy converts that to `{ success: false, error: message }`. The
> envelope translation lives in `twin-node.service.ts` line ~70. Check
> `call<T>()`."

---

## 5. Section 3b — Signature demo (3 min)

**Click Sign → point at signature → Verify (green) → Tamper → Verify (red).**

> "Pure browser Web Crypto. ECDSA P-256 because Ed25519 isn't universally
> available in `crypto.subtle` yet — pragmatic choice, math is conceptually
> identical. The keypair is generated once on mount and lives only in the
> Client Component's state. Refresh the page, new keypair.
>
> The point is the contract:
>
> - **Sign**: `crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' },
>   privateKey, data)` → 64-byte r||s signature.
> - **Verify**: `crypto.subtle.verify(...)` returns boolean. The signature
>   is mathematically bound to *that exact byte sequence*.
> - **Tamper**: I flip one byte of the message and verification fails. No
>   network call. The math fails locally.
>
> Now the bridge to TWIN: the previous card returned a DID Document with
> public keys. Imagine those public keys are mine, and I just signed a
> contract with my private key. You — anywhere in the world — can:
>
> 1. Resolve my DID (no auth, no API key).
> 2. Pull my public key from `verificationMethod`.
> 3. Run `crypto.subtle.verify` exactly like in this card.
> 4. Get a boolean. No third party needed.
>
> *That's* the architectural payoff of putting public keys on a public
> ledger. Verification becomes a one-line client-side operation. Compare
> with traditional PKI where you'd need to call a CA, hit OCSP, etc."

---

## 6. Section 4 + 4b — public vs private profile (2 min)

**Click "Load public profile". Then point at the inline private profile.**

> "Same identity, two endpoints, two trust models.
>
> - `GET /agent?id=<did>` — public. No auth header required (the proxy
>   adds one but the node doesn't need it for this route). Returns
>   schema.org Person — the *public face* of the identity.
> - `GET /identity/profile` — authenticated. Returns the *full* record
>   including private fields like email. Authorization: you can only ever
>   see your own.
>
> The privacy boundary is enforced server-side, not client-side. A clever
> attacker can't change a query param to read someone else's private
> profile — the route looks up *your* profile based on `sub` in your JWT,
> the path doesn't take a DID."

---

## 7. Section 5 — Audit log (1 min)

> "The node logs every request and exposes the log via REST. We expose it
> in the tour because newcomers always ask 'how do I debug?'. In real
> deployments you'd ship logs to your observability stack (CloudWatch,
> Datadog, whatever).
>
> Note this is the node's logger, not Vercel's. Vercel logs the proxy
> calls; the node logs the engine calls. You'll want both."

---

## 8. Section 6 — Modules NOT enabled here (3 min)

**Scroll to the dashed cards.**

> "Honesty section. Kitsune (this node) is identity-only by config —
> environment-variable feature flags. Same engine binary supports all of
> these:
>
> - **NFT** — Move-based NFTs on Rebased. Mint, transfer, burn. Used in
>   the ETD project to back electronic Bills of Lading.
> - **Attestation** — issuer signs a claim about a subject DID, anyone
>   verifies. VC-shaped but TWIN-native.
> - **AIG / AIS** — auditable graphs and streams. Useful for supply-chain
>   provenance and tamper-evident event logs.
> - **Blob storage** — content-addressed (CID) file store with pluggable
>   backends. The connector seam I mentioned in Section 1 — same
>   `IBlobStorageComponent`, swap S3 / file / IPFS connectors.
> - **Wallet** — IOTA address & balance management. Needed for any
>   on-chain write.
>
> If your project needs one of these, two paths:
>
> 1. **Cheap**: ask Rodrigo to flip the env flag on this node. Restart, done.
> 2. **Real**: stand up your own deployment with the modules you need. The
>    `identity-management` repo is a fuller scaffold — same connectors,
>    different selection."

---

## 9. Closing (1 min)

> "Three architectural takeaways:
>
> 1. **Modular by config.** Same engine, different module sets. Don't
>    fork the engine — flip flags.
> 2. **Connector seam is the integration point.** When you need a
>    custom backing store, write a connector, not a fork.
> 3. **Chain is the source of truth.** The node is auth + cache. Treat
>    your DIDs like Git commits — they live on the chain, not in your
>    database.
>
> Repo is public. Fork it, point it at your own node, extend it. The total
> custom code is ~600 lines of TypeScript, mostly glue. Questions?"

---

## Q&A — likely technical questions

**Q: How does the service-account singleton survive across Vercel
serverless invocations?**
A: It doesn't. Module-scope cache lives only as long as a Lambda instance.
Cold start = re-auth. For our traffic that's fine. For hot paths you'd
move the cache to Redis/Upstash and key it by env. Vercel KV would work.

**Q: What happens if two requests trigger login simultaneously?**
A: `TwinNodeAuthManager` stores the in-flight Promise on `authPromise`.
Concurrent calls await the same Promise; only one HTTP login fires. Look
at `getToken()`.

**Q: Why JWT in a cookie and not Authorization header from the browser?**
A: HttpOnly cookies aren't readable by JS — XSS can't steal the token.
Authorization header from the browser would mean the JS holds the token,
which is more dangerous. The proxy reads the cookie server-side and adds
the Authorization header on the outbound call.

**Q: Why force-dynamic? Couldn't you just SSG?**
A: SSG bakes the prefetched JSON into the HTML at build time. If the
service token were ever serialized into a Server Component output, it'd
end up in static HTML. `force-dynamic` removes that risk and also keeps
the data fresh. Build-time prefetch + dynamic page-shell would be more
optimal but isn't worth the extra complexity here.

**Q: How are DID Documents actually stored on IOTA Rebased?**
A: As Move objects with deterministic content schema. The
`IotaIdentityConnector` serializes the DID Document to a Move object and
publishes it; resolution reads the object by ID. The on-chain object is
the canonical version. Look at `@iota/identity-wasm` for the
serialization rules.

**Q: What if I want to write to the node from the browser (not server-side)?**
A: Don't. Always proxy. Two reasons: (1) CORS — TWIN nodes have strict
origin policies. (2) Token hygiene — once a JWT enters the browser it can
leak. The pattern is: browser hits your Next.js route → route calls node.

**Q: Connector pattern — is it `Inversify`-style DI?**
A: Closer to a Factory + Service Locator. `Factory.register('identity',
new IotaIdentityConnector())` then components resolve from the factory.
Not a runtime DI container. Look at `@twin.org/core` for the factory
class. It works because TWIN compiles to ESM and module init is the wiring
phase.

**Q: How do I run all this locally?**
A: Three steps. (1) Clone, `npm install`. (2) Set
`TWIN_NODE_URL=http://localhost:3000` (or wherever your node runs).
(3) `npm run dev`. README has the table. For a local node, see the
`identity-management` repo.

**Q: What's the testnet vs mainnet story?**
A: TWIN nodes are configured per network. Same engine, different chain
endpoints. DIDs minted on testnet don't exist on mainnet — they're
separate ledgers. Plan migrations accordingly.

**Q: Logging endpoint exposes audit data — security risk?**
A: Yes if you expose it without scope checks. The tour exposes it because
the service account has `tenant-admin`. In a multi-tenant deployment
you'd scope reads to your tenant. The node enforces this via the JWT
claims, not at the proxy layer.

---

## If running long

Cut in this order:

1. **Section 7 (audit log)** — least architectural content.
2. **Section 6b (private profile)** — adds little to the public/private
   delta you already explained in Section 4.
3. **Section 8 (missing modules)** — keep the slide visible but skip the
   per-module commentary; let them read.

Never cut: **Architecture card** (Section 1), **Auth flow** (Section 3),
**Signature demo** (Section 5). Those three are the conceptual core.
