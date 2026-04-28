# TWIN Onboarding Tour — Presentation Script

A read-aloud script for walking new joiners through
<https://twin-node-poc.vercel.app/twin-tour>. Total time: **~15 minutes** for
the walk-through plus 10 minutes Q&A.

> Tone notes: keep it concrete. Click as you talk. If a section bores them,
> move on — the URL stays live, they can poke at it after.

---

## 0. Before the meeting (1 min, on your own)

- Open <https://twin-node-poc.vercel.app/twin-tour> in a fresh browser tab so
  the service token is warm.
- Have the GitHub repo ready in another tab:
  <https://github.com/albertolive/twin-node-poc>.
- Confirm `/info` shows TWIN Node `v0.0.3-next.30` (sanity check the node
  is still up).

---

## 1. Opening (1 min)

> "Quick context before we start. TWIN is a stack — not one product. Today
> I'm not going to throw architecture diagrams at you. Instead I built a
> single page that talks to a real, live TWIN node running in our staging
> environment. Every section shows one capability with the actual HTTP call
> and the actual JSON response. Everything is read-only and safe to click.
>
> The URL is in the chat. After the meeting, please play with it. Fork the
> repo if you want to extend it. The whole thing is about 400 lines of code."

**Action:** Share the URL in chat, then share your screen on the page.

---

## 2. Section 1 — Node identity (2 min)

**Click:** Just point at the two JSON blobs already rendered.

> "First thing: every TWIN node exposes `/info` and `/health`. `/info` is
> self-description — the node tells you which version of the stack it runs,
> which modules are loaded, what testnet it's on. This matters because TWIN
> is modular: the same engine can run an identity-only node, a full data-
> space connector node, or anything in between. You always start integration
> by reading `/info`.
>
> `/health` is the liveness check. Boring but essential — your monitoring
> hits this."

> "Notice this node is on the IOTA Rebased testnet. So everything you'll
> see — DIDs, signatures — is anchored to a real public ledger."

---

## 3. Section 2 — JWT auth (2 min)

**Click:** "Load sample token" → "Decode JWT payload"

> "Every authenticated call to a TWIN node carries a JWT. The node mints it
> for you when you log in. I've embedded a sample one because the real
> token never leaves the server in this tour — it lives in an HttpOnly
> cookie.
>
> Look at the decoded payload. The interesting claim is `sub` — that's a
> DID, not a database user ID. So the *identity of the caller* is a public,
> resolvable, decentralized identifier. There's no 'users table' anywhere in
> the node. Authorization happens off the `scope` claim — this one says
> `tenant-admin`."

**Optional sidebar:** "Try pasting just a DID into the input. You'll get an
explanation of why a bare DID isn't a JWT — that's a question newcomers
ask all the time, so I baked the answer into the UI."

---

## 4. Section 3 — DID resolution (2 min)

**Click:** "Resolve DID" with the pre-filled DID.

> "This is where it gets interesting. The DID we just saw in the JWT? Anyone
> in the world can resolve it. Watch."

**Wait for response, then point at `verificationMethod`:**

> "This is the DID Document. The two fields that matter:
>
> - `verificationMethod`: the public keys associated with this identity.
>   These are what you'd use to verify any signature claiming to come from
>   this DID.
> - `service`: where to find more about this identity. In TWIN's case,
>   typically a profile endpoint.
>
> The whole document is committed to IOTA Rebased. Immutable, public,
> resolvable without an API key."

---

## 5. Section 3b — Signature demo (2 min) ⭐ NEW

**Click:** "Sign message" → show signature → "Verify signature" → green.
Then **"Tamper with message"** → "Verify" → red.

> "I want to show you *why* DIDs being public on-chain matters. This card is
> pure browser crypto — no server call. I generated a keypair when the page
> loaded. Watch what happens when I sign this message.
>
> [click Sign — point at signature]
>
> That blob is a digital signature. Anyone with my public key — which is
> right there at the top of the card — can mathematically verify that I, the
> holder of the private key, signed exactly this message. Click Verify.
>
> [click Verify — green]
>
> Now I'll tamper with the message. Just one character.
>
> [click Tamper — message changes]
> [click Verify — red]
>
> Signature broken. The math doesn't lie.
>
> Now connect this back to the previous card. The DID Document we just
> resolved? It contains public keys exactly like this one — except those
> public keys are committed to IOTA. So if I sign a contract with my private
> key, anyone in the world can fetch my DID Document, pull my public key
> off-chain, and verify my signature. **No central authority. No API key.
> No 'trust us, we're the auth provider'.** That's the whole point of
> decentralized identity."

