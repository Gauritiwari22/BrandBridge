import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Target, Users, BarChart3, FileSignature, Link2, Shield, GraduationCap, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrandBridge AI — Where brands meet creators & campuses" },
      { name: "description", content: "AI-powered platform for brand-creator collaborations, campus sponsorships, contracts, and analytics." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Sparkles, title: "AI Matchmaking", desc: "Gemini-powered matches between brands, creators, and college events." },
  { icon: GraduationCap, title: "Campus Sponsorship Hub", desc: "Fest teams post events, brands sponsor with tracked ROI." },
  { icon: Users, title: "Ambassador Program", desc: "Students build profiles, brands recruit campus reps in one click." },
  { icon: Shield, title: "Fraud Detection", desc: "Trust & Authenticity scores flag fake followers automatically." },
  { icon: FileSignature, title: "E-Contracts", desc: "Sign deliverables digitally — no PDFs flying around in DMs." },
  { icon: Link2, title: "Affiliate Tracking", desc: "Auto-generated referral codes track clicks, conversions, revenue." },
  { icon: BarChart3, title: "Live Analytics", desc: "Reach, engagement, CPE, conversion — graphs judges love." },
  { icon: Zap, title: "AI Content Studio", desc: "Captions, briefs, proposals, emails — generated in seconds." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-hero-gradient text-white"><Sparkles className="h-5 w-5" /></div>
            <span className="font-display text-xl font-bold">BrandBridge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button className="bg-hero-gradient text-white">Get started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-card">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-Powered Brand Collaboration
          </div>
          <h1 className="mt-6 font-display text-6xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Where <span className="text-gradient">brands</span> meet <br />
            creators & campuses.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            One platform to discover, collaborate, sponsor, sign contracts, and analyze every brand partnership — supercharged with AI matching, trust scoring, and content generation.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="bg-hero-gradient text-white shadow-elegant">
              Launch your first campaign <ArrowRight className="ml-2 h-4 w-4" />
            </Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">Join as a creator</Button></Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span>★ Brands</span><span>★ Influencers</span><span>★ Students</span><span>★ College Clubs</span><span>★ Local Businesses</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold">Everything you need to <span className="text-gradient">collaborate</span></h2>
          <p className="mt-4 text-muted-foreground">8 powerful features. One platform. Zero spreadsheets.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:shadow-elegant">
              <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-hero-gradient text-white transition group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-12 text-center text-white shadow-elegant">
          <Target className="mx-auto h-10 w-10" />
          <h2 className="mt-4 font-display text-4xl font-bold">Ready to bridge the brand gap?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Join hundreds of brands and creators already building campaigns on BrandBridge.</p>
          <Link to="/auth"><Button size="lg" variant="secondary" className="mt-8">Get started — it's free</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 BrandBridge AI
      </footer>
    </div>
  );
}
