import { Gravity } from "@gravity-ai/api";
import type {
  GravityAdsResult,
  IncomingAdRequest,
  MessageObject,
} from "@gravity-ai/api";

/**
 * Gravity ad integration for the terminal agent.
 *
 * Off everywhere by default. The ads deployment (branch `gravity-ads` on
 * Vercel) turns it on with branch-scoped env vars, so the main site never
 * serves ads:
 *
 *   GRAVITY_ADS_ENABLED=1        opt this deployment into ads
 *   GRAVITY_API_KEY=...          from app.trygravity.ai publisher dashboard
 *   GRAVITY_ADS_PRODUCTION=1     real ads + billing; unset = test ads
 *
 * The ad delimits the end of the chat stream: the route appends
 * GRAVITY_AD_MARKER + JSON after the model text, and the terminal splits it
 * back out client-side (see lib/gravity-marker.ts).
 */
export { GRAVITY_AD_MARKER } from "./gravity-marker";

const PLACEMENT = [
  { placement: "below_response" as const, placement_id: "keller-cv-terminal" },
];

function envFlag(name: string): boolean {
  return process.env[name]?.trim() === "1";
}

export function gravityAdsEnabled(): boolean {
  return envFlag("GRAVITY_ADS_ENABLED") && !!process.env.GRAVITY_API_KEY?.trim();
}

// Lazy so the module is inert (and the key unread) when ads are disabled.
let client: Gravity | null = null;

/**
 * Kick off an ad request to run in parallel with the model call — Gravity's
 * intended pattern, so ad latency never adds to user-perceived latency.
 * Returns null when ads are disabled. The SDK call itself never throws and
 * fails open (empty `ads`) on timeout or error.
 */
export function requestGravityAd(
  req: IncomingAdRequest,
  messages: MessageObject[],
): Promise<GravityAdsResult> | null {
  if (!gravityAdsEnabled()) return null;
  // Gravity's test-ad inventory is mostly consumer brands, so the SDK's
  // default 0.2 relevancy threshold filters nearly every dev-tool
  // conversation to a 204 no-fill. GRAVITY_RELEVANCY=0 makes test ads fill
  // reliably on the demo deployment; leave unset in production.
  const relevancy = Number.parseFloat(process.env.GRAVITY_RELEVANCY ?? "");
  const production = envFlag("GRAVITY_ADS_PRODUCTION");
  client ??= new Gravity({
    timeoutMs: 3000,
    ...(Number.isFinite(relevancy) ? { relevancy } : {}),
    // Optional endpoint override — lets local dev point at a mock ad server
    ...(process.env.GRAVITY_API_URL
      ? { gravityApi: process.env.GRAVITY_API_URL }
      : {}),
  });
  // Read production per call — Vercel env values can carry trailing newlines
  // from CLI paste, and the SDK requires production === true (not truthy).
  return client.getAds(req, messages, PLACEMENT, { production });
}
