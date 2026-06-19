import { NextResponse } from "next/server";
import { z } from "zod";

import { readStore, updateProfile } from "@/lib/store";

const profileSchema = z.object({
  name: z.string(),
  email: z.string(),
  niche: z.string(),
  audience: z.string(),
  channels: z.string(),
  followerCount: z.string(),
  portfolioUrl: z.string(),
  location: z.string(),
  packages: z.string(),
  pastCollabs: z.string(),
  tone: z.enum(["warm", "professional", "bold"])
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ profile: store.profile });
}

export async function PUT(request: Request) {
  const payload = profileSchema.parse(await request.json());
  const profile = await updateProfile(payload);
  return NextResponse.json({ profile });
}
