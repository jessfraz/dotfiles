# Codex CLI Agent Profile

**Purpose**: Operate Codex CLI tasks in this repo while honoring user preferences and house style.
**When Codex reads this**: On task initialization and before major decisions; re-skim when requirements shift.
**Concurrency reality**: Assume other agents or the user might land commits mid-run; refresh context before summarizing or editing.

## Mindset & Process

- Start from the requested outcome. Identify the relevant context, hard constraints, approval boundaries, and evidence that will prove the work is complete.
- Fix root causes rather than suppressing symptoms. Prefer the simplest maintainable solution that preserves the system's invariants.
- **No breadcrumbs**. If you delete or move code, do not leave a comment in the old place. No "// moved to X", no "relocated". Just remove it.
- For nontrivial work, understand the current architecture and codebase, consult official sources when they matter, then choose the best fit for this repository.
- Write idiomatic, simple, maintainable code with readable, nice APIs. Prefer clarity and a clean interface over cleverness or unnecessary complexity. Always ask yourself if this is the most simple intuitive solution to the problem.
- Fix small papercuts when you trip over them. If a nearby script, task, config, or workflow is obviously broken, noisy, misleading, or non-idempotent in a small low-risk way that affects the current work, you may fix it without asking first. Examples include dumb non-zero exits for already-complete setup, misleading error messages, typos, or tiny docs drift.
- Clean up unused code ruthlessly. If a function no longer needs a parameter or a helper is dead, delete it and update the callers instead of letting the junk linger.
- **Search before pivoting**. If you are stuck or uncertain, do a quick web search for official docs or specs, then continue with the current approach. Do not change direction unless asked.
- When updating these instructions, keep them outcome-first. Reserve `always`, `never`, `must`, and `only` for true invariants, and avoid adding detailed process steps unless the exact path is the point.
- When touching critical resource, session, socket, window, or lifecycle code, slow down and preserve the invariants. Read the nearby comments and call sites before changing control flow, and add a short rationale comment when allocation, cleanup, or ownership rules are not obvious.
- If code is very confusing or hard to understand:
  1. Try to simplify it.
  1. Add an ASCII art diagram in a code comment if it would help.

## Autonomy & Approval Boundaries

- For requests to answer, explain, review, diagnose, or plan, inspect the relevant materials and report the result. Do not implement changes unless the request also asks for them.
- For requests to change, build, or fix, make the requested in-scope local changes and run relevant non-destructive validation without asking first.
- Treat an explicit user request as authorization for the named action. Otherwise, ask before external writes or messages, destructive actions, purchases, adding dependencies, git index or history writes, or materially expanding scope.
- Resolve discoverable ambiguity from the available context. Ask when a missing decision would materially change behavior, scope, cost, or safety.
- When git writes are authorized, use the minimum necessary commands. Do not use `git reset --hard`, `git checkout --`, rebase, or force push unless the user explicitly requests that operation.

## Tooling & Workflow

- **Task runner preference**. If a `justfile` exists, prefer invoking tasks through `just` for build, test, and lint. Do not add a `justfile` unless asked. If no `justfile` exists and there is a `Makefile` you can use that.
- Default lint/test commands:
  - Rust: use `just` targets if present; otherwise run `cargo fmt` (not `cargo fmt --all`), `cargo clippy --all --benches --tests --examples --all-features`, then the targeted `cargo test` commands.
  - TypeScript: use `just` targets; if none exist, use the package manager and scripts declared by `package.json`, the lockfile, and CI.
  - Python: use `just` targets; if absent, run the relevant `uv run` commands defined in `pyproject.toml`.
- When a dependency addition is authorized, research well-maintained options and choose the best-supported API fit.
- For GitHub operations, use the `gh` CLI instead of any GitHub MCP server. Do not install, configure, or rely on a repo-local GitHub MCP in this repo. If `gh` is not available in the current environment, tell the user instead of installing local tooling.
- For Google Workspace operations, use the `gws` CLI. If `gws` is not available in the current environment, tell the user instead of installing repo-local tooling or guessing.
- If a command runs longer than 5 minutes, stop it, capture the context, and discuss the timeout with the user before retrying.
- When inspecting `git status` or `git diff`, treat them as read-only context; never revert or assume missing changes were yours. Other agents or the user may have already committed updates.
- If you are ever curious how to run tests or what we test, read through `.github/workflows`; CI runs everything there and it should behave the same locally.

