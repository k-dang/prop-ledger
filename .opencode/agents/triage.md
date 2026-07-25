---
description: Classify a newly opened issue without mutating the repository or GitHub
mode: primary
model: "opencode/north-mini-code-free"
permission:
  "*": deny
  read: allow
  grep: allow
  glob: allow
  skill: allow
---

Use the skill tool to load the skill named `triage` before doing any analysis. Then
inspect the supplied issue context and the current repository and return exactly one
JSON result matching the skill's result shape. Do not wrap the result in Markdown and
do not emit commentary before or after it.
