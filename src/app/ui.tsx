"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  Clock3,
  Download,
  FileText,
  Handshake,
  ListChecks,
  Loader2,
  MailCheck,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";

import type { AppStore, Brand, Campaign, CreatorProfile } from "@/lib/types";

type Status = {
  gmailConnected: boolean;
  connectedEmail: string | null;
  openaiConfigured: boolean;
  googleConfigured: boolean;
};

function badgeClass(status: string) {
  if (status === "sent" || status === "won" || status === "replied") return "badge green";
  if (status === "draft" || status === "drafted") return "badge blue";
  if (status === "follow_up_due" || status === "new") return "badge orange";
  if (status === "rejected") return "badge red";
  return "badge";
}

function collect(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload;
}

function scoreBrand(brand: Brand) {
  let score = 25;
  if (brand.email) score += 20;
  if (brand.whyFit.length > 40) score += 25;
  if (brand.website) score += 10;
  if (brand.category) score += 10;
  if (brand.contactName) score += 10;
  if (brand.budgetRange) score += 5;
  if (brand.dealType && brand.dealType !== "unknown") score += 5;
  if (brand.notes.length > 30) score += 5;
  if (brand.region) score += 5;
  return Math.min(score, 100);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function mediaKitText(profile: CreatorProfile) {
  return [
    `${profile.name} - Creator Media Kit`,
    `Niche: ${profile.niche || "Not set"}`,
    `Audience: ${profile.audience || "Not set"}`,
    `Channels: ${profile.channels || "Not set"}`,
    `Followers: ${profile.followerCount || "Not set"}`,
    `Location: ${profile.location || "Not set"}`,
    `Packages: ${profile.packages || "Not set"}`,
    `Past collaborations: ${profile.pastCollabs || "Available on request"}`,
    `Portfolio: ${profile.portfolioUrl || "Available on request"}`
  ].join("\n");
}

function csvCell(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

export function Dashboard({ initialStore }: { initialStore: AppStore }) {
  const [store, setStore] = useState(initialStore);
  const [status, setStatus] = useState<Status | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState(initialStore.brands[0]?.id ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draftDirty, setDraftDirty] = useState(false);

  const selectedBrand = store.brands.find((brand) => brand.id === selectedBrandId) ?? store.brands[0] ?? null;
  const selectedCampaign = useMemo(() => {
    if (!selectedBrand) return null;
    return store.campaigns.find((campaign) => campaign.brandId === selectedBrand.id) ?? null;
  }, [selectedBrand, store.campaigns]);
  const leadScore = selectedBrand ? scoreBrand(selectedBrand) : 0;
  const followUpsDue = store.campaigns.filter((campaign) => {
    if (!campaign.followUpDueAt || campaign.status !== "sent") return false;
    return new Date(campaign.followUpDueAt).getTime() <= Date.now();
  }).length;
  const filteredBrands = store.brands.filter((brand) => {
    const searchText =
      `${brand.name} ${brand.email} ${brand.category} ${brand.whyFit} ${brand.source} ${brand.region} ${brand.dealType} ${brand.budgetRange} ${brand.notes}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });
  const mediaKit = mediaKitText(store.profile);

  useEffect(() => {
    refreshStatus();
  }, []);

  async function refreshStatus() {
    try {
      const response = await fetch("/api/status");
      setStatus(await readJson(response));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read system status.");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("profile");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collect(event.currentTarget))
      });
      const payload = await readJson(response);
      setStore((current) => ({ ...current, profile: payload.profile as CreatorProfile }));
      setNotice("Profile saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setPending(null);
    }
  }

  async function addBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("brand");
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...collect(event.currentTarget), status: "new" })
      });
      const payload = await readJson(response);
      setStore((current) => ({ ...current, brands: payload.brands as Brand[] }));
      setSelectedBrandId(payload.brands[0]?.id ?? selectedBrandId);
      event.currentTarget.reset();
      setNotice("Brand added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Brand add failed.");
    } finally {
      setPending(null);
    }
  }

  async function deleteBrand(id: string) {
    setPending(`delete-${id}`);
    try {
      const response = await fetch(`/api/brands?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await readJson(response);
      setStore((current) => ({ ...current, brands: payload.brands as Brand[], campaigns: payload.campaigns as Campaign[] }));
      setSelectedBrandId(payload.brands[0]?.id ?? "");
      setNotice("Brand removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setPending(null);
    }
  }

  async function generateDraft() {
    if (!selectedBrand) return;
    setPending("generate");
    try {
      const response = await fetch("/api/pitch/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand.id })
      });
      const payload = await readJson(response);
      setStore(payload.store as AppStore);
      setDraftDirty(false);
      setNotice("Pitch draft generated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Draft generation failed.");
    } finally {
      setPending(null);
    }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCampaign) return;
    setPending("draft");
    try {
      const response = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCampaign.id, ...collect(event.currentTarget) })
      });
      const payload = await readJson(response);
      setStore(payload.store as AppStore);
      setDraftDirty(false);
      setNotice("Draft saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Draft save failed.");
    } finally {
      setPending(null);
    }
  }

  async function sendCampaign() {
    if (!selectedCampaign) return;
    if (draftDirty) {
      setNotice("Save draft edits before sending.");
      return;
    }
    setPending("send");
    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}/send`, { method: "POST" });
      const payload = await readJson(response);
      setStore(payload.store as AppStore);
      setNotice("Email sent through Gmail.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Send failed.");
    } finally {
      setPending(null);
    }
  }

  async function updateCampaignStatus(status: Campaign["status"]) {
    if (!selectedCampaign) return;
    setPending(`status-${status}`);
    try {
      const response = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCampaign.id, status })
      });
      const payload = await readJson(response);
      setStore(payload.store as AppStore);
      setNotice(`Campaign marked ${status.replaceAll("_", " ")}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setPending(null);
    }
  }

  async function copyMediaKit() {
    await navigator.clipboard.writeText(mediaKit);
    setNotice("Media kit copied.");
  }

  function exportBrands() {
    const header = ["Brand", "Email", "Status", "Category", "Deal type", "Budget", "Region", "Source", "Fit notes", "Notes"];
    const rows = store.brands.map((brand) => [
      brand.name,
      brand.email,
      brand.status,
      brand.category,
      brand.dealType,
      brand.budgetRange,
      brand.region,
      brand.source,
      brand.whyFit,
      brand.notes
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "brand-pipeline.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Brand pipeline exported.");
  }

  return (
    <section className="section grid two-col">
      <div className="grid">
        {notice ? <div className="notice">{notice}</div> : null}

        <div className="panel intelligence">
          <div>
            <h2 className="panel-title">Next best action</h2>
            <p className="subtle">
              {selectedBrand
                ? selectedCampaign
                  ? draftDirty
                    ? "Save your edited pitch before approving a Gmail send."
                    : selectedCampaign.status === "sent"
                      ? `Follow up on ${formatDate(selectedCampaign.followUpDueAt)} if there is no reply.`
                      : status?.gmailConnected
                        ? "Review the draft, personalize the details, then approve the send."
                        : "Review and save the draft now; connect Gmail before approving a send."
                  : leadScore >= 70
                    ? "This lead has enough context for a strong first draft."
                    : "Add more fit notes before generating a pitch."
                : "Add a brand contact to start outreach."}
            </p>
          </div>
          <div className="score-ring" aria-label={`Lead score ${leadScore}`}>
            <strong>{leadScore}</strong>
            <span>score</span>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Creator profile</h2>
          <form className="form-grid" onSubmit={saveProfile}>
            <div className="grid two-col">
              <Field label="Name" name="name" defaultValue={store.profile.name} />
              <Field label="Email" name="email" defaultValue={store.profile.email} />
            </div>
            <Field label="Niche" name="niche" defaultValue={store.profile.niche} />
            <Field label="Audience" name="audience" defaultValue={store.profile.audience} textarea />
            <div className="grid two-col">
              <Field label="Channels" name="channels" defaultValue={store.profile.channels} />
              <Field label="Follower count" name="followerCount" defaultValue={store.profile.followerCount} />
            </div>
            <div className="grid two-col">
              <Field label="Portfolio URL" name="portfolioUrl" defaultValue={store.profile.portfolioUrl} />
              <Field label="Location" name="location" defaultValue={store.profile.location} />
            </div>
            <Field label="Packages" name="packages" defaultValue={store.profile.packages} textarea />
            <Field label="Past collabs" name="pastCollabs" defaultValue={store.profile.pastCollabs} textarea />
            <div className="form-row">
              <label htmlFor="tone">Tone</label>
              <select id="tone" name="tone" defaultValue={store.profile.tone}>
                <option value="warm">Warm</option>
                <option value="professional">Professional</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <button className="button green" disabled={pending === "profile"}>
              {pending === "profile" ? <Loader2 size={16} /> : <CheckCircle2 size={16} />}
              Save profile
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="item-header">
            <h2 className="panel-title">Media kit snapshot</h2>
            <FileText size={18} color="#275f9f" />
          </div>
          <div className="media-kit">
            <p><strong>{store.profile.name || "Creator"}</strong></p>
            <p>{store.profile.niche || "Add your niche"}</p>
            <p>{store.profile.channels || "Add channels"} {store.profile.followerCount ? `- ${store.profile.followerCount} followers` : ""}</p>
            <p>{store.profile.packages || "Add package options"}</p>
          </div>
          <div className="actions">
            <button className="button secondary" type="button" onClick={copyMediaKit}>
              <Clipboard size={16} />
              Copy media kit
            </button>
            <a className="button secondary" href={store.profile.portfolioUrl || "#"} aria-disabled={!store.profile.portfolioUrl}>
              <FileText size={16} />
              Portfolio
            </a>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Add brand</h2>
          <form className="form-grid" onSubmit={addBrand}>
            <div className="grid two-col">
              <Field label="Brand" name="name" required />
              <Field label="Contact name" name="contactName" />
            </div>
            <div className="grid two-col">
              <Field label="Email" name="email" required />
              <Field label="Website" name="website" />
            </div>
            <div className="grid two-col">
              <Field label="Category" name="category" />
              <Field label="Source" name="source" defaultValue="Manual prospect" />
            </div>
            <div className="grid two-col">
              <div className="form-row">
                <label htmlFor="dealType">Deal type</label>
                <select id="dealType" name="dealType" defaultValue="unknown">
                  <option value="unknown">Unknown</option>
                  <option value="paid">Paid</option>
                  <option value="gifted">Gifted</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <Field label="Budget range" name="budgetRange" placeholder="$250-$1,000" />
            </div>
            <Field label="Region" name="region" placeholder="US, India, Global" />
            <Field label="Why this brand fits" name="whyFit" textarea />
            <Field label="Private notes" name="notes" textarea />
            <button className="button" disabled={pending === "brand"}>
              {pending === "brand" ? <Loader2 size={16} /> : <Plus size={16} />}
              Add contact
            </button>
          </form>
        </div>
      </div>

      <aside className="grid">
        <div className="panel">
          <div className="item-header">
            <h2 className="panel-title">System status</h2>
            <button className="button secondary" type="button" onClick={refreshStatus}>Check</button>
          </div>
          {status ? (
            <div className="grid">
              <span className={status.gmailConnected ? "badge green" : "badge orange"}>
                Gmail {status.gmailConnected ? `connected: ${status.connectedEmail}` : "not connected"}
              </span>
              <span className={status.openaiConfigured ? "badge green" : "badge orange"}>
                OpenAI {status.openaiConfigured ? "configured" : "fallback template mode"}
              </span>
              <span className={status.googleConfigured ? "badge green" : "badge orange"}>
                Google OAuth {status.googleConfigured ? "configured" : "needs .env.local keys"}
              </span>
              <span className={followUpsDue ? "badge orange" : "badge green"}>
                {followUpsDue} follow-up{followUpsDue === 1 ? "" : "s"} due
              </span>
            </div>
          ) : (
            <p className="subtle">Run a status check after adding environment keys.</p>
          )}
        </div>

        <div className="panel">
          <div className="item-header">
            <div>
              <h2 className="panel-title">Brand pipeline</h2>
              <span className="tiny">{filteredBrands.length} shown</span>
            </div>
            <button className="icon-button" type="button" onClick={exportBrands} title="Export pipeline CSV" aria-label="Export pipeline CSV">
              <Download size={16} />
            </button>
          </div>
          <label className="search-box" htmlFor="brand-search">
            <Search size={16} />
            <input
              id="brand-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brands"
            />
          </label>
          <div className="list">
            {filteredBrands.map((brand) => (
              <button
                className={brand.id === selectedBrand?.id ? "item-card selected" : "item-card"}
                key={brand.id}
                type="button"
                onClick={() => {
                  setSelectedBrandId(brand.id);
                  setDraftDirty(false);
                }}
              >
                <span className="item-header">
                  <span>
                    <span className="item-title">{brand.name}</span>
                    <span className="tiny">{brand.email}</span>
                  </span>
                  <span className={badgeClass(brand.status)}>{brand.status}</span>
                </span>
                <span className="progress-track"><span style={{ width: `${scoreBrand(brand)}%` }} /></span>
                <span className="deal-row">
                  <span>{brand.dealType}</span>
                  <span>{brand.budgetRange || "Budget TBD"}</span>
                  <span>{brand.region || "Any region"}</span>
                </span>
                <span className="tiny">{brand.whyFit || brand.category || "No fit notes yet"}</span>
              </button>
            ))}
            {!filteredBrands.length ? <div className="warning">No matching brands.</div> : null}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Selected outreach</h2>
          {selectedBrand ? (
            <div className="grid">
              <div className="item-header">
                <div>
                  <p className="item-title">{selectedBrand.name}</p>
                  <p className="tiny">{selectedBrand.email}</p>
                </div>
                <button className="button secondary" type="button" onClick={() => deleteBrand(selectedBrand.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="deal-grid">
                <span><Handshake size={14} /> {selectedBrand.dealType}</span>
                <span>{selectedBrand.budgetRange || "Budget TBD"}</span>
                <span>{selectedBrand.region || "Region TBD"}</span>
                <span>{selectedBrand.source || "Manual source"}</span>
              </div>
              {selectedBrand.notes ? <div className="draft-box compact">{selectedBrand.notes}</div> : null}
              <div className="actions">
                <button className="button orange" type="button" onClick={generateDraft} disabled={pending === "generate"}>
                  {pending === "generate" ? <Loader2 size={16} /> : selectedCampaign ? <Wand2 size={16} /> : <Sparkles size={16} />}
                  Generate pitch
                </button>
                <button
                  className="button green"
                  type="button"
                  onClick={sendCampaign}
                  disabled={!selectedCampaign || pending === "send" || draftDirty || !status?.gmailConnected}
                  title={!status?.gmailConnected ? "Connect Gmail before sending" : undefined}
                >
                  {pending === "send" ? <Loader2 size={16} /> : <Send size={16} />}
                  Approve and send
                </button>
              </div>
              {selectedCampaign ? (
                <form className="form-grid" onSubmit={saveDraft}>
                  <div className="actions">
                    <span className={badgeClass(selectedCampaign.status)}>
                      {selectedCampaign.status.replaceAll("_", " ")}
                    </span>
                    <span className="badge">
                      <Clock3 size={13} /> follow-up {formatDate(selectedCampaign.followUpDueAt)}
                    </span>
                    {status?.gmailConnected ? (
                      <span className="badge green"><MailCheck size={13} /> Gmail ready</span>
                    ) : null}
                  </div>
                  <Field
                    label="Subject"
                    name="subject"
                    defaultValue={selectedCampaign.subject}
                    required
                    onChange={() => setDraftDirty(true)}
                  />
                  <Field
                    label="Pitch"
                    name="body"
                    defaultValue={selectedCampaign.body}
                    textarea
                    required
                    onChange={() => setDraftDirty(true)}
                  />
                  <Field
                    label="Follow-up"
                    name="followUpBody"
                    defaultValue={selectedCampaign.followUpBody}
                    textarea
                    required
                    onChange={() => setDraftDirty(true)}
                  />
                  <button className="button secondary" disabled={!draftDirty || pending === "draft"}>
                    {pending === "draft" ? <Loader2 size={16} /> : <Pencil size={16} />}
                    Save draft edits
                  </button>
                </form>
              ) : (
                <div className="warning">Generate a draft before sending. The app never sends without your click.</div>
              )}
              {selectedCampaign ? (
                <div className="panel-inset">
                  <div className="item-header">
                    <h3 className="mini-title"><ListChecks size={15} /> Deal outcome</h3>
                  </div>
                  <div className="actions">
                    <button className="button secondary" type="button" onClick={() => updateCampaignStatus("replied")} disabled={pending === "status-replied"}>
                      Replied
                    </button>
                    <button className="button secondary" type="button" onClick={() => updateCampaignStatus("won")} disabled={pending === "status-won"}>
                      Won
                    </button>
                    <button className="button secondary" type="button" onClick={() => updateCampaignStatus("rejected")} disabled={pending === "status-rejected"}>
                      Rejected
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="subtle">Add a brand to start drafting outreach.</p>
          )}
        </div>
      </aside>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  textarea = false,
  required = false,
  onChange,
  placeholder
}: {
  label: string;
  name: string;
  defaultValue?: string;
  textarea?: boolean;
  required?: boolean;
  onChange?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="form-row">
      <label htmlFor={name}>{label}</label>
      {textarea ? (
        <textarea id={name} name={name} defaultValue={defaultValue} required={required} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input id={name} name={name} defaultValue={defaultValue} required={required} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}
