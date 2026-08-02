import { streamText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { getSystemPrompt, checkRateLimit, getAgentTools } from "@/lib/agent";
import { requestGravityAd, GRAVITY_AD_MARKER } from "@/lib/gravity";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Agent is not configured yet. Check back later!" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error:
          "Rate limit reached. Try again tomorrow, or reach out directly at gabrielkeller@utexas.edu",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json();
    const { messages, timezone, greeting } = body;

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Cap conversation length (prevent token abuse)
    const trimmed = messages.slice(-30);

    // Cap individual message length
    for (const msg of trimmed) {
      if (typeof msg.content === "string" && msg.content.length > 1000) {
        msg.content = msg.content.slice(0, 1000);
      }
    }

    // Ad request runs in parallel with the model call (Gravity's intended
    // pattern) so it adds zero user-perceived latency. Null when ads are
    // disabled (main deployment) or for the auto-greeting. Never throws.
    const adPromise = greeting
      ? null
      : requestGravityAd(
          { body, headers: Object.fromEntries(req.headers) },
          trimmed,
        );

    const result = streamText({
      // gemini-2.0-flash was retired by Google on 2026-06-01. gemini-2.5-flash-lite
      // is the like-for-like replacement: same $0.10/$0.40 per-1M pricing as the
      // retired model, supports tool calling, and stays on the existing GCP key.
      model: google("gemini-2.5-flash-lite"),
      system: getSystemPrompt(
        typeof timezone === "string" ? timezone : undefined,
      ),
      messages: trimmed,
      tools: getAgentTools(ip),
      stopWhen: stepCountIs(2),
      temperature: 0.6,
      maxOutputTokens: 512,
      onError: ({ error }) => console.error("[agent] stream error:", error),
    });

    // Stream text to client, drive tool execution via fullStream.
    // Inject green badge when a real tool call fires.
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      let wroteText = false;
      try {
        let badgeSent = false;
        for await (const part of result.fullStream) {
          if (part.type === "tool-call" && !badgeSent) {
            await writer.write(encoder.encode("📫 message sent\n"));
            badgeSent = true;
          }
          if (part.type === "text-delta") {
            // Only mark text as written once the write actually succeeds, so a
            // failed write (e.g. client disconnect) still triggers the fallback.
            await writer.write(encoder.encode(part.text));
            wroteText = true;
          }
          // The model call can fail mid-stream (e.g. a retired model, quota, or
          // a transient upstream error). The SDK surfaces this as an error part
          // rather than throwing, so re-throw to hit the fallback below instead
          // of closing the stream with an empty body.
          if (part.type === "error") {
            throw part.error;
          }
        }

        // Model text is done — append the ad (if any) as a marker-delimited
        // JSON tail the terminal splits back out. By now the parallel ad
        // request has almost always resolved (3s timeout vs. a full LLM
        // stream), so this await is ~free.
        if (adPromise && wroteText) {
          const adResult = await adPromise;
          console.log(
            `[gravity] status=${adResult.status} elapsed=${adResult.elapsed}ms ads=${adResult.ads?.length ?? 0}${adResult.error ? ` error=${adResult.error}` : ""}`,
          );
          const ad = adResult.ads?.[0];
          if (ad) {
            await writer.write(
              encoder.encode(`\n${GRAVITY_AD_MARKER}${JSON.stringify(ad)}`),
            );
          }
        }
      } catch (err) {
        console.error("[agent] stream error:", err);
        // Don't leave the visitor staring at "(no response)" — say something.
        // The write can itself fail if the client has already gone away, in
        // which case there's nothing left to tell them, so swallow it.
        if (!wroteText) {
          try {
            await writer.write(
              encoder.encode(
                "The agent hit a snag reaching its model. Try again in a moment, or reach out directly at gabrielkeller@utexas.edu",
              ),
            );
          } catch {
            /* client disconnected — nothing to write to */
          }
        }
      } finally {
        // close() throws if the stream already errored (e.g. client aborted).
        await writer.close().catch(() => {});
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err: unknown) {
    console.error("[agent] Error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
