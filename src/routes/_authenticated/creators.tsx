import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Instagram, Youtube, Twitter, Shield, MessageSquare, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/creators")({
  head: () => ({ meta: [{ title: "Creators · BrandBridge" }] }),
  beforeLoad: async () => {
    // Hard-gate: only brands & businesses can access creator discovery.
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (prof && prof.role !== "brand" && prof.role !== "business") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Creators,
});

function Creators() {
  const { profile } = useAuth();
  const [q, setQ] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [minEngagement, setMinEngagement] = useState("");
  const [location, setLocation] = useState("");

  const { data: creators, isLoading } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*, social_connections_public(*)").in("role", ["influencer", "student", "business"]).order("trust_score", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({ ...c, social_connections: c.social_connections_public }));
    },
    enabled: profile?.role === "brand" || profile?.role === "business",
  });

  const filtered = creators?.filter(c => {
    const s = q.toLowerCase();
    const matchQ = !s || c.full_name?.toLowerCase().includes(s) || c.college?.toLowerCase().includes(s) || c.niche?.some((n: string) => n.toLowerCase().includes(s));
    const matchF = !minFollowers || (c.followers ?? 0) >= parseInt(minFollowers);
    const matchE = !minEngagement || (c.engagement_rate ?? 0) >= parseFloat(minEngagement);
    const matchL = !location || c.location?.toLowerCase().includes(location.toLowerCase());
    return matchQ && matchF && matchE && matchL;
  });

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Discover creators</h1>
        <p className="mt-1 text-muted-foreground">Browse verified influencers, student ambassadors, and local talent.</p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Input placeholder="Name, college, or niche…" value={q} onChange={e => setQ(e.target.value)} />
        <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
        <Input type="number" placeholder="Min followers" value={minFollowers} onChange={e => setMinFollowers(e.target.value)} />
        <Input type="number" step="0.1" placeholder="Min engagement %" value={minEngagement} onChange={e => setMinEngagement(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="h-56 animate-pulse" />)}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered?.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-hero-gradient text-white font-bold">
                  {c.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to="/p/$id" params={{ id: c.id }} className="font-semibold hover:underline">{c.full_name}</Link>
                    {c.verified && <Shield className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs capitalize text-muted-foreground">{c.role}{c.college ? ` · ${c.college}` : ""}{c.location ? ` · ${c.location}` : ""}</p>
                </div>
              </div>
              {c.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1">
                {c.niche?.slice(0, 3).map((n: string) => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div><p className="text-xs text-muted-foreground">Followers</p><p className="font-bold">{(c.followers ?? 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Engage</p><p className="font-bold">{c.engagement_rate ?? 0}%</p></div>
                <div><p className="text-xs text-muted-foreground">Trust</p><p className="font-bold text-gradient">{c.trust_score ?? 50}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2 text-muted-foreground">
                  {c.instagram && (
                    <span className="flex items-center gap-0.5">
                      <Instagram className="h-4 w-4" />
                      {c.social_connections?.some((s: any) => s.provider === "instagram") && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </span>
                  )}
                  {c.youtube && <Youtube className="h-4 w-4" />}
                  {c.twitter && <Twitter className="h-4 w-4" />}
                </div>
                <Link to="/messages" search={{ to: c.id } as any}>
                  <Button size="sm" variant="outline"><MessageSquare className="mr-1 h-3 w-3" />Message</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && filtered?.length === 0 && <Card className="mt-8 p-12 text-center"><p className="text-muted-foreground">No creators match those filters.</p></Card>}
    </div>
  );
}