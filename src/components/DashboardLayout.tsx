import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { SplashScreen } from "@/components/SplashScreen";
import {
  LayoutDashboard, Baby, ClipboardCheck, MessageSquare, DollarSign, BarChart3,
  Settings, LogOut, Menu, X, BookOpen, Activity, Home, CreditCard, Bell, UserCheck,
  GraduationCap,
} from "lucide-react";

interface NavItem { label: string; href: string; icon: ReactNode; badgeKey?: "pendingRequests" }

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Children", href: "/admin/children", icon: <Baby className="h-5 w-5" /> },
  { label: "Classes", href: "/admin/classes", icon: <GraduationCap className="h-5 w-5" /> },
  { label: "Requests", href: "/admin/access-requests", icon: <UserCheck className="h-5 w-5" />, badgeKey: "pendingRequests" },
  { label: "Attendance", href: "/admin/attendance", icon: <ClipboardCheck className="h-5 w-5" /> },
  { label: "Fees", href: "/admin/fees", icon: <DollarSign className="h-5 w-5" /> },
  { label: "Messages", href: "/admin/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Attendance", href: "/teacher/attendance", icon: <ClipboardCheck className="h-5 w-5" /> },
  { label: "Activities", href: "/teacher/activities", icon: <Activity className="h-5 w-5" /> },
  { label: "Messages", href: "/teacher/messages", icon: <MessageSquare className="h-5 w-5" /> },
];

const parentNav: NavItem[] = [
  { label: "Home", href: "/parent", icon: <Home className="h-5 w-5" /> },
  { label: "Activities", href: "/parent/activities", icon: <Activity className="h-5 w-5" /> },
  { label: "Fees", href: "/parent/fees", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Messages", href: "/parent/messages", icon: <MessageSquare className="h-5 w-5" /> },
];

function getNavItems(role: string | null): NavItem[] {
  switch (role) {
    case "admin": return adminNav;
    case "teacher": return teacherNav;
    case "parent": return parentNav;
    default: return [];
  }
}

function getRoleLabel(role: string | null) {
  switch (role) {
    case "admin": return "Administrator";
    case "teacher": return "Teacher";
    case "parent": return "Parent";
    default: return "";
  }
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, effectiveRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const navItems = getNavItems(effectiveRole);
  const bottomNavItems = navItems.slice(0, 4);

  useEffect(() => {
    if (role !== "admin") return;
    const load = async () => {
      const { count } = await supabase
        .from("child_access_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingRequests(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("admin-access-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "child_access_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "U";

  const badgeFor = (k?: string) => k === "pendingRequests" && pendingRequests > 0 ? pendingRequests : null;

  const renderItem = (item: NavItem, onClick?: () => void) => {
    const active = location.pathname === item.href;
    const badge = badgeFor(item.badgeKey);
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {item.icon}
        <span className="flex-1">{item.label}</span>
        {badge && <Badge variant="destructive" className="h-5 px-1.5 text-xs">{badge}</Badge>}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SplashScreen />
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">E-NMS</span>
        </div>
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">{navItems.map((i) => renderItem(i))}</nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
            </div>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl flex flex-col">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">E-NMS</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {navItems.map((i) => renderItem(i, () => setSidebarOpen(false)))}
            </nav>
            <div className="border-t border-border p-3">
              <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col pb-16 lg:pb-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">E-NMS</span>
          </div>
          <div className="flex-1" />
          <RoleSwitcher />
          {role === "admin" && pendingRequests > 0 && (
            <button onClick={() => navigate("/admin/access-requests")} className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{pendingRequests}</span>
            </button>
          )}
          <Avatar className="h-7 w-7 lg:hidden">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-4">
          <ReadOnlyBanner />
          {children}
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card lg:hidden animate-fade-in"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {bottomNavItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className={`transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
              <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
