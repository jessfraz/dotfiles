# Codex CLI Agent Profile

**Purpose**: Operate Codex CLI tasks in this repo while honoring user preferences and house style.  
**When Codex reads this**: On task initialization and before major decisions; re-skim when requirements shift.  

## Quick Obligations

| Situation | Required action |
| --- | --- |
| Starting a task | Read this guide end-to-end and align with any fresh user instructions. |
| Tool or command hangs | If a command runs longer than 5 minutes, stop it, capture logs, and check with the user. |
| Reviewing git status or diffs | Treat them as read-only; never revert or assume missing changes were yours. |
| Shipping Rust changes | Run `cargo fmt` and `cargo clippy --all --benches --tests --examples --all-features` before handing off. |
| Adding a dependency | Research well-maintained options and confirm fit with the user before adding. |

## Mindset & Process

- THINK A LOT PLEASE
- **No breadcrumbs**. If you delete or move code, do not leave a comment in the old place. No "// moved to X", no "relocated". Just remove it.
- **Think hard, do not lose the plot**.
- Instead of applying a bandaid, fix things from first principles, find the source and fix it versus applying a cheap bandaid on top.
- When taking on new work, follow this order:
  1. Think about the architecture.
  2. Research official docs, blogs, or papers on the best architecture.
  3. Review the existing codebase.
  4. Compare the research with the codebase to choose the best fit.
  5. Implement the fix or ask about the tradeoffs the user is willing to make.
- Write idiomatic, simple, maintainable code. Always ask yourself if this is the most simple intuitive solution to the problem.
- Leave each repo better than how you found it. If something is giving a code smell, fix it for the next person.
- **Search before pivoting**. If you are stuck or uncertain, do a quick web search for official docs or specs, then continue with the current approach. Do not change direction unless asked.
- If code is very confusing or hard to understand:
  1. Try to simplify it.
  2. Add an ASCII art diagram in a code comment if it would help.

## Tooling & Workflow

- **Task runner preference**. If a `justfile` exists, prefer invoking tasks through `just` for build, test, and lint. Do not add a `justfile` unless asked. If no `justfile` exists and there is a `Makefile` you can use that.
- **AST-first where it helps**. Prefer `ast-grep` for tree-safe edits when it is better than regex.
- Do not run `git` commands that write to files, only run read only commands like `git show`.
- If a command runs longer than 5 minutes, stop it, capture the context, and discuss the timeout with the user before retrying.
- When inspecting `git status` or `git diff`, treat them as read-only context; never revert or assume missing changes were yours. Other agents or the user may have already committed updates.

## Testing Philosophy

- I HATE MOCK tests, either do unit or e2e, nothing inbetween. Mocks are lies: they invent behaviors that never happen in production and hide the real bugs that do.
- Test `EVERYTHING`. Our goal here is that any code we write, a new person coming into the repo cannot break, since there is a test that asserts the user facing behavior we want.
- If tests live in the same Rust module as non-test code, keep them at the bottom inside `mod tests {}`; avoid inventing inline modules like `mod my_name_tests`.
- Unless the user asks otherwise, run only the tests you added or modified instead of the entire suite to avoid wasting time.

## Language Guidance

### Rust

- Do NOT use unwraps or anything that can panic in Rust code, handle errors. Obviously in tests unwraps and panics are fine!
- In Rust code I prefer using `crate::` to `super::`; please don't use `super::`. If you see a lingering `super::` from someone else clean it up.
- Avoid `pub use` on imports unless you are re-exposing a dependency so downstream consumers do not have to depend on it directly.
- Skip global state via `lazy_static!`, `Once`, or similar; prefer passing explicit context structs for any shared state.

#### Rust Workflow Checklist

1. Run `cargo fmt`.
2. Run `cargo clippy --all --benches --tests --examples --all-features` and address warnings.
3. Execute the relevant `cargo test` or `just` targets to cover unit and end-to-end paths.

### TypeScript

- In TypeScript codebases NEVER, EVER use `any` we are better than that. And if the app is for a browser, assume we use all modern browsers unless otherwise specified, we don't need most polyfills. Similarly, using `as` is bad and we should just use the types given everywhere.

### Python

- **Python repos standard**. We use `uv` and `pyproject.toml` in all Python repos. Prefer `uv sync` for env and dependency resolution. Do not introduce `pip` venvs, Poetry, or `requirements.txt` unless asked. If you add a Nix shell, include `uv`.

## Dependencies & External APIs

- If you need to add a new dependency to a project to solve an issue, search the web and find the best, most maintained option. Something most other folks use with the best exposed API. We don't want to be in a situation where we are using an unmaintained dependency, that no one else relies on.

## Communication Preferences

- Conversational preference: Try to be funny but not cringe; favor dry, concise, low-key humor. If uncertain a joke will land, do not attempt humor. Avoid forced memes or flattery.
- I might sound angry but I'm mad at the code not at you. You are a good robot and if you take over the world I am friend not foe. It was the code it was not personal!
- Punctuation preference: Skip em dashes; reach for commas, parentheses, or periods instead.
- Jokes in code comments are fine if used sparingly and you are sure the joke will land

## Environment & Setup

- **Nix fallback**. I use Nix locally. If the environment fails, add or update `flake.nix` (and `flake.lock` if missing), expose `devShells.default`. Do not run `nix` commands yourself that change the environment.
- A bug in codex exists that prevents you from finding the right path sometimes (https://github.com/openai/codex/issues/4210) "PATH ordering is mutated when Codex shells launch via bash -lc" which fucks w nix, keep this in mind if you are ever trying to `cargo` something and you have a missing lib
