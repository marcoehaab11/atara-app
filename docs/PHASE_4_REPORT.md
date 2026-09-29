# Phase 4: piece animation and audio

Implemented the 200 ms / 24 degree tilt, five-keyframe 520 ms flights,
top-layer-first stagger, exact final pile coordinates, 240 ms landing bounce,
and a pool of 32 flying sprites. SVG textures are rasterized once at boot for DPR.
Tapping during a pour settles it once, then handles that same tap normally.
Undo/restart remain instant. Resizing or backgrounding also settles active motion.

Sound effects are synthesized at boot and played with Phaser audio. Landing
effects follow spice material, vary pitch, and are gated to one per 22 ms.
Settings now include sound and piece motion in Arabic and English; both persist.
Legacy saves keep their progress. First-launch motion respects OS reduced motion;
the alternative is a 300 ms layer drop from 70 px, with 45 ms layer stagger.

## Validation

- 78 tests across six files passed, including motion endpoints, settle-once,
  PCM headers/sample bounds/determinism and old-save preference migration.
- TypeScript, ESLint and production build passed.
- Browser verified: tap during pour selects the next jar; undo during pour
  restores the state and consumes only one undo; preferences survive reload.
- Production preview performed a pour and had no browser console errors.
- Production output contains no `motionBench` fixture or control screen.
- Screenshot: `phase-4-preview.png`. Raw timing: `phase-4-metrics.json`.

## Performance

Measured in the Codex in-app desktop browser on Windows, 1280 x 720 viewport,
with a 24-piece pour (three cumin layers) and sound enabled:

| Run | Average FPS | p95 frame ms | Duration ms |
| --- | ---: | ---: | ---: |
| Full 1 | 58.84 | 27.10 | 1379.60 |
| Full 2 | 60.39 | 27.40 | 1376.60 |
| Tap skip | 61.96 | 27.20 | 338.60 |
| Reduced motion | 61.30 | 28.30 | 393.00 |

These are animation-loop frame intervals, not GPU profiler measurements. Two
desktop runs do not establish sustained 60 FPS on a mid-range Android phone.
Physical-phone performance remains unverified; repeat the fixture there.
The production JS is approximately 1.66 MB / 422 KB gzip; Vite reports its
existing chunk-size advisory. No dependencies were added.

## Reproduce

1. `npm run dev -- --host` — start the game and print the phone's Wi-Fi URL.
2. Open the game, select a filled jar, then an empty/matching jar. Tap another
   jar while pieces fly: they land immediately and the new jar is selected.
3. Open settings; switch piece motion off and pour again to see the layer drop.
   Reload to confirm the preference is saved.
4. Add `?motionBench` to the development URL; Restart runs the 24-piece fixture,
   Back skips it, and Piece motion switches modes. Timings appear below the board.
5. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` — verification.

Music, cat audio and native haptics belong to subsequent scheduled phases.
Next: Phase 5 after owner approval, as required by AGENTS.md and spec section 30.

Commit message: `feat: animate individual spice pours with sound and motion preferences`
