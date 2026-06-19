import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Instagram, Youtube, Twitter, Shield, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/creators")({
  head: () => ({ meta: [{ title: "Creators · BrandBridge" }] }),
  component: Creators,
});

function Creators() {
  const [q, setQ] = useState("");
  const { data: creators } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").in("role", ["influencer", "student", "business"]).order("trust_score", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = creators?.filter(c => {
    const s = q.toLowerCase();
    return !s || c.full_name?.toLowerCase().includes(s) || c.college?.toLowerCase().includes(s) || c.niche?.some((n: string) => n.toLowerCase().includes(s));
  });

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div>
        <h1 className="font-display text-4xl font-bold">Discover creators</h1>
        <p className="mt-1 text-muted-foreground">Browse verified influencers, student ambassadors, and local talent.</p>
      </div>
      <Input className="mt-6 max-w-md" placeholder="Search by name, college, or niche..." value={q} onChange={e => setQ(e.target.value)} />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map(c => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-hero-gradient text-white font-bold">
                {c.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{c.full_name}</p>
                  {c.verified && <Shield className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs capitalize text-muted-foreground">{c.role}{c.college ? ` · ${c.college}` : ""}</p>
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
            <div className="mt-3 flex gap-2 text-muted-foreground">
              {c.instagram && <Instagram className="h-4 w-4" />}
              {c.youtube && <Youtube className="h-4 w-4" />}
              {c.twitter && <Twitter className="h-4 w-4" />}
            </div>
          </Card>
        ))}
      </div>
      {filtered?.length === 0 && <Card className="mt-8 p-12 text-center"><p className="text-muted-foreground">No creators found.</p></Card>}
    </div>
  );
}
