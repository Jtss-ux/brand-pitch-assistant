export type CreatorProfile = {
  name: string;
  email: string;
  niche: string;
  audience: string;
  channels: string;
  followerCount: string;
  portfolioUrl: string;
  location: string;
  packages: string;
  pastCollabs: string;
  tone: "warm" | "professional" | "bold";
};

export type Brand = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  website: string;
  category: string;
  whyFit: string;
  source: string;
  region: string;
  dealType: "paid" | "gifted" | "affiliate" | "event" | "unknown";
  budgetRange: string;
  notes: string;
  status: "new" | "drafted" | "sent" | "replied" | "won" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type Campaign = {
  id: string;
  brandId: string;
  subject: string;
  body: string;
  status: "draft" | "sent" | "follow_up_due" | "replied" | "won" | "rejected";
  followUpBody: string;
  sentAt: string | null;
  followUpDueAt: string | null;
  gmailMessageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GmailTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
};

export type AppStore = {
  profile: CreatorProfile;
  brands: Brand[];
  campaigns: Campaign[];
  gmail: {
    connectedEmail: string | null;
    tokens: GmailTokens | null;
  };
};
