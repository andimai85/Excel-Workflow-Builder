import type { WorkflowDoc, WorkflowStep } from "@/lib/workflow-types";
import { StepCard } from "./step-card";
import { responsibleLabel } from "@/lib/workflow-parser";
import { ChevronDown } from "lucide-react";

function phaseBg(idx: number) {
  return `var(--phase-${idx % 8})`;
}
function phaseAccent(idx: number) {
  return `var(--phase-${idx % 8}-accent)`;
}

function groupByPhase(doc: WorkflowDoc) {
  const groups: { phase: string | null; phaseIndex: number; steps: WorkflowStep[] }[] = [];
  for (const step of doc.steps) {
    const last = groups[groups.length - 1];
    if (last && last.phaseIndex === step.phaseIndex) {
      last.steps.push(step);
    } else {
      groups.push({
        phase: step.phase,
        phaseIndex: step.phaseIndex,
        steps: [step],
      });
    }
  }
  return groups;
}

export function VerticalView({
  doc,
  onSelect,
}: {
  doc: WorkflowDoc;
  onSelect: (s: WorkflowStep) => void;
}) {
  const groups = groupByPhase(doc);
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <section
          key={gi}
          className="rounded-2xl border p-4"
          style={{ backgroundColor: phaseBg(g.phaseIndex) }}
        >
          <header className="mb-3 flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: phaseAccent(g.phaseIndex) }}
            />
            <h3
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: phaseAccent(g.phaseIndex) }}
            >
              {g.phase ?? "Ohne Phase"}
            </h3>
          </header>
          <ol className="space-y-2">
            {g.steps.map((s, i) => (
              <li key={s.id} className="relative">
                <StepCard doc={doc} step={s} onClick={() => onSelect(s)} />
                {i < g.steps.length - 1 ? (
                  <div className="flex justify-center py-1">
                    <ChevronDown className="size-4 text-muted-foreground/60" />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function HorizontalView({
  doc,
  onSelect,
}: {
  doc: WorkflowDoc;
  onSelect: (s: WorkflowStep) => void;
}) {
  const groups = groupByPhase(doc);
  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex min-w-max gap-4">
        {groups.map((g, gi) => (
          <section
            key={gi}
            className="rounded-2xl border p-3"
            style={{ backgroundColor: phaseBg(g.phaseIndex) }}
          >
            <header className="mb-2 flex items-center gap-2 px-1">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: phaseAccent(g.phaseIndex) }}
              />
              <h3
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: phaseAccent(g.phaseIndex) }}
              >
                {g.phase ?? "Ohne Phase"}
              </h3>
            </header>
            <div className="flex items-stretch gap-2">
              {g.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="w-64">
                    <StepCard doc={doc} step={s} onClick={() => onSelect(s)} />
                  </div>
                  {i < g.steps.length - 1 ? (
                    <div className="text-muted-foreground/60">→</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function SwimlaneView({
  doc,
  onSelect,
}: {
  doc: WorkflowDoc;
  onSelect: (s: WorkflowStep) => void;
}) {
  // Only lanes with at least one R
  const lanes = doc.responsibleKeys.filter((k) =>
    doc.steps.some((s) => s.raci[k]?.includes("R")),
  );
  const lanesOrNone = lanes.length ? lanes : doc.responsibleKeys;

  const laneOfStep = (s: WorkflowStep): string | null => {
    for (const k of lanesOrNone) {
      if (s.raci[k]?.includes("R")) return k;
    }
    // fallback: first key with any role
    for (const k of lanesOrNone) if (s.raci[k]?.length) return k;
    return null;
  };

  return (
    <div className="overflow-x-auto pb-3">
      <div className="min-w-max">
        {/* Phase header row */}
        <div className="mb-2 grid" style={{
          gridTemplateColumns: `220px repeat(${doc.steps.length}, 240px)`,
        }}>
          <div />
          {doc.steps.map((s) => (
            <div
              key={s.id}
              className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
              style={{
                backgroundColor: phaseBg(s.phaseIndex),
                color: phaseAccent(s.phaseIndex),
              }}
            >
              {s.phase ?? ""}
            </div>
          ))}
        </div>
        {lanesOrNone.map((key) => {
          const r = doc.responsibles[key];
          return (
            <div
              key={key}
              className="grid border-b py-2"
              style={{
                gridTemplateColumns: `220px repeat(${doc.steps.length}, 240px)`,
              }}
            >
              <div className="pr-3">
                <div className="text-xs font-semibold text-foreground">
                  {responsibleLabel(r, key)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {r?.role || key}
                </div>
              </div>
              {doc.steps.map((s) => {
                const lane = laneOfStep(s);
                const inLane = lane === key;
                return (
                  <div key={s.id} className="px-1">
                    {inLane ? (
                      <StepCard doc={doc} step={s} onClick={() => onSelect(s)} />
                    ) : (
                      <div className="h-full" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}