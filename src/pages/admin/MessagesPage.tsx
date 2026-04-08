import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;
type Profile = Tables<"profiles">;

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ recipient_id: "", subject: "", message_body: "" });

  const fetchData = async () => {
    setLoading(true);
    const [msgRes, profRes] = await Promise.all([
      supabase.from("messages").select("*").order("sent_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    if (msgRes.data) setMessages(msgRes.data);
    if (profRes.data) setProfiles(profRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.full_name || "Unknown";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: form.recipient_id,
      subject: form.subject || null,
      message_body: form.message_body,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Message sent!");
      setDialogOpen(false);
      setForm({ recipient_id: "", subject: "", message_body: "" });
      fetchData();
    }
    setSending(false);
  };

  const markAsRead = async (msg: Message) => {
    if (msg.is_read || msg.recipient_id !== user?.id) return;
    await supabase.from("messages").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", msg.id);
    fetchData();
  };

  const otherProfiles = profiles.filter(p => p.id !== user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">{messages.filter(m => !m.is_read && m.recipient_id === user?.id).length} unread</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Send className="h-4 w-4" /> New Message</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1">
                <Label>To</Label>
                <Select value={form.recipient_id} onValueChange={v => setForm(f => ({ ...f, recipient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                  <SelectContent>
                    {otherProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Message</Label>
                <Textarea value={form.message_body} onChange={e => setForm(f => ({ ...f, message_body: e.target.value }))} required rows={4} />
              </div>
              <Button type="submit" className="w-full" disabled={sending || !form.recipient_id || !form.message_body}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : messages.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <Card key={msg.id} className={`shadow-card cursor-pointer ${!msg.is_read && msg.recipient_id === user?.id ? "border-primary/30 bg-primary/5" : ""}`} onClick={() => markAsRead(msg)}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {msg.sender_id === user?.id ? `To: ${getProfileName(msg.recipient_id)}` : `From: ${getProfileName(msg.sender_id)}`}
                      </p>
                      {!msg.is_read && msg.recipient_id === user?.id && <Badge className="text-[10px]">New</Badge>}
                    </div>
                    {msg.subject && <p className="text-xs font-medium text-foreground mt-0.5">{msg.subject}</p>}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.message_body}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(msg.sent_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
