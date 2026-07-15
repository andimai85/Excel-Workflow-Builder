import type { RaciRole, WorkflowDoc, WorkflowStep } from "@/lib/workflow-types";
import { responsibleInitials } from "@/lib/workflow-parser";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<RaciRole, string> = {
  R: "R",
  A: "A",
  C: "C",
  I: "I",
};

const ROLE_STYLE: Record<RaciRole, string> = {
  R: "bg-[color:var(--raci-r)] text-[color:var(--raci-r-fg)]",
  A: "bg-[color:var(--raci-a)] text-[color:var(--raci-a-fg)]",
  C: "bg-[color:var(--raci-c)] text-[color:var(--raci-c-fg)]",
  I: "bg-[color:var(--raci-i)] text-[color:var(--raci-i-fg)]",
};

const ROLE_ORDER: RaciRole[] = ["R", "A", "C", "I"];

export function RaciBadges({
  doc,
  step,
  max = 6,
}: {
  doc: WorkflowDoc;
  step: WorkflowStep;
  max?: number;
}) {
  const items: { role: RaciRole; key: string }[] = [];
  for (const role of ROLE_ORDER) {
    for (const key of doc.responsibleKeys) {
      const roles = step.raci[key];
      if (roles?.includes(role)) items.push({ role, key });
    }
  }
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((it, i) => {
        const r = doc.responsibles[it.key];
        return (
          <span
            key={`${i}-${it.key}-${it.role}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              ROLE_STYLE[it.role],
            )}
            title={`${it.role} · ${it.key}`}
          >
            <span>{ROLE_LABEL[it.role]}</span>
            <span className="opacity-90">{responsibleInitials(r, it.key)}</span>
          </span>
        );
      })}
      {rest > 0 ? (
        <span className="text-[10px] text-muted-foreground">+{rest}</span>
      ) : null}
    </div>
  );
}

export { ROLE_ORDER };