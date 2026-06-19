import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/gmail";
import { readStore, writeStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params;
  const store = await readStore();
  const campaign = store.campaigns.find((item) => item.id === campaignId);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  const brand = store.brands.find((item) => item.id === campaign.brandId);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  if (!store.gmail.connectedEmail) {
    return NextResponse.json({ error: "Connect Gmail before sending." }, { status: 400 });
  }

  const result = await sendEmail({
    to: brand.email,
    from: store.gmail.connectedEmail,
    subject: campaign.subject,
    body: campaign.body
  });

  const now = new Date().toISOString();
  campaign.status = "sent";
  campaign.sentAt = now;
  campaign.gmailMessageId = result.id ?? null;
  campaign.updatedAt = now;
  brand.status = "sent";
  brand.updatedAt = now;
  await writeStore(store);

  return NextResponse.json({ store });
}
