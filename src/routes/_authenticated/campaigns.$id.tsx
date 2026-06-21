import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, Loader2, DollarSign, Users, Target, Calendar, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campaigns/$id")({
  head: () => ({ meta: [{ title: "Campaign · BrandBridge" }] }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [pitch, setPitch] = useState("");
  const [rate, setRate] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [matches, setMatches] = useState<any[] | null>(null);

  const { data: campaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("*, brand:profiles!brand_id(*)").eq("id", id).single();
      return data;
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["applications", id],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*, creator:profiles!creator_id(*)").eq("campaign_id", id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const isBrand = user?.id === campaign?.brand_id;
  const myApplication = applications?.find(a => a.creator_id === user?.id);

  const apply = async () => {
    if (!user) return;
    const { error } = await supabase.from("applications").insert({
      campaign_id: id, creator_id: user.id, pitch, proposed_rate: parseFloat(rate) || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Application sent!");
    qc.invalidateQueries({ queryKey: ["applications", id] });
  };

  const updateAppStatus = async (appId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (error) return toast.error(error.message);
    toast.success(`Application ${status}`);
    qc.invalidateQueries({ queryKey: ["applications", id] });
  };

  const runAiMatch = async () => {
    if (!campaign) return;
    setAiLoading(true);
    try {
      const { data: creators } = await supabase.from("profiles").select("*").in("role", ["influencer", "student"]).limit(50);
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { action: "match", campaign, creators },
      });
      if (error) throw error;
      setMatches(data.matches);
    } catch (e: any) {
      toast.error(e.message);
    }
    setAiLoading(false);
  };

  const createContract = async (creatorId: string) => {
    if (!campaign || !user) return;
    const { data, error } = await supabase.from("contracts").insert({
      campaign_id: id,
      brand_id: user.id,
      creator_id: creatorId,
      title: campaign.title,
      terms: `Standard partnership agreement for "${campaign.title}". Deliverables: ${campaign.deliverables || "as discussed"}.`,
      amount: campaign.budget,
      deliverables: campaign.deliverables,
      due_date: campaign.end_date,
      status: "sent",
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Contract drafted!");
    navigate({ to: "/contracts" });
  };

  if (!campaign) return <div className="p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="rounded-2xl bg-hero-gradient p-8 text-white shadow-elegant">
        <Badge className="bg-white/20 text-white border-0">{campaign.category || "General"}</Badge>
        <h1 className="mt-3 font-display text-4xl font-bold">{campaign.title}</h1>
        <p className="mt-2 text-white/90">by {campaign.brand?.brand_name || campaign.brand?.full_name}</p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" />${Number(campaign.budget).toLocaleString()}</span>
          {campaign.min_followers ? <span className="flex items-center gap-2"><Users className="h-4 w-4" />{campaign.min_followers.toLocaleString()}+ followers</span> : null}
          {campaign.min_engagement ? <span className="flex items-center gap-2"><Target className="h-4 w-4" />{campaign.min_engagement}%+ engagement</span> : null}
          {campaign.end_date && <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />Due {campaign.end_date}</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          <h2 className="font-display text-xl font-bold">About this campaign</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{campaign.description || "No description provided."}</p>
          {campaign.deliverables && (
            <>
              <h3 className="mt-6 font-semibold">Deliverables</h3>
              <p className="mt-2 text-sm text-muted-foreground">{campaign.deliverables}</p>
            </>
          )}
          {campaign.target_niches?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {campaign.target_niches.map((n: string) => <Badge key={n} variant="secondary">{n}</Badge>)}
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          {isBrand ? (
            <>
              <h3 className="font-display text-lg font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Matches</h3>
              <p className="mt-1 text-xs text-muted-foreground">Let AI rank top creators for you.</p>
              <Button onClick={runAiMatch} disabled={aiLoading} className="mt-3 w-full bg-hero-gradient text-white">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find creators"}
              </Button>
            </>
          ) : myApplication ? (
            <>
              <h3 className="font-display text-lg font-bold">Your application</h3>
              <Badge className="mt-2 capitalize">{myApplication.status}</Badge>
              <p className="mt-3 text-sm text-muted-foreground">{myApplication.pitch}</p>
            </>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-hero-gradient text-white">Apply now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Apply to {campaign.title}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Your pitch</Label><Textarea rows={4} value={pitch} onChange={e => setPitch(e.target.value)} placeholder="Why are you the right creator for this?" /></div>
                  <div><Label>Proposed rate (USD)</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} /></div>
                  <Button onClick={apply} className="w-full bg-hero-gradient text-white">Send application</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </Card>
      </div>

      {matches && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Top AI matches</h2>
          <div className="mt-4 space-y-3">
            {matches.map((m: any) => (
              <div key={m.creator_id} className="flex items-start justify-between rounded-lg border border-border p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{m.name}</p>
                    <Badge className="bg-hero-gradient text-white border-0">{m.score}/100</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{m.reason}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => createContract(m.creator_id)}>Draft contract</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isBrand && applications && applications.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-xl font-bold">Applications ({applications.length})</h2>
          <div className="mt-4 space-y-3">
            {applications.map(a => (
              <div key={a.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{a.creator?.full_name}</p>
                    <Badge variant="outline">Trust {a.creator?.trust_score}</Badge>
                    <Badge className="capitalize">{a.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.pitch}</p>
                  {a.proposed_rate && <p className="mt-1 text-xs">Rate: ${a.proposed_rate}</p>}
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateAppStatus(a.id, "rejected")}><X className="h-4 w-4" /></Button>
                    <Button size="sm" className="bg-hero-gradient text-white" onClick={() => updateAppStatus(a.id, "accepted")}><Check className="h-4 w-4" /></Button>
                  </div>
                )}
                {a.status === "accepted" && (
                  <Button size="sm" variant="outline" onClick={() => createContract(a.creator_id)}>Send contract</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
