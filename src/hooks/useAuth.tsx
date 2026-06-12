import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "parent";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  viewAsRole: AppRole | null;
  effectiveRole: AppRole | null;
  isReadOnly: boolean;
  loading: boolean;
  setViewAsRole: (r: AppRole | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  viewAsRole: null,
  effectiveRole: null,
  isReadOnly: false,
  loading: true,
  setViewAsRole: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const VIEW_AS_KEY = "enms.viewAsRole";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [viewAsRole, setViewAsRoleState] = useState<AppRole | null>(() => {
    if (typeof window === "undefined") return null;
    const v = sessionStorage.getItem(VIEW_AS_KEY);
    return v === "teacher" || v === "parent" || v === "admin" ? (v as AppRole) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.rpc("get_user_role", { _user_id: userId });
    setRole(data as AppRole | null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setRole(null);
        setViewAsRoleState(null);
        sessionStorage.removeItem(VIEW_AS_KEY);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setViewAsRole = (r: AppRole | null) => {
    setViewAsRoleState(r);
    if (r) sessionStorage.setItem(VIEW_AS_KEY, r);
    else sessionStorage.removeItem(VIEW_AS_KEY);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setViewAsRole(null);
  };

  // Only admins can use view-as. For everyone else, viewAs is ignored.
  const activeViewAs = role === "admin" ? viewAsRole : null;
  const effectiveRole: AppRole | null = activeViewAs ?? role;
  const isReadOnly = role === "admin" && activeViewAs !== null && activeViewAs !== "admin";

  return (
    <AuthContext.Provider
      value={{ user, session, role, viewAsRole: activeViewAs, effectiveRole, isReadOnly, loading, setViewAsRole, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
