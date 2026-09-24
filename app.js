import {
  LEGACY_STORAGE_KEY,
  SCHEMA_VERSION,
  STORAGE_KEY,
  buildExport,
  createId,
  filterAndSortIssues,
  parseStoredIssues,
  validateIssueDraft,
} from "./core.js";

const $ = (selector) => document.querySelector(selector);
const THEME_STORAGE_KEY = "contribution-compass:theme";

const form = $("#issue-form");
const issueList = $("#issue-list");
const emptyState = $("#empty-state");
const template = $("#issue-template");
const toast = $("#toast");
const toastMessage = $("#toast-message");
const toastAction = $("#toast-action");
const formMessage = $("#form-message");

const controls = {
  search: $("#search"),
  statusFilter: $("#status-filter"),
  priorityFilter: $("#priority-filter"),
  sortFilter: $("#sort-filter"),
  clearButton: $("#clear-data"),
  exportButton: $("#export-data"),
  importInput: $("#import-data"),
  cancelEditButton: $("#cancel-edit"),
  saveButton: $("#save-button"),
  formEyebrow: $("#form-eyebrow"),
  formTitle: $("#form-title"),
  nextMoveTitle: $("#next-move-title"),
  nextMoveCopy: $("#next-move-copy"),
  totalCount: $("#total-count"),
  progressCount: $("#progress-count"),
  completedCount: $("#completed-count"),
  themeToggle: $("#theme-toggle"),
};

const fields = {
  title: $("#title"),
  project: $("#project"),
  url: $("#url"),
  status: $("#status"),
  priority: $("#priority"),
  dueDate: $("#due-date"),
  notes: $("#notes"),
};

const errorNodes = {
  title: $("#title-error"),
  project: $("#project-error"),
  url: $("#url-error"),
  dueDate: $("#due-date-error"),
};

let { issues, notice } = loadIssues();
let editingId = null;
let toastTimeout;

function preferredTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // The app remains usable when browser storage is disabled.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#101812" : "#f3f6f1");
  controls.themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  controls.themeToggle.setAttribute("title", isDark ? "Switch to light theme" : "Switch to dark theme");
  controls.themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
}

function setupTheme() {
  applyTheme(preferredTheme());

  controls.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Theme still changes for the current page session.
    }
    applyTheme(nextTheme);
  });
}

function loadIssues() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return { issues: parseStoredIssues(JSON.parse(current)), notice: "" };
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = parseStoredIssues(JSON.parse(legacy));
      persistIssues(migrated);
      return {
        issues: migrated,
        notice: migrated.length ? "Your previous tracker entries were migrated safely." : "",
      };
    }
  } catch {
    return {
      issues: [],
      notice: "Saved browser data could not be read. You can still use the tracker in this session.",
    };
  }

  return { issues: [], notice: "" };
}

function persistIssues(nextIssues = issues) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, issues: nextIssues })
    );
    return true;
  } catch {
    showToast("Your browser could not save this change. Export important data before closing.");
    return false;
  }
}

