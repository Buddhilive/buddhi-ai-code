import { NextResponse } from "next/server";
import { getPaginatedChats } from "@/lib/db/queries";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
        const search = searchParams.get("search") || "";

        const data = await getPaginatedChats(page, pageSize, search);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GET /api/chats/history error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch chat history" }, { status: 500 });
    }
}
