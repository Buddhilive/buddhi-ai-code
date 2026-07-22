"use client";

import { useChatStore } from "@/components/chat/store/use-chat-store";
import { MessageList } from "@/components/chat/message-list";
import { SuggestionsList } from "@/components/chat/suggestions-list";
import { ChatInputArea } from "@/components/chat/chat-input-area";
import { useEffect, useMemo, useCallback, useState, use } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ChatPage({ params }: { params: Promise<{ chatId?: string[] }> }) {
    const resolvedParams = use(params);
    const chatIdFromUrl = resolvedParams.chatId?.[0] || null;

    const { model, fetchModels, reasoningEnabled, setCurrentChatId, fetchRecentChats } = useChatStore();

    // Tracks which chatId's messages are currently loaded.
    // isFetching is derived from this — no synchronous setState needed in the effect.
    const [loadedChatId, setLoadedChatId] = useState<string | null>(null);
    const isFetching = Boolean(chatIdFromUrl && loadedChatId !== chatIdFromUrl);
    const [error, setError] = useState<Error | null>(null);

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
        onError: (err) => {
            console.error("Chat error:", err);
            // Remove partial/incomplete assistant message before showing the error banner
            setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.slice(0, -1);
                return prev;
            });
            setError(err);
        },
    });

    // Fetch saved messages when chatId is present in URL or clear messages if starting a new chat.
    // isFetching is derived from (chatIdFromUrl !== loadedChatId) so no synchronous setState is needed here.
    useEffect(() => {
        if (!chatIdFromUrl) {
            setMessages([]);
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
                    setLoadedChatId(chatIdFromUrl);
                }
            })
            .catch((err) => {
                console.error("Error loading chat:", err);
                if (isMounted) {
                    setMessages([]);
                    setLoadedChatId(chatIdFromUrl);
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
            setError(null);
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

    // --- Message action handlers ---

    const handleEdit = useCallback(
        (editedText: string) => {
            setError(null);

            // Strip last user + assistant pair from thread
            setMessages((prev) => {
                let stripped = [...prev];
                if (stripped[stripped.length - 1]?.role === "assistant") {
                    stripped = stripped.slice(0, -1);
                }
                if (stripped[stripped.length - 1]?.role === "user") {
                    stripped = stripped.slice(0, -1);
                }
                return stripped;
            });

            sendMessage(editedText);
        },
        [setMessages, sendMessage]
    );

    const handleRegenerate = useCallback(() => {
        setError(null);

        // Find last user message text before modifying the array
        let lastUserText = "";
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.role === "user") {
                if (Array.isArray(msg.parts) && msg.parts.length > 0) {
                    lastUserText = msg.parts
                        .filter((p) => p.type === "text")
                        .map((p) => (p as { text?: string }).text || "")
                        .join("");
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    lastUserText = (msg as any).content || "";
                }
                break;
            }
        }

        if (!lastUserText) return;

        // Strip the last assistant + user pair — chatSendMessage will append a fresh
        // user message, so we must remove the original to avoid a duplicate.
        setMessages((prev) => {
            let stripped = [...prev];
            if (stripped[stripped.length - 1]?.role === "assistant") {
                stripped = stripped.slice(0, -1);
            }
            if (stripped[stripped.length - 1]?.role === "user") {
                stripped = stripped.slice(0, -1);
            }
            return stripped;
        });

        sendMessage(lastUserText);
    }, [messages, setMessages, sendMessage]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Copied to clipboard");
        }).catch(() => {
            toast.error("Failed to copy to clipboard");
        });
    }, []);

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
            <MessageList
                messages={messages}
                reasoningEnabled={reasoningEnabled}
                chatStatus={chatStatus}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
                onCopy={handleCopy}
                error={error}
            />
            <div className="grid shrink-0 gap-4 pt-4">
                <SuggestionsList onSuggestionClick={handleSuggestionClick} />
                <ChatInputArea sendMessage={sendMessage} chatStatus={chatStatus} />
            </div>
        </div>
    );
}
