export async function register() {
  if (process.env.BRAINTRUST_API_KEY) {
    const { initBraintrustLogger } = await import("@/lib/braintrust");
    initBraintrustLogger();
  }
}
