import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight modal/side-panel that intentionally avoids Radix Dialog.
 * The Radix Dialog focus-scope + dismissable-layer stack causes an
 * infinite render loop in the offline single-file production build
 * (works fine in dev). This component keeps behavior simple: inline fixed
 * overlay, backdrop click closes, Escape closes, no focus trap or body locks.
 */
export function SimpleModal({
  open,
  onClose,
  side = "right",
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "center";
  className?: string;
  children: React.ReactNode;
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-background shadow-xl",
          side === "right"
            ? "ml-auto h-full w-full max-w-xl overflow-y-auto"
            : "m-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}