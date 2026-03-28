import { Baby, ClipboardCheck, CreditCard, MessageSquare, Calendar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParentDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Child</h1>
        <p className="text-sm text-muted-foreground">Track your child's day at school.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard title="Attendance" value="0%" icon={<ClipboardCheck className="h-5 w-5" />} color="success" />
        <StatCard title="Fee Balance" value="UGX 0" icon={<CreditCard className="h-5 w-5" />} color="warning" />
        <StatCard title="Messages" value="0" icon={<MessageSquare className="h-5 w-5" />} color="primary" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" /> Message Teacher
        </Button>
        <Button size="sm" variant="outline" className="gap-2">
          <CreditCard className="h-4 w-4" /> Pay Fees
        </Button>
        <Button size="sm" variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" /> Report Absence
        </Button>
      </div>

      {/* Today's Timeline */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Baby className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No activities logged today yet.</p>
            <p className="text-xs text-muted-foreground">Your child's teacher will update activities throughout the day.</p>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No announcements yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
