import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { TrendingUp, MousePointer, DollarSign, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · BrandBridge" }] }),
  component: Analytics,
});

const COLORS = ["oklch(0.55 0.26 310)", "oklch(0.68 0.24 340)", "oklch(0.78 0.18 60)", "oklch(0.6 0.18 200)"];

function Analytics() {
  const { user } = useAuth();

  const { data: analytics, refetch } = useQuery({
    queryKey: ["analytics", user?.id],
    queryFn: async () => {
      const [{ data: rows }, { data: campaigns }, { data: affiliates }] = await Promise.all([
        supabase.from("campaign_analytics").select("*, campaign:campaigns(title, brand_id)").order("recorded_on"),
        supabase.from("campaigns").select("*").order("created_at"),
        supabase.from("affiliate_codes").select("*"),
      ]);
      return { rows: rows ?? [], campaigns: campaigns ?? [], affiliates: affiliates ?? [] };
    },
  });

  const generateDemo = async () => {
    if (!user) return;
    const { data: myC } = await supabase.from("campaigns").select("id").eq("brand_id", user.id).limit(1);
    if (!myC || myC.length === 0) return toast.error("Create a campaign first");
    const cid = myC[0].id;
    const today = new Date();
    const rows = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i));
      const reach = 5000 + Math.floor(Math.random() * 8000);
      return {
        campaign_id: cid,
        reach,
        impressions: reach * 2,
        engagements: Math.floor(reach * (0.03 + Math.random() * 0.05)),
        clicks: Math.floor(reach * 0.01),
        conversions: Math.floor(reach * 0.002),
        spend: 100 + Math.floor(Math.random() * 200),
        recorded_on: d.toISOString().slice(0, 10),
      };
    });
    const { error } = await supabase.from("campaign_analytics").insert(rows);
    if (error) return toast.error(error.message);
    toast.success("Demo analytics generated");
    refetch();
  };

  const totals = analytics?.rows.reduce((a, r) => ({
    reach: a.reach + (r.reach || 0),
    engagements: a.engagements + (r.engagements || 0),
    conversions: a.conversions + (r.conversions || 0),
    spend: a.spend + Number(r.spend || 0),
  }), { reach: 0, engagements: 0, conversions: 0, spend: 0 });
  const cpe = totals && totals.engagements > 0 ? (totals.spend / totals.engagements).toFixed(2) : "0";

  // Aggregate by date
  const byDate = (analytics?.rows ?? []).reduce<Record<string, any>>((a, r) => {
    a[r.recorded_on] ??= { date: r.recorded_on, reach: 0, engagements: 0, conversions: 0 };
    a[r.recorded_on].reach += r.reach || 0;
    a[r.recorded_on].engagements += r.engagements || 0;
    a[r.recorded_on].conversions += r.conversions || 0;
    return a;
  }, {});
  const timeline = Object.values(byDate);

  const affPie = (analytics?.affiliates ?? []).slice(0, 5).map(a => ({ name: a.code, value: Number(a.revenue) }));

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Live performance across concluded and ongoing campaigns.</p>
        </div>
        <Button variant="outline" onClick={generateDemo}>Generate demo data</Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          { icon: TrendingUp, label: "Total Reach", value: (totals?.reach ?? 0).toLocaleString() },
          { icon: Target, label: "Engagements", value: (totals?.engagements ?? 0).toLocaleString() },
          { icon: MousePointer, label: "Conversions", value: (totals?.conversions ?? 0).toLocaleString() },
          { icon: DollarSign, label: "Cost / Engage", value: `$${cpe}` },
        ].map(s => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-hero-gradient text-white"><s.icon className="h-5 w-5" /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold">Reach & engagement over time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeline}>
              <XAxis dataKey="date" stroke="oklch(0.5 0.02 280)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.02 280)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.01 280)" }} />
              <Line type="monotone" dataKey="reach" stroke="oklch(0.55 0.26 310)" strokeWidth={2} />
              <Line type="monotone" dataKey="engagements" stroke="oklch(0.78 0.18 60)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold">Conversions per day</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timeline}>
              <XAxis dataKey="date" stroke="oklch(0.5 0.02 280)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.02 280)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.01 280)" }} />
              <Bar dataKey="conversions" fill="oklch(0.68 0.24 340)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {affPie.length > 0 && (
        <Card className="mt-6 p-6">
          <h3 className="font-display text-lg font-bold">Revenue by affiliate code</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={affPie} dataKey="value" nameKey="name" outerRadius={100} label>
                {affPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
