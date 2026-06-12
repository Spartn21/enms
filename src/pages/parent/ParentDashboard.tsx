import { useEffect, useState } from "react";
import { Baby, ClipboardCheck, CreditCard, MessageSquare, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, role, isReadOnly } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      // For real parents, gate on having guardian rows. Admins in view-as see whatever exists.
      if (role === "parent") {
        const { data: g } = await supabase.from("guardians").select("child_id").eq("user_id", user.id);
        if (!g || g.length === 0) { navigate("/parent/request-access", { replace: true }); return; }
        const ids = g.map((r) => r.child_id);
        const { data: kids } = await supabase.from("children").select("id,first_name,last_name").in("id", ids);
        setChildren(kids ?? []);
      } else {
        const { data: kids } = await supabase.from("children").select("id,first_name,last_name").limit(5);
        setChildren(kids ?? []);
      }
      setLoading(false);
    };
    load();
  }, [user, role, navigate]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Child{children.length > 1 ? "ren" : ""}</h1>
        <p className="text-sm text-muted-foreground">
          {children.length === 0 ? "No children linked yet." : children.map((c) => `${c.first_name} ${c.last_name}`).join(", ")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard title="Attendance" value="—" icon={<ClipboardCheck className="h-5 w-5" />} color="success" />
        <StatCard title="Fee Balance" value="—" icon={<CreditCard className="h-5 w-5" />} color="warning" />
        <StatCard title="Messages" value="—" icon={<MessageSquare className="h-5 w-5" />} color="primary" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" disabled={isReadOnly} onClick={() => navigate("/parent/messages")}><MessageSquare className="h-4 w-4" /> Message Teacher</Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/parent/fees")}><CreditCard className="h-4 w-4" /> Pay Fees</Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/parent/activities")}><Calendar className="h-4 w-4" /> View Activities</Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Today's Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Baby className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No activities logged today yet.</p>
            <p className="text-xs text-muted-foreground">Your child's teacher will update activities throughout the day.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
