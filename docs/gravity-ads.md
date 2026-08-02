# Gravity ads on keller.cv

The terminal agent can serve native sponsored suggestions from
[Gravity](https://www.trygravity.ai/) (`@gravity-ai/api` server-side,
`@gravity-ai/react` tracking primitives client-side). Ads are **off by
default everywhere** — the integration only activates on a deployment that
opts in via env vars, so the main site never serves ads.

## How it works

1. `app/api/chat/route.ts` kicks off `requestGravityAd()` (lib/gravity.ts)
   **in parallel** with the Gemini call — Gravity's intended pattern, so ad
   latency adds zero user-perceived latency. Greeting requests
   (`greeting: true`) are excluded.
2. The route streams model text as before, then appends
   `GRAVITY_AD_MARKER` (U+001E + `__GRAVITY_AD__`) followed by the ad JSON.
3. `app/terminal.tsx` splits the marker back out of the stream
   (`splitGravityAd`) and stores the ad on the history entry. It also sends
   `gravity_context` (anonymous visitor/session UUIDs + device signals via
   the SDK's `gravityContext()`) with each chat request.
4. `components/terminal-ad.tsx` renders a **terminal-native ad unit** —
   custom renderer instead of the stock `<GravityAd>` card, styled like
   terminal output with a `── sponsored ──` rule. Impression tracking
   (IntersectionObserver, ≥50% visible) and click attribution still run
   through the SDK's `useAdTracking` + `clickUrl` redirect, identical to the
   stock component.

## Env vars

| Var | Effect |
|---|---|
| `GRAVITY_ADS_ENABLED=1` | Master switch. Unset ⇒ no ad requests at all. |
| `GRAVITY_API_KEY` | Publisher API key from [app.trygravity.ai](https://app.trygravity.ai/publisher/signup). Required. |
| `GRAVITY_ADS_PRODUCTION=1` | Real ads + billing. Unset ⇒ Gravity test ads. |
| `GRAVITY_API_URL` | Optional endpoint override (local mock server in dev). |

## The ads deployment

Goal: a separate deployment serving ads while the main site stays clean.
The code is identical on both — only env differs.

1. Sign up as a publisher at app.trygravity.ai and copy the API key
   (Gabriel does this; the key goes in Vercel, never in the repo).
2. Create branch `gravity-ads` tracking `main` and push it.
3. In Vercel → Project → Settings → Environment Variables, add
   `GRAVITY_ADS_ENABLED=1` and `GRAVITY_API_KEY` scoped to
   **Preview → gravity-ads branch only**.
4. Vercel's branch deployment (`gravity-ads-<project>.vercel.app`, or an
   alias like `ads.keller.cv` via Settings → Domains) now serves ads; leave
   `GRAVITY_ADS_PRODUCTION` unset for test ads until the demo needs real
   fill.
5. Keep `gravity-ads` fresh by fast-forwarding it to `main` when the main
   site changes.

## Local dev with a mock ad server

`.env.development.local` (gitignored) can point the SDK at a mock:

```
GRAVITY_ADS_ENABLED=1
GRAVITY_API_KEY=test-key-local
GRAVITY_API_URL=http://localhost:4573/api/v1/ad
```

A mock server just answers `POST /api/v1/ad` with a JSON array of one ad
object (`adText`, `brandName`, `cta`, `url`, `impUrl`, `clickUrl`) and 200s
the `/track/*` pixel hits. Delete `.env.development.local` to turn ads back
off in dev.
