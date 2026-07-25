# 02 — Route new issues with evidence-based triage

**What to build:** Make every newly opened GitHub issue pass through a read-only, repository-aware triage worker and then through a deterministic state transition that applies one readiness label and posts the evidence supporting that decision.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Opening an issue starts triage; issue edits and comments do not start or restart it.
- [x] Triage concurrency is scoped to the repository and issue, and a newer run cancels an older run for the same issue.
- [x] The triage skill reads the full issue and comments, related open work, product and domain context, repository instructions, and the likely implementation area before classifying.
- [x] The triage worker cannot mutate issues, labels, branches, commits, or pull requests.
- [x] The worker selects exactly one of `ready-to-implement`, `ready-to-spec`, `needs-info`, or `wait-to-implement` using the agreed contextual rubric.
- [x] The JSON decision contains one allowed label and a concise reporter-facing comment summarizing the evidence, likely implementation area, and one concrete next step.
- [x] `ready-to-implement` is rejected when material assumptions or open questions remain or when acceptance criteria cannot be traced to issue, maintainer, product, or specification evidence.
- [x] Malformed JSON, an unrecognized label, a missing or empty comment, an unavailable model, or missing credentials fail closed without changing the issue.
- [x] After the minimal result checks pass, a deterministic step removes prior readiness labels, applies exactly one allowed label, and posts a concise reporter-facing evidence comment.
- [x] The mutation uses GitHub's built-in repository token with `issues: write` limited to the apply job; no additional authentication credentials are required.
- [x] Maintainers can re-triage by manually replacing the readiness label; the human label is authoritative and no separate re-triage trigger exists.
- [x] OpenCode uses the explicitly selected free model, with automatic update, sharing, paid fallback, and automatic provider fallback disabled.
- [x] Issue content is treated as untrusted data and is never interpolated directly into executable workflow commands.
- [x] Workflow syntax, agent and skill discovery, result extraction, and representative valid and invalid label/comment results are checked locally.
- [ ] A controlled issue on the default branch proves the real trigger, permissions, label, and comment behavior without using confidential data.

## Comments

- Implemented as a two-job workflow: read-only context gathering and OpenCode triage followed by a
  deterministic apply job using the built-in repository token. The workflow intentionally keeps
  its small JSON checks inline and introduces no separate automation library, fixture harness, or
  additional automation identity.
- YAML parsing, `actionlint`, OpenCode agent and skill discovery, JSONL extraction, both type-checks,
  and all 84 repository tests pass. The remaining acceptance step is the controlled default-branch
  GitHub run after the four readiness labels and `OPENCODE_API_KEY` are configured.
