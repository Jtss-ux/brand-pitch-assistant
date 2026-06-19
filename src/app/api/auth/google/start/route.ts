import { NextResponse } from "next/server";

import { getGoogleAuthUrl } from "@/lib/gmail";

export async function GET() {
  try {
    return NextResponse.redirect(getGoogleAuthUrl());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
