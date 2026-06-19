import { promises as fs } from "node:fs";
import path from "node:path";

import type { AppStore, Brand, Campaign, CreatorProfile, GmailTokens } from "@/lib/types";

const storePath = path.join(process.cwd(), "data", "store.json");

export const defaultProfile: CreatorProfile = {
  name: "Joseph Stephen",
  email: "josephst2007@gmail.com",
  niche: "AI tools, creator workflows, student builder projects",
  audience: "Founders, students, indie builders, creators interested in practical AI",
  channels: "LinkedIn, X/Twitter, Instagram, YouTube Shorts",
  followerCount: "",
  portfolioUrl: "",
  location: "",
  packages: "UGC demo video, product walkthrough, short-form launch post, founder testimonial",
  pastCollabs: "",
  tone: "warm"
};

const initialStore: AppStore = {
  profile: defaultProfile,
  brands: [
    {
      id: "seed-openai-tools",
      name: "AI SaaS Tool",
      contactName: "Partnerships team",
      email: "partnerships@example.com",
      website: "https://example.com",
      category: "AI productivity",
      whyFit: "Audience cares about practical AI workflows and product demos.",
      source: "Manual prospect",
      region: "Global",
      dealType: "paid",
      budgetRange: "$250-$1,000",
      notes: "Good fit for a short demo or founder testimonial.",
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  campaigns: [],
  gmail: {
    connectedEmail: null,
    tokens: null
  }
};

async function ensureStore() {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<AppStore> {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  const store = JSON.parse(raw) as AppStore;
  store.brands = store.brands.map((brand) => ({
    ...brand,
    source: brand.source ?? "",
    region: brand.region ?? "",
    dealType: brand.dealType ?? "unknown",
    budgetRange: brand.budgetRange ?? "",
    notes: brand.notes ?? ""
  }));
  return store;
}

export async function writeStore(store: AppStore) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function updateProfile(profile: CreatorProfile) {
  const store = await readStore();
  store.profile = profile;
  await writeStore(store);
  return store.profile;
}

export async function upsertBrand(input: Omit<Brand, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existing = input.id ? store.brands.find((brand) => brand.id === input.id) : null;

  if (existing) {
    Object.assign(existing, input, { updatedAt: now });
  } else {
    store.brands.unshift({
      ...input,
      id: makeId("brand"),
      createdAt: now,
      updatedAt: now
    });
  }

  await writeStore(store);
  return store.brands;
}

export async function removeBrand(id: string) {
  const store = await readStore();
  store.brands = store.brands.filter((brand) => brand.id !== id);
  store.campaigns = store.campaigns.filter((campaign) => campaign.brandId !== id);
  await writeStore(store);
  return store;
}

export async function saveCampaign(campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existing = campaign.id ? store.campaigns.find((item) => item.id === campaign.id) : null;

  if (existing) {
    Object.assign(existing, campaign, { updatedAt: now });
  } else {
    store.campaigns.unshift({
      ...campaign,
      id: makeId("campaign"),
      createdAt: now,
      updatedAt: now
    });
  }

  await writeStore(store);
  return store;
}

export async function saveGmailTokens(tokens: GmailTokens, connectedEmail: string | null) {
  const store = await readStore();
  store.gmail = {
    connectedEmail,
    tokens: {
      ...store.gmail.tokens,
      ...tokens
    }
  };
  await writeStore(store);
  return store.gmail;
}
