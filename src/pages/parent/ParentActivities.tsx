import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ActivityLog = Tables<"activity_logs">;

export default function ParentActivities() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("log_date", { ascending: false }).limit(50);
      if (data) setLogs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        <p className="text-sm text-muted-foreground">Your child's daily activity logs.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No activity logs yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Card key={log.id} className="shadow-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{log.log_date}</p>
                  <span className="text-lg">{log.mood === "happy" ? "😊" : log.mood === "okay" ? "😐" : log.mood === "upset" ? "😢" : log.mood === "tired" ? "😴" : "—"}</span>
                </div>
                {log.activities_description && <p className="text-xs text-muted-foreground mt-1">{log.activities_description}</p>}
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  {log.meal_breakfast && <span>🍳 {log.meal_breakfast}</span>}
                  {log.meal_lunch && <span>🍱 {log.meal_lunch}</span>}
                  {log.nap_duration && <span>💤 {log.nap_duration}min</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
