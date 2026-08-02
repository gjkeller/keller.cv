# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a single Next.js 15 application (portfolio website with an interactive terminal emulator). There are no external services, databases, or Docker containers required. The only API route (`/api/chat`) calls the Google Gemini API for the AI agent feature, which is optional.

### Quick Reference

- **Package manager:** pnpm 10.15.0 (specified in `package.json` `packageManager` field)
- **Node version:** 18 (specified in `.nvmrc`)
- **Dev server:** `pnpm dev` → http://localhost:3000
- **Lint:** `pnpm lint`
- **Type-check:** `pnpm type-check`
- **Build:** `pnpm build`

### Non-obvious Notes

- After `pnpm install`, pnpm may warn about ignored build scripts for `sharp` and `unrs-resolver`. Run `pnpm rebuild sharp unrs-resolver` if image optimization fails at runtime.
- The AI agent (`agent` command in the terminal) requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`. Without it the site works fully except the agent returns a "not configured" message.
- The `SLACK_WEBHOOK_URL` env var is also optional (used by the agent's `notify_gabe` tool).
- Gravity ads in the terminal agent are off by default; they require `GRAVITY_ADS_ENABLED=1` + `GRAVITY_API_KEY` and only run on the dedicated ads deployment. See `docs/gravity-ads.md`.
- Braintrust tracing is off by default; set `BRAINTRUST_API_KEY` to trace agent LLM + tool calls. See `docs/agent-observability.md`.
- All content is file-based (markdown in `content/`, data in `lib/data.ts`). No database or migrations needed.
- The dev server compiles on first request, so the first page load after `pnpm dev` takes a few seconds.
