<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Package manager

- Use `pnpm` for project commands and dependency operations.

## Code organization

- Keep server actions and shared helpers in `src/lib/` (e.g. `src/lib/actions.ts`), not under `src/app/`.
- Inline single-use wrapper/shell components directly into the route layout instead of keeping separate component files.
