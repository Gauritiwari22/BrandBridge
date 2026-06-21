import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Shield, Instagram, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · BrandBridge" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refreshProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (profile) setForm({
      ...profile,
      niche: profile.niche?.join(", ") ?? "",
      skills: profile.skills?.join(", ") ?? "",
    });
  }, [profile]);

  const loadConnections = async () => {
    if (!user) return;
    const { data } = await supabase.from("social_connections").select("*").eq("user_id", user.id);
    setConnections(data ?? []);
  };

  useEffect(() => { loadConnections(); }, [user]);

  // Handle the redirect back from Instagram OAuth: /profile?connected=instagram(&error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      if (error) toast.error(`Couldn't connect Instagram: ${error}`);
      else { toast.success("Instagram connected!"); loadConnections(); refreshProfile(); }
      // Clean the URL so refreshing doesn't re-trigger the toast
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const connectInstagram = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-oauth?step=start", {
        body: { user_id: user.id },
      });
      if (error) throw error;
      window.location.href = data.auth_url; // hand off to Meta's login screen
    } catch (e: any) {
      toast.error(e.message);
      setConnectLoading(false);
    }
  };

  const disconnect = async (provider: string) => {
    if (!user) return;
    const { error } = await supabase.from("social_connections").delete().eq("user_id", user.id).eq("provider", provider);
    if (error) return toast.error(error.message);
    toast.success(`${provider} disconnected`);
    loadConnections();
  };

  const onChange = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const payload = {
      ...form,
      niche: form.niche?.split(",").map((s: string) => s.trim()).filter(Boolean),
      skills: form.skills?.split(",").map((s: string) => s.trim()).filter(Boolean),
      followers: parseInt(form.followers) || 0,
      engagement_rate: parseFloat(form.engagement_rate) || 0,
    };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.email; delete payload.role;
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated!");
    refreshProfile();
  };

  const computeTrust = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { action: "trust", profile: form, connections } });
      if (error) throw error;
      setForm({ ...form, trust_score: data.trust_score, authenticity_score: data.authenticity_score });
      toast.success(`Trust ${data.trust_score} · Authenticity ${data.authenticity_score}${data.ai_note ? ` — ${data.ai_note}` : ""}`);
    } catch (e: any) { toast.error(e.message); }
    setAiLoading(false);
  };

  if (!profile) return <div className="p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-4xl font-bold">Your profile</h1>
      <p className="mt-1 capitalize text-muted-foreground">{profile.role}</p>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Trust Score: <span className="text-gradient">{form.trust_score ?? 50}</span> · Authenticity: <span className="text-gradient">{form.authenticity_score ?? 50}</span></p>
            <p className="text-xs text-muted-foreground">AI analyzes your profile completeness, audience, and engagement.</p>
          </div>
          <Button size="sm" variant="outline" onClick={computeTrust} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" />Compute</>}
          </Button>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <p className="text-sm font-semibold">Connected accounts</p>
        <p className="text-xs text-muted-foreground">Link your real social accounts so brands see verified, live stats instead of self-reported numbers.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {connections.find(c => c.provider === "instagram") ? (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Instagram className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  @{connections.find(c => c.provider === "instagram")?.username}
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                </p>
                <p className="text-xs text-muted-foreground">
                  {(connections.find(c => c.provider === "instagram")?.follower_count ?? 0).toLocaleString()} followers · {connections.find(c => c.provider === "instagram")?.engagement_rate ?? 0}% engagement
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => disconnect("instagram")}>Disconnect</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={connectInstagram} disabled={connectLoading}>
              {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Instagram className="mr-2 h-4 w-4" />Connect Instagram</>}
            </Button>
          )}
          {/* YouTube and Twitter/X connect buttons go here once those providers are wired up */}
        </div>
      </Card>

      <Card className="mt-6 p-6 space-y-4">
        <div><Label>Full name</Label><Input value={form.full_name || ""} onChange={onChange("full_name")} /></div>
        <div><Label>Bio</Label><Textarea rows={3} value={form.bio || ""} onChange={onChange("bio")} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>College</Label><Input value={form.college || ""} onChange={onChange("college")} /></div>
          <div><Label>Location</Label><Input value={form.location || ""} onChange={onChange("location")} /></div>
        </div>
        {(profile.role === "brand" || profile.role === "business") && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Brand name</Label><Input value={form.brand_name || ""} onChange={onChange("brand_name")} /></div>
            <div><Label>Website</Label><Input value={form.website || ""} onChange={onChange("website")} /></div>
          </div>
        )}
        <div><Label>Niches (comma separated)</Label><Input value={form.niche || ""} onChange={onChange("niche")} placeholder="tech, lifestyle" /></div>
        <div><Label>Skills</Label><Input value={form.skills || ""} onChange={onChange("skills")} /></div>
        <div className="grid gap-4 md:grid-cols-4">
          <div><Label>Instagram</Label><Input value={form.instagram || ""} onChange={onChange("instagram")} /></div>
          <div><Label>YouTube</Label><Input value={form.youtube || ""} onChange={onChange("youtube")} /></div>
          <div><Label>Twitter</Label><Input value={form.twitter || ""} onChange={onChange("twitter")} /></div>
          <div><Label>LinkedIn</Label><Input value={form.linkedin || ""} onChange={onChange("linkedin")} /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Followers (total)</Label><Input type="number" value={form.followers || 0} onChange={onChange("followers")} /></div>
          <div><Label>Engagement rate %</Label><Input type="number" step="0.1" value={form.engagement_rate || 0} onChange={onChange("engagement_rate")} /></div>
        </div>
        <Button onClick={save} disabled={loading} className="w-full bg-hero-gradient text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </Card>
    </div>
  );
}