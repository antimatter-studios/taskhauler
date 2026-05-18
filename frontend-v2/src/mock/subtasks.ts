// Will be replaced by GET /api/v1/cards/:id/subtasks when endpoint exists.
// Used as the default seed when localStorage doesn't have user-authored
// subtasks yet. Keyed by placeholder card id ("mock-card-1", …) which the
// consumer remaps to real card IDs at runtime.

export interface Subtask {
  id: string;
  card_id: string;
  text: string;
  done: boolean;
  position: number;
}

export const MOCK_SUBTASKS: Record<string, Subtask[]> = {
  "mock-card-1": [
    { id: "st1-1", card_id: "mock-card-1", text: "Audit current sync path for partial writes", done: true, position: 1000 },
    { id: "st1-2", card_id: "mock-card-1", text: "Spike incremental store API", done: true, position: 2000 },
    { id: "st1-3", card_id: "mock-card-1", text: "Wire partial sync to column virtualizer", done: false, position: 3000 },
    { id: "st1-4", card_id: "mock-card-1", text: "Migrate 3 hot paths off full-sync", done: false, position: 4000 },
    { id: "st1-5", card_id: "mock-card-1", text: "Benchmark 10k card scroll", done: false, position: 5000 },
  ],
  "mock-card-2": [
    { id: "st2-1", card_id: "mock-card-2", text: "Implement window-based virtualization", done: true, position: 1000 },
    { id: "st2-2", card_id: "mock-card-2", text: "Add overscan tuning knob", done: true, position: 2000 },
    { id: "st2-3", card_id: "mock-card-2", text: "Stress-test at 50k cards", done: true, position: 3000 },
    { id: "st2-4", card_id: "mock-card-2", text: "Open PR with migration note", done: false, position: 4000 },
  ],
  "mock-card-3": [
    { id: "st3-1", card_id: "mock-card-3", text: "Repro on Safari 17.4 with SSO disabled", done: true, position: 1000 },
    { id: "st3-2", card_id: "mock-card-3", text: "Capture SAML response samples", done: true, position: 2000 },
    { id: "st3-3", card_id: "mock-card-3", text: "Patch signature canonicalization", done: false, position: 3000 },
    { id: "st3-4", card_id: "mock-card-3", text: "Add regression test fixture", done: false, position: 4000 },
    { id: "st3-5", card_id: "mock-card-3", text: "Verify on prod-mirror", done: false, position: 5000 },
    { id: "st3-6", card_id: "mock-card-3", text: "Ship hotfix", done: false, position: 6000 },
  ],
  "mock-card-4": [
    { id: "st4-1", card_id: "mock-card-4", text: "Profile webhook at 50k rows", done: false, position: 1000 },
    { id: "st4-2", card_id: "mock-card-4", text: "Identify stall point", done: false, position: 2000 },
    { id: "st4-3", card_id: "mock-card-4", text: "Batch + paginate row reads", done: false, position: 3000 },
  ],
};
