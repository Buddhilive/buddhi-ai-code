import { streamText, UIMessage, convertToModelMessages, createUIMessageStreamResponse, toUIMessageStream } from "ai";
import { lmstudio } from "@/lib/lmstudio";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const {
        messages,
        model,
        // webSearch,
    }: {
        messages: UIMessage[];
        model: string;
        // webSearch: boolean;
    } = await req.json();

    console.log("RECEIVED BODY MODEL:", model);

    // Guard: reject if no model is specified
    if (!model || model.trim() === "") {
        return NextResponse.json(
            { error: "No model selected. Please select a model before sending a message." },
            { status: 400 }
        );
    }

    try {
        const result = streamText({
            // model: webSearch ? "perplexity/sonar" : model,
            model: lmstudio(model),
            messages: await convertToModelMessages(messages),
            system:
                "You are a helpful assistant that can answer questions and help with tasks",
        });

        // send sources and reasoning back to the client
        return createUIMessageStreamResponse({
            stream: toUIMessageStream({
                stream: result.stream,
                sendSources: true,
                sendReasoning: true,
            }),
        });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred while communicating with the model." },
            { status: 500 }
        );
    }
}
