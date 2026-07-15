import { memo, useState } from "react";
import type { WorkflowDoc, WorkflowStep } from "@/lib/workflow-types";
import { SimpleModal } from "@/components/ui/simple-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2, Star } from "lucide-react";
import { updateWorkflow } from "@/lib/workflow-store";
import { responsibleLabel } from "@/lib/workflow-parser";
import type { RaciRole } from "@/lib/workflow-types";
import { cn } from "@/lib/utils";

const ROLES: RaciRole[] = ["R", "A", "C", "I"];
const ROLE_STYLE: Record<RaciRole, string> = {
  R: "bg-[color:var(--raci-r)] text-[color:var(--raci-r-fg)]",
  A: "bg-[color:var(--raci-a)] text-[color:var(--raci-a-fg)]",
  C: "bg-[color:var(--raci-c)] text-[color:var(--raci-c-fg)]",
  I: "bg-[color:var(--raci-i)] text-[color:var(--raci-i-fg)]",
};

function PlainCheckbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "grid h-4 w-4 shrink-0 cursor-pointer place-content-center rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        checked ? "bg-primary text-primary-foreground" : "bg-background text-transparent",
      )}
    >
      {checked ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  );
}

function updateStep(
  doc: WorkflowDoc,
  stepId: string,
  mut: (s: WorkflowStep) => WorkflowStep,
): WorkflowDoc {
  return {
    ...doc,
    steps: doc.steps.map((s) => (s.id === stepId ? mut(s) : s)),
  };
}

