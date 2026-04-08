import { Users, ClipboardCheck, Activity, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Class</h1>
        <p className="text-sm text-muted-foreground">Your class overview for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Class Size" value="0" icon={<Users className="h-5 w-5" />} color="primary" />
        <StatCard title="Present Today" value="0" icon={<ClipboardCheck className="h-5 w-5" />} color="success" />
        <StatCard title="Logs Pending" value="0" icon={<Activity className="h-5 w-5" />} color="warning" />
        <StatCard title="Messages" value="0" icon={<MessageSquare className="h-5 w-5" />} color="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" onClick={() => navigate("/teacher/attendance")}><ClipboardCheck className="h-4 w-4" /> Mark Attendance</Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/teacher/activities")}><Activity className="h-4 w-4" /> Log Activity</Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/teacher/messages")}><MessageSquare className="h-4 w-4" /> Messages</Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-base">Today's Check-ins</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">No check-ins recorded yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
