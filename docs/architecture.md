# Architecture notes

## Design goal

Contribution Compass is a small, private contribution-planning tool. It deliberately has no backend, no user account, and no GitHub API integration.

This keeps the trust boundary simple: the browser owns the data and the user decides when to export or remove it.

## Modules

### `index.html`

Contains the semantic application structure, form controls, filters, status area, and reusable issue-card template. The JavaScript is loaded as an ES module.

### `styles.css`

Defines the visual tokens, responsive layouts, focus states, form errors, and mobile behavior. No external font or CSS dependency is required.

### `core.js`

Contains pure, testable functions for:

- generating entry IDs;
- validating title, repository, date, status, priority, and URL fields;
- normalizing stored entries;
- parsing old/local/imported data safely;
- filtering and sorting entries; and
- producing a versioned export payload.

The module accepts only `http` and `https` URLs for issue links. Rendering code uses `textContent` for user-controlled strings.

### `app.js`

Owns browser-only behavior:

- reading and writing local storage;
- migrating the earlier storage key to the versioned storage format;
- rendering cards and counters;
- handling form submission, edit mode, delete/undo, filters, and sorting;
- importing/exporting JSON; and
- displaying accessible status feedback.

## Data format

Version 2 stores this structure under the `contribution-compass:v2` browser local-storage key:

```json
{
  "schemaVersion": 2,
  "issues": [
    {
      "id": "unique-entry-id",
      "title": "Document escrow seller veto",
      "project": "owner/repository",
      "url": "https://github.com/owner/repository/issues/123",
      "status": "Applied",
      "priority": "Medium",
      "dueDate": "2026-10-01",
      "notes": "Waiting for maintainer assignment.",
      "createdAt": 1780000000000,
      "updatedAt": 1780000000000
    }
  ]
}
```

The app validates imported and stored data before rendering it. Invalid entries are ignored rather than inserted into the interface.

## Testing strategy

`tests/core.test.mjs` uses Node’s built-in test runner. It covers validation, protocol-safe URL handling, normalization, duplicate handling, filtering, sorting, and portable export construction.

Browser interactions should also be checked manually:

1. Create an entry.
2. Refresh the page and verify persistence.
3. Edit an entry and update its status.
4. Filter, search, and sort the queue.
5. Export JSON, clear entries, then import the backup.
6. Test keyboard focus and a mobile-width viewport.
