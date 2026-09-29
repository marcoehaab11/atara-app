# Phase 5 verification

## Implemented

- Glass / woven sack / brass vessel styles on the 20-level world cycle.
- Coin shop with seven decorations, configured prices, ownership and insufficient
  funds checks. Purchases appear immediately: hanging items, brass sign, counter
  plant/scale/radio/cat. Tea tray rendering is ready for Phase 6's day-7 grant.
- Cat interaction with original synthesized effect and Hassan line.
- Customer order card, spice icons/checks, waiting/missed/delivered statuses,
  immediate reward (40 normal, 80 hard) and persistent per-level receipts.
- Missed orders recover when undo removes the disallowed completed spice;
  completing the requested spices later cannot rescue an already-missed board.
  Granted rewards stay delivered across undo/restart/reload and are never farmed.
- Hassan world/order/purchase/theme lines, varied normal/win lines and 60% praise.
- Automatic Egyptian calendar themes plus manual overrides, seasonal garlands,
  backgrounds, greetings and spring eggs. Sources/windows: `SEASON_DATES.md`.
- Arabic/English settings, motion/sound/haptics, theme and app version. Future
  music/reminder/privacy/purchase/Play Games actions are visibly disabled with a
  clear explanation. Browser vibration depends on browser/device support.
- Save schema v2; explicit v1 migration in the existing storage key, optional
  metadata sanitization, board/history/hidden/helper restoration, corrupt-session
  rejection, and one-time reward receipts. A solved board saved before its win
  animation completes is settled on next load without duplicate rewards.
- Stable jar and toolbar buttons through animation redraws; sticky mobile toolbar.
- Development-only `?debug` tools for coins, jump, preview day, confirmed reset,
  and the last 20 sanitized analytics events. No names in analytics.

## Files

- `src/meta/{player,shop,orderReward,themes}.ts`: persistence, economy and seasons.
- `src/core/{session,orders}.ts`: session snapshots/validation and order correctness.
- `src/ui/{app,decorations}.ts`, `src/game/board.ts`, `src/style.css`: presentation.
- `src/config.ts`, `src/i18n/{ar,en}.json`, `src/services/{synth,analytics}.ts`.
- `src/dev/metaPanel.ts`, `tests/meta.test.ts`, README and phase/date reports.

## Tests and browser evidence

- 85 tests across seven files passed; TypeScript, ESLint and web build passed.
- Tests cover unlock/funds/duplicate purchase guards; v1 migration; corrupt saves;
  restored undo/helper state; normal/hard order rewards and no duplicates;
  missed-order semantics; inclusive calendar boundaries and manual overrides.
- Browser purchased all seven decorations in an isolated localhost test save.
  Buying chili reduced 50 to 10; repeat purchase disabled. Remaining purchases
  used explicit debug funds and left 150 coins. Cat displayed its line.
- Played level 7 using a feasible ordered solution: order raised 150 to 190.
  Undo plus reload kept 190, restored 14 moves and four undos; re-delivery gave
  no extra coins. Finished in 21 moves (par 20), two stars, +20 coins = 210.
- Reload restored the board after five moves. Production reload restored a pour
  even when reloaded during animation. No page console errors observed.
- Inspected worlds 21/41, Ramadan and spring art, purchases and locale switching.
- At 390 x 844 in Arabic and English: document width 375 (no horizontal overflow),
  toolbar bottom 844. Large boards scroll vertically with the toolbar visible.
- Production `?debug` shows ordinary gameplay; compiled JS contains neither
  `metaPanel` nor `motionBench` nor the debug panel implementation.
- `phase-5-preview.png`: decorated test shop in Brass Corner with spring theme.
  This uses a separate test save; it does not grant decorations to the owner.
- Vite retains its Phaser-related chunk-size advisory (~1.68 MB JS / 428 KB gzip).

## Run and expected behavior

```powershell
npm run dev -- --host
npm test
npm run typecheck
npm run lint
npm run build
npm run preview
```

The dev command prints the local and Wi-Fi URLs. In normal play, the coin shop
opens from level 4; orders begin on eligible levels from 7. Buy a decoration and
see it appear; reload an unfinished level to resume. Settings change the season
immediately. Levels 21 and 41 introduce sacks and brass. For faster verification,
use `?debug` on a separate test origin, add test coins and jump to these levels.

Daily rewards/challenges/music are Phase 6; real monetization, Android services,
native storage, cloud conflict resolution and publishing retain their scheduled
phases. Physical-phone performance and haptics are not verified by desktop QA.

Commit message: `feat: add shop worlds orders seasonal themes and resumable saves`
