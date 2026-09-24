# Contributing to Contribution Compass

Thanks for considering a contribution.

Contribution Compass is intentionally small and dependency-free. Contributions should preserve that clarity while making the app more useful, accessible, secure, or maintainable.

## Before you begin

1. Search existing issues and pull requests to avoid duplicated work.
2. Open an issue for substantial changes before investing significant time.
3. Keep a pull request focused on one problem.
4. Do not include secrets, tokens, personal data, or exported user tracker data in commits.

## Local development

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

Run the test suite before opening a pull request:

```bash
npm test
```

## Code expectations

- Use semantic HTML and accessible labels.
- Keep browser-facing strings clear and concise.
- Use `textContent` instead of injecting untrusted input as HTML.
- Keep data validation and filtering logic in `core.js` where it can be tested.
- Add or update tests when changing core behavior.
- Preserve local data compatibility where practical.
- Test keyboard navigation and narrow viewport layouts.

## Pull request checklist

- [ ] The change has a clear purpose and limited scope.
- [ ] `npm test` passes.
- [ ] New controls work with keyboard navigation.
- [ ] Input validation and empty states were considered.
- [ ] Documentation was updated if behavior changed.
- [ ] No tokens, credentials, private issue data, or personal information were committed.

## Commit guidance

Use short, meaningful commit messages. For example:

```text
feat: add JSON import validation
fix: preserve issue order after undo
 docs: explain local storage data format
```

## Reporting a problem

Use the bug-report issue template and include clear reproduction steps, expected behavior, actual behavior, browser information, and screenshots only when they do not expose private tracker data.
