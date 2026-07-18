import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use LM Studio's native API which lists ALL downloaded models (loaded + unloaded)
    // Falls back to the OpenAI-compat endpoint if native API isn't available
    const nativeResponse = await fetch("http://localhost:1234/api/v1/models", {
      cache: "no-store",
    });

    if (nativeResponse.ok) {
      const data = await nativeResponse.json();
      // Native API returns { data: [...] } with loaded_instances info
      const models = (data.data || []).map((m: any) => ({
        id: m.id,
        name: m.id,
        loaded: (m.loaded_instances ?? 0) > 0 || m.state === "loaded",
      }));
      return NextResponse.json({ models });
    }

    // Fallback: OpenAI-compat endpoint (only loaded models)
    const compatResponse = await fetch("http://localhost:1234/v1/models", {
      cache: "no-store",
    });

    if (!compatResponse.ok) {
      throw new Error(`LM Studio returned status: ${compatResponse.status}`);
    }

    const data = await compatResponse.json();
    const models = (data.data || []).map((m: any) => ({
      id: m.id,
      name: m.id,
      loaded: true, // If returned by /v1/models it's definitely loaded
    }));
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Failed to fetch LM Studio models:", error);
    return NextResponse.json({
      models: [],
      error: "LM Studio is not running or unreachable",
    });
  }
}
