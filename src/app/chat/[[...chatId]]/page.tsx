"use client";

import {
    Attachment,
    AttachmentPreview,
    AttachmentRemove,
    Attachments,
    type AttachmentData,
} from "@/components/ai-elements/attachments";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
    Message,
    MessageContent,
    MessageResponse,
} from "@/components/ai-elements/message";
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorName,
    ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
    PromptInput,
    PromptInputActionAddAttachments,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputBody,
    PromptInputButton,
    PromptInputFooter,
    PromptInputHeader,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
    usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
    Source,
    Sources,
    SourcesContent,
    SourcesTrigger,
} from "@/components/ai-elements/sources";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { CheckIcon, GlobeIcon } from "lucide-react";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";

interface Model {
    id: string;
    name: string;
    loaded?: boolean;
}

const suggestions = [
    "What are the latest trends in AI?",
    "How does machine learning work?",
    "Explain quantum computing",
    "Best practices for React development",
    "Tell me about TypeScript benefits",
    "How to optimize database queries?",
    "What is the difference between SQL and NoSQL?",
    "Explain cloud computing basics",
];

const AttachmentItem = ({
    attachment,
    onRemove,
}: {
    attachment: AttachmentData;
    onRemove: (id: string) => void;
}) => {
    const handleRemove = useCallback(() => {
        onRemove(attachment.id);
    }, [onRemove, attachment.id]);

    return (
        <Attachment data={attachment} onRemove={handleRemove}>
            <AttachmentPreview />
            <AttachmentRemove />
        </Attachment>
    );
};

const PromptInputAttachmentsDisplay = () => {
    const attachments = usePromptInputAttachments();

    const handleRemove = useCallback(
        (id: string) => {
            attachments.remove(id);
        },
        [attachments]
    );

    if (attachments.files.length === 0) {
        return null;
    }

    return (
        <Attachments variant="inline">
            {attachments.files.map((attachment) => (
                <AttachmentItem
                    attachment={attachment}
                    key={attachment.id}
                    onRemove={handleRemove}
                />
            ))}
        </Attachments>
    );
};

const SuggestionItem = ({
    suggestion,
    onClick,
}: {
    suggestion: string;
    onClick: (suggestion: string) => void;
}) => {
    const handleClick = useCallback(() => {
        onClick(suggestion);
    }, [onClick, suggestion]);

    return <Suggestion onClick={handleClick} suggestion={suggestion} />;
};

