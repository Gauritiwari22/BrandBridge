import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GraduationCap, Users, Calendar, MapPin, Loader2, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/$id")({
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("1000");
  const [tier, setTier] = useState("Silver");
  const [message, setMessage] = useState("");

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, organizer:profiles!organizer_id(*)").eq("id", id).single();
      return data;
    },
  });

  const { data: sponsorships } = useQuery({
    queryKey: ["sponsorships", id],
    queryFn: async () => {
      const { data } = await supabase.from("sponsorships").select("*, brand:profiles!brand_id(*)").eq("event_id", id);
      return data ?? [];
    },
  });

  const isOrganizer = user?.id === event?.organizer_id;

  const offerSponsorship = async () => {
    if (!user) return;
    const { error } = await supabase.from("sponsorships").insert({
      event_id: id, brand_id: user.id,
      offer_amount: parseFloat(amount) || 0, tier, message,
    });
    if (error) return toast.error(error.message);
    toast.success("Sponsorship offer sent!");
    qc.invalidateQueries({ queryKey: ["sponsorships", id] });
  };

  const updateStatus = async (sid: string, status: "accepted" | "rejected", amt: number) => {
    const { error } = await supabase.from("sponsorships").update({ status }).eq("id", sid);
    if (error) return toast.error(error.message);
    if (status === "accepted" && event) {
      await supabase.from("events").update({ funding_raised: (event.funding_raised || 0) + amt }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["event", id] });
    }
    qc.invalidateQueries({ queryKey: ["sponsorships", id] });
    toast.success(`Sponsorship ${status}`);
  };

  if (!event) return <div className="p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const pct = event.funding_goal > 0 ? Math.min(100, (event.funding_raised / event.funding_goal) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="rounded-2xl bg-hero-gradient p-8 text-white shadow-elegant">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" /><Badge className="bg-white/20 text-white border-0">{event.category}</Badge>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold">{event.title}</h1>
        <p className="mt-1 text-white/90">{event.college}</p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          {event.expected_footfall ? <span className="flex items-center gap-2"><Users className="h-4 w-4" />{event.expected_footfall.toLocaleString()} expected</span> : null}
          {event.event_date && <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{event.event_date}</span>}
          {event.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location}</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          <h2 className="font-display text-xl font-bold">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{event.description}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold">Funding</h3>
          <p className="mt-2 font-display text-3xl font-bold text-gradient">${Number(event.funding_raised).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">of ${Number(event.funding_goal).toLocaleString()} goal</p>
          <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-hero-gradient" style={{ width: `${pct}%` }} /></div>
          {!isOrganizer && profile?.role === "brand" && (
            <Dialog>
              <DialogTrigger asChild><Button className="mt-4 w-full bg-hero-gradient text-white">Sponsor this event</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Sponsor {event.title}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Amount (USD)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                  <div><Label>Tier</Label><Input value={tier} onChange={e => setTier(e.target.value)} /></div>
                  <div><Label>Message</Label><Textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} /></div>
                  <Button onClick={offerSponsorship} className="w-full bg-hero-gradient text-white">Send offer</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </Card>
      </div>

      {sponsorships && sponsorships.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-xl font-bold">Sponsorships ({sponsorships.length})</h2>
          <div className="mt-4 space-y-3">
            {sponsorships.map(s => (
              <div key={s.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{s.brand?.brand_name || s.brand?.full_name}</p>
                    <Badge>{s.tier}</Badge>
                    <Badge variant="outline" className="capitalize">{s.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm">${Number(s.offer_amount).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.message}</p>
                </div>
                {isOrganizer && s.status === "proposed" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "rejected", s.offer_amount)}><X className="h-4 w-4" /></Button>
                    <Button size="sm" className="bg-hero-gradient text-white" onClick={() => updateStatus(s.id, "accepted", s.offer_amount)}><Check className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
