# Attar Sort / رتّب العطارة

Android spice-sorting game, package ID `com.marcoehab.attarsort`.

## Current milestone

Phase 8: the Capacitor Android project is configured with test ads, native
preferences, haptics, local reminders, Firebase Analytics/UMP, Android back and
keyboard handling, and Google Play In-App Review. The native Android build is
not verified yet. Play Games integration still needs a plugin choice; RevenueCat
is part of the next phase.

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
Wi-Fi. First launch opens the shop-naming dialog over level 1. Pick a suggestion
and confirm, or skip. Tap the lifted jar, then the glowing empty jar. Complete
every spice to win; Next advances to the following puzzle. Undo/restart unlock
at level 2; hints and the coin counter unlock at level 3. Settings changes the
language; tap the wooden sign or use Settings to rename. Stop with Ctrl+C.

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
- `src/game/board.ts`: Phaser SVG textures, jar visuals and simple drop tween.
- `src/core/session.ts`: stable layer IDs, selection, history and helper usage.
- `src/ui/app.ts`: accessible jar hit targets and Arabic-friendly HTML overlays.
- `src/meta/player.ts` and `src/services/`: minimal local progress, hint worker
  and development-console-only analytics mock.
- `src/meta/daily.ts`, `src/services/daily.ts`, and `src/ui/dailyHub.ts`: daily
  reward rules, worker-generated date-seeded challenge and localized daily hub.
- `src/dev/music.ts`: development-only synthesized music placeholder; production
  builds omit this module.
- `src/meta/monetization.ts` and `src/services/ads.ts`: persistent offer/ad rules,
  browser-only purchase demos, and the native AdMob test bridge with UMP consent.
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
- The development-only `?motionBench` screen is eliminated from production builds. Core generation is exercised
  by tests; levels beyond the precomputed 1000 are generated on demand.
- Phase 5 shop decorations and order rewards are playable. Phase 6 adds daily
  rewards and challenges. Real-money purchases and ad-assisted help remain later.
- Save schema v4 migrates earlier saves in the existing localStorage slot. It saves owned
  decorations, settings, order-reward receipts and the in-progress board, hidden
  layers, undo history and helper counts. Invalid sessions safely restart.
  Native storage and cloud integration remain Phase 8.
- Phase 4 adds individual piece flights, tilt, landing bounce and material sounds,
  tap-to-skip and persisted sound/motion settings. First-launch motion follows the
  OS reduced-motion preference. See `docs/PHASE_4_REPORT.md` for measurements.
- Glass, woven sacks and brass worlds, counter decorations, interactive cat,
  seasonal garlands and greetings are implemented. Calendar sources and tentative
  2027 dates are documented in `docs/SEASON_DATES.md`.
- `?debug` enables development-only coin/jump/date/reset/event controls. Use a
  separate test browser origin/save; controls change that origin's save. They are
  removed from production. See `docs/PHASE_5_REPORT.md` for verification.
- Native portrait mode, localized Android labels, signing, service credentials
  and Play release validation are scheduled for later phases. See
  `docs/GOOGLE_PLAY_READINESS.md` for the remaining work and verification steps.

## Next phase

Wait for the owner's OK, then Phase 8: Android project, platform setup, and
native services. See `docs/PHASE_7_REPORT.md` and `docs/GOOGLE_PLAY_READINESS.md`.
## Android (Phase 8)

- Prepare and sync the native project: `npm run android:sync`
- Open it in Android Studio: `npm run android:open`
- Phase 8 status and remaining Android setup: [docs/PHASE_8_REPORT.md](docs/PHASE_8_REPORT.md)
