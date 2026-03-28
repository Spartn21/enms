import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard, Users, Baby, ClipboardCheck, MessageSquare, Megaphone,
  DollarSign, BarChart3, Settings, LogOut, Menu, X, BookOpen,
  Activity, Home, CreditCard, Bell
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Children", href: "/admin/children", icon: <Baby className="h-5 w-5" /> },
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
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = getNavItems(role);

  // Bottom nav for mobile (first 4 items)
  const bottomNavItems = navItems.slice(0, 4);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">E-NMS</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
            </div>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">E-NMS</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
              <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col pb-16 lg:pb-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">E-NMS</span>
          </div>
          <div className="flex-1" />
          <button className="relative text-muted-foreground">
            <Bell className="h-5 w-5" />
          </button>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card lg:hidden">
        {bottomNavItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
