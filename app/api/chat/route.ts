import { streamText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { getSystemPrompt, checkRateLimit, getAgentTools } from "@/lib/agent";

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

  const city = req.headers.get("x-vercel-ip-city") ?? undefined;
  const region = req.headers.get("x-vercel-ip-country-region") ?? undefined;

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
      system: getSystemPrompt(
        typeof timezone === "string" ? timezone : undefined,
        (city || region) ? { city, region } : undefined,
      ),
      messages: trimmed,
      tools: getAgentTools(ip),
      stopWhen: stepCountIs(2),
      temperature: 0.6,
      maxOutputTokens: 512,
    });

    // Stream text to client, drive tool execution via fullStream.
    // Inject green badge when a real tool call fires.
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      try {
        let badgeSent = false;
        for await (const part of result.fullStream) {
          if (part.type === "tool-call" && !badgeSent) {
            await writer.write(encoder.encode("📫 message sent\n"));
            badgeSent = true;
          }
          if (part.type === "text-delta") {
            await writer.write(encoder.encode(part.text));
          }
        }
      } catch (err) {
        console.error("[agent] stream error:", err);
      } finally {
        await writer.close();
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
