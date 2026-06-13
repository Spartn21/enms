import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

const SPLASH_KEY = "enms.showSplash";

export function triggerSplash() {
  try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch {}
}

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let shouldShow = false;
    try { shouldShow = sessionStorage.getItem(SPLASH_KEY) === "1"; } catch {}
    if (!shouldShow) return;
    setVisible(true);
    try { sessionStorage.removeItem(SPLASH_KEY); } catch {}
    const t1 = setTimeout(() => setLeaving(true), 1100);
    const t2 = setTimeout(() => setVisible(false), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center gradient-primary transition-opacity duration-400 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm shadow-xl">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">E-NMS</h1>
          <p className="text-sm text-white/80">Nursery Management System</p>
        </div>
        <div className="mt-2 flex gap-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/80 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/80 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/80 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
