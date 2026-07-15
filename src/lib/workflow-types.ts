export type RaciRole = "R" | "A" | "C" | "I";

export interface Responsible {
  key: string; // FB1..FB23
  firstName: string;
  lastName: string;
  role?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface WorkflowStep {
  id: string;
  index: number;
  title: string;
  phase: string | null;
  phaseIndex: number;
  isMilestone: boolean;
  storage: string | null;
  deliverable: string | null;
  duration: string | null;
  raci: Record<string, RaciRole[]>;
  checklist: ChecklistItem[];
  note: string;

  done: boolean;
  doneComment?: string;

  deliverableDone?: boolean;
  deliverableComment?: string;

  storageDone?: boolean;
  storageComment?: string;
}

export interface Phase {
  name: string;
  index: number;
}

export type ViewMode = "vertical" | "horizontal" | "swimlane";

export interface WorkflowDoc {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  view: ViewMode;
  responsibleKeys: string[]; // FB keys actually used
  responsibles: Record<string, Responsible>;
  phases: Phase[];
  steps: WorkflowStep[];
}
