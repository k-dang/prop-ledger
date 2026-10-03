# No tax-year close state machine

Property records stay editable. Filing readiness is derived from setup and
record exceptions; it is not persisted as a workflow state. The app organizes
records rather than calculating tax outcomes, so a period lock would introduce
additional lifecycle rules without protecting a calculation performed here.

A Year-End Package is generated from current records at download time. The JSON
file is the point-in-time artifact; later edits cannot change a downloaded file.
A subsequent download captures the current records. The app does not persist
packages or keep an edit audit log.

## Considered Options

- **Full close workflow.** Rejected: introduces rules for records spanning years,
  late arrivals and reopening when an exported snapshot meets the current need.
- **Persisted packages.** Removed: the downloaded artifact is sufficient for the
  current workflow; there is no package archive or history interface to support.

## Consequences

- Readiness is calculated from current records, never a saved workflow state.
- Users retain downloaded packages themselves; the app cannot retrieve an earlier
  download after records change.
- Supporting files are linked in the JSON package rather than embedded or frozen
  with it. A package preserves recorded figures and metadata, not the file bytes.
