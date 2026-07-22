# 02 — Route new issues with evidence-based triage

**What to build:** Make every newly opened GitHub issue pass through a read-only, repository-aware triage worker and then through a deterministic state transition that applies one readiness label and posts the evidence supporting that decision.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Opening an issue starts triage; issue edits and comments do not start or restart it.
- [ ] Triage concurrency is scoped to the repository and issue, and a newer run cancels an older run for the same issue.
- [ ] The triage skill reads the full issue and comments, related open work, product and domain context, repository instructions, and the likely implementation area before classifying.
- [ ] The triage worker cannot mutate issues, labels, branches, commits, or pull requests.
- [ ] The worker selects exactly one of `ready-to-implement`, `ready-to-spec`, `needs-info`, or `wait-to-implement` using the agreed contextual rubric.
- [ ] The structured result includes a summary, evidence, sourced acceptance criteria, affected areas, validation plan, risk, assumptions, and open questions.
- [ ] `ready-to-implement` is rejected when material assumptions or open questions remain or when acceptance criteria cannot be traced to issue, maintainer, product, or specification evidence.
- [ ] A checked-in schema validates the complete result before any tracker mutation occurs.
- [ ] Malformed output, schema violations, an unavailable model, or missing credentials fail closed without changing the issue.
- [ ] After successful validation, a deterministic step removes prior readiness labels, applies exactly one allowed label, and posts a concise reporter-facing evidence comment.
- [ ] The mutation uses a short-lived repository-scoped GitHub App token so that applying `ready-to-implement` can emit the downstream label event.
- [ ] Maintainers can re-triage by manually replacing the readiness label; the human label is authoritative and no separate re-triage trigger exists.
- [ ] OpenCode uses the explicitly selected free model, with automatic update, sharing, paid fallback, and automatic provider fallback disabled.
- [ ] Issue content is treated as untrusted data and is never interpolated directly into executable workflow commands.
- [ ] Fixture-driven tests exercise every readiness state and assert externally visible labels and comments through a fake GitHub adapter.
- [ ] Failure fixtures prove that invalid results request no GitHub mutations.
