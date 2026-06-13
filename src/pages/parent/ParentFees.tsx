import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";

interface FeeRow { id: string; child_id: string; term: string; academic_year: string; total_amount: number; amount_paid: number; due_date: string | null; child: { first_name: string; last_name: string; class_id: string | null } | null }
interface Template { id: string; class_id: string; term: string; academic_year: string; total_amount: number; afternoon_amount: number; due_date: string | null }
interface ClassRow { id: string; class_name: string }

export default function ParentFees() {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [f, t, c] = await Promise.all([
        supabase.from("fees").select("*, child:children(first_name,last_name,class_id)").order("created_at", { ascending: false }),
        (supabase as any).from("fee_templates").select("*"),
        supabase.from("classes").select("id,class_name"),
      ]);
      if (f.data) setFees(f.data as any);
      if (t.data) setTemplates(t.data as Template[]);
      if (c.data) setClasses(c.data as ClassRow[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalBalance = fees.reduce((s, f) => s + ((f.total_amount || 0) - (f.amount_paid || 0)), 0);
  const myClassIds = Array.from(new Set(fees.map(f => f.child?.class_id).filter(Boolean))) as string[];
  const relevantTemplates = templates.filter(t => myClassIds.includes(t.class_id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fees</h1>
        <p className="text-sm text-muted-foreground">Outstanding: UGX {totalBalance.toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {relevantTemplates.length > 0 && (
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">Class Fee Schedule</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {relevantTemplates.map(t => (
                  <div key={t.id} className="flex justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <p className="font-medium">{classes.find(c => c.id === t.class_id)?.class_name}</p>
                      <p className="text-xs text-muted-foreground">{t.term} · {t.academic_year}{t.due_date ? ` · due ${t.due_date}` : ""}</p>
                    </div>
                    <p className="font-semibold">UGX {Number(t.total_amount).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {fees.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No fee records yet.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Invoices</h2>
              {fees.map(fee => {
                const balance = (fee.total_amount || 0) - (fee.amount_paid || 0);
                return (
                  <Card key={fee.id} className="shadow-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{fee.child ? `${fee.child.first_name} ${fee.child.last_name}` : "Child"}</p>
                        <p className="text-xs text-muted-foreground">{fee.term} · {fee.academic_year}{fee.due_date ? ` · due ${fee.due_date}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">UGX {(fee.total_amount || 0).toLocaleString()}</p>
                        <Badge variant={balance <= 0 ? "default" : "destructive"} className="text-[10px]">
                          {balance <= 0 ? "Paid" : `Bal: ${balance.toLocaleString()}`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
