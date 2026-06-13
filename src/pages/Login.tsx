import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { GraduationCap, Loader2, Eye, EyeOff, AlertCircle, MailCheck } from "lucide-react";
import { triggerSplash } from "@/components/SplashScreen";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(72),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  useEffect(() => {
    if (params.get("confirmed") === "true") toast.success("Email confirmed — please sign in.");
  }, [params]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setUnconfirmedEmail(null);
    const { data: res, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(), password: data.password,
    });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(data.email.trim());
        toast.error("Please confirm your email first.");
      } else if (error.message.toLowerCase().includes("too many")) {
        toast.error("Too many attempts. Try again in a minute.");
      } else {
        toast.error("Invalid email or password.");
      }
      setSubmitting(false);
      return;
    }
    if (res.user) {
      triggerSplash();
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: res.user.id });
      const role = roleData as string;
      if (role === "parent") {
        const { data: g } = await supabase.from("guardians").select("id").eq("user_id", res.user.id).limit(1);
        navigate(g && g.length > 0 ? "/parent" : "/parent/request-access");
      } else if (role === "teacher") navigate("/teacher");
      else if (role === "admin") navigate("/admin");
      else navigate("/");
    }
    setSubmitting(false);
  };

  const resend = async () => {
    if (!unconfirmedEmail) return;
    const { error } = await supabase.auth.resend({
      type: "signup", email: unconfirmedEmail,
      options: { emailRedirectTo: "https://enms-nu.vercel.app/login?confirmed=true" },
    });
    if (error) toast.error(error.message);
    else toast.success("Confirmation email resent.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">E-NMS</h1>
          <p className="text-sm text-muted-foreground">Nursery Management System</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" inputMode="email"
                  placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"}
                    autoComplete="current-password" placeholder="••••••••"
                    onKeyUp={(e) => setCapsLock((e as any).getModifierState?.("CapsLock"))}
                    {...register("password")} aria-invalid={!!errors.password} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLock && <p className="flex items-center gap-1 text-xs text-warning"><AlertCircle className="h-3 w-3" /> Caps Lock is on</p>}
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox {...register("remember")} defaultChecked /> Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>

              {unconfirmedEmail && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <MailCheck className="h-4 w-4 mt-0.5" />
                  <div className="flex-1">
                    <p>Your email isn't confirmed yet.</p>
                    <button type="button" onClick={resend} className="font-medium underline">Resend confirmation</button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
