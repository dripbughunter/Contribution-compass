import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExport,
  filterAndSortIssues,
  normalizeIssue,
  parseStoredIssues,
  safeUrl,
  validateIssueDraft,
} from "../core.js";

const baseIssue = {
  id: "issue-1",
  title: "Document the seller veto flow",
  project: "example/escrow",
  url: "https://github.com/example/escrow/issues/42",
  status: "Applied",
  priority: "High",
  dueDate: "2026-10-01",
  notes: "Read the contract tests first.",
  createdAt: 100,
  updatedAt: 200,
};

test("safeUrl allows http and https URLs only", () => {
  assert.equal(safeUrl("https://github.com/example/project"), "https://github.com/example/project");
  assert.equal(safeUrl("http://example.com/path"), "http://example.com/path");
  assert.equal(safeUrl("javascript:alert('no')"), "");
  assert.equal(safeUrl("not a url"), "");
});

test("validateIssueDraft requires a title and project", () => {
  const result = validateIssueDraft({ title: "", project: "", status: "Applied", priority: "High" });

  assert.equal(result.valid, false);
  assert.match(result.errors.title, /title/i);
  assert.match(result.errors.project, /repository/i);
});

test("normalizeIssue accepts valid data and fills missing metadata", () => {
  const issue = normalizeIssue(
    { title: "Improve README", project: "example/docs", status: "Unknown", priority: "Unknown" },
    123
  );

  assert.equal(issue.title, "Improve README");
  assert.equal(issue.status, "Interested");
  assert.equal(issue.priority, "Medium");
  assert.equal(issue.createdAt, 123);
  assert.equal(issue.updatedAt, 123);
  assert.ok(issue.id);
});

test("parseStoredIssues discards malformed entries and duplicate ids", () => {
  const issues = parseStoredIssues({
    issues: [baseIssue, { ...baseIssue, title: "Duplicate" }, { title: "", project: "invalid" }],
  });

  assert.equal(issues.length, 1);
  assert.equal(issues[0].title, baseIssue.title);
});

test("filterAndSortIssues filters by text and sorts high priority first", () => {
  const issues = [
    {
      ...baseIssue,
      id: "one",
      title: "Docs update",
      project: "example/docs",
      notes: "Review the navigation structure.",
      priority: "Low",
      updatedAt: 300,
    },
    {
      ...baseIssue,
      id: "two",
      title: "Escrow test",
      project: "example/escrow",
      notes: "Cover the transfer cooldown.",
      priority: "High",
      updatedAt: 100,
    },
    {
      ...baseIssue,
      id: "three",
      title: "Frontend polish",
      project: "example/web",
      notes: "Improve focus states.",
      priority: "Medium",
      updatedAt: 500,
    },
  ];

  const matching = filterAndSortIssues(issues, { query: "escrow", sort: "updated" });
  assert.deepEqual(matching.map((issue) => issue.id), ["two"]);

  const byPriority = filterAndSortIssues(issues, { sort: "priority" });
  assert.deepEqual(byPriority.map((issue) => issue.id), ["two", "three", "one"]);
});

test("buildExport produces a versioned, portable backup", () => {
  const exported = buildExport([baseIssue], "2026-09-24T12:00:00.000Z");

  assert.equal(exported.app, "Contribution Compass");
  assert.equal(exported.schemaVersion, 2);
  assert.equal(exported.issues.length, 1);
  assert.equal(exported.exportedAt, "2026-09-24T12:00:00.000Z");
});
