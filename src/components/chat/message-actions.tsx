"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, PencilIcon, RefreshCwIcon, XIcon } from "lucide-react";
import type { ChatStatus } from "ai";
import {
    MessageAction,
    MessageContent,
    MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// UserMessageWithActions
// Renders the user message bubble in normal mode, or an inline edit UI
// when the user clicks "Edit". Actions are visible on hover.
// ---------------------------------------------------------------------------

interface UserMessageWithActionsProps {
    messageText: string;
    chatStatus: ChatStatus;
    onEdit: (editedText: string) => void;
    onRegenerate: () => void;
    onCopy: (text: string) => void;
}

export const UserMessageWithActions = ({
    messageText,
    chatStatus,
    onEdit,
    onRegenerate,
    onCopy,
}: UserMessageWithActionsProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(messageText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isDisabled = chatStatus === "streaming" || chatStatus === "submitted";
    const hasChanged = editText.trim() !== messageText.trim();

    // Auto-focus and position cursor at end when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const ta = textareaRef.current;
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        }
    }, [isEditing]);

    const handleEditClick = useCallback(() => {
        setEditText(messageText);
        setIsEditing(true);
    }, [messageText]);

    const handleSend = useCallback(() => {
        if (!hasChanged) return;
        onEdit(editText.trim());
        setIsEditing(false);
    }, [hasChanged, editText, onEdit]);

    const handleCancel = useCallback(() => {
        setEditText(messageText);
        setIsEditing(false);
    }, [messageText]);

    // --- Edit mode ---
    if (isEditing) {
        return (
            <div className="flex w-full flex-col items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className={cn(
                        "w-full resize-none rounded-lg bg-secondary px-4 py-3 text-sm text-foreground",
                        "min-h-[60px] outline-none ring-1 ring-border focus:ring-ring"
                    )}
                    rows={Math.max(2, editText.split("\n").length)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && hasChanged) {
                            e.preventDefault();
                            handleSend();
                        }
                        if (e.key === "Escape") {
                            handleCancel();
                        }
                    }}
                />
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <XIcon className="mr-1.5 size-3.5" />
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSend} disabled={!hasChanged}>
                        <CheckIcon className="mr-1.5 size-3.5" />
                        Send
                    </Button>
                </div>
            </div>
        );
    }

    // --- Normal (display) mode ---
    return (
        <div className="flex flex-col items-end gap-1.5">
            <MessageContent>
                <MessageResponse>{messageText}</MessageResponse>
            </MessageContent>
            {!isDisabled && (
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <MessageAction tooltip="Edit" onClick={handleEditClick}>
                        <PencilIcon className="size-3.5" />
                    </MessageAction>
                    <MessageAction tooltip="Regenerate" onClick={onRegenerate}>
                        <RefreshCwIcon className="size-3.5" />
                    </MessageAction>
                    <MessageAction tooltip="Copy" onClick={() => onCopy(messageText)}>
                        <CopyIcon className="size-3.5" />
                    </MessageAction>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// AssistantMessageActions
// Copy and Regenerate buttons for the last assistant message.
// Hidden while streaming/submitted.
// ---------------------------------------------------------------------------

interface AssistantMessageActionsProps {
    messageText: string;
    chatStatus: ChatStatus;
    onRegenerate: () => void;
    onCopy: (text: string) => void;
}

export const AssistantMessageActions = ({
    messageText,
    chatStatus,
    onRegenerate,
    onCopy,
}: AssistantMessageActionsProps) => {
    if (chatStatus === "streaming" || chatStatus === "submitted") return null;

    return (
        <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <MessageAction tooltip="Copy" onClick={() => onCopy(messageText)}>
                <CopyIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Regenerate" onClick={onRegenerate}>
                <RefreshCwIcon className="size-3.5" />
            </MessageAction>
        </div>
    );
};
