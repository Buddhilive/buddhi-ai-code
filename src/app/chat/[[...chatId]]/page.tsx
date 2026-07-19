"use client";

import { useChatStore } from "@/components/chat/store/use-chat-store";
import { MessageList } from "@/components/chat/message-list";
import { SuggestionsList } from "@/components/chat/suggestions-list";
import { ChatInputArea } from "@/components/chat/chat-input-area";
import { useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function ChatPage() {
    const { model, fetchModels, reasoningEnabled } = useChatStore();

    // Fetch models on load
    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    // Stable transport — recreated only when model or reasoningEnabled changes
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                body: { model, reasoningEnabled },
            }),
        [model, reasoningEnabled]
    );

    const { messages, sendMessage: chatSendMessage, status: chatStatus } = useChat({
        id: "chat",
        transport,
    });

    const sendMessage = useCallback(
        (text: string) => {
            chatSendMessage({ text });
        },
        [chatSendMessage]
    );

    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            sendMessage(suggestion);
        },
        [sendMessage]
    );

    return (
        <div className="relative flex h-[calc(100vh-80px)] flex-col divide-y overflow-hidden">
            <MessageList messages={messages} reasoningEnabled={reasoningEnabled} chatStatus={chatStatus} />
            <div className="grid shrink-0 gap-4 pt-4">
                <SuggestionsList onSuggestionClick={handleSuggestionClick} />
                <ChatInputArea sendMessage={sendMessage} chatStatus={chatStatus} />
            </div>
        </div>
    );
}
