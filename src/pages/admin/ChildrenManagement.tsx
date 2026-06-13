import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Baby, Plus, Search, Loader2, Pencil } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children"> & { afternoon_session_enrolled?: boolean };
type ClassRow = Tables<"classes"> & { level?: string | null; has_afternoon_session?: boolean };

const emptyForm = {
  first_name: "", last_name: "", date_of_birth: "",
  gender: "" as string, class_id: "", allergies: "",
  medical_info: "", dietary_restrictions: "", special_needs: "",
  status: "active" as string, afternoon_session_enrolled: false,
};

export default function ChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    const [childRes, classRes] = await Promise.all([
      supabase.from("children").select("*").order("first_name"),
      supabase.from("classes").select("*").order("class_name"),
    ]);
    if (childRes.data) setChildren(childRes.data as Child[]);
    if (classRes.data) setClasses(classRes.data as ClassRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Child) => {
    setEditingId(c.id);
    setForm({
      first_name: c.first_name, last_name: c.last_name,
      date_of_birth: c.date_of_birth ?? "", gender: (c.gender as string) ?? "",
      class_id: c.class_id ?? "", allergies: c.allergies ?? "",
      medical_info: c.medical_info ?? "", dietary_restrictions: c.dietary_restrictions ?? "",
      special_needs: c.special_needs ?? "", status: c.status,
      afternoon_session_enrolled: (c as any).afternoon_session_enrolled ?? false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      first_name: form.first_name,
      last_name: form.last_name,
      date_of_birth: form.date_of_birth || null,
      gender: (form.gender as "male" | "female") || null,
      class_id: form.class_id || null,
      allergies: form.allergies || null,
      medical_info: form.medical_info || null,
      dietary_restrictions: form.dietary_restrictions || null,
      special_needs: form.special_needs || null,
      status: form.status,
      afternoon_session_enrolled: form.afternoon_session_enrolled,
    };
    const { error } = editingId
      ? await supabase.from("children").update(payload).eq("id", editingId)
      : await supabase.from("children").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success(editingId ? "Child updated." : "Child registered.");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    }
    setSaving(false);
  };

  const filtered = children.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClass = classes.find(c => c.id === form.class_id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Children</h1>
          <p className="text-sm text-muted-foreground">{children.length} enrolled</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={openNew}><Plus className="h-4 w-4" /> Register Child</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit Child" : "Register New Child"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>First Name</Label>
                  <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>Last Name</Label>
                  <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                  </Select></div>
              </div>
              <div className="space-y-1"><Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Assign to class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}{c.level ? ` · ${c.level}` : ""}</SelectItem>)}</SelectContent>
                </Select></div>
              {selectedClass?.has_afternoon_session && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div><Label className="text-sm">Afternoon Session</Label>
                    <p className="text-xs text-muted-foreground">Optional paid subscription</p></div>
                  <Switch checked={form.afternoon_session_enrolled} onCheckedChange={(v) => setForm(f => ({ ...f, afternoon_session_enrolled: v }))} />
                </div>
              )}
              <div className="space-y-1"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Allergies</Label>
                <Input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Peanuts, Dairy" /></div>
              <div className="space-y-1"><Label>Medical Info</Label>
                <Textarea rows={2} value={form.medical_info} onChange={e => setForm(f => ({ ...f, medical_info: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Dietary Restrictions</Label>
                <Input value={form.dietary_restrictions} onChange={e => setForm(f => ({ ...f, dietary_restrictions: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Special Needs</Label>
                <Input value={form.special_needs} onChange={e => setForm(f => ({ ...f, special_needs: e.target.value }))} /></div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingId ? "Save Changes" : "Register Child"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search children..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Baby className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No children registered yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(child => {
            const cls = classes.find(c => c.id === child.class_id);
            return (
              <Card key={child.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Baby className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{child.first_name} {child.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{cls?.class_name ?? "Unassigned"}</p>
                    </div>
                    <button onClick={() => openEdit(child)} className="text-muted-foreground hover:text-primary" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant={child.status === "active" ? "default" : "secondary"} className="text-[10px]">{child.status}</Badge>
                    {(child as any).afternoon_session_enrolled && <Badge variant="outline" className="text-[10px]">Afternoon</Badge>}
                  </div>
                  {child.allergies && <p className="mt-2 text-xs text-destructive">⚠ {child.allergies}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
