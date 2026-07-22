import { db } from "./index";
import { chats, messages } from "./schema";
import { eq, desc, like, count } from "drizzle-orm";
import type { UIMessage } from "ai";

export function truncate(text: string, length: number = 50): string {
    if (!text) return "";
    return text.length > length ? text.slice(0, length) + "..." : text;
}

export async function createChat(id: string, title: string, model: string) {
    const now = new Date();
    const truncatedTitle = truncate(title, 50);
    await db.insert(chats).values({
        id,
        title: truncatedTitle,
        model,
        createdAt: now,
        updatedAt: now,
    });
    return id;
}

export async function getRecentChats(limit: number = 10) {
    const list = db.select().from(chats).orderBy(desc(chats.updatedAt)).limit(limit).all();
    const totalResult = db.select({ count: count() }).from(chats).get();
    return {
        chats: list,
        total: totalResult?.count ?? 0,
    };
}

export async function getChatById(id: string) {
    const chat = db.select().from(chats).where(eq(chats.id, id)).get();
    if (!chat) return null;

    const msgList = db
        .select()
        .from(messages)
        .where(eq(messages.chatId, id))
        .orderBy(messages.createdAt)
        .all();

    return {
        ...chat,
        messages: msgList.map((m) => ({
            id: m.id,
            role: m.role as UIMessage["role"],
            parts: m.parts as UIMessage["parts"],
            createdAt: m.createdAt,
        })),
    };
}

export async function saveMessages(chatId: string, uiMessages: UIMessage[]) {
    const now = new Date();
    
    // Update chat timestamp
    db.update(chats)
        .set({ updatedAt: now })
        .where(eq(chats.id, chatId))
        .run();

    // Delete existing messages and re-insert updated list to maintain sync
    db.delete(messages).where(eq(messages.chatId, chatId)).run();

    for (const msg of uiMessages) {
        db.insert(messages)
            .values({
                id: msg.id,
                chatId,
                role: msg.role,
                parts: msg.parts || [{ type: "text", text: "" }],
                createdAt: now,
            })
            .run();
    }
}

export async function deleteChat(id: string) {
    db.delete(chats).where(eq(chats.id, id)).run();
}

export async function getPaginatedChats(page: number = 1, pageSize: number = 20, search: string = "") {
    const offset = (page - 1) * pageSize;
    const query = search ? like(chats.title, `%${search}%`) : undefined;

    const list = db
        .select()
        .from(chats)
        .where(query)
        .orderBy(desc(chats.updatedAt))
        .limit(pageSize)
        .offset(offset)
        .all();

    const totalResult = db
        .select({ count: count() })
        .from(chats)
        .where(query)
        .get();

    return {
        chats: list,
        total: totalResult?.count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult?.count ?? 0) / pageSize),
    };
}
