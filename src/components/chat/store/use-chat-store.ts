import { create } from "zustand";
import { toast } from "sonner";

export interface Model {
    id: string;
    name: string;
    loaded?: boolean;
}

export interface ChatItem {
    id: string;
    title: string;
    model: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatStore {
    model: string;
    modelSelectorOpen: boolean;
    useWebSearch: boolean;
    isLoadingModel: boolean;
    availableModels: Model[];
    modelsLoading: boolean;
    modelsError: string | null;
    input: string;
    reasoningEnabled: boolean;
    
    // Chat state
    currentChatId: string | null;
    recentChats: ChatItem[];
    totalRecentChats: number;
    recentChatsLoading: boolean;

    // Actions
    setModel: (model: string) => void;
    setModelSelectorOpen: (open: boolean) => void;
    setUseWebSearch: (useWebSearch: boolean | ((prev: boolean) => boolean)) => void;
    setInput: (input: string | ((prev: string) => string)) => void;
    setReasoningEnabled: (reasoningEnabled: boolean | ((prev: boolean) => boolean)) => void;
    setCurrentChatId: (chatId: string | null) => void;
    fetchModels: () => Promise<void>;
    loadModel: (modelId: string) => Promise<void>;
    handleModelSelect: (modelId: string) => void;
    fetchRecentChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    model: "google/gemma-4-12b-qat",
    modelSelectorOpen: false,
    useWebSearch: false,
    isLoadingModel: false,
    availableModels: [],
    modelsLoading: true,
    modelsError: null,
    input: "",
    reasoningEnabled: true,
    currentChatId: null,
    recentChats: [],
    totalRecentChats: 0,
    recentChatsLoading: false,

    setModel: (model) => set({ model }),
    setModelSelectorOpen: (modelSelectorOpen) => set({ modelSelectorOpen }),
    setUseWebSearch: (useWebSearch) =>
        set((state) => ({
            useWebSearch: typeof useWebSearch === "function" ? useWebSearch(state.useWebSearch) : useWebSearch,
        })),
    setInput: (input) =>
        set((state) => ({
            input: typeof input === "function" ? input(state.input) : input,
        })),
    setReasoningEnabled: (reasoningEnabled) =>
        set((state) => ({
            reasoningEnabled: typeof reasoningEnabled === "function" ? reasoningEnabled(state.reasoningEnabled) : reasoningEnabled,
        })),
    setCurrentChatId: (currentChatId) => set({ currentChatId }),

    fetchModels: async () => {
        set({ modelsLoading: true, modelsError: null });
        try {
            const res = await fetch("/api/models");
            const data = await res.json();
            if (data.error) {
                set({ modelsError: data.error, modelsLoading: false });
            } else {
                set({ availableModels: data.models, modelsLoading: false });
            }
        } catch {
            set({ modelsError: "Failed to fetch models", modelsLoading: false });
        }
    },

    loadModel: async (modelId: string) => {
        set({ isLoadingModel: true });
        toast.loading("Loading model…", { id: "model-load" });
        try {
            const res = await fetch("/api/models/load", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: modelId }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                toast.error(data.error || "Failed to load model", { id: "model-load" });
            } else {
                toast.success("Model ready", { id: "model-load" });
                set((state) => ({
                    availableModels: state.availableModels.map((m) =>
                        m.id === modelId ? { ...m, loaded: true } : m
                    ),
                }));
            }
        } catch {
            toast.error("Failed to load model", { id: "model-load" });
        } finally {
            set({ isLoadingModel: false });
        }
    },

    handleModelSelect: (modelId: string) => {
        const { loadModel, availableModels } = get();
        set({ model: modelId, modelSelectorOpen: false });
        const selected = availableModels.find((m) => m.id === modelId);
        if (selected && !selected.loaded) {
            loadModel(modelId);
        }
    },

    fetchRecentChats: async () => {
        set({ recentChatsLoading: true });
        try {
            const res = await fetch("/api/chats");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            set({
                recentChats: data.chats,
                totalRecentChats: data.total,
                recentChatsLoading: false,
            });
        } catch (err) {
            console.error("fetchRecentChats error:", err);
            set({ recentChatsLoading: false });
        }
    },

    deleteChat: async (chatId: string) => {
        try {
            const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete chat");
            toast.success("Chat deleted");
            
            // Remove from store list
            set((state) => ({
                recentChats: state.recentChats.filter((c) => c.id !== chatId),
                totalRecentChats: Math.max(0, state.totalRecentChats - 1),
            }));
        } catch (err) {
            toast.error("Failed to delete chat");
            console.error("deleteChat error:", err);
        }
    },
}));
