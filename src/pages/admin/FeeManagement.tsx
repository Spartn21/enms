import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, Plus, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Fee = Tables<"fees">;
type Child = Tables<"children">;

export default function FeeManagement() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    child_id: "", term: "Term 1", academic_year: "2026",
    tuition_amount: "", meals_amount: "", transport_amount: "",
    extras_amount: "", due_date: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [feeRes, childRes] = await Promise.all([
      supabase.from("fees").select("*").order("created_at", { ascending: false }),
      supabase.from("children").select("*").eq("status", "active").order("first_name"),
    ]);
    if (feeRes.data) setFees(feeRes.data);
    if (childRes.data) setChildren(childRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tuition = parseFloat(form.tuition_amount) || 0;
    const meals = parseFloat(form.meals_amount) || 0;
    const transport = parseFloat(form.transport_amount) || 0;
    const extras = parseFloat(form.extras_amount) || 0;
    const total = tuition + meals + transport + extras;

    const { error } = await supabase.from("fees").insert({
      child_id: form.child_id,
      term: form.term,
      academic_year: form.academic_year,
      tuition_amount: tuition,
      meals_amount: meals,
      transport_amount: transport,
      extras_amount: extras,
      total_amount: total,
      due_date: form.due_date || null,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Fee record created!");
      setDialogOpen(false);
      setForm({ child_id: "", term: "Term 1", academic_year: "2026", tuition_amount: "", meals_amount: "", transport_amount: "", extras_amount: "", due_date: "" });
      fetchData();
    }
    setSaving(false);
  };

  const getChildName = (id: string) => {
    const child = children.find(c => c.id === id);
    return child ? `${child.first_name} ${child.last_name}` : "Unknown";
  };

  const totalCollected = fees.reduce((s, f) => s + (f.amount_paid || 0), 0);
  const totalExpected = fees.reduce((s, f) => s + (f.total_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
          <p className="text-sm text-muted-foreground">
            Collected: UGX {totalCollected.toLocaleString()} / {totalExpected.toLocaleString()}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Fee</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Fee Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Child</Label>
                <Select value={form.child_id} onValueChange={v => setForm(f => ({ ...f, child_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                  <SelectContent>
                    {children.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Term</Label>
                  <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Academic Year</Label>
                  <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tuition (UGX)</Label>
                  <Input type="number" value={form.tuition_amount} onChange={e => setForm(f => ({ ...f, tuition_amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Meals (UGX)</Label>
                  <Input type="number" value={form.meals_amount} onChange={e => setForm(f => ({ ...f, meals_amount: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Transport (UGX)</Label>
                  <Input type="number" value={form.transport_amount} onChange={e => setForm(f => ({ ...f, transport_amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Extras (UGX)</Label>
                  <Input type="number" value={form.extras_amount} onChange={e => setForm(f => ({ ...f, extras_amount: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !form.child_id}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Fee Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : fees.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No fee records yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {fees.map(fee => {
            const balance = (fee.total_amount || 0) - (fee.amount_paid || 0);
            return (
              <Card key={fee.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{getChildName(fee.child_id)}</p>
                      <p className="text-xs text-muted-foreground">{fee.term} · {fee.academic_year}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm">UGX {(fee.total_amount || 0).toLocaleString()}</p>
                      <Badge variant={balance <= 0 ? "default" : "destructive"} className="text-[10px]">
                        {balance <= 0 ? "Paid" : `Bal: ${balance.toLocaleString()}`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
