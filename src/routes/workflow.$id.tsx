import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useWorkflow, updateWorkflow } from "@/lib/workflow-store";
import type { ViewMode } from "@/lib/workflow-types";
import {
  VerticalView,
  HorizontalView,
  SwimlaneView,
} from "@/components/workflow/views";
import { StepDetailPanel } from "@/components/workflow/detail-panel";
import { ResponsiblesEditor } from "@/components/workflow/responsibles-editor";
import { exportWorkflowToXlsx } from "@/lib/workflow-export";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Users,
  LayoutList,
  ArrowRightLeft,
  Rows3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workflow/$id")({
  head: () => ({
    meta: [
      { title: "Workflow · Generator" },
      { name: "description", content: "Bearbeitbarer Workflow mit RACI, Phasen und Meilensteinen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const { id } = Route.useParams();
  const doc = useWorkflow(id);
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [respOpen, setRespOpen] = useState(false);

  const openStep = (stepId: string) => {
    setSelectedStep(stepId);
  };

  if (!doc) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Workflow nicht gefunden.
          </p>
          <Link to="/" className="mt-2 inline-block text-sm text-primary underline">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const setView = (v: ViewMode) =>
    updateWorkflow(doc.id, (d) => ({ ...d, view: v }));

  const totalDone = doc.steps.filter((s) => s.done).length;
  const deliverablesDone =
  doc.steps.filter((s) => s.deliverableDone).length;

const deliverablesTotal =
  doc.steps.filter((s) => !!s.deliverable).length;

const storageDone =
  doc.steps.filter((s) => s.storageDone).length;

const storageTotal =
  doc.steps.filter((s) => !!s.storage).length;
  const respFilled = doc.responsibleKeys.filter((k) => {
    const r = doc.responsibles[k];
    return r && (r.firstName?.trim() || r.lastName?.trim());
  }).length;

  const views: {
    mode: ViewMode;
    label: string;
    icon: typeof LayoutList;
  }[] = [
    { mode: "vertical", label: "Vertikal", icon: LayoutList },
    { mode: "horizontal", label: "Horizontal", icon: ArrowRightLeft },
    { mode: "swimlane", label: "Swimlane", icon: Rows3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="mr-1 size-4" />
            Start
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{doc.name}</h1>
            <p className="text-xs text-muted-foreground">
              {doc.steps.length} Schritte ·
{totalDone} erledigt ·
Deliverables {deliverablesDone}/{deliverablesTotal} ·
Ablagen {storageDone}/{storageTotal} ·{" "}
              {doc.phases.length} Phasen · {respFilled}/
              {doc.responsibleKeys.length} Verantwortliche zugeordnet
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
            {views.map((v) => {
              const Icon = v.icon;
              const active = doc.view === v.mode;
              return (
                <button
                  key={v.mode}
                  onClick={() => setView(v.mode)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => setRespOpen(true)}>
            <Users className="mr-1 size-4" />
            Verantwortliche
          </Button>
          <Button size="sm" onClick={() => exportWorkflowToXlsx(doc)}>
            <Download className="mr-1 size-4" />
            Export
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {doc.view === "vertical" ? (
          <VerticalView
            doc={doc}
            onSelect={(s) => openStep(s.id)}
          />
        ) : doc.view === "horizontal" ? (
          <HorizontalView
            doc={doc}
            onSelect={(s) => openStep(s.id)}
          />
        ) : (
          <SwimlaneView doc={doc} onSelect={(s) => openStep(s.id)} />
        )}
      </main>

      <StepDetailPanel
        doc={doc}
        stepId={selectedStep}
        onClose={() => setSelectedStep(null)}
      />
      <ResponsiblesEditor
        doc={doc}
        open={respOpen}
        onClose={() => setRespOpen(false)}
      />
    </div>
  );
}
