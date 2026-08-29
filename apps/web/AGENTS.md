<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## AI Agent Instructions

- Before implementing any new components, please check if it already exists in the project by looking through `/apps/web/src/components` and `apps/web/src/components/ui` (shadcn components).
- If it does not exist, please create it in the appropriate folder.
- Do not overwrite or modify existing components unless explicitly asked to do so, especially shadcn components (in `apps/web/src/components/ui`).
- Focus on implementing the functionality first with good layout.
- Provide responsible design (adaptive) with Tailwind CSS which works on both mobile and desktop devices (mobile first design).
- Avoid using Vanilla CSS and inline styles if Tailwind CSS and shadcn ui can achieve the same result.

<!-- END:nextjs-agent-rules -->
