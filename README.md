# Contribution Compass

**Contribution Compass** is a polished, local-first browser app for planning open-source contribution work with focus and accountability.

It helps contributors track issues from first research through application, assignment, implementation, and completion—without collecting an account, personal data, or a repository access token.

> Built with plain HTML, CSS, and JavaScript so the core frontend architecture is easy to inspect, learn, and extend.

## Why it exists

New contributors often lose track of issue scope, deadlines, pending applications, and follow-up work. Contribution Compass keeps a private working queue in the browser so that a contributor can make deliberate choices instead of applying indiscriminately.

It is a planning tool. It does **not** submit applications, create pull requests, or interact with GitHub on a user’s behalf.

## Features

- Create entries with a title, repository, issue URL, status, priority, personal deadline, and notes
- Track work through `Interested`, `Applied`, `Assigned`, `In progress`, and `Completed`
- Update an issue's status directly from the queue
- Edit, delete, restore, or safely clear local entries
- Search titles, repositories, and notes
- Filter by status and priority; sort by recent activity, deadline, priority, or creation time
- View a context-aware **Next move** prompt based on the queue
- Use a responsive dashboard with light/dark theme preference
- Export a versioned JSON backup and import it later
- Validate user input and allow only safe `http`/`https` issue links
- Persist data locally with browser `localStorage`
- Run without a backend, account, tracker, or external dependency
- Include automated unit tests for the data layer

## Privacy and security

Contribution Compass is intentionally local-first:

- It does not ask for passwords, GitHub tokens, wallet details, or KYC information.
- It does not make network requests.
- Entries are stored only in your current browser under local storage.
- Clearing browser/site data can remove saved entries, so export JSON backups when needed.
- Issue URLs are validated to allow only `http` and `https` protocols.

## Quick start

### Run in a browser

Open `index.html` directly in a modern browser.

### Run with a local server

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Test

The project uses Node’s built-in test runner and has no npm dependencies.

```bash
npm test
```

## Architecture

```text
contribution-compass/
├── index.html                  # Semantic page structure and accessible controls
├── styles.css                  # Responsive design system and visual states
├── core.js                     # Pure validation, filtering, sorting, storage-format helpers
├── app.js                      # Browser state, DOM rendering, import/export, local persistence
├── tests/core.test.mjs         # Unit tests for core logic
├── docs/architecture.md        # Data flow and design decisions
├── CONTRIBUTING.md             # Contribution workflow and quality expectations
└── .github/workflows/ci.yml    # Automated test workflow
```

The browser app delegates testable, side-effect-free logic to `core.js`.

```text
Form input → validation → issue state → localStorage → rendered queue
                              ↓
                         export/import JSON
```

Read the [architecture notes](docs/architecture.md) for more detail.

## Development principles

- Keep the app useful without requiring a server.
- Validate and normalize browser-stored data before rendering it.
- Prefer small, reviewable changes over feature churn.
- Keep accessibility and keyboard navigation part of every feature.
- Avoid collecting credentials or pretending to automate contribution work.

## Roadmap

- [ ] Add import preview and conflict-resolution UI
- [ ] Add a due-date calendar view
- [ ] Add test coverage for browser persistence helpers
- [ ] Add an optional, clearly scoped TypeScript build
- [ ] Add offline/PWA support only after defining a real user need

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

This project is licensed under the [MIT License](LICENSE).
