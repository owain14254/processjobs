import { SaveStatus } from "@/hooks/useJobsAutosave";
import { Loader2, Check, AlertCircle, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export function SaveStatusIndicator({ status, className }: SaveStatusIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-all",
        {
          "bg-muted text-muted-foreground": status === 'saving',
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400": status === 'saved',
          "bg-destructive/10 text-destructive": status === 'error',
        },
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Error</span>
        </>
      )}
    </div>
  );
}
