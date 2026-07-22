"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    Trash2,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ChatHistoryItem {
    id: string;
    title: string;
    model: string;
    createdAt: string;
    updatedAt: string;
}

export default function ChatHistoryPage() {
    const router = useRouter();
    const [chats, setChats] = React.useState<ChatHistoryItem[]>([]);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const deferredSearch = React.useDeferredValue(search);
    const [loading, setLoading] = React.useState(true);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
        setLoading(true);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setLoading(true);
    };

    React.useEffect(() => {
        let isMounted = true;

        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: "20",
            search: deferredSearch,
        });

        fetch(`/api/chats/history?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load chat history");
                return res.json();
            })
            .then((data) => {
                if (isMounted) {
                    setChats(data.chats || []);
                    setTotalPages(data.totalPages || 1);
                    setTotal(data.total || 0);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Fetch history error:", err);
                if (isMounted) {
                    toast.error("Failed to load chat history");
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [page, deferredSearch]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete chat");
            toast.success("Chat deleted");
            setChats((prev) => prev.filter((c) => c.id !== id));
            setTotal((prev) => Math.max(0, prev - 1));
        } catch (err) {
            toast.error("Failed to delete chat");
        }
    };

    return (
        <div className="container max-w-5xl py-8 px-4 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chat History</h1>
                    <p className="text-sm text-muted-foreground">
                        View, search, and manage your past AI conversations ({total} total).
                    </p>
                </div>
                <Button onClick={() => router.push("/chat")}>
                    <MessageSquare className="mr-2 size-4" />
                    New Chat
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Search chats by title..."
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-9"
                />
            </div>

            {/* Chat List */}
            {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    Loading chat history...
                </div>
            ) : chats.length === 0 ? (
                <Card className="p-8 text-center">
                    <CardContent className="pt-6 space-y-2">
                        <MessageSquare className="mx-auto size-10 text-muted-foreground opacity-50" />
                        <p className="text-base font-medium">No chat history found</p>
                        <p className="text-sm text-muted-foreground">
                            {deferredSearch
                                ? "No chats matched your search term."
                                : "You haven't started any chats yet."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {chats.map((chat) => (
                        <Card
                            key={chat.id}
                            className="cursor-pointer transition-colors hover:bg-accent/50 group"
                            onClick={() => router.push(`/chat/${chat.id}`)}
                        >
                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-1 overflow-hidden pr-4">
                                    <CardTitle className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                                        {chat.title}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {new Date(chat.updatedAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span>•</span>
                                        <span className="uppercase text-[10px] tracking-wider font-mono">
                                            {chat.model.split("/").pop()}
                                        </span>
                                    </CardDescription>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        className="inline-flex size-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">Actions</span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => handleDelete(chat.id, e)}
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                        >
                            <ChevronLeft className="mr-1 size-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                        >
                            Next
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
