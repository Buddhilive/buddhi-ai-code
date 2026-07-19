import { useCallback, useMemo } from "react";
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
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { CheckIcon } from "lucide-react";
import { useChatStore, type Model } from "./store/use-chat-store";

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

export const ModelSelectorDropdown = () => {
    const {
        model,
        modelSelectorOpen,
        setModelSelectorOpen,
        availableModels,
        modelsLoading,
        modelsError,
        isLoadingModel,
        handleModelSelect,
    } = useChatStore();

    const selectedModelData = useMemo(
        () => availableModels.find((m) => m.id === model),
        [model, availableModels]
    );

    return (
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
    );
};