const ModelItem = ({
    m,
    isSelected,
    onSelect,
}: {
    m: Model;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) => {
    const handleSelect = useCallback(() => {
        onSelect(m.id);
    }, [onSelect, m.id]);

    return (
        <ModelSelectorItem onSelect={handleSelect} value={m.id}>
            <ModelSelectorName>{m.name || m.id}</ModelSelectorName>
            {isSelected ? (
                <CheckIcon className="ml-auto size-4" />
            ) : (
                <div className="ml-auto size-4" />
            )}
        </ModelSelectorItem>
    );
};

export default function ChatPage() {
    const [model, setModel] = useState<string>("google/gemma-4-12b-qat");
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
    const [isLoadingModel, setIsLoadingModel] = useState(false);

    // Model fetching state
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelsError, setModelsError] = useState<string | null>(null);

    const loadModel = useCallback(async (modelId: string) => {
        setIsLoadingModel(true);
        toast.loading(`Loading model…`, { id: "model-load" });
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
                // Update loaded flag in list
                setAvailableModels((prev) =>
                    prev.map((m) => (m.id === modelId ? { ...m, loaded: true } : m))
                );
            }
        } catch {
            toast.error("Failed to load model", { id: "model-load" });
        } finally {
            setIsLoadingModel(false);
        }
    }, []);

    useEffect(() => {
        const fetchModels = async () => {
            setModelsLoading(true);
            try {
                const res = await fetch("/api/models");
                const data = await res.json();
                if (data.error) {
                    setModelsError(data.error);
                } else {
                    setAvailableModels(data.models);
                    if (data.models.length > 0) {
                        // const firstLoaded = data.models.find((m: Model) => m.loaded);
                        // const first = firstLoaded || data.models[0];
                        // setModel(first.id);
                        // // Auto-load if no model is currently loaded
                        // if (!firstLoaded) {
                        //     loadModel(first.id);
                        // }
                    }
                }
            } catch (err) {
                setModelsError("Failed to fetch models");
            } finally {
                setModelsLoading(false);
            }
        };
        fetchModels();
    }, [loadModel]);

    const [input, setInput] = useState("");
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | { target: { value: string } }) => {
        setInput(e.target.value);
    }, []);

    const modelRef = useRef(model);
    useEffect(() => {
        modelRef.current = model;
    }, [model]);

    // Stable transport — created once; body is a fn so it always reads the latest model from ref
    const transport = useMemo(() => new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model: modelRef.current }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);

    const { messages, sendMessage: chatSendMessage, status: chatStatus } = useChat({
        id: "chat",
        transport,
    });

    const sendMessage = useCallback((text: string) => {
        chatSendMessage({ text });
    }, [chatSendMessage]);

    const selectedModelData = useMemo(
        () => availableModels.find((m) => m.id === model),
        [model, availableModels]
    );

    const handleModelSelect = useCallback((modelId: string) => {
        setModel(modelId);
        setModelSelectorOpen(false);
        const selected = availableModels.find((m) => m.id === modelId);
        if (selected && !selected.loaded) {
            loadModel(modelId);
        }
    }, [availableModels, loadModel]);

    const handleSubmit = useCallback(
        (message: PromptInputMessage) => {
            const hasText = Boolean(message.text?.trim());
            const hasAttachments = Boolean(message.files?.length);

            if (!(hasText || hasAttachments)) {
                return;
            }

            if (message.files?.length) {
                toast.success("Files attached", {
                    description: `${message.files.length} file(s) attached to message`,
                });
            }

            sendMessage(message.text?.trim() || "Sent with attachments");
            setInput("");
        },
        [sendMessage, setInput]
    );

    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            sendMessage(suggestion);
        },
        [sendMessage]
    );

    const handleTranscriptionChange = useCallback((transcript: string) => {
        handleInputChange({ target: { value: input ? `${input} ${transcript}` : transcript } } as any);
    }, [input, handleInputChange]);

    const handleTextChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            handleInputChange(event);
        },
        [handleInputChange]
    );

    const toggleWebSearch = useCallback(() => {
        setUseWebSearch((prev) => !prev);
    }, []);

    const isSubmitDisabled = useMemo(
        () => !(input || "").trim() || chatStatus === "streaming" || chatStatus === "submitted" || isLoadingModel || !model,
        [input, chatStatus, isLoadingModel, model]
    );

    return (
        <div className="relative flex h-[calc(100vh-80px)] flex-col divide-y overflow-hidden">
            <Conversation>
                <ConversationContent>
                    {messages.map((message) => (
                        <Message
                            from={message.role === "user" ? "user" : "assistant"}
                            key={message.id}
                        >
                            <div>
                                <MessageContent>
                                    <MessageResponse>
                                        {message.parts
                                            .filter((p: any) => p.type === 'text')
                                            .map((p: any) => p.text)
                                            .join('') || ""}
                                    </MessageResponse>
                                </MessageContent>
                            </div>
                        </Message>
                    ))}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>
            <div className="grid shrink-0 gap-4 pt-4">
                <Suggestions className="px-4">
                    {suggestions.map((suggestion) => (
                        <SuggestionItem
                            key={suggestion}
                            onClick={handleSuggestionClick}
                            suggestion={suggestion}
                        />
                    ))}
                </Suggestions>
                <div className="w-full px-4 pb-4">
                    <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                        <PromptInputHeader>
                            <PromptInputAttachmentsDisplay />
                        </PromptInputHeader>
                        <PromptInputBody>
                            <PromptInputTextarea onChange={handleTextChange} value={input} />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools>
                                <PromptInputActionMenu>
                                    <PromptInputActionMenuTrigger />
                                    <PromptInputActionMenuContent>
                                        <PromptInputActionAddAttachments />
                                    </PromptInputActionMenuContent>
                                </PromptInputActionMenu>
                                <SpeechInput
                                    className="shrink-0"
                                    onTranscriptionChange={handleTranscriptionChange}
                                    size="icon-sm"
                                    variant="ghost"
                                />
                                {/* Web search disabled for LM Studio
                                <PromptInputButton
                                    onClick={toggleWebSearch}
                                    variant={useWebSearch ? "default" : "ghost"}
                                >
                                    <GlobeIcon size={16} />
                                    <span>Search</span>
                                </PromptInputButton>
                                */}
                                {/*
                                <ModelSelector
                                    onOpenChange={setModelSelectorOpen}
                                    open={modelSelectorOpen}
                                >
                                    <ModelSelectorTrigger render={<PromptInputButton />}>
                                        <ModelSelectorName>
                                            {isLoadingModel
                                                ? "Loading model…"
                                                : selectedModelData?.name || selectedModelData?.id || (modelsLoading ? "Loading models..." : "Select a model")}
                                        </ModelSelectorName>
                                    </ModelSelectorTrigger>
                                    <ModelSelectorContent>
                                        <ModelSelectorInput placeholder="Search models..." />
                                        <ModelSelectorList>
                                            {modelsLoading && <div className="p-2 text-sm text-muted-foreground">Loading models...</div>}
                                            {modelsError && <div className="p-2 text-sm text-destructive">{modelsError}</div>}
                                            {!modelsLoading && !modelsError && availableModels.length === 0 && (
                                                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                                            )}
                                            {!modelsLoading && availableModels.length > 0 && (
                                                <>
                                                    {availableModels.some((m) => m.loaded) && (
                                                        <ModelSelectorGroup heading="Loaded">
                                                            {availableModels.filter((m) => m.loaded).map((m) => (
                                                                <ModelItem
                                                                    isSelected={model === m.id}
                                                                    key={m.id}
                                                                    m={m}
                                                                    onSelect={handleModelSelect}
                                                                />
                                                            ))}
                                                        </ModelSelectorGroup>
                                                    )}
                                                    {availableModels.some((m) => !m.loaded) && (
                                                        <ModelSelectorGroup heading="Available (click to load)">
                                                            {availableModels.filter((m) => !m.loaded).map((m) => (
                                                                <ModelItem
                                                                    isSelected={model === m.id}
                                                                    key={m.id}
                                                                    m={m}
                                                                    onSelect={handleModelSelect}
                                                                />
                                                            ))}
                                                        </ModelSelectorGroup>
                                                    )}
                                                </>
                                            )}
                                        </ModelSelectorList>
                                    </ModelSelectorContent>
                                </ModelSelector>
                                */}
                            </PromptInputTools>
                            <PromptInputSubmit disabled={isSubmitDisabled} status={chatStatus} />
                        </PromptInputFooter>
                    </PromptInput>
                </div>
            </div>
        </div>
    );
}
