# Contributing

Two developers share this repository. Vignesh owns the engine, Ranga owns the
interface. The rules below exist so neither of us ever waits on the other.

## Git protocol — every commit, no exceptions

```bash
git pull --rebase origin main
npm run smoke
git add <your own files, named explicitly — never `git add .`>
git commit -m "Added thing"
git pull --rebase origin main
npm run smoke
git push origin main
```

Two pulls. The second catches the other developer pushing while you were writing
the commit message.

## Commit style

- Past tense. "Added the cascade policy", not "add cascade policy".
- Between 40 and 90 lines per commit. Split anything larger.
- Never squash a task's commits into one. The history is the record of the work.
- Name your files in `git add`. Never `git add .`.

## Code style

- One statement per line. Never join statements with commas or semicolons.
- No ternary (`? :`) expressions anywhere. Use `if` / `else`.
- Prefer genuinely fewer steps over dense formatting.

## The smoke rule

`npm run smoke` runs before every commit and again before every push. It calls
the engine through its front door, prints the nine metrics, and fails if any
numeric field anywhere is `NaN`, `undefined`, `null` or `Infinity`, if the
contract version does not match, or if a count is negative. If smoke fails, you
do not push. Fix it first.

## Changing the contract

`src/contract/types.ts` and `docs/CONTRACT.md` are shared. Neither developer
changes either file without messaging the other developer first and getting an
answer. A contract change is a conversation, not a commit. When it lands, bump
`CONTRACT_VERSION`, add a changelog line, and update both status files.

The same applies to `ARCHITECTURE.md`, `CONTRIBUTING.md`, `package.json` and
`vite.config.ts`.

## Ownership

- Engine: `src/engine/`, `scripts/`. Vignesh only.
- Interface: `src/ui/`, `src/main.tsx`, `index.html`, `src/styles/`. Ranga only.

If you need something on the other side of the seam, ask for it. Do not reach
across and write it yourself.

## No attribution

Do not add a co-authorship trailer, a generated-by footer, or any tool
attribution to a commit message, a pull request, or a source file. Not in any
form, not in any file. This includes anything added automatically — check
`git config` and disable it if present.

## Status files

`docs/status-vignesh.md` and `docs/status-ranga.md` are how the two halves stay
in sync. Update yours whenever your public surface changes state. The states are
exactly `working`, `stubbed` and `not started`. Anything marked `stubbed` is
returning fake data and must not be trusted or demonstrated as real.
