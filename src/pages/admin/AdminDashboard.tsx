import { Baby, ClipboardCheck, DollarSign, MessageSquare, UserPlus, Megaphone, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your school overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Total Enrolled" value="0" icon={<Baby className="h-5 w-5" />} trend="New this term" trendUp color="primary" />
        <StatCard title="Attendance Today" value="0%" icon={<ClipboardCheck className="h-5 w-5" />} color="success" />
        <StatCard title="Fee Collection" value="0%" icon={<DollarSign className="h-5 w-5" />} color="warning" />
        <StatCard title="Unread Messages" value="0" icon={<MessageSquare className="h-5 w-5" />} color="primary" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" onClick={() => navigate("/admin/children")}><UserPlus className="h-4 w-4" /> Register Child</Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/admin/messages")}><Megaphone className="h-4 w-4" /> Announcement</Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/admin/reports")}><FileText className="h-4 w-4" /> Generate Report</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            <p className="text-xs text-muted-foreground">Activity will appear here as you start using the system.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
