"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatStore } from "./store/use-chat-store";
import { MessageSquare, MoreHorizontal, Trash2, ArrowRight } from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RecentChats() {
    const pathname = usePathname();
    const { recentChats, totalRecentChats, fetchRecentChats, deleteChat, recentChatsLoading } = useChatStore();

    React.useEffect(() => {
        fetchRecentChats();
    }, [fetchRecentChats]);

    const handleDelete = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        e.preventDefault();
        deleteChat(chatId);
    };

    if (recentChatsLoading && recentChats.length === 0) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
                <div className="px-3 py-2 text-xs text-muted-foreground">Loading chats...</div>
            </SidebarGroup>
        );
    }

    if (recentChats.length === 0) {
        return null;
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
            <SidebarMenu>
                {recentChats.map((chat) => {
                    const href = `/chat/${chat.id}`;
                    const isActive = pathname === href;

                    return (
                        <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton isActive={isActive} tooltip={chat.title} render={<Link href={href} />}>
                                <MessageSquare className="size-4 shrink-0" />
                                <span className="truncate">{chat.title}</span>
                            </SidebarMenuButton>

                            <DropdownMenu>
                                <DropdownMenuTrigger render={<SidebarMenuAction showOnHover />}>
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">More options</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right" align="start">
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => handleDelete(e, chat.id)}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    );
                })}

                {totalRecentChats > 10 && (
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-muted-foreground hover:text-foreground" render={<Link href="/chat/history" />}>
                            <span className="flex items-center gap-2">
                                <span>View More</span>
                                <ArrowRight className="size-3" />
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
