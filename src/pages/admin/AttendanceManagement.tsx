import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, CheckCheck, Search } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Child = Tables<"children">;
type Attendance = Tables<"attendance">;
type ClassRow = Tables<"classes">;
type Status = Enums<"attendance_status">;

export default function AttendanceManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    setLoading(true);
    const [c, cls, a] = await Promise.all([
      supabase.from("children").select("*").eq("status", "active").order("first_name"),
      supabase.from("classes").select("*").order("class_name"),
      supabase.from("attendance").select("*").eq("date", today),
    ]);
    if (c.data) setChildren(c.data);
    if (cls.data) setClasses(cls.data);
    if (a.data) setAttendance(a.data);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const visible = useMemo(() => children.filter(c =>
    (classFilter === "all" || c.class_id === classFilter) &&
    (!search || `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()))
  ), [children, classFilter, search]);

  const getStatus = (id: string) => attendance.find(a => a.child_id === id)?.status ?? null;

  const upsertOne = async (childId: string, status: Status) => {
    setSavingId(childId);
    const { error } = await supabase.from("attendance")
      .upsert({ child_id: childId, date: today, status }, { onConflict: "child_id,date" });
    if (error) toast.error(error.message);
    await fetchData();
    setSavingId(null);
  };

  const markAll = async (status: Status) => {
    if (visible.length === 0) return;
    setBulkSaving(true);
    const rows = visible.map(c => ({ child_id: c.id, date: today, status }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "child_id,date" });
    if (error) toast.error(error.message);
    else toast.success(`Marked ${rows.length} as ${status}.`);
    await fetchData();
    setBulkSaving(false);
  };

  const present = attendance.filter(a => a.status === "present").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const late = attendance.filter(a => a.status === "late").length;
  const unmarked = visible.filter(c => !getStatus(c.id)).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">Today: {today}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-success">{present}</p><p className="text-[10px] text-muted-foreground">Present</p></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-destructive">{absent}</p><p className="text-[10px] text-muted-foreground">Absent</p></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-warning">{late}</p><p className="text-[10px] text-muted-foreground">Late</p></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-foreground">{unmarked}</p><p className="text-[10px] text-muted-foreground">Unmarked</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" disabled={bulkSaving || visible.length === 0} onClick={() => markAll("present")}>
          {bulkSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Mark all present ({visible.length})
        </Button>
        <Button size="sm" variant="outline" disabled={bulkSaving || visible.length === 0} onClick={() => markAll("absent")}>Mark all absent</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No children to mark.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {visible.map(child => {
            const status = getStatus(child.id);
            return (
              <Card key={child.id} className="shadow-card">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{child.first_name} {child.last_name}</p>
                    {status && <Badge variant={status === "present" ? "default" : status === "late" ? "secondary" : "destructive"} className="text-[10px] mt-1">{status}</Badge>}
                  </div>
                  <div className="flex gap-1">
                    {(["present", "late", "absent"] as Status[]).map(s => (
                      <Button key={s} size="sm" variant={status === s ? "default" : "outline"} className="text-xs h-8 px-2"
                        disabled={savingId === child.id} onClick={() => upsertOne(child.id, s)}>
                        {savingId === child.id ? <Loader2 className="h-3 w-3 animate-spin" /> : s.charAt(0).toUpperCase() + s.slice(1)}
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
