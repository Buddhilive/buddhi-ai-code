"use client";

import { useChatStore } from "@/components/chat/store/use-chat-store";
import { MessageList } from "@/components/chat/message-list";
import { SuggestionsList } from "@/components/chat/suggestions-list";
import { ChatInputArea } from "@/components/chat/chat-input-area";
import { useEffect, useMemo, useCallback, useState, use } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2 } from "lucide-react";

export default function ChatPage({ params }: { params: Promise<{ chatId?: string[] }> }) {
    const resolvedParams = use(params);
    const chatIdFromUrl = resolvedParams.chatId?.[0] || null;

    const { model, fetchModels, reasoningEnabled, setCurrentChatId, fetchRecentChats } = useChatStore();

    const [fetchedChatId, setFetchedChatId] = useState<string | null>(null);
    const isFetching = Boolean(chatIdFromUrl && fetchedChatId !== chatIdFromUrl);

    // Update currentChatId in store when URL param changes
    useEffect(() => {
        setCurrentChatId(chatIdFromUrl);
    }, [chatIdFromUrl, setCurrentChatId]);

    // Stable transport — recreated only when model, reasoningEnabled, or chatIdFromUrl changes
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                body: { model, reasoningEnabled, chatId: chatIdFromUrl },
            }),
        [model, reasoningEnabled, chatIdFromUrl]
    );

    const { messages, setMessages, sendMessage: chatSendMessage, status: chatStatus } = useChat({
        id: chatIdFromUrl || "new-chat",
        transport,
        onFinish: () => {
            fetchRecentChats();
        },
    });

    // Fetch saved messages when chatId is present in URL or clear messages if starting a new chat
    useEffect(() => {
        if (!chatIdFromUrl) {
            setMessages([]);
            setFetchedChatId(null);
            return;
        }

        let isMounted = true;

        fetch(`/api/chats/${chatIdFromUrl}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load chat");
                return res.json();
            })
            .then((data) => {
                if (isMounted) {
                    setMessages(data.messages || []);
                    setFetchedChatId(chatIdFromUrl);
                }
            })
            .catch((err) => {
                console.error("Error loading chat:", err);
                if (isMounted) {
                    setMessages([]);
                    setFetchedChatId(chatIdFromUrl);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [chatIdFromUrl, setMessages]);

    // Fetch models on load
    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const sendMessage = useCallback(
        async (text: string) => {
            let activeChatId = chatIdFromUrl;

            // If starting a new conversation (no chatId in URL yet)
            if (!activeChatId) {
                try {
                    const res = await fetch("/api/chats", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: text, model }),
                    });
                    const data = await res.json();
                    if (data.chatId) {
                        activeChatId = data.chatId;
                        setCurrentChatId(activeChatId);
                        // Update route smoothly without full navigation/unmount
                        window.history.replaceState(null, "", `/chat/${activeChatId}`);
                        fetchRecentChats();
                    }
                } catch (err) {
                    console.error("Failed to create chat in DB:", err);
                }
            }

            chatSendMessage(
                { text },
                {
                    body: {
                        chatId: activeChatId,
                    },
                }
            );
        },
        [chatIdFromUrl, model, setCurrentChatId, chatSendMessage, fetchRecentChats]
    );

    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            sendMessage(suggestion);
        },
        [sendMessage]
    );

    if (isFetching) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
