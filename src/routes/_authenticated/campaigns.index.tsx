import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, DollarSign, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campaigns/")({
  head: () => ({ meta: [{ title: "Campaigns · BrandBridge" }] }),
  component: Campaigns,
});

function Campaigns() {
  const { profile } = useAuth();
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*, brand:profiles!brand_id(full_name, brand_name, avatar_url)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">Discover brand collaborations or launch your own.</p>
        </div>
        {profile?.role === "brand" && (
          <Link to="/campaigns/new"><Button className="bg-hero-gradient text-white"><Plus className="mr-2 h-4 w-4" />New campaign</Button></Link>
        )}
      </div>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Loading…</p>
      ) : campaigns?.length === 0 ? (
        <Card className="mt-8 p-12 text-center">
          <p className="text-muted-foreground">No campaigns yet.</p>
          {profile?.role === "brand" && <Link to="/campaigns/new"><Button className="mt-4 bg-hero-gradient text-white">Launch the first one</Button></Link>}
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns?.map((c: any) => (
            <Link key={c.id} to="/campaigns/$id" params={{ id: c.id }}>
              <Card className="group h-full overflow-hidden p-0 transition hover:shadow-elegant">
                <div className="h-32 bg-hero-gradient relative">
                  <Badge className="absolute top-3 right-3 bg-white text-primary">{c.status}</Badge>
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.category || "General"}</p>
                  <h3 className="mt-1 font-display text-lg font-bold group-hover:text-primary">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />₹{Number(c.budget).toLocaleString()}</span>
                    {c.min_followers ? <span className="flex items-center gap-1"><Target className="h-3 w-3" />{c.min_followers.toLocaleString()}+ followers</span> : null}
                    {c.end_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.end_date}</span>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
