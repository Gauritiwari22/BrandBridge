// Handles Instagram Business Login OAuth.
// Two routes via ?step=:
//   step=start    -> returns the Facebook/Instagram authorization URL for the frontend to redirect to
//   step=callback -> Meta redirects here with ?code=...; we exchange it for a token, fetch profile data, and store it

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_APP_ID = Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Must exactly match a redirect URI configured in the Meta app dashboard
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth?step=callback`;
// Where to send the influencer back to in the app once linking finishes
const APP_RETURN_URL = Deno.env.get("APP_PUBLIC_URL") ?? "https://your-app.example.com";

const GRAPH = "https://graph.facebook.com/v21.0";

async function dbFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=representation",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`DB error ${res.status}: ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const step = url.searchParams.get("step");

  try {
    // ---- STEP 1: build the authorization URL ----
    if (step === "start") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("Missing user_id");

      // `state` round-trips the BrandBridge user id through Meta's redirect so the
      // callback knows which profile to attach the connection to.
      const state = encodeURIComponent(JSON.stringify({ user_id }));
      const scope = ["instagram_basic", "instagram_graph_user_profile", "pages_show_list"].join(",");

      const authUrl =
        `https://www.facebook.com/v21.0/dialog/oauth` +
        `?client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}` +
        `&scope=${scope}`;

      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- STEP 2: Meta redirects back here with ?code=&state= ----
    if (step === "callback") {
      const code = url.searchParams.get("code");
      const stateRaw = url.searchParams.get("state");
      if (!code || !stateRaw) throw new Error("Missing code or state from Meta redirect");
      const { user_id } = JSON.parse(decodeURIComponent(stateRaw));

      // 2a. Exchange code -> short-lived token
      const tokenRes = await fetch(
        `${GRAPH}/oauth/access_token` +
          `?client_id=${META_APP_ID}` +
          `&client_secret=${META_APP_SECRET}` +
          `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
          `&code=${code}`,
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      const shortLivedToken = tokenData.access_token as string;

      // 2b. Exchange short-lived -> long-lived token (60 days)
      const longRes = await fetch(
        `${GRAPH}/oauth/access_token` +
          `?grant_type=fb_exchange_token` +
          `&client_id=${META_APP_ID}` +
          `&client_secret=${META_APP_SECRET}` +
          `&fb_exchange_token=${shortLivedToken}`,
      );
      const longData = await longRes.json();
      if (!longRes.ok) throw new Error(`Long-lived exchange failed: ${JSON.stringify(longData)}`);
      const accessToken = longData.access_token as string;
      const expiresInSec = longData.expires_in ?? 60 * 24 * 60 * 60; // ~60 days default

      // 2c. Find the linked Facebook Page -> Instagram Business Account
      const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      const pageId = pagesData?.data?.[0]?.id;
      if (!pageId) throw new Error("No linked Facebook Page found for this account.");

      const igRes = await fetch(
        `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
      );
      const igData = await igRes.json();
      const igAccountId = igData?.instagram_business_account?.id;
      if (!igAccountId) throw new Error("No Instagram Business account linked to this Facebook Page.");

      // 2d. Fetch profile + media data for trust-score inputs
      const profileRes = await fetch(
        `${GRAPH}/${igAccountId}?fields=username,followers_count,media_count&access_token=${accessToken}`,
      );
      const igProfile = await profileRes.json();

      // Approximate engagement rate from the last 25 posts (likes+comments / followers)
      let engagementRate = 0;
      try {
        const mediaRes = await fetch(
          `${GRAPH}/${igAccountId}/media?fields=like_count,comments_count&limit=25&access_token=${accessToken}`,
        );
        const mediaData = await mediaRes.json();
        const posts = mediaData?.data ?? [];
        if (posts.length && igProfile.followers_count) {
          const totalEngagement = posts.reduce(
            (sum: number, p: any) => sum + (p.like_count ?? 0) + (p.comments_count ?? 0),
            0,
          );
          engagementRate = (totalEngagement / posts.length / igProfile.followers_count) * 100;
        }
      } catch {
        // Engagement is best-effort; profile sync still succeeds without it.
      }

      // 2e. Upsert into social_connections
      await dbFetch("social_connections?on_conflict=user_id,provider", {
        method: "POST",
        body: JSON.stringify([{
          user_id,
          provider: "instagram",
          external_user_id: igAccountId,
          username: igProfile.username,
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + expiresInSec * 1000).toISOString(),
          follower_count: igProfile.followers_count ?? 0,
          media_count: igProfile.media_count ?? 0,
          engagement_rate: Number(engagementRate.toFixed(2)),
          last_synced_at: new Date().toISOString(),
        }]),
      });

      // 2f. Also mirror follower/engagement onto profiles for quick display, keep instagram handle in sync
      await dbFetch(`profiles?id=eq.${user_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          instagram: igProfile.username ? `https://instagram.com/${igProfile.username}` : undefined,
          followers: igProfile.followers_count ?? 0,
          engagement_rate: Number(engagementRate.toFixed(2)),
        }),
      });

      // Redirect the influencer back into the app
      return Response.redirect(`${APP_RETURN_URL}/profile?connected=instagram`, 302);
    }

    return new Response(JSON.stringify({ error: "Unknown step" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    // On callback failure, send the user back with an error flag rather than a raw JSON error page
    if (step === "callback") {
      return Response.redirect(
        `${APP_RETURN_URL}/profile?connected=instagram&error=${encodeURIComponent(e.message)}`,
        302,
      );
    }
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});