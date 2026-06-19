import { Mail, Send, ShieldCheck, Sparkles, Target, Users } from "lucide-react";

import { Dashboard } from "@/app/ui";
import { readStore } from "@/lib/store";

export default async function Home() {
  const store = await readStore();
  const metrics = {
    brands: store.brands.length,
    drafts: store.campaigns.filter((campaign) => campaign.status === "draft").length,
    sent: store.campaigns.filter((campaign) => campaign.status === "sent").length
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brandmark">PitchOS</div>
        <p className="subtle">Personal outreach command center for creator-brand partnerships.</p>
        <nav className="nav-stack" aria-label="Primary">
          <div className="nav-item"><Target size={18} /> Pipeline</div>
          <div className="nav-item"><Sparkles size={18} /> AI drafts</div>
          <div className="nav-item"><Mail size={18} /> Gmail</div>
          <div className="nav-item"><ShieldCheck size={18} /> Approval first</div>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="title">Brand pitching assistant</h1>
            <p className="subtle">
              Manage brands, draft personalized outreach, approve sends, and track follow-ups from one workspace.
            </p>
          </div>
          <a className="button" href="/api/auth/google/start">
            <Mail size={17} />
            Connect Gmail
          </a>
        </header>

        <section className="section grid three-col">
          <div className="panel metric">
            <div>
              <span className="tiny">Brand contacts</span>
              <strong>{metrics.brands}</strong>
            </div>
            <Users color="#1f7a5a" />
          </div>
          <div className="panel metric">
            <div>
              <span className="tiny">Drafts ready</span>
              <strong>{metrics.drafts}</strong>
            </div>
            <Sparkles color="#b65d20" />
          </div>
          <div className="panel metric">
            <div>
              <span className="tiny">Emails sent</span>
              <strong>{metrics.sent}</strong>
            </div>
            <Send color="#275f9f" />
          </div>
        </section>

        <Dashboard initialStore={store} />
      </main>
    </div>
  );
}
