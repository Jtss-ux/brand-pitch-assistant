import { NextResponse } from "next/server";

import { exchangeGoogleCode } from "@/lib/gmail";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?notice=google-oauth-missing-code`);
  }

  try {
    await exchangeGoogleCode(code);
    return NextResponse.redirect(`${appUrl}/?notice=gmail-connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/?notice=gmail-connect-failed`);
  }
}
