import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, effectiveRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Admins can access any role-protected route (used for view-as previews).
  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole) && role !== "admin") {
    const redirectMap: Record<AppRole, string> = { admin: "/admin", teacher: "/teacher", parent: "/parent" };
    return <Navigate to={redirectMap[role!] || "/"} replace />;
  }

  return <>{children}</>;
}
