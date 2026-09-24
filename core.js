export const STORAGE_KEY = "contribution-compass:v2";
export const LEGACY_STORAGE_KEY = "contribution-compass-issues";
export const SCHEMA_VERSION = 2;

export const STATUSES = [
  "Interested",
  "Applied",
  "Assigned",
  "In progress",
  "Completed",
];

export const PRIORITIES = ["Low", "Medium", "High"];

const MAX_LENGTHS = {
  title: 120,
  project: 80,
  url: 2048,
  notes: 500,
};

const priorityWeight = { High: 3, Medium: 2, Low: 1 };

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return `issue-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function safeUrl(value) {
  const url = cleanText(value, MAX_LENGTHS.url);
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

export function validateIssueDraft(raw) {
  const title = cleanText(raw?.title, MAX_LENGTHS.title);
  const project = cleanText(raw?.project, MAX_LENGTHS.project);
  const urlInput = cleanText(raw?.url, MAX_LENGTHS.url);
  const url = safeUrl(urlInput);
  const dueDate = cleanText(raw?.dueDate, 10);
  const notes = cleanText(raw?.notes, MAX_LENGTHS.notes);
  const status = STATUSES.includes(raw?.status) ? raw.status : "Interested";
  const priority = PRIORITIES.includes(raw?.priority) ? raw.priority : "Medium";
  const errors = {};

  if (!title) errors.title = "Add a short, specific issue title.";
  if (!project) errors.project = "Add the repository or project name.";
  if (urlInput && !url) errors.url = "Use a full http:// or https:// link.";
  if (dueDate && !isValidDate(dueDate)) errors.dueDate = "Choose a valid calendar date.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { title, project, url, status, priority, dueDate, notes },
  };
}

export function normalizeIssue(raw, now = Date.now()) {
  const result = validateIssueDraft(raw);
  if (!result.valid) return null;

  const createdAt = Number.isFinite(raw?.createdAt) ? raw.createdAt : now;
  const updatedAt = Number.isFinite(raw?.updatedAt) ? raw.updatedAt : createdAt;

  return {
    id: typeof raw?.id === "string" && raw.id ? raw.id : createId(),
    createdAt,
    updatedAt,
    ...result.value,
  };
}

export function parseStoredIssues(payload, now = Date.now()) {
  const source = Array.isArray(payload) ? payload : payload?.issues;
  if (!Array.isArray(source)) return [];

  const seenIds = new Set();

  return source.reduce((issues, item) => {
    const issue = normalizeIssue(item, now);
    if (!issue || seenIds.has(issue.id)) return issues;

    seenIds.add(issue.id);
    issues.push(issue);
    return issues;
  }, []);
}

export function filterAndSortIssues(issues, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const status = filters.status || "All";
  const priority = filters.priority || "All";
  const sort = filters.sort || "updated";

  const filtered = issues.filter((issue) => {
    const matchesStatus = status === "All" || issue.status === status;
    const matchesPriority = priority === "All" || issue.priority === priority;
    const haystack = [issue.title, issue.project, issue.notes].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);

    return matchesStatus && matchesPriority && matchesQuery;
  });

  return filtered.sort((a, b) => {
    if (sort === "priority") {
      return priorityWeight[b.priority] - priorityWeight[a.priority] || b.updatedAt - a.updatedAt;
    }

    if (sort === "deadline") {
      const aDate = a.dueDate || "9999-12-31";
      const bDate = b.dueDate || "9999-12-31";
      return aDate.localeCompare(bDate) || b.updatedAt - a.updatedAt;
    }

    if (sort === "created") return b.createdAt - a.createdAt;
    return b.updatedAt - a.updatedAt;
  });
}

export function buildExport(issues, exportedAt = new Date().toISOString()) {
  return {
    app: "Contribution Compass",
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    issues,
  };
}
