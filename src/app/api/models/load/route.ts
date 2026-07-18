import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { model } = await req.json();

    if (!model || typeof model !== "string") {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Call LM Studio's native load API (v1)
    const response = await fetch("http://localhost:1234/api/v1/models/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
      // Loading can take time — no timeout set so it relies on Next.js maxDuration
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            (errorData as any)?.error?.message ||
            `LM Studio returned status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, model, data });
  } catch (error) {
    console.error("Failed to load LM Studio model:", error);
    return NextResponse.json(
      { error: "Failed to load model — is LM Studio running?" },
      { status: 500 }
    );
  }
}
