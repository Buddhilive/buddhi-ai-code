import { NextResponse } from "next/server";
import { getRecentChats, createChat } from "@/lib/db/queries";
import { nanoid } from "nanoid";

export async function GET() {
    try {
        const data = await getRecentChats(10);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GET /api/chats error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch chats" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { title, model } = await req.json();
        const id = nanoid();
        await createChat(id, title || "New Chat", model || "google/gemma-4-12b-qat");
        return NextResponse.json({ chatId: id });
    } catch (error: any) {
        console.error("POST /api/chats error:", error);
        return NextResponse.json({ error: error.message || "Failed to create chat" }, { status: 500 });
    }
}
