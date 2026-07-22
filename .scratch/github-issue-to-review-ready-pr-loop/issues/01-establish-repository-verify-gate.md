# 01 — Establish the repository Verify gate

**What to build:** Make the repository's aggregate validation contract run automatically for every pull request and every push to `main`, giving human and automated changes the same visible CI gate before review or merge.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] The aggregate verification command runs formatting and lint checks, application type-checking, Worker type-checking, and the complete unit test suite.
- [x] Pull requests, pushes to `main`, and an explicit manual dispatch all start the Verify workflow.
- [x] The workflow uses a read-only GitHub token and grants no mutation permissions.
- [x] Obsolete runs for the same workflow and ref are cancelled through GitHub Actions concurrency.
- [x] Node.js, pnpm, and referenced actions use reviewed, pinned versions.
- [x] Dependencies install from the lockfile without allowing lockfile changes.
- [x] The production build remains outside this contract because it does not yet have a CI-safe runtime configuration.
- [x] The aggregate verification command passes locally on the implementation branch.

## Comments

- Implemented the aggregate verification command and read-only GitHub Actions gate. Workflow
  syntax passes `actionlint`; frozen installation, both type-checks, lint, and all 84 tests pass.
  Standards and ticket-compliance reviews reported no findings.
