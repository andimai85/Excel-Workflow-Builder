import { useSyncExternalStore } from "react";
import type { WorkflowDoc } from "./workflow-types";

const KEY = "wf-generator:v1";

type State = Record<string, WorkflowDoc>;

const listeners = new Set<() => void>();
let cache: State | null = null;
const EMPTY: State = {};
let pendingPersist: State | null = null;
let persistTimer: number | null = null;
let beforeUnloadRegistered = false;

function flushPersist() {
  if (typeof window === "undefined" || !pendingPersist) return;
  const next = pendingPersist;
  pendingPersist = null;
  if (persistTimer !== null) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Keep the in-memory state usable even if the browser blocks storage.
  }
}

function schedulePersist(next: State) {
  if (typeof window === "undefined") return;
  pendingPersist = next;

  if (!beforeUnloadRegistered) {
    beforeUnloadRegistered = true;
    window.addEventListener("beforeunload", flushPersist);
    window.addEventListener("pagehide", flushPersist);
  }

  if (persistTimer !== null) return;
  persistTimer = window.setTimeout(flushPersist, 250);
}

function read(): State {
  if (cache) return cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as State) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: State) {
  cache = next;
  schedulePersist(next);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useWorkflows(): WorkflowDoc[] {
  const snap = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
  return Object.values(snap).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useWorkflow(id: string | undefined): WorkflowDoc | undefined {
  const snap = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
  return id ? snap[id] : undefined;
}

export function saveWorkflow(doc: WorkflowDoc) {
  const s = { ...read() };
  s[doc.id] = { ...doc, updatedAt: Date.now() };
  write(s);
}

export function deleteWorkflow(id: string) {
  const s = { ...read() };
  delete s[id];
  write(s);
}

export function updateWorkflow(
  id: string,
  updater: (doc: WorkflowDoc) => WorkflowDoc,
) {
  const s = { ...read() };
  const cur = s[id];
  if (!cur) return;
  s[id] = { ...updater(cur), updatedAt: Date.now() };
  write(s);
}