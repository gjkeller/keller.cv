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
| `GRAVITY_ADS_PRODUCTION=1` | **Production ads** — real advertisers, real billing/revenue. Unset ⇒ **test ads** (sample brands like Durable, no charge). Blocked with `publisher_not_approved` until Gravity approves the account. |
| `GRAVITY_RELEVANCY` | Optional relevancy threshold override (0–1). Gravity's test inventory is consumer brands, so the SDK's default 0.2 filters most dev conversations to a 204 no-fill — set `0` on the demo deployment for reliable test-ad fill. |
| `GRAVITY_API_URL` | Optional endpoint override (local mock server in dev). |
| `NEXT_PUBLIC_GRAVITY_PIXEL_ID` | Pixel UUID from dashboard → Settings → Platform Settings. Unset ⇒ no `gr-pix.js` (main site stays clean). Required for attribution + device/geo dashboard metrics. |

## Go-live checklist (test mode)

| Item | Status on `ads.keller.cv` |
|---|---|
| API key in server env | ✅ `GRAVITY_API_KEY` (branch-scoped preview) |
| Ads render in placement | ✅ `keller-cv-terminal` via `TerminalAd` |
| Impressions on visibility | ✅ `useAdTracking` IntersectionObserver ≥50% → `impUrl` |
| Clicks via `clickUrl` | ✅ link href is `ad.clickUrl` only |
| Gravity pixel | ⏳ needs `NEXT_PUBLIC_GRAVITY_PIXEL_ID` |
| Stable `sessionId` | ✅ `gr-session-id` in sessionStorage + `gravityContext()` |
| Device `ua` + `ip` | ✅ client `gravity_context.device` + server IP from `x-forwarded-for` |
| Fail-open | ✅ SDK never throws; chat streams without ad on error/204 |
| Test mode (until approved) | ✅ `GRAVITY_ADS_PRODUCTION` unset + `GRAVITY_RELEVANCY=0` |

Vercel function logs print a one-liner per ad request:
`[gravity] status=… testAd=… session=yes/no user=… ua=… ip=…`

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

**Why the real API never fills on localhost:** Gravity's engine silently
no-fills (204) any request whose `device.ip` is a private/loopback address —
verified 2026-08-02: identical request body fills with a public IP and 204s
with `::1`, even in test-ad mode. Local dev against the real API will
therefore always see `[gravity] status=204`; use the mock server for local
rendering work and a deployed preview for real-fill testing.

## Test ads vs production ads

| | Test (default) | Production (`GRAVITY_ADS_PRODUCTION=1`) |
|---|---|---|
| **Inventory** | Gravity sample brands (Durable, etc.) | Real advertiser campaigns |
| **Billing** | None | Impressions/clicks count toward revenue |
| **Fill rate** | High with `GRAVITY_RELEVANCY=0` | Lower on dev/Gabe-centric chat; higher on consumer topics |
| **Use when** | Demoing integration to Leo, dev | You're ready to monetize live traffic |

To flip to production on `ads.keller.cv`: add `GRAVITY_ADS_PRODUCTION=1` in Vercel (same scope as the other `GRAVITY_*` vars), redeploy, then test with consumer-intent prompts (travel, finance, shopping). You may want to drop `GRAVITY_RELEVANCY=0` so only relevant ads show — expect more 204 no-fills on meta/Gabe questions.
