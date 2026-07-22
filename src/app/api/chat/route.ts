import { streamText, UIMessage, convertToModelMessages, createUIMessageStreamResponse, toUIMessageStream } from "ai";
import { lmstudio } from "@/lib/lmstudio";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const {
        messages,
        model,
        reasoningEnabled = true,
        chatId,
        // webSearch,
    }: {
        messages: UIMessage[];
        model: string;
        reasoningEnabled?: boolean;
        chatId?: string;
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
            onFinish: async ({ response }) => {
                if (chatId) {
                    try {
                        const { saveMessages } = await import("@/lib/db/queries");
                        // Combine existing messages with assistant's response message
                        const fullMessages: UIMessage[] = [
                            ...messages,
                            {
                                id: response.id || `assistant-${Date.now()}`,
                                role: "assistant",
                                parts: response.messages.flatMap((m) =>
                                    typeof m.content === "string"
                                        ? [{ type: "text" as const, text: m.content }]
                                        : (m.content as any[])
                                ),
                            },
                        ];
                        await saveMessages(chatId, fullMessages);
                    } catch (err) {
                        console.error("Failed to save chat messages in onFinish:", err);
                    }
                }
            },
        });

        // send sources and reasoning back to the client
        return createUIMessageStreamResponse({
            stream: toUIMessageStream({
                stream: result.stream,
                sendSources: true,
                sendReasoning: reasoningEnabled,
            }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred while communicating with the model." },
            { status: 500 }
        );
    }
}

