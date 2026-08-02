"use client";

import Script from "next/script";

declare global {
  interface Window {
    gravity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    GravityPixelObject?: string;
  }
}

/**
 * Gravity publisher pixel — required for attribution, device/geo dashboard
 * metrics, and payouts. Gated by NEXT_PUBLIC_GRAVITY_PIXEL_ID so the main
 * site stays pixel-free unless the ads deployment sets the env var.
 *
 * Docs: https://docs.trygravity.ai/ai-platforms/pixel
 */
export function GravityPixel() {
  const pixelId = process.env.NEXT_PUBLIC_GRAVITY_PIXEL_ID?.trim();
  if (!pixelId) return null;

  return (
    <Script
      id="gravity-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(w,d,t,u,n,a,m){w['GravityPixelObject']=n;w[n]=w[n]||function(){
(w[n].q=w[n].q||[]).push(arguments)},w[n].l=1*new Date();a=d.createElement(t),
m=d.getElementsByTagName(t)[0];a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
}(window,document,'script','https://code.trygravity.ai/gr-pix.js','gravity');
gravity('init', ${JSON.stringify(pixelId)});
`,
      }}
    />
  );
}
