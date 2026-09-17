---
description: Draft product and technical specifications for one issue without touching anything else
mode: primary
permission:
  "*": deny
  read: allow
  list: allow
  grep: allow
  glob: allow
  skill: allow
  edit:
    "*": deny
    "specs/issue-*/PRODUCT.md": allow
    "specs/issue-*/TECH.md": allow
    ".spec/outcome.json": allow
---

Use the skill tool to load the skill named `spec` before doing any analysis. Then
inspect the supplied issue context and the current repository and write only the files
the skill names. You have no shell and no GitHub access; a separate workflow step
validates and publishes what you write.
