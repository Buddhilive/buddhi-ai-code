import { useCallback } from "react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

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

const SuggestionItem = ({
    suggestion,
    onClick,
}: {
    suggestion: string;
    onClick: (suggestion: string) => void;
}) => {
    const handleSelect = useCallback(() => {
        onClick(suggestion);
    }, [onClick, suggestion]);

    return <Suggestion onClick={handleSelect} suggestion={suggestion} />;
};

interface SuggestionsListProps {
    onSuggestionClick: (suggestion: string) => void;
}

export const SuggestionsList = ({ onSuggestionClick }: SuggestionsListProps) => {
    return (
        <Suggestions className="px-4">
            {suggestions.map((suggestion) => (
                <SuggestionItem
                    key={suggestion}
                    onClick={onSuggestionClick}
                    suggestion={suggestion}
                />
            ))}
        </Suggestions>
    );
};
