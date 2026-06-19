import { NextResponse } from "next/server";
import { z } from "zod";

import { readStore, writeStore } from "@/lib/store";

const campaignPatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["draft", "sent", "follow_up_due", "replied", "won", "rejected"]).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  followUpBody: z.string().min(1).optional()
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ campaigns: store.campaigns });
}

export async function PATCH(request: Request) {
  const payload = campaignPatchSchema.parse(await request.json());
  const store = await readStore();
  const campaign = store.campaigns.find((item) => item.id === payload.id);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  Object.assign(campaign, {
    status: payload.status ?? campaign.status,
    subject: payload.subject ?? campaign.subject,
    body: payload.body ?? campaign.body,
    followUpBody: payload.followUpBody ?? campaign.followUpBody
  });
  campaign.updatedAt = new Date().toISOString();
  const brand = store.brands.find((item) => item.id === campaign.brandId);
  if (brand && payload.status) {
    switch (payload.status) {
      case "draft":
      case "follow_up_due":
        brand.status = "drafted";
        break;
      case "sent":
      case "replied":
      case "won":
      case "rejected":
        brand.status = payload.status;
        break;
    }
    brand.updatedAt = campaign.updatedAt;
  }
  await writeStore(store);

  return NextResponse.json({ store });
}
