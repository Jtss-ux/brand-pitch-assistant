import { NextResponse } from "next/server";
import { z } from "zod";

import { readStore, removeBrand, upsertBrand } from "@/lib/store";

const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  contactName: z.string(),
  email: z.string().email(),
  website: z.string(),
  category: z.string(),
  whyFit: z.string(),
  source: z.string().default(""),
  region: z.string().default(""),
  dealType: z.enum(["paid", "gifted", "affiliate", "event", "unknown"]).default("unknown"),
  budgetRange: z.string().default(""),
  notes: z.string().default(""),
  status: z.enum(["new", "drafted", "sent", "replied", "won", "rejected"])
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ brands: store.brands });
}

export async function POST(request: Request) {
  const payload = brandSchema.parse(await request.json());
  const brands = await upsertBrand(payload);
  return NextResponse.json({ brands });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing brand id." }, { status: 400 });
  }

  const store = await removeBrand(id);
  return NextResponse.json({ brands: store.brands, campaigns: store.campaigns });
}
