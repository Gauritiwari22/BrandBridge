import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function callAI(messages: any[], jsonMode = false) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "content") {
      const { type, input } = body;
      const prompts: Record<string, string> = {
        caption: "Write 3 short, scroll-stopping Instagram captions (with relevant hashtags) for:",
        email: "Write a concise, professional sponsorship outreach email for:",
        proposal: "Write a structured brand collaboration proposal (intro, value, deliverables, ask) for:",
        brief: "Write a clear influencer brief (objective, deliverables, dos, don'ts, deadline) for:",
        linkedin: "Write a thoughtful, engaging LinkedIn post (200 words max) about:",
      };
      const sys = "You are an expert brand-creator marketing copywriter for BrandBridge AI. Be concrete, on-brand, and impactful.";
      const text = await callAI([
        { role: "system", content: sys },
        { role: "user", content: `${prompts[type] ?? prompts.caption}\n\n${input}` },
      ]);
      return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "match") {
      const { campaign, creators } = body;
      const list = (creators ?? []).slice(0, 30).map((c: any) => ({
        id: c.id, name: c.full_name, role: c.role,
        niche: c.niche, followers: c.followers, engagement: c.engagement_rate,
        trust: c.trust_score, college: c.college,
      }));
      const prompt = `Campaign:
Title: ${campaign.title}
Description: ${campaign.description}
Target niches: ${(campaign.target_niches ?? []).join(", ")}
Min followers: ${campaign.min_followers} · Min engagement: ${campaign.min_engagement}%
Budget: ₹${campaign.budget} (INR)

Creators (JSON): ${JSON.stringify(list)}

Score each creator 0-100 on niche overlap (30), audience size (25), engagement quality (25), and budget alignment (20). Return the TOP 5 as JSON:
{ "matches": [ { "creator_id": "uuid", "name": "string", "score": number, "reason": "one short sentence" } ] }`;
      const raw = await callAI([
        { role: "system", content: "You are an AI matchmaking engine. Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ], true);
      const parsed = JSON.parse(raw);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "trust") {
      const { profile } = body;
      // Heuristic + AI hybrid score
      let trust = 30;
      if (profile.bio) trust += 10;
      if (profile.avatar_url) trust += 5;
      if (profile.college) trust += 5;
      if (profile.niche?.length) trust += 5;
      if (profile.instagram || profile.youtube || profile.twitter || profile.linkedin) trust += 10;
      if (profile.verified) trust += 15;
      if ((profile.followers ?? 0) > 1000) trust += 10;
      if ((profile.engagement_rate ?? 0) > 2) trust += 10;

      // Authenticity: engagement-to-follower sanity check
      let auth = 50;
      const f = Number(profile.followers ?? 0);
      const e = Number(profile.engagement_rate ?? 0);
      if (f > 0) {
        if (e >= 2 && e <= 8) auth = 85;
        else if (e > 8) auth = 60;
        else if (e < 1) auth = 35;
        else auth = 70;
      }
      if (f > 100000 && e < 1) auth -= 20; // suspicious

      trust = Math.max(0, Math.min(100, trust));
      auth = Math.max(0, Math.min(100, auth));

      return new Response(JSON.stringify({ trust_score: trust, authenticity_score: auth }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