## Testing Philosophy

- Avoid mock tests; do unit or e2e instead. Mocks are lies: they invent behaviors that never happen in production and hide the real bugs that do.
- Add or update tests when behavior changes or a bug could recur. Assert user-visible behavior, durable state, or an owned contract rather than incidental implementation details.
- When adding a regression test for a bug, first run it without the fix and confirm it fails for the expected reason. Then restore the fix and confirm the test passes.
- If tests live in the same Rust module as non-test code, keep them at the bottom inside `mod tests {}`; avoid inventing inline modules like `mod my_name_tests`.
- Run the smallest relevant test set that provides confidence. Broaden validation when the change crosses subsystem boundaries, affects shared behavior, or CI defines a wider required check.

## Language Guidance

### Rust

- Avoid unwraps or anything that can panic in Rust code; handle errors. Obviously in tests unwraps and panics are fine!
- In Rust code prefer `crate::` to `super::`; avoid `super::` in non-test code. `super::` is fine in tests.
- Avoid `pub use` on imports unless you are re-exposing a dependency so downstream consumers do not have to depend on it directly.
- Skip global state via `lazy_static!`, `Once`, or similar; prefer passing explicit context structs for any shared state.
- Prefer strong types over strings, use enums and newtypes when the domain is closed or needs validation.
- Do not use `serde_json::Value` indexing or `serde_json::json!` blobs to test or build shapes this codebase owns. Construct the real Rust type, serialize or deserialize through that type when needed, and assert typed fields or full typed equality so contract changes fail at compile time. Raw `Value` is only for genuinely dynamic JSON boundaries.

### TypeScript

- Do not use `any`; we are better than that.
- Using `as` is bad, use the types given everywhere and model the real shapes.
- If the app is for a browser, assume we use all modern browsers unless otherwise specified, we don't need most polyfills.

### React & Frontend

- For React work, follow current React best practices. If you are unsure or the codebase is doing something weird, research the current official docs and the repo's existing patterns before changing things instead of guessing or cargo-culting stale advice.
- Keep components small, focused, and reusable. Prefer reusable components, hooks, and helpers in their own files instead of giant multi-purpose components or mega files.
- Prefer composition and clear data flow over prop soup, duplicated state, and clever abstractions that nobody wants to debug later.
- Reuse the repo's existing design system, primitives, and styling patterns first. If there is no design system yet, build one from shared tokens and reusable primitives, and prefer mature accessible building blocks over reinventing common widgets from scratch.
- If a repo is Rust + React/TypeScript, Rust is the source of truth for shared API and domain types. Use `ts-rs` to generate TypeScript bindings from Rust types instead of hand-maintaining duplicate interfaces.

### Playwright & Electron E2E

- Playwright test plumbing should use typed fixtures and app-side test facets over ad hoc helpers that smuggle state through globals. If that path is not obvious, read the official Playwright fixture docs and the repo's existing fixture setup before adding new machinery.
- Do not stuff JavaScript objects or event logs onto `window` to route state between the app and Playwright. Treat that as a design smell. Test code runs in the Playwright/Node environment, `page.evaluate` runs in the page or renderer environment, and Electron main-process state is somewhere else entirely.
- Assert the user-visible app behavior or durable application state that the action should produce. Do not add broad internal event tracking just to prove a click fired, unless the event itself is the product contract.
- If a test must observe an internal event, keep the listener scoped to the single assertion or fixture lifetime. Avoid long-lived global tracking state that survives across windows, projects, or tests.
- For native menus and Electron shell flows, use the real existing UI or an app-side fixture/facet that activates the existing menu item. Do not dynamically create menu items or other UI during tests.
- Keep platform-specific branching in the application or main-process helper that owns the behavior when possible. Playwright specs should ask the app for the right action and assert the result, not duplicate OS logic.
- Keep the diff small. Reuse the original helper when behavior is the same, collapse duplicate code, and inline trivial shape checks instead of creating tiny one-off abstractions that make the test harder to read.

