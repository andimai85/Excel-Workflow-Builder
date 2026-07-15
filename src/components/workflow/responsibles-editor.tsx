import { useEffect } from "react";
import type { Responsible, WorkflowDoc } from "@/lib/workflow-types";
import { updateWorkflow } from "@/lib/workflow-store";

function buildResponsibleDraft(doc: WorkflowDoc): Record<string, Responsible> {
  return Object.fromEntries(
    doc.responsibleKeys.map((key) => [
      key,
      {
        key,
        firstName: doc.responsibles[key]?.firstName ?? "",
        lastName: doc.responsibles[key]?.lastName ?? "",
        role: doc.responsibles[key]?.role ?? "",
      },
    ]),
  );
}

export function ResponsiblesEditor({
  doc,
  open,
  onClose,
}: {
  doc: WorkflowDoc;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const initial = buildResponsibleDraft(doc);
    const fields = new Map<
      string,
      {
        firstName: HTMLDivElement;
        lastName: HTMLDivElement;
        role: HTMLDivElement;
      }
    >();

    let closed = false;

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const backdrop = document.createElement("div");
    backdrop.className = "absolute inset-0 bg-black/60";

    const panel = document.createElement("div");
    panel.className =
      "relative m-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background shadow-xl";

    const content = document.createElement("div");
    content.className = "p-6";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className =
      "absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground";
    closeButton.setAttribute("aria-label", "Schließen");
    closeButton.textContent = "×";

    const title = document.createElement("h2");
    title.className = "pr-8 text-lg font-semibold";
    title.textContent = "Verantwortliche zuordnen";

    const description = document.createElement("p");
    description.className = "text-sm text-muted-foreground";
    description.textContent =
      "Namen ersetzen die FB-Kürzel überall im Workflow. Änderungen werden beim Schließen gespeichert.";

    const formWrap = document.createElement("div");
    formWrap.className = "mt-4 overflow-x-auto";

    const table = document.createElement("table");
    table.className = "w-full text-sm";

    const thead = document.createElement("thead");
    thead.className = "text-muted-foreground";
    const headerRow = document.createElement("tr");
    for (const label of ["FB", "Vorname", "Nachname", "Rolle"]) {
      const th = document.createElement("th");
      th.className = "px-2 py-1 text-left font-medium";
      th.textContent = label;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");

    const makeEditable = (value: string, label: string) => {
      const field = document.createElement("div");
      field.contentEditable = "true";
      field.spellcheck = false;
      field.setAttribute("role", "textbox");
      field.setAttribute("aria-label", label);
      field.className =
        "min-h-8 w-full min-w-36 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring";
      field.textContent = value;
      field.addEventListener("keydown", (event) => {
        if (event.key === "Enter") event.preventDefault();
      });
      field.addEventListener("paste", (event) => {
        event.preventDefault();
        const text = event.clipboardData?.getData("text/plain") ?? "";
        document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
      });
      return field;
    };

    const fieldText = (field: HTMLDivElement | undefined) =>
      (field?.textContent ?? "").replace(/\u00a0/g, " ").trim();

    for (const key of doc.responsibleKeys) {
      const responsible = initial[key];
      const row = document.createElement("tr");
      row.className = "border-t";

      const keyCell = document.createElement("td");
      keyCell.className = "px-2 py-1 font-mono text-xs";
      keyCell.textContent = key;
      row.appendChild(keyCell);

      const firstName = makeEditable(
        responsible?.firstName ?? "",
        `${key} Vorname`,
      );
      const lastName = makeEditable(
        responsible?.lastName ?? "",
        `${key} Nachname`,
      );
      const role = makeEditable(responsible?.role ?? "", `${key} Rolle`);
      fields.set(key, { firstName, lastName, role });

      for (const input of [firstName, lastName, role]) {
        const cell = document.createElement("td");
        cell.className = "px-2 py-1";
        cell.appendChild(input);
        row.appendChild(cell);
      }

      tbody.appendChild(row);
    }

    const footer = document.createElement("div");
    footer.className = "mt-4 flex justify-end";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className =
      "inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90";
    saveButton.textContent = "Schließen";
    footer.appendChild(saveButton);

    table.appendChild(thead);
    table.appendChild(tbody);
    formWrap.appendChild(table);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(formWrap);
    content.appendChild(footer);
    panel.appendChild(closeButton);
    panel.appendChild(content);
    overlay.appendChild(backdrop);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const close = () => {
      if (closed) return;
      closed = true;

      const next: Record<string, Responsible> = {};
      let changed = false;

      for (const key of doc.responsibleKeys) {
        const current = initial[key];
        const field = fields.get(key);
        const responsible = {
          key,
          firstName: fieldText(field?.firstName),
          lastName: fieldText(field?.lastName),
          role: fieldText(field?.role),
        };
        next[key] = responsible;
        if (
          responsible.firstName !== (current?.firstName ?? "") ||
          responsible.lastName !== (current?.lastName ?? "") ||
          responsible.role !== (current?.role ?? "")
        ) {
          changed = true;
        }
      }

      overlay.remove();
      onClose();

      if (changed) {
        window.setTimeout(() => {
          updateWorkflow(doc.id, (d) => ({
            ...d,
            responsibles: {
              ...d.responsibles,
              ...next,
            },
          }));
        }, 0);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    backdrop.addEventListener("click", close);
    closeButton.addEventListener("click", close);
    saveButton.addEventListener("click", close);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      backdrop.removeEventListener("click", close);
      closeButton.removeEventListener("click", close);
      saveButton.removeEventListener("click", close);
      window.removeEventListener("keydown", onKeyDown);
      overlay.remove();
    };
  }, [doc, onClose, open]);

  return null;
}