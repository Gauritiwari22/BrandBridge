import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Instagram, Youtube, Twitter, Linkedin, ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/p/$id")({
  head: ({ loaderData }: any) => {
    const p = loaderData;
    return {
      meta: [
        { title: p ? `${p.full_name} · BrandBridge` : "Creator · BrandBridge" },
        { name: "description", content: p?.bio?.slice(0, 160) ?? "Creator portfolio on BrandBridge AI." },
        { property: "og:title", content: p?.full_name ?? "Creator" },
        { property: "og:description", content: p?.bio ?? "" },
      ],
    };
  },
  loader: async ({ params }) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", params.id).maybeSingle();
    return data;
  },
  component: PublicPortfolio,
});

function PublicPortfolio() {
  const { id } = Route.useParams();
  const { data: p } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", id).maybeSingle()).data,
  });

  if (!p) return <div className="grid min-h-screen place-items-center text-muted-foreground">Profile not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-hero-gradient text-white"><Sparkles className="h-4 w-4" /></div><span className="font-display font-bold">BrandBridge</span></Link>
          <Link to="/auth"><Button size="sm" className="bg-hero-gradient text-white">Collaborate on BrandBridge</Button></Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl bg-hero-gradient p-8 text-white shadow-elegant">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/20 text-3xl font-bold">{p.full_name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-bold">{p.full_name}</h1>
                {p.verified && <Shield className="h-5 w-5" />}
              </div>
              <p className="capitalize text-white/85">{p.role}{p.college ? ` · ${p.college}` : ""}{p.location ? ` · ${p.location}` : ""}</p>
            </div>
          </div>
          {p.bio && <p className="mt-5 text-white/90">{p.bio}</p>}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="p-5 text-center"><p className="text-xs uppercase text-muted-foreground">Followers</p><p className="mt-1 font-display text-3xl font-bold">{(p.followers ?? 0).toLocaleString()}</p></Card>
          <Card className="p-5 text-center"><p className="text-xs uppercase text-muted-foreground">Engagement</p><p className="mt-1 font-display text-3xl font-bold">{p.engagement_rate ?? 0}%</p></Card>
          <Card className="p-5 text-center"><p className="text-xs uppercase text-muted-foreground">Trust Score</p><p className="mt-1 font-display text-3xl font-bold text-gradient">{p.trust_score ?? 50}</p></Card>
        </div>

        {p.niche?.length ? (
          <Card className="mt-6 p-6">
            <h2 className="font-display text-lg font-bold">Niches</h2>
            <div className="mt-3 flex flex-wrap gap-2">{p.niche.map((n: string) => <Badge key={n} variant="secondary">{n}</Badge>)}</div>
          </Card>
        ) : null}

        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-bold">Find me online</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {p.instagram && <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30" href={p.instagram} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" /> Instagram</a>}
            {p.youtube && <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30" href={p.youtube} target="_blank" rel="noreferrer"><Youtube className="h-4 w-4" /> YouTube</a>}
            {p.twitter && <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30" href={p.twitter} target="_blank" rel="noreferrer"><Twitter className="h-4 w-4" /> Twitter</a>}
            {p.linkedin && <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30" href={p.linkedin} target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
          </div>
        </Card>

        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back home</Link>
      </main>
    </div>
  );
}
