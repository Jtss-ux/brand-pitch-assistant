import OpenAI from "openai";

import type { Brand, CreatorProfile } from "@/lib/types";

export type PitchOutput = {
  subject: string;
  body: string;
  followUpBody: string;
};

function fallbackPitch(profile: CreatorProfile, brand: Brand): PitchOutput {
  const creatorName = profile.name || "Joseph";
  const brandName = brand.name || "your team";
  const fit = brand.whyFit || `I think ${brandName} fits my audience well.`;
  const packageLine = profile.packages || "a short-form product demo and creator-style walkthrough";
  const dealContext =
    brand.dealType && brand.dealType !== "unknown"
      ? `I am thinking this could work as a ${brand.dealType} collaboration${brand.budgetRange ? ` in the ${brand.budgetRange} range` : ""}.`
      : "";
  const notes = brand.notes ? `\n\nExtra context I had in mind: ${brand.notes}` : "";

  return {
    subject: `${brandName} x ${creatorName} - creator collab idea`,
    body: `Hi ${brand.contactName || "team"},\n\nI am ${creatorName}, a creator focused on ${profile.niche || "practical AI and builder content"}.\n\nI came across ${brandName} and thought there is a strong fit: ${fit}${notes}\n\nI would love to create ${packageLine} that shows your product in a useful, authentic way for ${profile.audience || "my audience"}. ${dealContext}\n\nIf you are open to creator partnerships, I can send over a simple concept and package options.\n\nBest,\n${creatorName}`,
    followUpBody: `Hi ${brand.contactName || "team"},\n\nJust following up on my note about a possible ${brandName} creator collab. I think there is a strong fit with my audience and I would be happy to send over a simple content concept or package options.\n\nBest,\n${creatorName}`
  };
}

export async function generatePitch(profile: CreatorProfile, brand: Brand): Promise<PitchOutput> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackPitch(profile, brand);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You write concise, human creator outreach emails. Avoid hype, fake metrics, spam language, and unverifiable claims. Return strict JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Create a brand pitch email and one polite follow-up.",
          creatorProfile: profile,
          brand
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "pitch",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            followUpBody: { type: "string" }
          },
          required: ["subject", "body", "followUpBody"]
        },
        strict: true
      }
    }
  });

  const text = response.output_text;
  return JSON.parse(text) as PitchOutput;
}
