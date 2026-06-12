import { useAuth, AppRole } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, BookOpen, Users } from "lucide-react";

const opts: { value: AppRole; label: string; icon: React.ReactNode; path: string }[] = [
  { value: "admin", label: "Admin", icon: <ShieldCheck className="h-3.5 w-3.5" />, path: "/admin" },
  { value: "teacher", label: "Teacher", icon: <BookOpen className="h-3.5 w-3.5" />, path: "/teacher" },
  { value: "parent", label: "Parent", icon: <Users className="h-3.5 w-3.5" />, path: "/parent" },
];

export function RoleSwitcher() {
  const { role, viewAsRole, setViewAsRole } = useAuth();
  const navigate = useNavigate();
  if (role !== "admin") return null;

  const active: AppRole = viewAsRole ?? "admin";

  const onSelect = (v: AppRole) => {
    setViewAsRole(v === "admin" ? null : v);
    navigate(opts.find((o) => o.value === v)!.path);
  };

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors ${
            active === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
          <span className="hidden sm:inline">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
