import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, Plus, Loader2, Send } from "lucide-react";

interface ClassRow { id: string; class_name: string; level: string | null; has_afternoon_session: boolean }
interface Template {
  id: string; class_id: string; term: string; academic_year: string;
  tuition_amount: number; meals_amount: number; transport_amount: number;
  afternoon_amount: number; extras_amount: number; total_amount: number;
  due_date: string | null;
}

const blank = {
  class_id: "", term: "Term 1", academic_year: new Date().getFullYear().toString(),
  tuition_amount: "", meals_amount: "", transport_amount: "",
  afternoon_amount: "", extras_amount: "", due_date: "",
};

export default function FeeTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      (supabase as any).from("fee_templates").select("*").order("academic_year", { ascending: false }).order("term"),
      supabase.from("classes").select("id,class_name,level,has_afternoon_session").order("class_name"),
    ]);
    if (t.data) setTemplates(t.data as Template[]);
    if (c.data) setClasses(c.data as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await (supabase as any).from("fee_templates").insert({
      class_id: form.class_id,
      term: form.term,
      academic_year: form.academic_year,
      tuition_amount: Number(form.tuition_amount) || 0,
      meals_amount: Number(form.meals_amount) || 0,
      transport_amount: Number(form.transport_amount) || 0,
      afternoon_amount: Number(form.afternoon_amount) || 0,
      extras_amount: Number(form.extras_amount) || 0,
      due_date: form.due_date || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Template saved."); setOpen(false); setForm(blank); load(); }
    setSaving(false);
  };

  const apply = async (id: string) => {
    setApplying(id);
    const { data, error } = await (supabase as any).rpc("apply_fee_template", { _template_id: id });
    if (error) toast.error(error.message);
    else toast.success(`Applied to ${data ?? 0} children.`);
    setApplying(null);
  };

  const className = (id: string) => classes.find(c => c.id === id)?.class_name ?? "Unknown class";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Templates</h1>
          <p className="text-sm text-muted-foreground">One template per class, term &amp; year. Apply to generate fee records for every child.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Template</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Fee Template</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1"><Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Term</Label>
                  <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
                  </Select></div>
                <div className="space-y-1"><Label>Academic Year</Label>
                  <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Tuition (UGX)</Label><Input type="number" value={form.tuition_amount} onChange={e => setForm(f => ({ ...f, tuition_amount: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Meals (UGX)</Label><Input type="number" value={form.meals_amount} onChange={e => setForm(f => ({ ...f, meals_amount: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Transport (UGX)</Label><Input type="number" value={form.transport_amount} onChange={e => setForm(f => ({ ...f, transport_amount: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Afternoon Session</Label><Input type="number" value={form.afternoon_amount} onChange={e => setForm(f => ({ ...f, afternoon_amount: e.target.value }))} /></div>
                <div className="space-y-1 col-span-2"><Label>Extras (UGX)</Label><Input type="number" value={form.extras_amount} onChange={e => setForm(f => ({ ...f, extras_amount: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              <Button type="submit" className="w-full" disabled={saving || !form.class_id}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Template</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No fee templates yet.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <Card key={t.id} className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between">
                <span>{className(t.class_id)}</span>
                <Badge variant="secondary" className="text-[10px]">{t.term} · {t.academic_year}</Badge>
              </CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Tuition</span><span>UGX {t.tuition_amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>Meals</span><span>UGX {t.meals_amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>Transport</span><span>UGX {t.transport_amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>Afternoon</span><span>UGX {t.afternoon_amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>Extras</span><span>UGX {t.extras_amount.toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>UGX {t.total_amount.toLocaleString()}</span></div>
                <Button size="sm" variant="outline" className="w-full gap-2" disabled={applying === t.id} onClick={() => apply(t.id)}>
                  {applying === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Apply to class
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
