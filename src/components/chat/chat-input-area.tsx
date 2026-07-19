import { useCallback, useMemo } from "react";
import {
    Attachment,
    AttachmentPreview,
    AttachmentRemove,
    Attachments,
    type AttachmentData,
} from "@/components/ai-elements/attachments";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
    PromptInput,
    PromptInputActionAddAttachments,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputBody,
    PromptInputFooter,
    PromptInputHeader,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
    usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { useChatStore } from "./store/use-chat-store";
import type { ChatStatus } from "ai";
import { ModelSelectorDropdown } from "./model-selector-dropdown";
import { toast } from "sonner";

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

interface ChatInputAreaProps {
    sendMessage: (text: string) => void;
    chatStatus: ChatStatus;
}

export const ChatInputArea = ({ sendMessage, chatStatus }: ChatInputAreaProps) => {
    const {
        input,
        setInput,
        isLoadingModel,
        model,
    } = useChatStore();

    const handleTextChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(event.target.value);
        },
        [setInput]
    );

    const handleTranscriptionChange = useCallback(
        (transcript: string) => {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        [setInput]
    );

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

    const isSubmitDisabled = useMemo(
        () =>
            !(input || "").trim() ||
            chatStatus === "streaming" ||
            chatStatus === "submitted" ||
            isLoadingModel ||
            !model,
        [input, chatStatus, isLoadingModel, model]
    );

    return (
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
                        {/* Model selector dropdown component */}
                        <ModelSelectorDropdown />
                    </PromptInputTools>
                    <PromptInputSubmit disabled={isSubmitDisabled} status={chatStatus} />
                </PromptInputFooter>
            </PromptInput>
        </div>
    );
};
