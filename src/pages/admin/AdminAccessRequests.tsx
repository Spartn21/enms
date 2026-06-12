import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserCheck, Check, X, Inbox } from "lucide-react";

interface Row {
  id: string; parent_id: string; child_id: string; relationship: string;
  note: string | null; status: string; created_at: string;
  child?: { first_name: string; last_name: string };
  parent?: { full_name: string; email: string };
}

export default function AdminAccessRequests() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("child_access_requests")
      .select("id,parent_id,child_id,relationship,note,status,created_at")
      .order("created_at", { ascending: false });
    if (!data) { setRows([]); setLoading(false); return; }
    const childIds = [...new Set(data.map((r) => r.child_id))];
    const parentIds = [...new Set(data.map((r) => r.parent_id))];
    const [{ data: children }, { data: parents }] = await Promise.all([
      supabase.from("children").select("id,first_name,last_name").in("id", childIds),
      supabase.from("profiles").select("id,full_name,email").in("id", parentIds),
    ]);
    setRows(data.map((r) => ({
      ...r,
      child: children?.find((c) => c.id === r.child_id),
      parent: parents?.find((p) => p.id === r.parent_id) as any,
    })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-req-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "child_access_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase.from("child_access_requests").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(status === "approved" ? "Access granted." : "Request rejected.");
    setBusy(null);
  };

  const visible = tab === "pending" ? rows.filter((r) => r.status === "pending") : rows;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parent Access Requests</h1>
        <p className="text-sm text-muted-foreground">Approve parents to link them to their child's data.</p>
      </div>

      <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 font-medium capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t}{t === "pending" ? ` (${rows.filter((r) => r.status === "pending").length})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No {tab === "pending" ? "pending " : ""}requests.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <Card key={r.id} className="shadow-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {r.parent?.full_name || "Parent"} → {r.child ? `${r.child.first_name} ${r.child.last_name}` : "Child"}
                </CardTitle>
                <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Email:</span> {r.parent?.email} · <span className="font-medium text-foreground">Relationship:</span> {r.relationship}
                </p>
                {r.note && <p className="rounded-md bg-muted/50 p-2 text-xs">{r.note}</p>}
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                {r.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => review(r.id, "approved")} disabled={busy === r.id} className="gap-1">
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => review(r.id, "rejected")} disabled={busy === r.id} className="gap-1">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
