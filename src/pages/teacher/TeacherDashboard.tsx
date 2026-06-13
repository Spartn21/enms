import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, Activity, MessageSquare, AlertTriangle, Utensils, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children">;

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [className, setClassName] = useState<string>("");
  const [roster, setRoster] = useState<Child[]>([]);
  const [presentToday, setPresentToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: cls } = await supabase.from("classes").select("id,class_name").eq("teacher_id", user.id).maybeSingle();
      if (cls) {
        setClassName(cls.class_name);
        const { data: ch } = await supabase.from("children").select("*").eq("class_id", cls.id).eq("status", "active").order("first_name");
        setRoster(ch ?? []);
        if (ch && ch.length) {
          const { data: att } = await supabase.from("attendance").select("child_id,status").eq("date", today).in("child_id", ch.map(c => c.id));
          setPresentToday((att ?? []).filter(a => a.status === "present").length);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const flagged = roster.filter(c => c.allergies || c.medical_info || c.dietary_restrictions || c.special_needs);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Class</h1>
        <p className="text-sm text-muted-foreground">{className || "No class assigned yet"} · {today}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Class Size" value={String(roster.length)} icon={<Users className="h-5 w-5" />} color="primary" />
        <StatCard title="Present Today" value={String(presentToday)} icon={<ClipboardCheck className="h-5 w-5" />} color="success" />
        <StatCard title="Medical Flags" value={String(flagged.length)} icon={<AlertTriangle className="h-5 w-5" />} color="warning" />
        <StatCard title="Messages" value="0" icon={<MessageSquare className="h-5 w-5" />} color="primary" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-2" onClick={() => navigate("/teacher/attendance")}><ClipboardCheck className="h-4 w-4" /> Mark Attendance</Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/teacher/activities")}><Activity className="h-4 w-4" /> Log Activity</Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/teacher/messages")}><MessageSquare className="h-4 w-4" /> Messages</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Class Roster &amp; Health Notes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : roster.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No children in your class yet.</p>
          ) : (
            <div className="space-y-2">
              {roster.map(c => (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{c.first_name} {c.last_name}</p>
                    {(c.allergies || c.medical_info) && <Badge variant="destructive" className="text-[10px]">Health</Badge>}
                  </div>
                  {c.allergies && <p className="mt-1 text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Allergies: {c.allergies}</p>}
                  {c.medical_info && <p className="text-xs text-warning">⚕ {c.medical_info}</p>}
                  {c.dietary_restrictions && <p className="text-xs text-muted-foreground flex items-center gap-1"><Utensils className="h-3 w-3" /> {c.dietary_restrictions}</p>}
                  {c.special_needs && <p className="text-xs text-muted-foreground">★ {c.special_needs}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
