# Agent observability (Braintrust)

The terminal agent (`/api/chat`) can send traces to [Braintrust](https://www.braintrust.dev/) — LLM calls, tool executions (`notify_gabe`), latency, and token usage. Off everywhere unless opted in via env var (same pattern as Gravity ads).

## Env vars

| Var | Effect |
|---|---|
| `BRAINTRUST_API_KEY` | From [braintrust.dev](https://www.braintrust.dev/) → Settings → API keys, or created by `braintrust-setup` wizard. Unset ⇒ no tracing. |
| `BRAINTRUST_PROJECT_ID` | Optional. Defaults to `fc09d099-3a44-4839-96cf-90cc27f6a515` (keller.cv agent project from onboarding). |

Add both to Vercel → **Production** (and Preview if you want traces on branch deploys). Never commit the key.

## Setup (one-time)

1. Create a free Braintrust account / project.
2. Copy the API key into Vercel env as `BRAINTRUST_API_KEY`.
3. Deploy. Traces appear under the project name within a few seconds of a chat request.

## What gets traced

- `streamText` calls (model, tokens, latency)
- Tool calls (`notify_gabe` → Slack)
- Streaming spans via Braintrust's Vercel AI SDK wrapper (`wrapAISDK`)

Gravity ad requests are still logged server-side as `[gravity] status=…` in Vercel logs; wiring those into Braintrust metadata is a follow-up.

## Local dev

Tracing is off unless `BRAINTRUST_API_KEY` is in `.env.local`. Most local agent work doesn't need it.

## Free tier

Braintrust Starter is $0 with usage limits — enough for a personal-site agent. See [Plans and limits](https://www.braintrust.dev/docs/plans-and-limits).
