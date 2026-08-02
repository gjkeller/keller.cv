"use client";

import type { RefObject } from "react";
import { useAdTracking } from "@gravity-ai/react";
import type { AdResponse } from "@gravity-ai/react";
import type { Theme } from "@/lib/themes";

/**
 * Terminal-native Gravity ad unit.
 *
 * Custom renderer instead of the stock <GravityAd> card so the ad reads like
 * terminal output — Gravity's own docs treat terminals/CLIs as a first-class
 * surface, but their built-in variants are all web-styled cards. Impression
 * (IntersectionObserver) and click tracking still run through the SDK's
 * useAdTracking primitives, so attribution works exactly as it would with
 * the stock component.
 */
export function TerminalAd({ ad, theme }: { ad: AdResponse | null; theme: Theme }) {
  const { containerRef, handleClick } = useAdTracking({ ad });

  if (!ad?.adText) return null;

  const href = ad.clickUrl || ad.url;
  let host = "";
  try {
    host = ad.url ? new URL(ad.url).hostname.replace(/^www\./, "") : "";
  } catch {
    /* malformed landing URL — just omit the hostname hint */
  }

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement>}
      className="mt-2"
      data-testid="gravity-terminal-ad"
    >
      <div style={{ color: theme.termDim }} aria-hidden="true">
        {"── sponsored ─────────────────────────"}
      </div>
      <div style={{ color: theme.termText }}>
        {ad.brandName && <span className="font-semibold">{ad.brandName}: </span>}
        {ad.adText}
      </div>
      {href && (
        <div>
          <a
            href={href}
            target="_blank"
            rel="noopener sponsored"
            onClick={handleClick}
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: theme.accent }}
          >
            {"→ "}
            {ad.cta || "Learn more"}
            {host ? ` (${host})` : ""}
          </a>
        </div>
      )}
      <div style={{ color: theme.termDim }} aria-hidden="true">
        {"──────────────────────────────────────"}
      </div>
    </div>
  );
}
