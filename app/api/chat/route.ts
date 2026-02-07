import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getSystemPrompt, checkRateLimit } from "@/lib/agent";

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
    const { messages, timezone } = await req.json();

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

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: getSystemPrompt(typeof timezone === "string" ? timezone : undefined),
      messages: trimmed,
      temperature: 0.6,
      maxOutputTokens: 512,
    });

    return result.toTextStreamResponse({
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err: unknown) {
    console.error("[agent] Error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
