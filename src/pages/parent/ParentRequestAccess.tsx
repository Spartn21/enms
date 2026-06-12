import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Baby, Loader2, Search, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DirChild { id: string; first_name: string; last_initial: string; class_name: string | null }
interface RequestRow { id: string; child_id: string; status: string; relationship: string; created_at: string }

export default function ParentRequestAccess() {
  const navigate = useNavigate();
  const { user, isReadOnly } = useAuth();
  const [directory, setDirectory] = useState<DirChild[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<DirChild | null>(null);
  const [relationship, setRelationship] = useState("Mother");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [dirRes, reqRes, guardRes] = await Promise.all([
      supabase.rpc("get_children_directory"),
      supabase.from("child_access_requests").select("id,child_id,status,relationship,created_at").eq("parent_id", user!.id),
      supabase.from("guardians").select("child_id").eq("user_id", user!.id),
    ]);
    if (dirRes.data) setDirectory(dirRes.data as DirChild[]);
    if (reqRes.data) setRequests(reqRes.data);
    // If parent already linked to children, send them home
    if (guardRes.data && guardRes.data.length > 0) navigate("/parent", { replace: true });
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const statusFor = (childId: string) => requests.find((r) => r.child_id === childId)?.status;

  const submit = async () => {
    if (!target || isReadOnly) return;
    setSubmitting(true);
    const { error } = await supabase.from("child_access_requests").insert({
      parent_id: user!.id, child_id: target.id, relationship, note: note || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Request submitted. The admin will review it shortly."); setTarget(null); setNote(""); load(); }
    setSubmitting(false);
  };

  const filtered = directory.filter((c) =>
    `${c.first_name} ${c.last_initial}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.class_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Your Child</h1>
        <p className="text-sm text-muted-foreground">
          Search the school directory and request access. An administrator will review and approve.
        </p>
      </div>

      {requests.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-base">Your Requests</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {requests.map((r) => {
              const child = directory.find((d) => d.id === r.child_id);
              const Icon = r.status === "approved" ? CheckCircle2 : r.status === "rejected" ? XCircle : Clock;
              const color = r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-warning";
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{child ? `${child.first_name} ${child.last_initial}.` : "Child"} <span className="text-muted-foreground">({r.relationship})</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or class…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Baby className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No children match your search.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => {
            const status = statusFor(c.id);
            return (
              <Card key={c.id} className="shadow-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Baby className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.first_name} {c.last_initial}.</p>
                    <p className="text-xs text-muted-foreground">{c.class_name ?? "Unassigned"}</p>
                  </div>
                  {status ? (
                    <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>{status}</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setTarget(c)} disabled={isReadOnly}>Request</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request access to {target?.first_name} {target?.last_initial}.</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note for the admin (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I am the mother, my child started this term." maxLength={500} />
            </div>
            <Button className="w-full" onClick={submit} disabled={submitting || isReadOnly}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
