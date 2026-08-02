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

export function gravityAdsEnabled(): boolean {
  return (
    process.env.GRAVITY_ADS_ENABLED === "1" && !!process.env.GRAVITY_API_KEY
  );
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
  client ??= new Gravity({
    production: process.env.GRAVITY_ADS_PRODUCTION === "1",
    timeoutMs: 3000,
    // Optional endpoint override — lets local dev point at a mock ad server
    ...(process.env.GRAVITY_API_URL
      ? { gravityApi: process.env.GRAVITY_API_URL }
      : {}),
  });
  return client.getAds(req, messages, PLACEMENT);
}
