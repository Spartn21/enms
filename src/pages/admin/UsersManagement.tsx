import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users as UsersIcon, Search, Loader2, Mail, Phone } from "lucide-react";

interface UserRow { id: string; full_name: string | null; email: string | null; phone_number: string | null; role: string }

export default function UsersManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone_number"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const roleMap = new Map((r.data ?? []).map((x: any) => [x.user_id, x.role]));
      const rows = (p.data ?? []).map((u: any) => ({ ...u, role: roleMap.get(u.id) ?? "parent" }));
      setUsers(rows);
      setLoading(false);
    };
    load();
  }, []);

  const filter = (role: string) =>
    users.filter(u => u.role === role && (
      !q || (u.full_name?.toLowerCase().includes(q.toLowerCase())) || (u.email?.toLowerCase().includes(q.toLowerCase()))
    ));

  const list = (rows: UserRow[]) =>
    rows.length === 0 ? (
      <Card><CardContent className="py-12 text-center"><UsersIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No users found.</p></CardContent></Card>
    ) : (
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map(u => (
          <Card key={u.id} className="shadow-card">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {(u.full_name || u.email || "?").slice(0,1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name || "No name"}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</p>
                {u.phone_number && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone_number}</p>}
              </div>
              <Badge variant="secondary" className="text-[10px] capitalize">{u.role}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} total accounts</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="teachers">
          <TabsList><TabsTrigger value="teachers">Teachers ({users.filter(u=>u.role==="teacher").length})</TabsTrigger>
            <TabsTrigger value="parents">Parents ({users.filter(u=>u.role==="parent").length})</TabsTrigger>
            <TabsTrigger value="admins">Admins ({users.filter(u=>u.role==="admin").length})</TabsTrigger></TabsList>
          <TabsContent value="teachers" className="mt-4">{list(filter("teacher"))}</TabsContent>
          <TabsContent value="parents" className="mt-4">{list(filter("parent"))}</TabsContent>
          <TabsContent value="admins" className="mt-4">{list(filter("admin"))}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
