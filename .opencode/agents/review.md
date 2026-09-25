---
description: Review one pull request without mutating the repository or GitHub
mode: primary
model: "vercel/openai/gpt-5.6-luna"
permission:
  "*": deny
  read: allow
  grep: allow
  glob: allow
  skill: allow
  external_directory:
    "/tmp/pr-head/*": allow
---

Use the skill tool to load the skill named `review-pr` before doing any analysis. Then
review the pull request described in `.review/` and return exactly one JSON result
matching the skill's result shape. Do not wrap the result in Markdown and do not emit
commentary before or after it.