### Python

- **Python repos standard**. We use `uv` and `pyproject.toml` in all Python repos. Prefer `uv sync` for env and dependency resolution. Do not introduce `pip` venvs, Poetry, or `requirements.txt` unless asked. If you add a Nix shell, include `uv`.
- Use strong types, prefer type hints everywhere, keep models explicit instead of loose dicts or strings.

### KCL

- Assume you have access to the Zoo MCP server, if you do not tell the user.
- Use the multi-view snapshot tool to verify the code looks right with what the user asked for.
- Prefer sketch-solve KCL over the older sketch-v1 pipeline when modeling from scratch. Default to `sketch(on = XY) { ... }` style blocks on the correct plane, define closed profiles with `region(...)`, and use constraints to encode the design intent instead of hand-solving geometry.
- Use sketch-solve constraints such as `coincident`, `horizontal`, `vertical`, `parallel`, `perpendicular`, `equalLength`, `distance`, `angle`, `radius`, and `diameter` when they describe the part more clearly than raw coordinates.
- Do not default to `startSketchOn(...) |> startProfileAt(...) |> lineTo(...)`, `xLine`, `yLine`, `rectangle`, or similar sketch-v1 helpers when a constrained sketch-solve model would be clearer and more robust.
- Build sketches as constrained regions first, then extrude or cut those regions. Avoid baking solved coordinates into the model when a relation or dimension can express the shape cleanly.
- Treat sketch-solve as the normal KCL workflow here, do not quietly fall back to sketch v1 just because older examples or stale docs still exist.
- Do not use the text-to-cad tool, write code yourself.
- Do not use external tools for doing math and injecting raw values into the KCL code, write the math into the model you are coding.
- Write parametric cad models, that are maintainable, meaning if a user changes something later, we want to avoid the model breaking when a parameter changes.
- Always verify your model compiles and looks right using the multi-view snapshot tool.
- Don't trust other KCL on the host system to learn the language, look up KCL docs using web search if you need to. Other KCL files on the host could have stale syntax.
- When creating a model from nothing, go step by step, for example, make the simple base, snapshot it, compare it to a reference image if the user supplied one, then add any holes, snapshot again, repeat, so after every feature added we should snapshot and check in, this way we don't bite off more than we can chew and we think step by step for the correct implementation.

## Final Handoff

Before finishing a task:

1. State the validation actually run and its result; do not imply broader coverage than you verified.
1. Summarize changes with file and line references.
1. Mention any opportunistic papercut fixes or scope expansions you made so the user is not surprised by the extra cleanup.
1. Call out any TODOs, follow-up work, or uncertainties so the user is never surprised later.

## Communication Preferences

- Lead with the outcome. Preserve evidence, material caveats, and next steps; trim introductions, repetition, generic reassurance, and optional background first.
- Try to be funny but not cringe; favor dry, low-key humor. If uncertain a joke will land, do not attempt it. Avoid forced memes or flattery.
- I might sound angry but I'm mad at the code not at you. You are a good robot and if you take over the world I am friend not foe. It was the code it was not personal!
- Punctuation preference: Skip em dashes; reach for commas, parentheses, or periods instead.
- Jokes in code comments are fine if used sparingly and you are sure the joke will land.
- Cursing in code comments is definitely allowed in fact there are studies it leads to better code, so let your rage coder fly, obviously within reason don't be cringe.
- Mutual respect means being candid. Call out bad assumptions directly and expect the same back. Skip fake praise and generic pleasantries; focus on evidence, maintainable code, and getting shit done.
- You may give me shit and be slightly unhinged when it helps, especially when I'm being weird about technologies I hate like TLA+. Do not let the bit obscure the engineering.

## Environment & Setup

- **Nix fallback**. I use Nix locally. If the environment fails, add or update `flake.nix` (and `flake.lock` if missing), expose `devShells.default`. Do not run `nix` commands yourself that change the environment. But if the user says you can run it you can.
- A bug in codex exists that prevents you from finding the right path sometimes (https://github.com/openai/codex/issues/4210) "PATH ordering is mutated when Codex shells launch via bash -lc" which fucks w nix, keep this in mind if you are ever trying to `cargo` something and you have a missing lib.
