import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileSignature, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/contracts")({
  head: () => ({ meta: [{ title: "Contracts · BrandBridge" }] }),
  component: Contracts,
});

function Contracts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState<string | null>(null);

  const { data: contracts } = useQuery({
    queryKey: ["contracts", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("contracts")
        .select("*, brand:profiles!brand_id(full_name, brand_name), creator:profiles!creator_id(full_name)")
        .or(`brand_id.eq.${user!.id},creator_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const sign = async (c: any) => {
    if (!signature.trim()) return toast.error("Type your full name to sign");
    const isBrand = user?.id === c.brand_id;
    const updates: any = {};
    if (isBrand) { updates.brand_signature = signature; updates.brand_signed_at = new Date().toISOString(); }
    else { updates.creator_signature = signature; updates.creator_signed_at = new Date().toISOString(); }

    // Status transitions
    const bSigned = c.brand_signed_at || isBrand;
    const cSigned = c.creator_signed_at || !isBrand;
    if (bSigned && cSigned) updates.status = "active";
    else updates.status = isBrand ? "signed_brand" : "signed_creator";

    const { error } = await supabase.from("contracts").update(updates).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Contract signed!");
    setSignature(""); setSigning(null);
    qc.invalidateQueries({ queryKey: ["contracts", user?.id] });
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="font-display text-4xl font-bold">Contracts</h1>
      <p className="mt-1 text-muted-foreground">E-sign deliverables and lock in partnerships.</p>

      <div className="mt-8 space-y-4">
        {contracts?.length === 0 && <Card className="p-12 text-center"><p className="text-muted-foreground">No contracts yet.</p></Card>}
        {contracts?.map(c => {
          const isBrand = user?.id === c.brand_id;
          const mySigned = isBrand ? !!c.brand_signed_at : !!c.creator_signed_at;
          return (
            <Card key={c.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-xl font-bold">{c.title}</h3>
                    <Badge className="capitalize">{c.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Between {c.brand?.brand_name || c.brand?.full_name} and {c.creator?.full_name}</p>
                  <p className="mt-3 text-sm whitespace-pre-wrap">{c.terms}</p>
                  {c.deliverables && <p className="mt-2 text-sm"><b>Deliverables:</b> {c.deliverables}</p>}
                  <p className="mt-2 text-sm"><b>Amount:</b> ${Number(c.amount).toLocaleString()}{c.due_date ? ` · Due ${c.due_date}` : ""}</p>
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className={c.brand_signed_at ? "text-primary font-semibold" : "text-muted-foreground"}>
                      {c.brand_signed_at ? <Check className="inline h-3 w-3" /> : "○"} Brand: {c.brand_signature || "Pending"}
                    </span>
                    <span className={c.creator_signed_at ? "text-primary font-semibold" : "text-muted-foreground"}>
                      {c.creator_signed_at ? <Check className="inline h-3 w-3" /> : "○"} Creator: {c.creator_signature || "Pending"}
                    </span>
                  </div>
                </div>
                {!mySigned && (
                  <Dialog open={signing === c.id} onOpenChange={o => setSigning(o ? c.id : null)}>
                    <DialogTrigger asChild><Button className="bg-hero-gradient text-white">Sign</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>E-sign contract</DialogTitle></DialogHeader>
                      <p className="text-sm text-muted-foreground">By typing your full name you legally agree to the terms above.</p>
                      <div><Label>Type your full name</Label><Input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Jane Doe" /></div>
                      <Button onClick={() => sign(c)} className="w-full bg-hero-gradient text-white">Sign contract</Button>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
