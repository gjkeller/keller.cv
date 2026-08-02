import * as ai from "ai";

const PROJECT_ID =
  process.env.BRAINTRUST_PROJECT_ID ?? "fc09d099-3a44-4839-96cf-90cc27f6a515";

export function braintrustEnabled(): boolean {
  return !!process.env.BRAINTRUST_API_KEY;
}

let loggerReady = false;
let wrapped: Pick<typeof ai, "streamText"> | null = null;

/** Call once at startup (instrumentation.ts). No-op when unset. */
export function initBraintrustLogger(): void {
  if (!braintrustEnabled() || loggerReady) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initLogger } = require("braintrust") as typeof import("braintrust");
  initLogger({
    apiKey: process.env.BRAINTRUST_API_KEY,
    projectId: PROJECT_ID,
  });
  loggerReady = true;
}

/** streamText from the AI SDK, Braintrust-wrapped when BRAINTRUST_API_KEY is set. */
export function getTracedStreamText(): typeof ai.streamText {
  if (!braintrustEnabled()) return ai.streamText;
  initBraintrustLogger();
  if (!wrapped) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { wrapAISDK } = require("braintrust") as typeof import("braintrust");
    wrapped = wrapAISDK(ai);
  }
  return wrapped.streamText;
}