function StepDetailPanelComponent({
  doc,
  stepId,
  onClose,
}: {
  doc: WorkflowDoc;
  stepId: string | null;
  onClose: () => void;
}) {
  const step = doc.steps.find((s) => s.id === stepId);
  const [newItem, setNewItem] = useState("");

  if (!step) return null;

  const set = (mut: (s: WorkflowStep) => WorkflowStep) =>
    updateWorkflow(doc.id, (d) => updateStep(d, step.id, mut));

  const allDone =
    step.checklist.length > 0 && step.checklist.every((c) => c.done);

  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return (
      <SimpleModal open onClose={onClose} side="right">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 pr-8 text-lg font-semibold">
              {step.isMilestone ? (
                <Star className="size-5 fill-[color:var(--milestone)] text-[color:var(--milestone)]" />
              ) : null}
              <span>#{step.index + 1} · {step.title}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {step.phase ? `${step.phase} · ` : ""}
              {step.duration ? `Dauer: ${step.duration}` : ""}
            </p>
          </div>
          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Deliverable</div>
                <div className="font-medium">{step.deliverable ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ablage in</div>
                <div className="font-medium">{step.storage ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Meilenstein</div>
                <div className="font-medium">{step.isMilestone ? "Ja" : "Nein"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-medium">{step.done ? "Erledigt" : allDone ? "Erledigt" : "Offen"}</div>
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">RACI-Matrix</h4>
              <div className="rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">Person</th>
                      {ROLES.map((r) => (
                        <th key={r} className="px-2 py-1 text-center font-medium">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doc.responsibleKeys
                      .filter((k) => step.raci[k]?.length)
                      .map((k) => {
                        const roles = step.raci[k];
                        const r = doc.responsibles[k];
                        return (
                          <tr key={k} className="border-t">
                            <td className="px-2 py-1">
                              <div className="font-medium">{responsibleLabel(r, k)}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {k}{r?.role ? ` · ${r.role}` : ""}
                              </div>
                            </td>
                            {ROLES.map((role) => (
                              <td key={role} className="px-2 py-1 text-center">
                                {roles.includes(role) ? (
                                  <span className={cn("inline-flex size-5 items-center justify-center rounded text-[10px] font-bold", ROLE_STYLE[role])}>{role}</span>
                                ) : (
                                  <span className="text-muted-foreground/40">·</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {step.checklist.length ? (
              <section>
                <h4 className="mb-2 text-sm font-semibold">Checkliste</h4>
                <ul className="space-y-2 text-sm">
                  {step.checklist.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <span className={cn("grid h-4 w-4 place-content-center rounded-sm border border-primary", c.done ? "bg-primary text-primary-foreground" : "bg-background")}>
                        {c.done ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                      </span>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {step.note ? (
              <section>
                <h4 className="mb-2 text-sm font-semibold">Notizen</h4>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm">{step.note}</p>
              </section>
            ) : null}
          </div>
        </div>
      </SimpleModal>
    );
  }

  return (
    <SimpleModal open onClose={onClose} side="right">
      <div className="p-6">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 pr-8 text-lg font-semibold">
            {step.isMilestone ? (
              <Star className="size-5 fill-[color:var(--milestone)] text-[color:var(--milestone)]" />
            ) : null}
            <span>#{step.index + 1} · {step.title}</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {step.phase ? `${step.phase} · ` : ""}
            {step.duration ? `Dauer: ${step.duration}` : ""}
          </p>
        </div>

        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Deliverable</div>
              <div className="font-medium">{step.deliverable ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ablage in</div>
              <div className="font-medium">{step.storage ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Meilenstein</div>
              <div className="font-medium">
                {step.isMilestone ? "Ja" : "Nein"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="font-medium">
                {step.done
                  ? "Erledigt"
                  : step.checklist.some((c) => c.done)
                    ? "In Arbeit"
                    : "Offen"}
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">RACI-Matrix</h4>
            <div className="rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">Person</th>
                    {ROLES.map((r) => (
                      <th key={r} className="px-2 py-1 text-center font-medium">
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doc.responsibleKeys
                    .filter((k) => step.raci[k]?.length)
                    .map((k) => {
                      const roles = step.raci[k];
                      const r = doc.responsibles[k];
                      return (
                        <tr key={k} className="border-t">
                          <td className="px-2 py-1">
                            <div className="font-medium">
                              {responsibleLabel(r, k)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {k}
                              {r?.role ? ` · ${r.role}` : ""}
                            </div>
                          </td>
                          {ROLES.map((role) => (
                            <td key={role} className="px-2 py-1 text-center">
                              {roles.includes(role) ? (
                                <span
                                  className={cn(
                                    "inline-flex size-5 items-center justify-center rounded text-[10px] font-bold",
                                    ROLE_STYLE[role],
                                  )}
                                >
                                  {role}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">
                                  ·
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Checkliste</h4>
              <label className="flex items-center gap-2 text-xs">
                <PlainCheckbox
                  checked={step.done || allDone}
                  label="Schritt erledigt"
                  onCheckedChange={(v) => set((s) => ({ ...s, done: !!v }))}
                />
                Schritt erledigt
              </label>
            </div>
            <ul className="space-y-2">
              {step.checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <PlainCheckbox
                    checked={c.done}
                    label={`Checklistenpunkt ${c.label} erledigt`}
                    onCheckedChange={(v) =>
                      set((s) => ({
                        ...s,
                        checklist: s.checklist.map((x) =>
                          x.id === c.id ? { ...x, done: !!v } : x,
                        ),
                        done:
                          s.checklist.length > 0 &&
                          s.checklist
                            .map((x) =>
                              x.id === c.id ? { ...x, done: !!v } : x,
                            )
                            .every((x) => x.done)
                            ? true
                            : s.done,
                      }))
                    }
                  />
                  <Input
                    value={c.label}
                    onChange={(e) =>
                      set((s) => ({
                        ...s,
                        checklist: s.checklist.map((x) =>
                          x.id === c.id ? { ...x, label: e.target.value } : x,
                        ),
                      }))
                    }
                    className="h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      set((s) => ({
                        ...s,
                        checklist: s.checklist.filter((x) => x.id !== c.id),
                      }))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center gap-2">
              <Input
                placeholder="Neuer Punkt…"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItem.trim()) {
                    const label = newItem.trim();
                    setNewItem("");
                    set((s) => ({
                      ...s,
                      checklist: [
                        ...s.checklist,
                        {
                          id: Math.random().toString(36).slice(2, 10),
                          label,
                          done: false,
                        },
                      ],
                    }));
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (!newItem.trim()) return;
                  const label = newItem.trim();
                  setNewItem("");
                  set((s) => ({
                    ...s,
                    checklist: [
                      ...s.checklist,
                      {
                        id: Math.random().toString(36).slice(2, 10),
                        label,
                        done: false,
                      },
                    ],
                  }));
                }}
              >
                <Plus className="mr-1 size-4" />
                Hinzufügen
              </Button>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">Notizen</h4>
            <Textarea
              value={step.note}
              onChange={(e) =>
                set((s) => ({ ...s, note: e.target.value }))
              }
              rows={4}
            />
          </section>
        </div>
      </div>
    </SimpleModal>
  );
}

export const StepDetailPanel = memo(StepDetailPanelComponent);