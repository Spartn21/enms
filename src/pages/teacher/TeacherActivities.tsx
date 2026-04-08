import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Plus, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ActivityLog = Tables<"activity_logs">;
type Child = Tables<"children">;

export default function TeacherActivities() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    child_id: "", mood: "", activities_description: "",
    meal_breakfast: "", meal_lunch: "", meal_snack: "",
    nap_duration: "", behavior_notes: "", health_notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [logRes, childRes] = await Promise.all([
      supabase.from("activity_logs").select("*").eq("log_date", today).order("created_at", { ascending: false }),
      supabase.from("children").select("*").eq("status", "active").order("first_name"),
    ]);
    if (logRes.data) setLogs(logRes.data);
    if (childRes.data) setChildren(childRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("activity_logs").insert({
      child_id: form.child_id,
      logged_by: user.id,
      mood: (form.mood as any) || null,
      activities_description: form.activities_description || null,
      meal_breakfast: (form.meal_breakfast as any) || null,
      meal_lunch: (form.meal_lunch as any) || null,
      meal_snack: (form.meal_snack as any) || null,
      nap_duration: form.nap_duration ? parseInt(form.nap_duration) : null,
      behavior_notes: form.behavior_notes || null,
      health_notes: form.health_notes || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Activity logged!");
      setDialogOpen(false);
      setForm({ child_id: "", mood: "", activities_description: "", meal_breakfast: "", meal_lunch: "", meal_snack: "", nap_duration: "", behavior_notes: "", health_notes: "" });
      fetchData();
    }
    setSaving(false);
  };

  const getChildName = (id: string) => {
    const c = children.find(ch => ch.id === id);
    return c ? `${c.first_name} ${c.last_name}` : "Unknown";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Activities</h1>
          <p className="text-sm text-muted-foreground">{logs.length} logs today</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Log Activity</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Child</Label>
                <Select value={form.child_id} onValueChange={v => setForm(f => ({ ...f, child_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                  <SelectContent>{children.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Mood</Label>
                <Select value={form.mood} onValueChange={v => setForm(f => ({ ...f, mood: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select mood" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">😊 Happy</SelectItem>
                    <SelectItem value="okay">😐 Okay</SelectItem>
                    <SelectItem value="upset">😢 Upset</SelectItem>
                    <SelectItem value="tired">😴 Tired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Activities</Label>
                <Textarea value={form.activities_description} onChange={e => setForm(f => ({ ...f, activities_description: e.target.value }))} placeholder="What did the child do today?" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["meal_breakfast", "meal_lunch", "meal_snack"] as const).map(meal => (
                  <div key={meal} className="space-y-1">
                    <Label className="text-xs capitalize">{meal.split("_")[1]}</Label>
                    <Select value={(form as any)[meal]} onValueChange={v => setForm(f => ({ ...f, [meal]: v }))}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumed">All</SelectItem>
                        <SelectItem value="partial">Some</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label>Nap Duration (minutes)</Label>
                <Input type="number" value={form.nap_duration} onChange={e => setForm(f => ({ ...f, nap_duration: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Behavior Notes</Label>
                <Input value={form.behavior_notes} onChange={e => setForm(f => ({ ...f, behavior_notes: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Health Notes</Label>
                <Input value={form.health_notes} onChange={e => setForm(f => ({ ...f, health_notes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !form.child_id}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Log
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No activities logged today.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Card key={log.id} className="shadow-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-foreground">{getChildName(log.child_id)}</p>
                  <span className="text-lg">{log.mood === "happy" ? "😊" : log.mood === "okay" ? "😐" : log.mood === "upset" ? "😢" : log.mood === "tired" ? "😴" : "—"}</span>
                </div>
                {log.activities_description && <p className="text-xs text-muted-foreground mt-1">{log.activities_description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
