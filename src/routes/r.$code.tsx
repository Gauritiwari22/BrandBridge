import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/r/$code")({
  beforeLoad: async ({ params }) => {
    const { data } = await supabase.from("affiliate_codes").select("id, clicks, url").eq("code", params.code).maybeSingle();
    if (!data) {
      throw redirect({ to: "/" });
    }
    // Track click
    try {
      await supabase.from("affiliate_codes").update({ clicks: (data.clicks ?? 0) + 1 }).eq("id", data.id);
    } catch {}
    if (data.url && /^https?:\/\//.test(data.url) && !data.url.startsWith(window.location.origin)) {
      window.location.href = data.url;
      return;
    }
    throw redirect({ to: "/" });
  },
  component: () => <div className="grid min-h-screen place-items-center text-muted-foreground">Redirecting…</div>,
});
