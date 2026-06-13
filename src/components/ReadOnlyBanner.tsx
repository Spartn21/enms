import { Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ReadOnlyBanner() {
  const { isReadOnly, viewAsRole, setViewAsRole } = useAuth();
  if (!isReadOnly) return null;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4" />
        <span>Preview mode - viewing as <strong>{viewAsRole}</strong>. Changes are disabled.</span>
      </div>
      <button onClick={() => setViewAsRole(null)} className="text-xs font-medium underline hover:no-underline">
        Exit
      </button>
    </div>
  );
}
