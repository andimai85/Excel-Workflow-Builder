import * as XLSX from "xlsx";
import type { WorkflowDoc } from "./workflow-types";
import { responsibleLabel } from "./workflow-parser";

export function exportWorkflowToXlsx(doc: WorkflowDoc) {
  const roleOrder = ["R", "A", "C", "I"] as const;
  const respHeaders = doc.responsibleKeys.map((k) => {
    const r = doc.responsibles[k];
    const name = responsibleLabel(r, k);
    return name === k ? k : `${k} — ${name}`;
  });

  const header = [
    "#",
    "Phase",
    "Schritt",
    "Meilenstein",
    "Ablage in",
    "Deliverable",
    "Dauer",
    "Status",
    "Checkliste",
    "Notizen",
    ...respHeaders,
  ];

  const rows: (string | number)[][] = [header];
  for (const step of doc.steps) {
    const checklist = step.checklist
      .map((c) => `${c.done ? "[x]" : "[ ]"} ${c.label}`)
      .join("\n");
    const raciCells = doc.responsibleKeys.map((k) => {
      const roles = step.raci[k];
      if (!roles) return "";
      return roles.sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b)).join("/");
    });
    rows.push([
      step.index + 1,
      step.phase ?? "",
      step.title,
      step.isMilestone ? "x" : "",
      step.storage ?? "",
      step.deliverable ?? "",
      step.duration ?? "",
      step.done ? "erledigt" : step.checklist.some((c) => c.done) ? "in Arbeit" : "offen",
      checklist,
      step.note,
      ...raciCells,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Workflow");
  XLSX.writeFile(wb, `${doc.name || "workflow"}_export.xlsx`);
}