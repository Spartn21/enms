import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, GraduationCap } from "lucide-react";

interface ClassRow { id: string; class_name: string; age_group: string | null; teacher_id: string | null; capacity: number | null }
interface Teacher { id: string; full_name: string; email: string }

export default function ClassesManagement() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ class_name: "", age_group: "", capacity: "", teacher_id: "" });

  const load = async () => {
    setLoading(true);
    const [cls, prof, roles] = await Promise.all([
      supabase.from("classes").select("*").order("class_name"),
      supabase.from("profiles").select("id,full_name,email"),
      supabase.from("user_roles").select("user_id").eq("role", "teacher"),
    ]);
    if (cls.data) setClasses(cls.data as any);
    if (prof.data && roles.data) {
      const ids = new Set(roles.data.map((r: any) => r.user_id));
      setTeachers(prof.data.filter((p: any) => ids.has(p.id)) as Teacher[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("classes").insert({
      class_name: form.class_name,
      age_group: form.age_group || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      teacher_id: form.teacher_id || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Class created."); setOpen(false); setForm({ class_name: "", age_group: "", capacity: "", teacher_id: "" }); load(); }
    setSaving(false);
  };

  const setTeacher = async (classId: string, teacherId: string) => {
    const { error } = await supabase.from("classes").update({ teacher_id: teacherId || null }).eq("id", classId);
    if (error) toast.error(error.message);
    else { toast.success("Teacher assigned."); load(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground">Create classes and assign teachers.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1"><Label>Class Name</Label>
                <Input required value={form.class_name} onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Age Group</Label>
                  <Input value={form.age_group} onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))} placeholder="e.g. 3-4 yrs" /></div>
                <div className="space-y-1"><Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>Teacher</Label>
                <Select value={form.teacher_id} onValueChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>)}</SelectContent>
                </Select></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : classes.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No classes yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.id} className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{c.class_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{c.age_group || "No age group"} · Capacity {c.capacity ?? "—"}</p>
                <div className="space-y-1">
                  <Label className="text-xs">Class Teacher</Label>
                  <Select value={c.teacher_id ?? ""} onValueChange={(v) => setTeacher(c.id, v)}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
