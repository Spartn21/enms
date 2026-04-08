import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Fee = Tables<"fees">;

export default function ParentFees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("fees").select("*").order("created_at", { ascending: false });
      if (data) setFees(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalBalance = fees.reduce((s, f) => s + ((f.total_amount || 0) - (f.amount_paid || 0)), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fees</h1>
        <p className="text-sm text-muted-foreground">Outstanding: UGX {totalBalance.toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : fees.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No fee records found.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {fees.map(fee => {
            const balance = (fee.total_amount || 0) - (fee.amount_paid || 0);
            return (
              <Card key={fee.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{fee.term} · {fee.academic_year}</p>
                      <p className="text-xs text-muted-foreground">Due: {fee.due_date || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm">UGX {(fee.total_amount || 0).toLocaleString()}</p>
                      <Badge variant={balance <= 0 ? "default" : "destructive"} className="text-[10px]">
                        {balance <= 0 ? "Paid" : `Bal: ${balance.toLocaleString()}`}
                      </Badge>
                    </div>
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
