import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { parseWorkflowFile } from "@/lib/workflow-parser";
import { saveWorkflow, useWorkflows, deleteWorkflow } from "@/lib/workflow-store";
import type { ViewMode } from "@/lib/workflow-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileSpreadsheet,
  Upload,
  Trash2,
  ArrowRight,
  LayoutList,
  ArrowRightLeft,
  Rows3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workflow-Generator aus Excel" },
      {
        name: "description",
        content:
          "Offline Browser-Tool: Excel-Datei einlesen und Workflow mit RACI, Phasen und Meilensteinen visualisieren.",
      },
      { property: "og:title", content: "Workflow-Generator aus Excel" },
      {
        property: "og:description",
        content:
          "Excel-Workflow mit RACI, Phasen und Meilensteinen in Vertikal-, Horizontal- oder Swimlane-Ansicht.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const workflows = useWorkflows();
  const [view, setView] = useState<ViewMode>("vertical");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const doc = await parseWorkflowFile(file);
      doc.view = view;
      saveWorkflow(doc);
      navigate({ to: "/workflow/$id", params: { id: doc.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Datei konnte nicht gelesen werden.");
    } finally {
      setBusy(false);
    }
  };

  const views: {
    mode: ViewMode;
    label: string;
    desc: string;
    icon: typeof LayoutList;
  }[] = [
    {
      mode: "vertical",
      label: "Vertikal",
      desc: "Karten untereinander, Phasen als farbige Bänder",
      icon: LayoutList,
    },
    {
      mode: "horizontal",
      label: "Horizontal",
      desc: "Karten links → rechts, Phasen als Spalten",
      icon: ArrowRightLeft,
    },
    {
      mode: "swimlane",
      label: "Swimlane",
      desc: "Zeilen pro Verantwortlichem (R)",
      icon: Rows3,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Workflow-Generator</h1>
            <p className="text-xs text-muted-foreground">
              Excel-Datei einlesen, Workflow mit RACI, Phasen und Meilensteinen
              visualisieren — 100% offline.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            1. Ansicht wählen
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {views.map((v) => {
              const Icon = v.icon;
              const active = view === v.mode;
              return (
                <button
                  key={v.mode}
                  onClick={() => setView(v.mode)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-muted-foreground/40",
                  )}
                >
                  <Icon
                    className={cn(
                      "mb-2 size-5",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="text-sm font-semibold">{v.label}</div>
                  <div className="text-xs text-muted-foreground">{v.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            2. Excel-Datei laden
          </h2>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              "rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm">
              <span className="font-medium">Datei hier ablegen</span> oder{" "}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-primary underline underline-offset-2"
              >
                auswählen
              </button>
              . Erwartete Spalten: <code className="text-xs">Deliverables, Dauer, Phase, Ablage in, MS, Schritt, dann FB- oder Verantwortlichen-Spalten</code>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {busy ? (
              <p className="mt-3 text-xs text-muted-foreground">Wird gelesen…</p>
            ) : null}
            {error ? (
              <p className="mt-3 text-xs text-destructive">{error}</p>
            ) : null}
          </div>
        </section>

        {workflows.length ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Zuletzt bearbeitet
            </h2>
            <ul className="space-y-2">
              {workflows.map((w) => {
                const done = w.steps.filter((s) => s.done).length;
                return (
                  <li key={w.id}>
                    <Card className="flex items-center justify-between gap-3 p-3">
                      <button
                        onClick={() =>
                          navigate({ to: "/workflow/$id", params: { id: w.id } })
                        }
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <FileSpreadsheet className="size-5 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {w.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {w.steps.length} Schritte · {done} erledigt ·{" "}
                            {new Date(w.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`"${w.name}" löschen?`)) deleteWorkflow(w.id);
                        }}
                        aria-label="Löschen"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
