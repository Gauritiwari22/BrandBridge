import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link2, Copy, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/affiliates")({
  head: () => ({ meta: [{ title: "Affiliates · BrandBridge" }] }),
  component: Affiliates,
});

function Affiliates() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creatorId, setCreatorId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [commission, setCommission] = useState("10");

  const { data: codes } = useQuery({
    queryKey: ["affiliates", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("affiliate_codes")
        .select("*, creator:profiles!creator_id(full_name), brand:profiles!brand_id(brand_name, full_name)")
        .or(`brand_id.eq.${user!.id},creator_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: creators } = useQuery({
    queryKey: ["all-creators"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name").in("role", ["influencer", "student"])).data ?? [],
    enabled: profile?.role === "brand",
  });

  const { data: campaigns } = useQuery({
    queryKey: ["my-campaigns", user?.id],
    queryFn: async () => (await supabase.from("campaigns").select("id, title").eq("brand_id", user!.id)).data ?? [],
    enabled: !!user && profile?.role === "brand",
  });

  const generateCode = (name?: string) => {
    const prefix = (name || "BB").substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "");
    return `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  };

  const create = async () => {
    if (!user || !creatorId) return toast.error("Pick a creator");
    const creator = creators?.find(c => c.id === creatorId);
    const code = generateCode(creator?.full_name);
    const url = `${window.location.origin}/r/${code}`;
    const { error } = await supabase.from("affiliate_codes").insert({
      code, creator_id: creatorId, brand_id: user.id,
      campaign_id: campaignId || null,
      commission_pct: parseFloat(commission), url,
    });
    if (error) return toast.error(error.message);
    toast.success(`Code ${code} created!`);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["affiliates", user.id] });
  };

  const simulateClick = async (id: string) => {
    const { data } = await supabase.from("affiliate_codes").select("clicks, conversions, revenue").eq("id", id).single();
    if (!data) return;
    const conv = Math.random() > 0.7 ? 1 : 0;
    const rev = conv ? Math.floor(Math.random() * 200) + 50 : 0;
    await supabase.from("affiliate_codes").update({
      clicks: (data.clicks || 0) + 1,
      conversions: (data.conversions || 0) + conv,
      revenue: Number(data.revenue || 0) + rev,
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["affiliates", user?.id] });
    toast.success(conv ? `+1 click, +1 conversion ($${rev})` : "+1 click");
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Affiliate codes</h1>
          <p className="mt-1 text-muted-foreground">Track referral clicks, conversions, and revenue per creator.</p>
        </div>
        {profile?.role === "brand" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-hero-gradient text-white"><Plus className="mr-2 h-4 w-4" />New code</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate affiliate code</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Creator</Label>
                  <Select value={creatorId} onValueChange={setCreatorId}>
                    <SelectTrigger><SelectValue placeholder="Pick a creator" /></SelectTrigger>
                    <SelectContent>{creators?.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Campaign (optional)</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger><SelectValue placeholder="No specific campaign" /></SelectTrigger>
                    <SelectContent>{campaigns?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Commission %</Label><Input type="number" value={commission} onChange={e => setCommission(e.target.value)} /></div>
                <Button onClick={create} className="w-full bg-hero-gradient text-white">Generate</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {codes?.length === 0 && <Card className="md:col-span-2 p-12 text-center"><p className="text-muted-foreground">No affiliate codes yet.</p></Card>}
        {codes?.map(c => (
          <Card key={c.id} className="p-5">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="font-mono text-lg font-bold text-gradient">{c.code}</p>
              <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(c.url); toast.success("Copied!"); }}>
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.creator?.full_name} × {c.brand?.brand_name || c.brand?.full_name} · {c.commission_pct}%</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{c.url}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div><p className="text-xs text-muted-foreground">Clicks</p><p className="font-display text-xl font-bold">{c.clicks}</p></div>
              <div><p className="text-xs text-muted-foreground">Conversions</p><p className="font-display text-xl font-bold">{c.conversions}</p></div>
              <div><p className="text-xs text-muted-foreground">Revenue</p><p className="font-display text-xl font-bold text-gradient">${Number(c.revenue).toLocaleString()}</p></div>
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => simulateClick(c.id)}>Simulate click</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
