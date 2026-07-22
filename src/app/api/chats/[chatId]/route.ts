import { NextResponse } from "next/server";
import { getChatById, deleteChat } from "@/lib/db/queries";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params;
        const chat = await getChatById(chatId);
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }
        return NextResponse.json(chat);
    } catch (error: any) {
        console.error("GET /api/chats/[chatId] error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch chat" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params;
        await deleteChat(chatId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE /api/chats/[chatId] error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete chat" }, { status: 500 });
    }
}
