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
import type { UIMessage } from "ai";

interface MessageListProps {
    messages: UIMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
    return (
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
                                        .filter((p) => p.type === "text")
                                        .map((p) => p.text)
                                        .join("")}
                                </MessageResponse>
                            </MessageContent>
                        </div>
                    </Message>
                ))}
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>
    );
};
