import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePitch } from "@/lib/pitch";
import { readStore, saveCampaign, writeStore } from "@/lib/store";

const bodySchema = z.object({
  brandId: z.string()
});

export async function POST(request: Request) {
  const { brandId } = bodySchema.parse(await request.json());
  const store = await readStore();
  const brand = store.brands.find((item) => item.id === brandId);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  const pitch = await generatePitch(store.profile, brand);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const updatedStore = await saveCampaign({
    brandId,
    subject: pitch.subject,
    body: pitch.body,
    followUpBody: pitch.followUpBody,
    status: "draft",
    sentAt: null,
    followUpDueAt: nextWeek,
    gmailMessageId: null
  });

  const target = updatedStore.brands.find((item) => item.id === brandId);
  if (target) {
    target.status = "drafted";
    target.updatedAt = new Date().toISOString();
    await writeStore(updatedStore);
  }

  return NextResponse.json({ store: updatedStore });
}
