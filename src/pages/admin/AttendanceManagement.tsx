import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClipboardCheck, Loader2 } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Child = Tables<"children">;
type Attendance = Tables<"attendance">;

export default function AttendanceManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    setLoading(true);
    const [childRes, attRes] = await Promise.all([
      supabase.from("children").select("*").eq("status", "active").order("first_name"),
      supabase.from("attendance").select("*").eq("date", today),
    ]);
    if (childRes.data) setChildren(childRes.data);
    if (attRes.data) setAttendance(attRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStatus = (childId: string) => {
    const record = attendance.find(a => a.child_id === childId);
    return record?.status || null;
  };

  const markAttendance = async (childId: string, status: Enums<"attendance_status">) => {
    setSaving(childId);
    const existing = attendance.find(a => a.child_id === childId);
    if (existing) {
      const { error } = await supabase.from("attendance").update({ status }).eq("id", existing.id);
      if (error) toast.error(error.message);
      else toast.success("Updated!");
    } else {
      const { error } = await supabase.from("attendance").insert({ child_id: childId, date: today, status });
      if (error) toast.error(error.message);
      else toast.success("Marked!");
    }
    await fetchData();
    setSaving(null);
  };

  const present = attendance.filter(a => a.status === "present").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const late = attendance.filter(a => a.status === "late").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">Today: {today}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-success">{present}</p>
          <p className="text-xs text-muted-foreground">Present</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-destructive">{absent}</p>
          <p className="text-xs text-muted-foreground">Absent</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-warning">{late}</p>
          <p className="text-xs text-muted-foreground">Late</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : children.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No children to mark attendance for.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {children.map(child => {
            const status = getStatus(child.id);
            return (
              <Card key={child.id} className="shadow-card">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-foreground text-sm">{child.first_name} {child.last_name}</p>
                    {status && <Badge variant={status === "present" ? "default" : status === "late" ? "secondary" : "destructive"} className="text-[10px] mt-1">{status}</Badge>}
                  </div>
                  <div className="flex gap-1">
                    {(["present", "late", "absent"] as const).map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={status === s ? "default" : "outline"}
                        className="text-xs h-8 px-2"
                        disabled={saving === child.id}
                        onClick={() => markAttendance(child.id, s)}
                      >
                        {saving === child.id ? <Loader2 className="h-3 w-3 animate-spin" /> : s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
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