function formatDate(dateString, includeYear = true) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function formatUpdated(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return `Updated ${new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

function showToast(message, actionLabel = "", action = null) {
  window.clearTimeout(toastTimeout);
  toastMessage.textContent = message;
  toastAction.hidden = !actionLabel;
  toastAction.textContent = actionLabel;
  toastAction.onclick = action;
  toast.hidden = false;

  toastTimeout = window.setTimeout(() => {
    toast.hidden = true;
  }, actionLabel ? 7500 : 4200);
}

function clearFormErrors() {
  Object.values(errorNodes).forEach((node) => {
    node.textContent = "";
  });
  formMessage.textContent = "";
}

function displayFormErrors(errors) {
  clearFormErrors();
  Object.entries(errors).forEach(([field, message]) => {
    if (errorNodes[field]) errorNodes[field].textContent = message;
  });

  const firstError = Object.keys(errors)[0];
  if (firstError && fields[firstError]) fields[firstError].focus();
  formMessage.textContent = "Please correct the highlighted field before saving.";
}

function updateStats() {
  controls.totalCount.textContent = issues.length;
  controls.progressCount.textContent = issues.filter(
    (issue) => issue.status === "Assigned" || issue.status === "In progress"
  ).length;
  controls.completedCount.textContent = issues.filter(
    (issue) => issue.status === "Completed"
  ).length;
}

function updateNextMove() {
  const byStatus = (status) => issues.find((issue) => issue.status === status);
  const inProgress = byStatus("In progress");
  const assigned = byStatus("Assigned");
  const applied = byStatus("Applied");
  const interested = byStatus("Interested");

  if (inProgress) {
    controls.nextMoveTitle.textContent = `Move “${inProgress.title}” forward.`;
    controls.nextMoveCopy.textContent = "Work in small reviewable steps, test what you change, and communicate blockers early.";
  } else if (assigned) {
    controls.nextMoveTitle.textContent = `Plan “${assigned.title}” before coding.`;
    controls.nextMoveCopy.textContent = "Read contribution guidance, confirm the scope, and make a realistic implementation plan.";
  } else if (applied) {
    controls.nextMoveTitle.textContent = `Wait responsibly on “${applied.title}”.`;
    controls.nextMoveCopy.textContent = "Do not begin issue work before assignment. Use the time to study general skills or improve an independent project.";
  } else if (interested) {
    controls.nextMoveTitle.textContent = `Research “${interested.title}” before applying.`;
    controls.nextMoveCopy.textContent = "Read the issue, contribution guide, and repository structure. Apply only when the scope is a genuine fit.";
  } else {
    controls.nextMoveTitle.textContent = "Add one realistic issue to your queue.";
    controls.nextMoveCopy.textContent = "Start small, understand the scope, and do quality work.";
  }
}

function getFilters() {
  return {
    query: controls.search.value,
    status: controls.statusFilter.value,
    priority: controls.priorityFilter.value,
    sort: controls.sortFilter.value,
  };
}

function renderIssues() {
  const visibleIssues = filterAndSortIssues(issues, getFilters());
  issueList.innerHTML = "";
  emptyState.hidden = visibleIssues.length > 0;

  visibleIssues.forEach((issue) => {
    const item = template.content.cloneNode(true);
    const card = item.querySelector(".issue-card");
    const title = item.querySelector(".issue-title");
    const project = item.querySelector(".issue-project");
    const notes = item.querySelector(".issue-notes");
    const deadline = item.querySelector(".issue-deadline");
    const updated = item.querySelector(".issue-updated");
    const issueLink = item.querySelector(".issue-link");
    const priority = item.querySelector(".priority-badge");
    const statusSelect = item.querySelector(".status-select");
    const editButton = item.querySelector(".edit-button");
    const deleteButton = item.querySelector(".delete-button");

    card.dataset.status = issue.status.toLowerCase().replace(/\s+/g, "-");
    title.textContent = issue.title;
    project.textContent = issue.project;
    priority.textContent = `${issue.priority} priority`;
    priority.classList.add(`priority-${issue.priority.toLowerCase()}`);
    statusSelect.value = issue.status;
    updated.textContent = formatUpdated(issue.updatedAt);

    if (issue.url) {
      issueLink.href = issue.url;
      issueLink.hidden = false;
    }

    if (issue.notes) {
      notes.textContent = issue.notes;
    } else {
      notes.remove();
    }

    if (issue.dueDate) {
      deadline.textContent = `Personal deadline: ${formatDate(issue.dueDate)}`;
      deadline.hidden = false;
    }

    statusSelect.addEventListener("change", (event) => {
      updateIssue(issue.id, { status: event.target.value });
      showToast(`Status updated to ${event.target.value}.`);
    });

    editButton.addEventListener("click", () => startEditing(issue));

    deleteButton.addEventListener("click", () => {
      const shouldDelete = window.confirm(`Remove “${issue.title}” from the tracker?`);
      if (!shouldDelete) return;

      const originalIndex = issues.findIndex((savedIssue) => savedIssue.id === issue.id);
      const deletedIssue = issues[originalIndex];
      issues = issues.filter((savedIssue) => savedIssue.id !== issue.id);
      persistIssues();
      refreshInterface();

      showToast("Issue removed from your tracker.", "Undo", () => {
        issues.splice(originalIndex, 0, deletedIssue);
        persistIssues();
        refreshInterface();
        showToast("Issue restored.");
      });
    });

    issueList.appendChild(item);
  });
}

function refreshInterface() {
  updateStats();
  updateNextMove();
  renderIssues();
}

function updateIssue(id, changes) {
  issues = issues.map((issue) =>
    issue.id === id ? { ...issue, ...changes, updatedAt: Date.now() } : issue
  );
  persistIssues();
  refreshInterface();
}

function startEditing(issue) {
  editingId = issue.id;
  fields.title.value = issue.title;
  fields.project.value = issue.project;
  fields.url.value = issue.url || "";
  fields.status.value = issue.status;
  fields.priority.value = issue.priority;
  fields.dueDate.value = issue.dueDate || "";
  fields.notes.value = issue.notes || "";

  clearFormErrors();
  controls.formEyebrow.textContent = "EDIT ENTRY";
  controls.formTitle.textContent = "Refine your plan";
  controls.saveButton.innerHTML = "Save changes <span>✓</span>";
  controls.cancelEditButton.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  fields.title.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  clearFormErrors();
  controls.formEyebrow.textContent = "NEW ENTRY";
  controls.formTitle.textContent = "Plan your work";
  controls.saveButton.innerHTML = "Add to tracker <span>→</span>";
  controls.cancelEditButton.hidden = true;
}

function draftFromForm() {
  return {
    title: fields.title.value,
    project: fields.project.value,
    url: fields.url.value,
    status: fields.status.value,
    priority: fields.priority.value,
    dueDate: fields.dueDate.value,
    notes: fields.notes.value,
  };
}

function readImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsText(file);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const draft = validateIssueDraft(draftFromForm());

  if (!draft.valid) {
    displayFormErrors(draft.errors);
    return;
  }

  clearFormErrors();
  const now = Date.now();

  if (editingId) {
    issues = issues.map((issue) =>
      issue.id === editingId ? { ...issue, ...draft.value, updatedAt: now } : issue
    );
    showToast("Contribution entry updated.");
  } else {
    issues.unshift({ id: createId(), createdAt: now, updatedAt: now, ...draft.value });
    showToast("Issue added to your contribution plan.");
  }

  persistIssues();
  refreshInterface();
  resetForm();
  fields.title.focus();
});

[controls.search, controls.statusFilter, controls.priorityFilter, controls.sortFilter].forEach((input) => {
  input.addEventListener("input", renderIssues);
  input.addEventListener("change", renderIssues);
});

Object.keys(errorNodes).forEach((field) => {
  fields[field].addEventListener("input", () => {
    errorNodes[field].textContent = "";
  });
});

controls.cancelEditButton.addEventListener("click", resetForm);

controls.clearButton.addEventListener("click", () => {
  if (!issues.length) return;

  const shouldClear = window.confirm("Clear every saved issue from this browser? Export a backup first if needed.");
  if (!shouldClear) return;

  issues = [];
  persistIssues();
  resetForm();
  refreshInterface();
  showToast("All local tracker entries were cleared.");
});

controls.exportButton.addEventListener("click", () => {
  const file = new Blob([JSON.stringify(buildExport(issues), null, 2)], {
    type: "application/json",
  });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "contribution-compass-export.json";
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast("JSON backup exported.");
});

controls.importInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;

  try {
    const fileText = await readImportFile(file);
    const importedIssues = parseStoredIssues(JSON.parse(fileText));

    if (!importedIssues.length) {
      showToast("No valid Contribution Compass entries were found in that file.");
      return;
    }

    const replaceExisting = window.confirm(
      "Replace current entries with this backup? Choose Cancel to merge the imported entries instead."
    );

    if (replaceExisting) {
      issues = importedIssues;
    } else {
      const existingIds = new Set(issues.map((issue) => issue.id));
      const uniqueImported = importedIssues.filter((issue) => !existingIds.has(issue.id));
      issues = [...uniqueImported, ...issues];
    }

    persistIssues();
    refreshInterface();
    showToast(`Imported ${importedIssues.length} contribution entr${importedIssues.length === 1 ? "y" : "ies"}.`);
  } catch {
    showToast("That file is not a valid Contribution Compass JSON export.");
  }
});

setupTheme();
refreshInterface();
if (notice) showToast(notice);
