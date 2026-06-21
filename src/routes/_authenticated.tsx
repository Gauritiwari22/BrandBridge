import { createFileRoute, Link, Outlet, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, LayoutDashboard, Megaphone, GraduationCap, Users, FileSignature, Link2, BarChart3, Wand2, MessageSquare, LogOut, Loader2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

const ROLES_CREATORS = ["brand", "business"]; // who can browse creators

function navFor(role: string | undefined) {
  const base = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/events", label: "Campus Events", icon: GraduationCap },
  ];
  if (role && ROLES_CREATORS.includes(role)) {
    base.push({ to: "/creators", label: "Creators", icon: Users });
  }
  base.push(
    { to: "/messages", label: "Inbox", icon: MessageSquare },
    { to: "/contracts", label: "Contracts", icon: FileSignature },
    { to: "/affiliates", label: "Affiliates", icon: Link2 },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/ai-studio", label: "AI Studio", icon: Wand2 },
  );
  return base;
}

function AuthedLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const nav = navFor(profile?.role);

  const SidebarContent = () => (
    <>
      <Link to="/dashboard" onClick={() => setOpen(false)} className="mb-8 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-hero-gradient text-white"><Sparkles className="h-5 w-5" /></div>
        <span className="font-display text-lg font-bold">BrandBridge</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {nav.map(item => {
          const active = pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-primary text-primary-foreground shadow-card" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 rounded-xl border border-sidebar-border bg-card p-3">
        <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
            {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? "User"}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{profile?.role}</p>
          </div>
        </Link>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 md:flex md:flex-col">
        <SidebarContent />
      </aside>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-hero-gradient text-white"><Sparkles className="h-4 w-4" /></div>
          <span className="font-display font-bold">BrandBridge</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-72 p-4 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>
      <main className="bg-background pb-20 md:pb-0"><Outlet /></main>
    </div>
  );
}
