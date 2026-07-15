import * as XLSX from "xlsx";
import type {
  Phase,
  RaciRole,
  Responsible,
  WorkflowDoc,
  WorkflowStep,
} from "./workflow-types";

function normalizeCell(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRaci(value: unknown): RaciRole[] {
  const s = normalizeCell(value).toUpperCase();
  if (!s) return [];

  const parts = s.split(/[\/⁄∕,\s]+/).filter(Boolean);
  const out: RaciRole[] = [];
  for (const p of parts) {
    if (p === "R" || p === "A" || p === "C" || p === "I") {
      if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function columnName(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function responsibleKeyFromHeader(headerValue: string, col: number): string {
  const normalized = normalizeCell(headerValue);
  const fb = normalized.replace(/[\s\u00a0]/g, "").match(/^FB[-_]?(\d+)$/i);
  return fb ? `FB${fb[1]}` : normalized || `Spalte ${columnName(col)}`;
}

function makeUniqueKey(key: string, seen: Set<string>, col: number): string {
  if (!seen.has(key)) return key;

  const suffix = columnName(col);
  let next = `${key} (${suffix})`;
  let counter = 2;
  while (seen.has(next)) {
    next = `${key} (${suffix}-${counter})`;
    counter++;
  }
  return next;
}

export async function parseWorkflowFile(
  file: File,
  fallbackName?: string,
): Promise<WorkflowDoc> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  if (rows.length < 2) {
    throw new Error("Datei enthält keine Workflow-Daten.");
  }

  // Row 0: RACI group header; Row 1: column headers
  const header = rows[1].map((v) => normalizeCell(v));
  const headerNorm = header.map((h) => h.toLowerCase());
  const findByPrefix = (prefix: string) =>
    headerNorm.findIndex((h) => h.startsWith(prefix));
  const idx = {
    deliverables: findByPrefix("deliverables"),
    dauer: findByPrefix("dauer"),
    phase: findByPrefix("phase"),
    ablage: findByPrefix("ablage in"),
    ms: headerNorm.indexOf("ms"),
    schritt: findByPrefix("schritt"),
  };
  if (idx.schritt === -1) {
    throw new Error(
      "Spalte 'Schritt' nicht gefunden. Ist die Kopfzeile in Zeile 2?",
    );
  }

  // Responsible columns can either be classic "FB1" headers or real team/person
  // abbreviations such as "PMO", "REP/WE", "PM_NJ" after the "Schritt" column.
  const responsibleCols: { key: string; col: number }[] = [];
  const metaCols = new Set(Object.values(idx).filter((value) => value >= 0));
  const seenResponsibleKeys = new Set<string>();
  header.forEach((h, i) => {
    if (!h || metaCols.has(i)) return;

    const fbKey = h.replace(/[\s\u00a0]/g, "").match(/^FB[-_]?(\d+)$/i);
    const isResponsibleColumn = Boolean(fbKey) || i > idx.schritt;
    if (!isResponsibleColumn) return;

    const key = makeUniqueKey(
      responsibleKeyFromHeader(h, i),
      seenResponsibleKeys,
      i,
    );
    seenResponsibleKeys.add(key);
    responsibleCols.push({ key, col: i });
  });

  const phases: Phase[] = [];
  const steps: WorkflowStep[] = [];
  let currentPhase: string | null = null;
  let currentPhaseIndex = -1;
  const usedResponsibleKeys = new Set<string>();

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const title = row[idx.schritt];
    if (title == null || normalizeCell(title) === "") continue;

    const phaseCell = idx.phase >= 0 ? row[idx.phase] : null;
    if (phaseCell != null && normalizeCell(phaseCell) !== "") {
      const name = normalizeCell(phaseCell);
      if (!phases.some((p) => p.name === name)) {
        currentPhaseIndex = phases.length;
        phases.push({ name, index: currentPhaseIndex });
      } else {
        currentPhaseIndex = phases.findIndex((p) => p.name === name);
      }
      currentPhase = name;
    }

    const msVal = idx.ms >= 0 ? row[idx.ms] : null;
    const isMilestone = normalizeCell(msVal).toLowerCase() === "x";

    const storage =
      idx.ablage >= 0 && normalizeCell(row[idx.ablage]) !== ""
        ? normalizeCell(row[idx.ablage])
        : null;

    const deliverable =
      idx.deliverables >= 0 && normalizeCell(row[idx.deliverables]) !== ""
        ? normalizeCell(row[idx.deliverables])
        : null;

    const duration =
      idx.dauer >= 0 && normalizeCell(row[idx.dauer]) !== ""
        ? normalizeCell(row[idx.dauer])
        : null;

    const raci: Record<string, RaciRole[]> = {};
    for (const { key, col } of responsibleCols) {
      const roles = parseRaci(row[col]);
      if (roles.length) {
        raci[key] = roles;
        usedResponsibleKeys.add(key);
      }
    }

    const checklist = [];
    if (deliverable) {
      checklist.push({
        id: newId(),
        label: `Deliverable erstellt: ${deliverable}`,
        done: false,
      });
    }
    if (storage) {
      checklist.push({
        id: newId(),
        label: `Abgelegt in ${storage}`,
        done: false,
      });
    }

    steps.push({
      id: newId(),
      index: steps.length,
      title: normalizeCell(title),
      phase: currentPhase,
      phaseIndex: currentPhaseIndex,
      isMilestone,
      storage,
      deliverable,
      duration,
      raci,
      checklist,
      note: "",
      done: false,
    });
  }

  const responsibleKeys = responsibleCols
    .map(({ key }) => key)
    .filter((key) => usedResponsibleKeys.has(key));
  const responsibles: Record<string, Responsible> = {};
  for (const k of responsibleKeys) {
    responsibles[k] = { key: k, firstName: "", lastName: "", role: "" };
  }

  const now = Date.now();
  return {
    id: newId() + newId(),
    name: fallbackName ?? file.name.replace(/\.xlsx?$/i, ""),
    createdAt: now,
    updatedAt: now,
    view: "vertical",
    responsibleKeys,
    responsibles,
    phases,
    steps,
  };
}

export function responsibleLabel(r: Responsible | undefined, key: string): string {
  if (!r) return key;
  const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
  return name || key;
}

export function responsibleInitials(
  r: Responsible | undefined,
  key: string,
): string {
  if (!r) return key;
  const f = (r.firstName ?? "").trim();
  const l = (r.lastName ?? "").trim();
  if (!f && !l) return key;
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || key;
}