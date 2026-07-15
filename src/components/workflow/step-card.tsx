import type { WorkflowDoc, WorkflowStep } from "@/lib/workflow-types";
import { RaciBadges } from "./raci-badges";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, FolderArchive, Star } from "lucide-react";

export function stepStatus(step: WorkflowStep): "done" | "progress" | "open" {
  if (step.done) return "done";
  const anyDone = step.checklist.some((c) => c.done);
  return anyDone ? "progress" : "open";
}

export function StepCard({
  doc,
  step,
  onClick,
  compact,
}: {
  doc: WorkflowDoc;
  step: WorkflowStep;
  onClick: () => void;
  compact?: boolean;
}) {
  const status = stepStatus(step);
  const pi = ((step.phaseIndex >= 0 ? step.phaseIndex : 0) % 8) as number;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        step.isMilestone &&
          "border-[color:var(--milestone)] bg-[color:var(--milestone)]/10 ring-1 ring-[color:var(--milestone)]/40",
        status === "done" && "opacity-70",
      )}
      style={{
        borderLeft: `4px solid var(--phase-${pi}-accent)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {step.isMilestone ? (
            <Star
              className="size-4 shrink-0 fill-[color:var(--milestone)] text-[color:var(--milestone)]"
              aria-label="Meilenstein"
            />
          ) : status === "done" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <Circle className="size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-muted-foreground">
              #{step.index + 1}
              {step.phase ? ` · ${step.phase}` : ""}
            </div>
            <div className="truncate text-sm font-semibold text-foreground">
              {step.title}
            </div>
          </div>
        </div>
        {step.storage ? (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            title={`Ablage in ${step.storage}`}
          >
            <FolderArchive className="size-3" />
            {step.storage}
          </span>
        ) : null}
      </div>
      {!compact ? (
        <div className="mt-2">
          <RaciBadges doc={doc} step={step} max={6} />
        </div>
      ) : null}
      {step.checklist.length ? (
        <div className="mt-2 text-[10px] text-muted-foreground">
          {step.checklist.filter((c) => c.done).length}/{step.checklist.length}{" "}
          erledigt
        </div>
      ) : null}
    </button>
  );
}