import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Users, Calendar, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({ meta: [{ title: "Campus events · BrandBridge" }] }),
  component: Events,
});

function Events() {
  const { profile } = useAuth();
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, organizer:profiles!organizer_id(full_name, college)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Campus Sponsorship Hub</h1>
          <p className="mt-1 text-muted-foreground">College fests, hackathons, and society events looking for brand sponsors.</p>
        </div>
        {(profile?.role === "organizer" || profile?.role === "student") && (
          <Link to="/events/new"><Button className="bg-hero-gradient text-white"><Plus className="mr-2 h-4 w-4" />Post event</Button></Link>
        )}
      </div>

      {events?.length === 0 ? (
        <Card className="mt-8 p-12 text-center"><p className="text-muted-foreground">No events posted yet.</p></Card>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((e: any) => {
            const pct = e.funding_goal > 0 ? Math.min(100, (e.funding_raised / e.funding_goal) * 100) : 0;
            return (
              <Link key={e.id} to="/events/$id" params={{ id: e.id }}>
                <Card className="group h-full p-5 transition hover:shadow-elegant">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-hero-gradient text-white"><GraduationCap className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{e.category || "Event"}</p>
                      <h3 className="font-display text-lg font-bold group-hover:text-primary">{e.title}</h3>
                      <p className="text-xs text-muted-foreground">{e.college}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {e.expected_footfall ? <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.expected_footfall.toLocaleString()}</span> : null}
                    {e.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{e.event_date}</span>}
                    {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                  </div>
                  {e.funding_goal > 0 && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-hero-gradient" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">₹{Number(e.funding_raised).toLocaleString("en-IN")} / ₹{Number(e.funding_goal).toLocaleString("en-IN")} raised</p>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
