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
- All content is file-based (markdown in `content/`, data in `lib/data.ts`). No database or migrations needed.
- The dev server compiles on first request, so the first page load after `pnpm dev` takes a few seconds.
