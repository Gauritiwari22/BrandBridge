import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Search = { to?: string };

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Inbox · BrandBridge" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({ to: s.to as string | undefined }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/messages" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(search.to ?? null);
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.to) setActiveId(search.to);
  }, [search.to]);

  // All my messages -> derive conversation list
  const { data: allMessages } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Build conversation index
  const conversations = (() => {
    if (!user || !allMessages) return [] as { otherId: string; last: any; unread: number }[];
    const byOther = new Map<string, { last: any; unread: number }>();
    for (const m of allMessages) {
      const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const entry = byOther.get(other) ?? { last: m, unread: 0 };
      entry.last = m;
      if (m.recipient_id === user.id && !m.read_at) entry.unread += 1;
      byOther.set(other, entry);
    }
    return Array.from(byOther.entries()).map(([otherId, v]) => ({ otherId, ...v })).sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  })();

  const otherIds = Array.from(new Set([
    ...conversations.map(c => c.otherId),
    ...(activeId ? [activeId] : []),
  ]));

  const { data: profiles } = useQuery({
    queryKey: ["msg-profiles", otherIds.join(",")],
    queryFn: async () => {
      if (otherIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", otherIds);
      return Object.fromEntries((data ?? []).map(p => [p.id, p]));
    },
    enabled: otherIds.length > 0,
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`msgs:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["messages", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const conversation = allMessages?.filter(m =>
    user && activeId && (
      (m.sender_id === user.id && m.recipient_id === activeId) ||
      (m.sender_id === activeId && m.recipient_id === user.id)
    )
  ) ?? [];

  // Mark unread incoming as read on open
  useEffect(() => {
    if (!user || !activeId || !allMessages) return;
    const unreadIds = allMessages.filter(m => m.sender_id === activeId && m.recipient_id === user.id && !m.read_at).map(m => m.id);
    if (unreadIds.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds).then(() => {
      qc.invalidateQueries({ queryKey: ["messages", user.id] });
    });
  }, [activeId, allMessages, user, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation.length, activeId]);

  const send = async () => {
    if (!user || !activeId || !body.trim()) return;
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: activeId, body: body.trim() });
    if (error) return toast.error(error.message);
    setBody("");
    qc.invalidateQueries({ queryKey: ["messages", user.id] });
  };

  const filteredConvos = conversations.filter(c => {
    if (!filter) return true;
    const name = profiles?.[c.otherId]?.full_name?.toLowerCase() ?? "";
    return name.includes(filter.toLowerCase()) || c.last.body.toLowerCase().includes(filter.toLowerCase());
  });

  const activeProfile = activeId ? profiles?.[activeId] : null;

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-0 p-0 md:h-screen md:grid-cols-[320px_1fr]">
      <aside className="border-r border-border bg-card/30 p-4 overflow-y-auto">
        <h1 className="font-display text-2xl font-bold">Inbox</h1>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search conversations…" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="mt-4 space-y-1">
          {filteredConvos.length === 0 && <p className="px-2 py-8 text-center text-sm text-muted-foreground">No conversations yet. Message a creator from their profile.</p>}
          {filteredConvos.map(c => {
            const p = profiles?.[c.otherId];
            const active = activeId === c.otherId;
            return (
              <button key={c.otherId} onClick={() => { setActiveId(c.otherId); navigate({ to: "/messages", search: { to: c.otherId } }); }}
                className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left transition", active ? "bg-primary/10" : "hover:bg-accent/30")}>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-hero-gradient text-sm font-bold text-white">
                  {p?.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{p?.full_name ?? "Unknown"}</p>
                    {c.unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{c.unread}</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.last.body}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex flex-col bg-background">
        {!activeId ? (
          <div className="grid flex-1 place-items-center text-center text-muted-foreground">
            <div><MessageSquare className="mx-auto h-10 w-10 text-primary" /><p className="mt-3">Pick a conversation</p></div>
          </div>
        ) : (
          <>
            <header className="border-b border-border p-4">
              <p className="font-display text-lg font-bold">{activeProfile?.full_name ?? "Conversation"}</p>
              <p className="text-xs capitalize text-muted-foreground">{activeProfile?.role}</p>
            </header>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversation.map(m => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", mine ? "bg-hero-gradient text-white" : "bg-card border border-border")}>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <footer className="border-t border-border p-3">
              <div className="flex gap-2">
                <Textarea rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message…" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <Button onClick={send} className="bg-hero-gradient text-white"><Send className="h-4 w-4" /></Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
