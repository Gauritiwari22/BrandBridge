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

export const Route = createFileRoute("/_authenticated/events/new")({
  head: () => ({ meta: [{ title: "Post event · BrandBridge" }] }),
  component: NewEvent,
});

function NewEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", college: "", category: "", location: "",
    expected_footfall: "100", funding_goal: "5000", event_date: "",
  });
  const onChange = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("events").insert({
      organizer_id: user.id,
      title: form.title, description: form.description,
      college: form.college, category: form.category, location: form.location,
      expected_footfall: parseInt(form.expected_footfall) || 0,
      funding_goal: parseFloat(form.funding_goal) || 0,
      event_date: form.event_date || null,
    }).select().single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Event posted!");
    navigate({ to: "/events/$id", params: { id: data.id } });
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-4xl font-bold">Post a campus event</h1>
      <p className="mt-1 text-muted-foreground">Get matched with brands looking to sponsor.</p>
      <Card className="mt-8 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Event title *</Label><Input required value={form.title} onChange={onChange("title")} placeholder="IGDTUW Hackathon 2026" /></div>
          <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={onChange("description")} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>College</Label><Input value={form.college} onChange={onChange("college")} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={onChange("category")} placeholder="Hackathon / Fest / Workshop" /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Expected footfall</Label><Input type="number" value={form.expected_footfall} onChange={onChange("expected_footfall")} /></div>
            <div><Label>Funding goal (USD)</Label><Input type="number" value={form.funding_goal} onChange={onChange("funding_goal")} /></div>
            <div><Label>Event date</Label><Input type="date" value={form.event_date} onChange={onChange("event_date")} /></div>
          </div>
          <div><Label>Location</Label><Input value={form.location} onChange={onChange("location")} /></div>
          <Button type="submit" disabled={loading} className="w-full bg-hero-gradient text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post event"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
