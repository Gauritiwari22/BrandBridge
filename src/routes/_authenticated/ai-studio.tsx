import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wand2, Copy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-studio")({
  head: () => ({ meta: [{ title: "AI Studio · BrandBridge" }] }),
  component: Studio,
});

const PRESETS = [
  { id: "caption", label: "Instagram caption", hint: "Product / vibe to caption" },
  { id: "email", label: "Sponsorship email", hint: "Brand & event details" },
  { id: "proposal", label: "Brand proposal", hint: "Brand + creator pitch context" },
  { id: "brief", label: "Influencer brief", hint: "Campaign details" },
  { id: "linkedin", label: "LinkedIn post", hint: "Topic to post about" },
];

function Studio() {
  const [type, setType] = useState("caption");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!input.trim()) return toast.error("Tell the AI what you want");
    setLoading(true); setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { action: "content", type, input } });
      if (error) throw error;
      setOutput(data.text);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const preset = PRESETS.find(p => p.id === type)!;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center gap-2">
        <Wand2 className="h-6 w-6 text-primary" />
        <h1 className="font-display text-4xl font-bold">AI Content Studio</h1>
      </div>
      <p className="mt-1 text-muted-foreground">Generate captions, briefs, proposals, and emails in seconds.</p>

      <Card className="mt-8 p-6">
        <div className="space-y-4">
          <div>
            <Label>What to generate</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRESETS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{preset.hint}</Label>
            <Textarea rows={4} value={input} onChange={e => setInput(e.target.value)} placeholder="Describe the brand, audience, mood, or product..." />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full bg-hero-gradient text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" />Generate</>}
          </Button>
        </div>
      </Card>

      {output && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Output</h3>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied!"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm">{output}</pre>
        </Card>
      )}
    </div>
  );
}
