import { google } from "googleapis";
import type { Credentials } from "google-auth-library";

import { readStore, saveGmailTokens } from "@/lib/store";
import type { GmailTokens } from "@/lib/types";

const scopes = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
];

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, `${appUrl}/api/auth/google/callback`);
}

export function getGoogleAuthUrl() {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const profile = await oauth2.userinfo.get();
  await saveGmailTokens(tokens, profile.data.email ?? null);
}

export async function getAuthorizedGmail() {
  const store = await readStore();

  if (!store.gmail.tokens?.refresh_token && !store.gmail.tokens?.access_token) {
    throw new Error("Gmail is not connected.");
  }

  const client = getOAuthClient();
  client.setCredentials(toGoogleCredentials(store.gmail.tokens));
  return google.gmail({ auth: client, version: "v1" });
}

function toGoogleCredentials(tokens: GmailTokens): Credentials {
  return Object.fromEntries(Object.entries(tokens).filter(([, value]) => value != null)) as Credentials;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sendEmail({
  to,
  from,
  subject,
  body
}: {
  to: string;
  from: string;
  subject: string;
  body: string;
}) {
  const gmail = await getAuthorizedGmail();
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body
  ].join("\r\n");

  const response = await gmail.users.messages.send({
    requestBody: {
      raw: encodeBase64Url(message)
    },
    userId: "me"
  });

  return response.data;
}
