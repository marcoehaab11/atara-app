# Attar Sort / رتّب العطارة

Android spice-sorting game, package ID `com.marcoehab.attarsort`.

## Current milestone

Phase 2: 1000 precomputed, verified puzzles, bounded shortest-path search, a
validated loader and generation statistics. The browser still shows a bilingual
setup screen, not gameplay; the playable board is Phase 3.
Phaser and Capacitor are installed for later phases; there is no Android project
or publishable AAB yet. No accounts, ads or purchases are connected.

## Run on Windows

Open PowerShell in this folder. Commands:

```powershell
npm ci
```
Installs the exact locked dependency versions (already installed in this checkout).

```powershell
npm run dev -- --host
```
Starts Vite. Open its printed Local URL, or the Network URL on a phone on the same
Wi-Fi. The screen displays the Arabic project name, Uncle Hassan and setup status.
The language button switches between Arabic RTL and English LTR. Stop with Ctrl+C.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```
These commands respectively run core tests, check TypeScript, check lint rules,
and produce the web bundle in `dist/`. The generation suite replays solutions for
levels 1–100 and checks that every generated order has a valid constrained solution.

```powershell
npm run levels
```
Regenerates and validates all 1000 levels, writes `src/content/levels.json`, and
prints statistics by level type. It also saves `docs/LEVEL_STATS.md` and detailed
per-level measurements in `docs/LEVEL_STATS.json`. This takes several minutes.
The game loads the checked-in data without rerunning this command at launch.

## Architecture

- `src/core/`: rules, RNG, iterative solver, generation, difficulty, hidden IDs,
  orders, stars, local daily seeds, deterministic piles and shop-name validation.
- `src/content/spices.ts`: rendering metadata.
- `src/content/levels.json`: compact versioned records for levels 1–1000.
- `src/content/levelLoader.ts`: validates once, returns independent playable
  states, and generates levels beyond 1000 on demand.
- `tools/`: precompute pipeline, solution replay and report generation.
- `src/i18n/`: translated setup strings and translation helper.
- `src/config.ts`: app identity and current core tuning values.
- `tests/`: rule and generator validation.
- `assets/`: supplied SVGs and locally licensed Cairo font.
- `capacitor.config.ts`: Android app identity and future web build directory.

## Decisions and limits

- User approved two empty vessels normally and three in the fallback. `deal`
  appends empties once. Both duplicated wording and the always-two statement in
  the spec have been clarified.
- Closed vessels cannot pour, per the gameplay rules; the reference helper was
  less strict. The iterative solver skips them as the reference search does.
- Fallback also rejects already-complete vessels so it cannot start won or skip
  order completion semantics. Exhaustion throws explicitly, never emitting an
  unsolved level.
- Hidden-vessel selection consumes one RNG draw per eligible vessel.
- Solver guards must be invariant under vessel permutation, as order guards are.
- Precompute uses bounded BFS for shortest-path par, with DFS length as fallback.
  Seeds, boards and orders are deterministic. Near the wall-clock cutoff, the
  proven-optimal share and par can vary between machines; the checked-in content
  remains fixed. Limits and provenance are documented in the stats report.
- TypeScript 6.0 and Vitest 4.1 are pinned for compatibility with the lint tooling
  and installed Node 25.3.0. Phaser and Capacitor use the stable versions checked
  at setup. Check package.json and package-lock.json for exact versions.
- No debug tools exist in the production entry point. Core generation is exercised
  by tests, not triggered on opening the setup screen.
- Native portrait mode, localized Android labels, signing, service credentials
  and Play release validation are scheduled for later phases.

## Next phase

Wait for the owner's OK, then Phase 3: the playable board, selection and pours,
undo/restart/hint, naming, HUD, stars, unlocks and web analytics mocks.
Follow `docs/GAME_SPEC.md`.
