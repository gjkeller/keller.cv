// Intentional re-export: Next.js resolves opengraph-image.tsx and
// twitter-image.tsx as separate route segments, so each file must declare
// its own runtime / dynamic config. The PNG body and metadata are reused
// verbatim from the OG route.
export { default, alt, size, contentType } from "./opengraph-image";
export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;
