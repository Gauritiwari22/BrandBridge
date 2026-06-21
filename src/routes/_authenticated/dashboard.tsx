import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Users, GraduationCap, FileSignature, Sparkles, TrendingUp, ArrowRight, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · BrandBridge" }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to} className="group block">
      <Card className="p-5 transition hover:shadow-elegant">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{value}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-hero-gradient text-white"><Icon className="h-5 w-5" /></div>
        </div>
      </Card>
    </Link>
  );
}

function Dashboard() {
  const { profile, user } = useAuth();
  const role = profile?.role;

  const { data } = useQuery({
    queryKey: ["dash", user?.id, role],
    queryFn: async () => {
      const [campaigns, events, apps, contracts] = await Promise.all([
        supabase.from("campaigns").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("contracts").select("id", { count: "exact", head: true }),
      ]);
      return {
        campaigns: campaigns.count ?? 0,
        events: events.count ?? 0,
        applications: apps.count ?? 0,
        contracts: contracts.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const tips: Record<string, { title: string; cta: string; to: any }> = {
    brand: { title: "Launch a campaign to start matching with creators.", cta: "Create campaign", to: "/campaigns/new" },
    influencer: { title: "Browse open campaigns and apply with one click.", cta: "Browse campaigns", to: "/campaigns" },
    student: { title: "Complete your profile to attract brand ambassador offers.", cta: "Edit profile", to: "/profile" },
    organizer: { title: "Post your event so brands can sponsor it.", cta: "Post event", to: "/events/new" },
    business: { title: "Find micro-influencers in your local area.", cta: "Find creators", to: "/creators" },
  };
  const tip = role ? tips[role] : null;

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-4xl font-bold">{profile?.full_name} <span className="text-gradient">👋</span></h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">Signed in as {role}</p>
        </div>
        {role === "influencer" && (
          <div className="flex gap-4">
            <div className="text-right"><p className="text-xs text-muted-foreground">Trust Score</p><p className="font-display text-2xl font-bold text-gradient">{profile?.trust_score ?? 50}</p></div>
            <div className="text-right"><p className="text-xs text-muted-foreground">Followers</p><p className="font-display text-2xl font-bold">{profile?.followers ?? 0}</p></div>
          </div>
        )}
      </div>

      {tip && (
        <Card className="mt-6 flex items-center justify-between gap-4 bg-hero-gradient p-6 text-white shadow-elegant">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <p className="font-medium">{tip.title}</p>
          </div>
          <Link to={tip.to} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-primary">
            {tip.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Megaphone} label="Campaigns" value={data?.campaigns ?? 0} to="/campaigns" />
        <Stat icon={GraduationCap} label="Campus Events" value={data?.events ?? 0} to="/events" />
        <Stat icon={Users} label="Applications" value={data?.applications ?? 0} to="/campaigns" />
        <Stat icon={FileSignature} label="Contracts" value={data?.contracts ?? 0} to="/contracts" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold">Quick actions</h3>
          <div className="mt-4 grid gap-2">
            <Link to="/ai-studio" className="rounded-lg border border-border p-3 text-sm font-medium transition hover:bg-accent/30">✨ Generate content with AI</Link>
            <Link to="/messages" className="rounded-lg border border-border p-3 text-sm font-medium transition hover:bg-accent/30">💬 Open inbox</Link>
            <Link to="/analytics" className="rounded-lg border border-border p-3 text-sm font-medium transition hover:bg-accent/30">📊 View analytics</Link>
            <Link to="/affiliates" className="rounded-lg border border-border p-3 text-sm font-medium transition hover:bg-accent/30">🔗 Manage affiliate codes</Link>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Why BrandBridge?</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>✓ AI-powered matchmaking between brands and creators</li>
            <li>✓ Trust & Authenticity scores detect fake followers</li>
            <li>✓ E-contracts, affiliate links, and live analytics</li>
            <li>✓ Built for the 5-user creator economy</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
