import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campaigns/new")({
  head: () => ({ meta: [{ title: "New campaign · BrandBridge" }] }),
  component: NewCampaign,
});

function NewCampaign() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "", budget: "1000",
    target_niches: "", min_followers: "0", min_engagement: "0",
    deliverables: "", start_date: "", end_date: "",
  });

  if (profile && profile.role !== "brand" && profile.role !== "business") {
    return <div className="p-8"><Card className="p-12 text-center"><p>Only brands and businesses can create campaigns.</p></Card></div>;
  }

  const onChange = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("campaigns").insert({
      brand_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      budget: parseFloat(form.budget) || 0,
      target_niches: form.target_niches.split(",").map(s => s.trim()).filter(Boolean),
      min_followers: parseInt(form.min_followers) || 0,
      min_engagement: parseFloat(form.min_engagement) || 0,
      deliverables: form.deliverables,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: "open",
    }).select().single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Campaign launched!");
    navigate({ to: "/campaigns/$id", params: { id: data.id } });
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-4xl font-bold">New campaign</h1>
      <p className="mt-1 text-muted-foreground">Define your goal — our AI will surface matching creators.</p>

      <Card className="mt-8 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Title *</Label><Input required value={form.title} onChange={onChange("title")} placeholder="Summer launch with student creators" /></div>
          <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={onChange("description")} placeholder="What's the campaign about?" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Category</Label><Input value={form.category} onChange={onChange("category")} placeholder="Tech / Fashion / Food" /></div>
            <div><Label>Budget (USD) *</Label><Input required type="number" min="0" value={form.budget} onChange={onChange("budget")} /></div>
          </div>
          <div><Label>Target niches (comma separated)</Label><Input value={form.target_niches} onChange={onChange("target_niches")} placeholder="tech, gadgets, lifestyle" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Min followers</Label><Input type="number" min="0" value={form.min_followers} onChange={onChange("min_followers")} /></div>
            <div><Label>Min engagement %</Label><Input type="number" min="0" step="0.1" value={form.min_engagement} onChange={onChange("min_engagement")} /></div>
          </div>
          <div><Label>Deliverables</Label><Textarea rows={3} value={form.deliverables} onChange={onChange("deliverables")} placeholder="2 reels, 3 stories, 1 carousel" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={onChange("start_date")} /></div>
            <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={onChange("end_date")} /></div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-hero-gradient text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Launch campaign"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