---

## 6. Section 4 + 4b — Profiles (1 min)

**Click:** "Load public profile". Then point at the inline private profile.

> "Two profile endpoints. The public one — left card — anyone can hit. It's
> a schema.org Person fragment. Use it in your UI to render 'who is this
> DID' without leaking private fields.
>
> The private one — right below — is what *you* see about *yourself* when
> you authenticate. Notice it has fields the public one doesn't, like email.
> That's the privacy boundary the node enforces for you."

---

## 7. Section 5 — Audit log (1 min)

**Click:** "Load recent logs"

> "Every request the node handles is logged. You can read it back. We
> expose this in the tour because newcomers always ask 'how do I debug
> integrations?' — answer: this is your friend. In production you'd ship
> these to your observability stack."

---

## 8. Section 6 — What's NOT here (2 min)

**Scroll to the bottom — the dashed cards.**

> "Important honesty moment. The node behind this tour is identity-only by
> configuration. TWIN supports a lot more — and you can see the modules
> right here as links to their GitHub repos.
>
> - **NFT** — mint, transfer, burn on IOTA Rebased.
> - **Attestation** — issue and verify VC-style attestations.
> - **Auditable Item Graph / Stream** — tamper-evident graphs and append-
>   only streams.
> - **Blob storage** — content-addressed file store.
> - **Wallet** — address & balance management.
>
> Every one of these is just an env-var flag away from being live on this
> node. If your project needs one of these, talk to me after the meeting —
> we'll either enable it on this staging node or stand up a richer one for
> your team."

---

## 9. Closing (1 min)

> "Three takeaways:
>
> 1. **TWIN is a real, modular stack.** You're looking at a live node, not
>    a slideware diagram.
> 2. **Identity is foundational.** Even the auth token's subject is a DID.
>    Everything else — NFTs, attestations, data-space activities — points
>    back to DIDs you control.
> 3. **It's all open and inspectable.** The repo for this page is public,
>    the node API is documented, the DID Documents are on-chain. You don't
>    have to take my word for any of this — verify it.
>
> Tour URL stays live. Repo is at `github.com/albertolive/twin-node-poc` —
> fork it, point it at your own node, extend it with the modules your
> project needs. Questions?"

---

## Q&A — likely questions and answers

**Q: Why ECDSA in the signature demo when TWIN uses Ed25519?**
A: Pure browser-support reason — every browser supports ECDSA P-256 in
Web Crypto, Ed25519 is newer. The math is identical in spirit; the curve is
different. Real DID Documents in the tour show Ed25519 keys.

**Q: Can I write to this node?**
A: Yes, the service account is `tenant-admin`. But the tour intentionally
doesn't expose write endpoints — once we mint things on testnet they live
forever. For write demos we'll spin up a sandboxed flow.

**Q: What happens if the node goes down?**
A: Each card surfaces its own error in red. The tour itself stays up
because Next.js renders the shell statically; only the `/info`, `/health`
and own-profile prefetches happen on the server, and they fail
gracefully.

**Q: What's the difference between this tour and `identity-mvp`?**
A: This tour is a *read-only educational walkthrough* of one node. The
`identity-mvp` is a full product — registration flows, GLEIF integration,
multi-tenant. Different audience, different scope. Both talk to TWIN
nodes underneath.

**Q: Can I deploy my own copy?**
A: Yes — clone the repo, set `TWIN_NODE_URL` and `TWIN_NODE_SERVICE_*` env
vars, deploy to Vercel. README has the table.

**Q: Is the service password really in `.env.local`?**
A: For staging, yes. For any production-shaped deployment, you'd inject
secrets via Vercel's env vars (or whatever your platform uses) and never
commit them. `.env.local` is gitignored.

---

## If a section runs long

Cut **Section 7 (audit log)** first — it's the least interesting. Then
**Section 6b (private profile)** — collapsible. Never cut Section 3b
(signature demo); that's the conceptual punchline.
