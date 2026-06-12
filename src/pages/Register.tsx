import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Loader2, Eye, EyeOff, ShieldCheck, BookOpen, Users, AlertCircle } from "lucide-react";

type Role = "admin" | "teacher" | "parent";

const roles: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: "admin", label: "Administrator", icon: <ShieldCheck className="h-5 w-5" /> },
  { value: "teacher", label: "Teacher", icon: <BookOpen className="h-5 w-5" /> },
  { value: "parent", label: "Parent", icon: <Users className="h-5 w-5" /> },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^$|^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number").optional(),
  password: z.string()
    .min(8, "At least 8 characters")
    .max(72)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirm: z.string(),
  role: z.enum(["admin", "teacher", "parent"]),
  website: z.string().max(0, "").optional(), // honeypot
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

type FormData = z.infer<typeof schema>;

function passwordScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedAt = useRef(Date.now());

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "parent", website: "" },
  });

  const role = watch("role");
  const password = watch("password") ?? "";
  const score = useMemo(() => passwordScore(password), [password]);

  const onSubmit = async (data: FormData) => {
    if (Date.now() - mountedAt.current < 1500) { toast.error("Please slow down."); return; }
    if (data.website) return; // bot
    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: "https://enms-nu.vercel.app/login?confirmed=true",
        data: { full_name: data.full_name, phone_number: data.phone || null, role: data.role },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("pwned") || error.message.toLowerCase().includes("compromised") || error.message.toLowerCase().includes("breach")) {
        toast.error("This password has been seen in a data breach. Please choose a different one.");
      } else if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already")) {
        toast.error("An account with that email already exists.");
      } else {
        toast.error(error.message);
      }
      setSubmitting(false);
      return;
    }

    toast.success("Account created! Check your email to confirm.");
    navigate("/login");
    setSubmitting(false);
  };

  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = ["bg-destructive", "bg-destructive", "bg-warning", "bg-accent", "bg-success"][score];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        </div>

        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Choose your role</CardTitle>
            <CardDescription>Select how you'll use E-NMS</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Honeypot */}
              <input type="text" tabIndex={-1} autoComplete="off"
                className="absolute -left-[9999px] h-0 w-0" {...register("website")} aria-hidden="true" />

              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button key={r.value} type="button" onClick={() => setValue("role", r.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-all ${
                      role === r.value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                    }`}>
                    {r.icon}
                    <span className="text-xs font-medium">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" autoComplete="name" {...register("full_name")} aria-invalid={!!errors.full_name} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" inputMode="email" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="07XX XXX XXX" {...register("phone")} aria-invalid={!!errors.phone} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                    {...register("password")} aria-invalid={!!errors.password} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${score >= i ? strengthColor : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                  </div>
                )}
                {errors.password && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" /> {errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
                  {...register("confirm")} aria-invalid={!!errors.confirm} />
                {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
              </div>

              <p className="text-xs text-muted-foreground">
                By creating an account you agree to our terms of service.
              </p>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
