import { NextResponse } from "next/server";

import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();

  return NextResponse.json({
    gmailConnected: Boolean(store.gmail.tokens?.refresh_token || store.gmail.tokens?.access_token),
    connectedEmail: store.gmail.connectedEmail,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
}
