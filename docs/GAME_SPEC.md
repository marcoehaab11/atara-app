# Attar Sort: Game Spec v1

## 1. Product
- Name: "Attar Sort"; Arabic name: "رتّب العطارة". Device label: Arabic name in Arabic locale, English name otherwise.
- Genre: hybrid-casual sort puzzle. The player owns a traditional Egyptian spice shop (عطارة) and sorts spices into vessels. "عم حسن" (English: Uncle Hassan) is the old master who teaches the trade.
- Platform: Android phones, portrait only, one-handed. Google Play. Keep code portable for a later iOS version.
- Offline play; network only for ads, purchases, analytics, and cloud save.
- Languages: Arabic (default, RTL, Egyptian dialect) and English (LTR).
- Audience: 13+. Not designed for children (do not opt into Google Play Families).
- Business model: free to play, hybrid monetization: opt-in rewarded ads, limited interstitials, and in-app purchases (remove ads, hints pack, starter pack).
- Target markets: Egypt, Gulf countries, and global English speakers.

## 2. Core rules
- Each vessel holds 4 layers. Each spice appears exactly 4 times in a level.
- Tap a vessel to lift it, tap another to pour. Tap the lifted vessel again to cancel.
- A pour is legal only if the target is empty or its top layer is the same spice, and the target has space. A pour moves all contiguous top layers of that spice that fit.
- A vessel full of one spice is complete: it closes and cannot be selected.
- The level is won when every vessel is either empty or complete.

## 3. Spices
Ten spices. Each layer is drawn as a pile of individual pieces (see section 6). Artwork: Appendix A (placeholder vector art, 20x20 viewBox, swappable through a texture atlas).

| id | Arabic | English | piece form | pieces per layer | piece scale | max rotation (deg, +/-) | band tint | material | main color |
|---|---|---|---|---|---|---|---|---|---|
| 0 | كركم | Turmeric | knobby root fingers | 3 | 1.05 | 35 | rgba(227,162,26,.30) | hard | #e3a21a |
| 1 | شطة | Dried chili | curved red pods with green stems | 3 | 1.15 | 25 | rgba(193,18,31,.28) | soft | #c1121f |
| 2 | كمون | Cumin | ridged brown seeds | 8 | 0.62 | 90 | rgba(139,90,43,.35) | hard | #8b5a2b |
| 3 | نعناع | Dried mint | veined green leaves | 4 | 0.90 | 90 | rgba(58,125,52,.30) | soft | #3a7d34 |
| 4 | فلفل أسود | Black pepper | wrinkled black corns | 7 | 0.55 | 180 | rgba(10,8,6,.45) | hard | #2a2522 |
| 5 | حبهان | Cardamom | pale green ridged pods | 5 | 0.78 | 70 | rgba(169,196,107,.28) | hard | #a9c46b |
| 6 | كركديه | Hibiscus | dried star-shaped calyx | 3 | 0.95 | 180 | rgba(138,15,60,.32) | soft | #8a0f3c |
| 7 | ملح | Salt | cube crystals | 5 | 0.62 | 25 | rgba(230,225,215,.16) | hard | #e9e5dc |
| 8 | نيلة | Indigo | blue lumps | 4 | 0.72 | 180 | rgba(44,79,184,.32) | hard | #2c4fb8 |
| 9 | ورد | Dried rose | pink buds with green sepals | 4 | 0.82 | 40 | rgba(214,90,138,.28) | soft | #d65a8a |

Shapes, not only colors, identify spices; this is the main color-blind accessibility feature.

## 4. Screen layout and visual style
Portrait. Content max width 520dp, centered, side padding 14dp. Top to bottom:
1. Seasonal garland strip (only when a seasonal theme is active; section 21).
2. Header. Start side: level info, two lines: "Level N" plus a badge (hard or rest), then "Moves M · 3-star target P" (the target appears from level 2). During the daily challenge: "Today's challenge" plus a streak badge. End side: coin pill (coin icon + count), daily button (calendar icon, red dot when a reward or challenge is available), shop button, settings button (gear).
3. Sign row: hanging decoration slot A (brass lantern), the wooden shop sign, hanging decoration slot B (chili string). The sign hangs from two short chains. Line 1: shop label (section 16). Line 2: seasonal greeting (if any) + " · " + world name, or "Today's challenge" during the daily. Tapping the sign opens rename.
4. عم حسن row: round avatar (44dp) and a cream speech bubble (#f3e6cf background, #3a2412 text) with a tail pointing to the avatar. Every new line pops in (scale 0.97 to 1, 250 ms).
5. Customer order card (only when the level has an order; section 13).
6. Board: vessels on wooden shelves. Behind the board, a mashrabiya lattice tile (Appendix A) at 8% opacity.
7. Counter strip: a wooden counter edge with purchased decorations standing on it. Until the first purchase, show a small hint text.
8. Toast line (light brass text, fades out after 1.9 s).
9. Toolbar, four equal buttons: Undo (badge: remaining free undos, or "Ad"), Hint (badge: free + inventory hints, or "Ad"), Extra jar (badge "Ad"; disabled after use), Restart.

Palette: background #1a130f with a radial glow #553823 at the top center; panels #33251c; brass #d4a24c; light brass #f0c674; text #f7ecd9; muted #c9b79c; hairlines rgba(212,162,76,.35). Hard badge: bg #5a1f1a, text #ffb4a8. Rest badge: bg #1f4a2a, text #b6f0c2.
Popups: centered card, max width 370dp, dark wood gradient (#3d2c20 to #281c14), brass border, 22dp corners. Primary button: brass gradient with dark text (#2a1a0c). Secondary: outlined. Popups scroll if taller than 88% of the screen.
Font: bundle Cairo or Noto Sans Arabic locally, with its license file.

## 5. Vessels and worlds
- World index = floor((level - 1) / 20) mod 3. Chapter = floor((level - 1) / 20) + 1. Sign line 2: "World {chapter}: {world name}".
- World 0 "رف البرطمانات" (Jar Shelf): glass jars, translucent glass with a vertical shine stripe, rounded bottom, grey metal lid. Lid turns brass and glows when complete.
- World 1 "مخزن الشكاير" (Sack Storeroom): burlap sacks with a woven crosshatch texture and a thick rolled rim instead of a lid. When complete, the rim becomes a tied rope.
- World 2 "ركن النحاس" (Brass Corner): brass canisters with a warm sheen and a dome lid; the lid brightens when complete.
- Each row of vessels stands on a wooden plank with a soft shadow.
- Sizing: rows = 1 if vessels <= 5; rows = 3 if vessels > 10 and screen width < 440dp; otherwise 2. perRow = ceil(vessels / rows). Vessel width = clamp(34, floor((min(screenWidth, 520) - 40 - (perRow - 1) x 10) / perRow), 60), max 52 with 3 rows. Vessel height = width x 2.55 (x 2.3 with 3 rows). Layer height = floor((height - 16) / 4). Gap between vessels 10dp, between rows 30dp.
- A complete vessel shows the spice name under it in light brass.

## 6. Pile rendering
- Each layer is a band tinted with the spice's band tint, plus a pile of pieces.
- Piece layout per layer (deterministic): r = mulberry32(layerId x 97 + levelSeed x 131 + 5). For i from 0 to count - 1, draw in this order:
  - x% = (i + 0.5) / count x 100 + (r() - 0.5) x 10
  - y% = if count >= 6: (i odd ? 30 : 70) + (r() - 0.5) x 14; else 50 + (r() - 0.5) x 26
  - rotation = (r() - 0.5) x 2 x maxRotation
  - size = layerHeight x pieceScale x (0.88 + r() x 0.24)
- Pieces are centered on (x%, y%) of the band, may overlap, and are clipped by the vessel walls. Upper layers draw over lower ones.
- A pile keeps its exact look when it moves, because the layout depends only on the layer ID and level seed.
- Hidden layers: dark band (#3b2f27 with faint diagonal stripes) showing a light brass "؟" and no pieces.

## 7. Interaction and feedback
- Tap a vessel: it lifts 18dp (selected). Tap it again to cancel.
- Tap an empty vessel with nothing selected: shake. Tap a complete vessel: shake and toast "toast.closed".
- With a vessel selected, tap a target: if legal, pour (section 8). If illegal: the target shakes (6dp, 350 ms), error sound, 30 ms vibration, toast ("toast.full" if full, otherwise "toast.mismatch"), and the selection clears. Every third illegal tap in a level, عم حسن says "hassan.invalid".
- Hint highlight: the source is lifted with a pulsing glow, the target pulses. It clears on the next tap, except the guided first move of level 1, which stays until the first pour.
- When a pour completes a vessel: lid effect, glow pulse (600 ms), "complete" sound, and with 60% probability a praise line (skip if an order line was just said).
- A useful move is a legal pour where the source is not complete and not (the target is empty and the source holds only one spice). If no useful move exists after a pour: عم حسن says "hassan.stuck" and the stuck popup opens after 500 ms.

## 8. Pour animation
- The source vessel tilts toward the target (24 degrees, translated 8dp sideways and 24dp up) for 200 ms before pieces leave.
- Every piece of every moving layer flies as its own sprite. Keyframes (as offsets of the flight):
  - 0.00: its current position in the tilted source; rotation = layout rotation + tilt
  - 0.22: source mouth (center x plus jitter, 8dp above the source top); rotation + 30% of spin
  - 0.55: apex (midpoint x of the two mouths plus jitter, 40dp above the higher vessel top); rotation + 65% of spin
  - 0.84: target mouth (center x plus 40% of jitter, 6dp above the target top); final rotation + 15% of spin
  - 1.00: its final pile position in the target; final layout rotation
- Spin: random direction, 140 to 280 degrees. Horizontal jitter: +/- 8dp per piece. Easing: ease-in-out. Flight duration 520 ms. Stagger min(40 ms, 420 ms / pieceCount), top layer first.
- Target pieces stay invisible until their own flyer lands, then bounce (scale 1.3 to 0.92 to 1 over 240 ms) with a landing sound for the material.
- Tap to skip: a tap during a pour finishes every flight instantly, then the tap is handled normally.
- "Piece motion" setting off (or OS reduced motion on first launch): no flights; the new layers drop in from 70dp above over 300 ms, 45 ms apart.
- Undo and restart are instant.
- Performance: build piece textures once at boot for the device pixel ratio, pool flying sprites, and hold 60 fps during the largest pour (3 cumin layers = 24 pieces) on a mid-range phone.

## 9. Audio and haptics
- Sound effects: select (short soft blip), pour start (short airy rustle), landing hard (crisp click, randomized pitch), landing soft (softer muffled tap), invalid (low buzz), complete (two rising notes), win (four-note arpeggio), coin (two bright notes), cat meow. Landing sounds at most one per 22 ms.
- Use small sound files with licenses that allow commercial use (list them in CREDITS.md) or synthesize them in code.
- Music: calm oud-style loop with a commercial license (placeholder allowed only in debug builds). Low default volume. Separate music and sound toggles. Pause while the app is in the background and while ads play.
- Haptics (toggle in settings): pour 15 ms, invalid 30 ms, win 40 ms.

## 10. Level generation (deterministic)
All randomness uses mulberry32. Seeds are plain JS numbers; the generator applies ToInt32 (`|0`) itself.

```ts
export function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: T[], r: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [arr[i], arr[k]] = [arr[k], arr[i]]; }
  return arr;
}
```

Deal(n, r): shuffle the spice ids [0..9] with r and take the first n; pool = each chosen id 4 times; shuffle the pool with the same r; split into n vessels of 4 (index 0 = bottom). Then append 2 empty vessels.

Solver (reference implementation; port it, and make it iterative if recursion depth becomes a problem):

```ts
type State = number[][]; // spice ids, bottom to top
const CAP = 4;
const topRun = (v: number[]) => { const c = v[v.length - 1]; let k = 0; for (let i = v.length - 1; i >= 0 && v[i] === c; i--) k++; return { c, k }; };
const isComplete = (v: number[]) => v.length === CAP && v.every(x => x === v[0]);
const isWon = (s: State) => s.every(v => v.length === 0 || isComplete(v));
export function canPour(s: State, a: number, b: number) {
  if (a === b) return false; const A = s[a], B = s[b];
  if (!A.length || B.length >= CAP) return false;
  return !B.length || B[B.length - 1] === A[A.length - 1];
}
export function pour(s: State, a: number, b: number) {
  const { k } = topRun(s[a]); const m = Math.min(k, CAP - s[b].length);
  const n = s.map(v => v.slice()); for (let i = 0; i < m; i++) n[b].push(n[a].pop()!);
  return { state: n, moved: m };
}
const key = (s: State) => s.map(v => v.join(',')).sort().join('|');
export function solve(start: State, limit: number, guard?: (s: State) => boolean) {
  const seen = new Set<string>(); const path: [number, number][] = []; let nodes = 0, aborted = false;
  const dfs = (s: State): boolean => {
    if (isWon(s)) return true;
    if (++nodes > limit) { aborted = true; return false; }
    const k = key(s); if (seen.has(k)) return false; seen.add(k);
    const firstEmpty = s.findIndex(v => v.length === 0);
    const moves: [number, number, number][] = [];
    for (let a = 0; a < s.length; a++) {
      const A = s[a]; if (!A.length || isComplete(A)) continue;
      const t = topRun(A), uniform = t.k === A.length;
      for (let b = 0; b < s.length; b++) {
        if (a === b) continue; const B = s[b]; if (B.length >= CAP) continue;
        if (!B.length) { if (uniform || b !== firstEmpty) continue; moves.push([1, a, b]); continue; }
        if (B[B.length - 1] !== t.c) continue;
        const m = Math.min(t.k, CAP - B.length);
        let score = 3 + (m === t.k ? 2 : 0);
        if (B.length + m === CAP && B.every(x => x === t.c)) score += 3;
        moves.push([score, a, b]);
      }
    }
    moves.sort((x, y) => y[0] - x[0]);
    for (const [, a, b] of moves) {
      const ns = pour(s, a, b).state;
      if (guard && !guard(ns)) continue;
      path.push([a, b]);
      if (dfs(ns)) return true;
      if (aborted) return false;
      path.pop();
    }
    return false;
  };
  const ok = dfs(start);
  return { path: ok ? path.slice() : null, nodes, unsolvable: !ok && !aborted };
}
```

Generating level L (seed = L for normal levels):
1. type and spice count n from section 11. Candidate target K: hard 9, normal 5, tutorial and rest 3.
2. For attempt = 0, 1, 2 ... while attempt < K x 5 and candidates < K and total solver nodes < 220,000:
   - vessels = Deal(n, mulberry32(seed x 7919 + attempt x 104729 + 13))
   - reject if any vessel is already complete
   - count adjacent identical layers inside vessels; reject if the count > max(1, floor(n / 2))
   - Deal already appended 2 empty vessels; do not append them again. Run solve(vessels, 15000); if solved, keep {vessels, path, score = nodes + 3 x path length}
3. Fallback if no candidate: up to 20 deals with mulberry32(seed x 131 + attempt) and 3 empty vessels, solve limit 60,000.
4. Sort candidates by score ascending. Pick: hard = hardest; normal = index floor((count - 1) x 0.7); tutorial and rest = easiest.
5. Layer IDs: number layers sequentially across vessels in order, bottom to top. Keep a lookup layerId -> spice.
6. Hidden layers: section 12. Orders: section 13.
7. Par (the 3-star target shown to the player): at precompute time run a time-boxed shortest-path search (BFS or IDA*). If an optimal solution of length S is found, par = S + ceil(0.15 x S). Otherwise par = the DFS path length. At runtime (levels beyond 1000) use the DFS path length.

Precompute levels 1 to 1000 at build time (`npm run levels`) into `src/content/levels.json`:
`{ "v": 1, "levels": [ { "l": 1, "t": "tut", "n": 2, "vs": [[3,1,1,3],[1,3,3,1],[],[]], "hid": [layer ids], "par": 6, "ord": [a,b] or null, "w": 0 } ] }`
Beyond 1000, generate at runtime with the same algorithm. Print stats per level type (par distribution, generation time, share of levels with orders).

## 11. Level types and difficulty
- Types: levels 1 and 2 are "tutorial". Every level divisible by 5 is "hard" (red badge "صعبة", double coins). The level right after a hard level (from level 6 on) is "rest" (green badge "راحة"). All others are "normal".
- Spices: level 1 = 2, level 2 = 3, then min(10, 4 + floor((level - 3) / 3)). Hard: +1 (max 10). Rest: -1 (min 3). Normally 2 empty vessels; the generation fallback uses 3 (user-approved clarification, 2026-09-28).
- Why: playtesting showed the early game felt too easy, so the ramp starts at 4 spices on level 3 and normal levels pick the 70th percentile of difficulty. Keep these numbers in config for tuning.

## 12. Hidden layers
- From level 12, never on rest levels. Fraction of vessels affected: 40% at level 12, +3% per level, max 90%; 100% on hard levels.
- Selection: r = mulberry32(seed x 31 + 7); for each vessel in order, only if it has more than 1 layer, draw r(); if r() < fraction, hide every layer except the top.
- A layer is revealed when it becomes the top of its vessel or when it moves. Same-spice layers under the top still pour together (physical rule) and are revealed by moving.
- Revealed layers stay revealed after undo. Restart hides them again.
- The first hidden level (12) gets the intro line "hassan.hidden12".

## 13. Customer orders ("طلبات الزباين")
- From level 7, on normal and hard levels only. A customer wants 2 spices from the level completed before any other spice is completed.
- Choice: take the distinct spices in first-appearance order (vessels in order, bottom to top), shuffle with mulberry32(seed x 53 + 11), try pairs (0,1), (2,3), (4,5). For each pair, run solve(vessels, 15000, guard) where guard rejects any state in which a non-order spice is complete while not all order spices are complete. The first feasible pair becomes the order; otherwise the level has no order. Store it in levels.json.
- Reward: 20 coins per ordered spice, doubled on hard levels, granted immediately when the order is fulfilled.
- Status is recomputed from the current state after each move: delivered (sticky once granted), missed (a non-order spice completed first), or waiting. Undo can bring a missed order back to waiting. No penalty for missing.
- Card UI: customer avatar (Appendix A), title "order.title", the two spice icons with names and a check mark once complete, subtitle "order.sub", and a status chip: waiting (brass), delivered (green), missed (red).
- Lines: "hassan.order" at level start, "hassan.orderDone" and "hassan.orderMissed" on change.

## 14. Stars, coins, hints
- Stars: 3 if moves <= par; 2 if moves <= par + ceil(0.35 x par); else 1. Undo does not reduce the move count; restart resets it. Save best stars per level.
- Coins per win: 10 + 5 x stars, doubled on hard levels. From level 4 the win popup offers "double coins" via a rewarded ad.
- Hint inventory: a persistent count used after the per-level free hint and before offering a rewarded ad.
- Balance: coins, hints, owned items, stars, and levels are saved locally and in the cloud snapshot.

## 15. Helpers
- Undo: 5 free per level, then +5 via a rewarded ad. Restores the previous state instantly (hidden layers stay revealed).
- Hint: 1 free per level, then inventory, then a rewarded ad. Runs the solver from the current state (limit 60,000) and highlights the first move. If proven unsolvable: toast "toast.hintUnsolvable" (do not consume the hint). If the search times out: toast "toast.hintNotFound" (do not consume).
- Extra empty vessel: once per level via a rewarded ad; also appended to the undo history and to the restart state.
- Restart: back to the level's initial state (keeps an extra vessel if added), moves reset, hidden layers hidden again, order reset.
- Stuck popup (section 22).

## 16. Shop name
- The player names the shop. Default name "عم حسن" (English "Uncle Hassan").
- Arabic label: "عطارة {name}". English label: "{name} Spice Shop".
- Naming popup timing: config flag `nameAskTiming`: "first_launch" (default: shown before level 1 starts, with the board visible behind it) or "after_level_1" (shown right after the first win). Shown automatically only once.
- Popup: عم حسن's intro text ("name.body.first"), a fixed prefix label "عطارة" next to a text field (the player types only the rest), six suggestion chips (البركة، الخير، الهنا، الأمانة، أبو الدهب، الشرق) that fill the field, a live sign preview, "name.save.first" and "name.skip" buttons, and a note that renaming is possible any time.
- Skip keeps the default name and marks the popup as answered.
- Cleaning: trim, collapse spaces, strip a leading "عطارة" or "عطاره" (so it never shows twice).
- Validation: 2 to 18 characters; Arabic or Latin letters, digits, and spaces only (reject symbols and emoji). Inline errors: "name.err.short", "name.err.long", "name.err.chars".
- Rename: tap the sign any time, or Settings > Shop name. Same popup in rename mode ("name.save.rename", "name.cancel"). After a rename, عم حسن says "hassan.renamed".
- The sign shrinks its font for long names (16 to 14 to 13dp) and never overflows.
- Text fields use at least 16px font so mobile browsers do not zoom; the keyboard must not hide the confirm button. Enter confirms.
- The name is local only and never shown to other players in v1. If names ever become visible to others, add a profanity filter and reporting first.
- Where the name appears: the sign, welcome line, one win line, the purchase line, the shop title, the day-7 reward line, reminders.

## 17. First-time experience and unlocks
- The app opens straight into level 1 (no title screen on first launch). With the default timing, the naming popup appears first: one tap on a suggestion plus one confirm, or one tap to skip.
- After naming: "hassan.welcomeNamed" or "hassan.welcomeSkipped", followed by "hassan.tut1".
- Level 1 has no toolbar and the first move is highlighted (source lifted, target glowing) until the first pour.
- Unlock schedule by highest level reached: 2 = undo and restart; 3 = hint, extra vessel, coin pill; 4 = shop button, counter decorations, double-coins button; 5 = daily button (reward and challenge). Each unlock is announced once by عم حسن ("hassan.unlock2" to "hassan.unlock5") on the first visit of that level.
- The daily hub opens automatically once per day on the first level start when the reward is unclaimed, never on top of another popup.

## 18. Character: عم حسن
- Original character; must not resemble any existing IP. Look: round warm face, white skullcap (طاقية), thick dark mustache, small smile, brown galabeya shoulders (Appendix A).
- Level start line priority: daily challenge line; level 1 welcome + tutorial; unlock line (first visit to levels 2 to 5); level 12 hidden intro; new world intro (levels 21, 41, 61, ...); order line; hard line; rest line; random normal line.
- Other lines: praise on vessel complete, win lines, 3-star line, stuck, invalid, order delivered or missed, purchase, cat tap, daily reward, day 7, streak, starter thanks, theme change, rename. All in Appendix B.

## 19. Shop and decorations ("كبّر المحل")
| id | Arabic | English | price | placement |
|---|---|---|---|---|
| chili | عقد شطة معلّق | Chili string | 40 | hanging slot B |
| plant | زرعة نعناع | Mint plant | 70 | counter |
| lantern | فانوس نحاس | Brass lantern | 110 | hanging slot A |
| scale | ميزان نحاس | Brass scale | 160 | counter |
| radio | راديو قديم | Old radio | 220 | counter |
| sign | لافتة نحاس | Brass sign | 300 | replaces the wooden sign (brass gradient, dark text) |
| cat | قطة المحل | Shop cat | 400 | counter; tap = meow + "hassan.cat" |
| tray | صينية شاي | Tea tray | not sold | counter; only from the day-7 daily reward |

- Counter order: plant, scale, tray, radio, cat, then colored eggs during Sham El-Nessim.
- Items appear in the scene the moment they are bought. Prices live in config.
- Shop screen: title "shop.title", coin balance, starter pack card when active (section 24), decoration list (icon, name, price or "owned", buy button or "need X"), hints pack, remove-ads button, back button.

## 20. Daily systems (unlock at level 5)
- Daily reward calendar (7 days): 20 coins, 1 hint, 40 coins, 2 hints, 60 coins, 3 hints, then 100 coins + tea tray (coins only if the tray is already owned). Claiming on consecutive days advances; missing a day restarts at day 1. Claimed days show a check and fade; today is highlighted.
- Daily challenge: one level per local calendar date. seed = yyyymmdd as an integer; r = mulberry32(seed); n = 7 + floor(r() x 3); hidden fraction = (r() < 0.5 ? 0.6 : 0); generated as a "normal" type (70th percentile); no orders; world = weekday (0 = Sunday) mod 3. Everyone gets the same puzzle on the same date.
- Reward: 50 + 10 x min(streak, 7) coins. Streak increases when completed on consecutive days, otherwise resets to 1. Keep the best streak. The current streak displays 0 if the last completion was before yesterday.
- Starting the daily from the middle of a normal level restarts that normal level afterwards (warn in the hub).
- Daily hub popup: reward grid (7 cells), claim button or claimed note, challenge section with streak and best, play button or "done" state, back button.
- Clock anti-cheat: store the last seen timestamp; if the device clock moves backwards, grant no daily reward or streak progress until the clock passes the stored time again.

## 21. Seasonal themes
| theme | background | top glow | garland | sign greeting | extra |
|---|---|---|---|---|---|
| normal | #1a130f | #553823 | none | none | |
| ramadan | #130f22 | #3d2e66 | small lanterns (gold, red, green) | رمضان كريم | |
| eid | #0f1a1b | #1f5550 | triangle bunting (red, gold, blue, green) | عيد سعيد | |
| sham el-nessim | #111a10 | #3b5f2a | pink flowers with green leaves | شم نسيم سعيد | colored eggs on the counter |
- Garland drawing: a rope made of 6 quadratic segments across the width (viewBox 360x30: each segment 60 wide, from y 3 through control y 15 back to y 3). Ramadan: one lantern hanging at the middle of each segment. Eid: flags at 20%, 50%, 80% of each segment. Sham El-Nessim: leaf, flower, leaf at 25%, 50%, 75%.
- Theme selection: automatic from a date table in config.ts (Ramadan, Eid al-Fitr, Eid al-Adha, Sham El-Nessim change every year; ask me for the dates and leave clearly marked placeholders until then). Settings override: Automatic (default), Normal, Ramadan, Eid, Sham El-Nessim.
- On theme change, عم حسن says the theme line.

## 22. Popups and flows
- Win (normal level), 550 ms after the last pour: win sound, spice pieces rain from the top (36 random pieces, 1.4 to 2.4 s falls), 40 ms vibration. Popup: title, stars (filled and empty), body text with moves and target, coins earned (with hard-level note), "double coins (ad)" from level 4, "next level".
- Next level flow: after completing level 10, show the starter pack offer once (if eligible); then the interstitial rule (section 24); then the next level.
- Win (daily challenge): popup with stars, moves, streak and best streak, coins; "back to levels".
- Stuck popup: body text; buttons Undo, Extra jar (ad) if unused, Restart.
- Rewarded ad flow: a short confirmation card naming the reward ("watch an ad for: {reward}") then the AdMob rewarded ad. Reward only on the SDK's reward callback. Cancel returns to where the player was (for double coins: back to the win popup).
- All popup texts: Appendix B.

## 23. Settings, navigation, debug tools
- Settings: shop name (change), sound effects, music, haptics, piece motion, daily reminder, language (Arabic / English), seasonal theme (Automatic, Normal, Ramadan, Eid, Sham El-Nessim), privacy options (UMP consent form), restore purchases, Google Play Games status, app version.
- Back gesture: closes the top popup; on the first-launch naming popup it acts as "skip"; with no popup it asks to exit.
- Debug builds only (never in release): +200 coins, advance one day, jump to level (1 to 1000), reset all progress (to replay the first minute), analytics event log (last 20 events).

## 24. Monetization
- Rewarded ads, only when the player taps a button that clearly says it shows an ad: +5 undos, a hint, an extra vessel, double coins. Never auto-play.
- Interstitials: only after completing a normal level; first after level 6, then only when the completed level is a multiple of 3, and at least 90 seconds apart. Skip if the player just watched a rewarded ad in that win popup. Never on app open, never during a level, never after the daily challenge. None if remove_ads is owned.
- No banner ads in v1.
- Products (Google Play Billing through RevenueCat):
  - remove_ads (non-consumable): removes interstitials; rewarded ads stay available as optional help.
  - hints_10 (consumable): +10 hints.
  - starter_pack (non-consumable): grants the remove_ads entitlement plus 10 hints and 200 coins exactly once. Offered once after completing level 10 if the player does not own remove_ads, then available in the shop for a real 48-hour window. Never fake or reset the timer. Grant the one-time contents exactly once, even after restore or cloud sync.
  - Ask me for prices before creating products in Play Console.
- No gambling mechanics, no loot boxes, no paid random rewards, no coin packs in v1, no fake close buttons, no misleading ad placements.
- AdMob: Google test IDs until I say "release build"; UMP consent before loading ads; music pauses during ads.

## 25. Rating prompt
- Official Google Play In-App Review API only.
- Request after a 3-star win from level 15 onward; never after a stuck popup, a missed order, or an ad; at most once every 30 days by our own counter.
- Never ask any question (like "Do you like the game?") before or while showing the review flow. Google may choose not to show the dialog; the game must continue normally either way.

## 26. Cloud save, achievements, reminders
- Google Play Games Services v2: automatic sign-in where available, never blocking play.
- Saved Games snapshot of the whole save (levels, stars, coins, hints, owned items, shop name, daily data, purchases cache, settings). Conflict rule: keep the snapshot with the higher highest-level-reached, then higher total stars (its shop name wins too); union owned decorations; never add coins from both sides.
- Achievements: first 3-star level; 50 levels; 100 levels; 7-day challenge streak; 20 orders delivered; all shop decorations owned.
- Daily reminder (local notifications, optional): ask for the notification permission (Android 13+) only after the player completes 2 daily challenges, with an in-game explanation card first ("reminder.ask.*"); if declined, never ask again automatically (settings toggle remains). At most one reminder per day at the player's usual play hour (median start hour of recent sessions, default 19:00), in عم حسن's voice ("reminder.*"). Stop after 3 consecutive ignored reminders until the player opens the app. Cancel today's reminder once the player has played today.

## 27. Tech stack (do not change without asking)
- Vite + TypeScript (strict). Vitest for unit tests. ESLint.
- Phaser (latest stable) for the board, piece sprites, animations, and audio. HTML/CSS overlay for header, sign, speech bubble, order card, toolbar, and popups (best Arabic text rendering).
- Capacitor (latest stable) for Android. compileSdk 36 and targetSdk 36 (Google Play requires new apps and updates to target Android 16). Release output: signed Android App Bundle (AAB).
- Ads: @capacitor-community/admob with the UMP consent flow.
- Purchases: RevenueCat (@revenuecat/purchases-capacitor) over Google Play Billing.
- Analytics: Firebase Analytics through a maintained Capacitor plugin (propose options, confirm with me). Respect UMP consent.
- @capacitor/preferences (save), @capacitor/haptics, @capacitor/local-notifications.
- Google Play Games Services v2 (sign-in, Saved Games, achievements) and the Play In-App Review API: find maintained Capacitor plugins or propose thin native plugins; ask me before choosing.
- A UI icon set with an MIT license (for example Lucide or Tabler) for undo, hint, extra jar, restart, calendar, shop, gear, sound.

## 28. Architecture
- src/core/: pure TypeScript, no Phaser, no DOM: rng, rules, solver and constrained solver, generator, difficulty scoring, hidden layers, orders, stars, pile layouts, daily seed, shop name cleaner and validator. Fully unit tested.
- src/meta/: economy, hint inventory, shop, shop name state, daily reward, daily challenge and streak, starter pack window, unlock schedule, themes and date table, achievements mapping, save model and migrations.
- src/content/: levels.json, spice data, strings with placeholders.
- tools/: Node scripts for precompute and stats.
- src/game/: Phaser scenes (Boot builds the texture atlas from assets/svg; Game), vessel styles, pile rendering, flight animation with pooling and tap to skip, decorations.
- src/ui/: header, sign, speech bubble, order card, toolbar, popups (naming, win, stuck, rewarded confirm, starter, daily hub, shop, settings). RTL aware.
- src/services/: interfaces AdsService, PurchaseService, StorageService, CloudSaveService, AchievementsService, ReviewService, NotificationService, AnalyticsService, HapticsService, AudioService. Each has a Web mock (browser, logs to console) and a Native implementation (Android), selected at startup.
- src/i18n/: ar.json (default) and en.json, keys from Appendix B. RTL for Arabic, LTR for English.
- src/config.ts: all numbers from Appendix C, ad unit IDs (test by default), product IDs, nameAskTiming, theme date table, debug flags.

## 29. Analytics events
Never send the shop name text or personal data.
- app_open (level, returning)
- shop_named (skipped, len, suggested); shop_renamed (len, suggested)
- level_start (level, type, order); level_complete (level, moves, par, stars, hints, undos, order: none, done, missed); level_restart (level, mode)
- stuck_shown (level, mode)
- hint_used (src: free, inventory, ad)
- rewarded_offer and rewarded_complete (placement: undo, hint, extra_jar, double_coins)
- interstitial_shown (level)
- shop_purchase (item, price); iap_purchase (sku); theme_change (theme)
- order_complete (level, reward); order_fail (level)
- daily_reward_claim (day); daily_challenge_start (date); daily_challenge_complete (streak, moves, stars)
- starter_offer_shown; review_requested; reminder_permission (granted or denied); reminder_opened

## 30. Phases (one Codex task each; stop after each)
1. Setup and core: project scaffold, scripts, src/core with tests (pour rules, win detection, solver, same seed = same level, level types and counts, hidden reveal rules, order feasibility, daily seed per date, pile layout determinism, name cleaner and validator, levels 1 to 100 solvable).
2. Precompute: tools script for levels 1 to 1000 with par, hidden layers, orders; stats report; loader test.
3. Playable in the browser: board with simple drop animation, selection, legal and illegal pours, undo, restart, hint and inventory, stuck popup, win popup with stars, HUD, sign with shop name, naming popup (first launch and rename), level 1 guided move, unlock schedule, analytics web mock. I must be able to play on my phone through the dev server's network URL.
4. Pour animation: tilt, per-piece flights, landing bounce, material sounds, tap to skip, piece motion setting, pooling. Report fps during a 24-piece pour.
5. Setting and meta: worlds and vessel styles, mashrabiya, counter and decorations, عم حسن lines, coins, shop, cat, order card and rewards, seasonal themes and date table, settings, save/load and migrations, full i18n with RTL.
6. Daily systems: reward calendar and tea tray, daily challenge and streak, daily hub, clock anti-cheat, placeholder music with separate toggles.
7. Monetization with Web mocks first (fake rewarded and interstitial ads, fake purchases, starter pack window), then real AdMob on Android with test IDs and the UMP consent form.
8. Android build and platform services: guide me through Android Studio setup, add Capacitor Android, portrait lock, edge-to-edge and safe areas (apps targeting Android 16 can no longer opt out), back gesture, keyboard handling for the name field, app icon and splash placeholders, versionCode and versionName, create and BACK UP the upload key, Firebase Analytics (verify in DebugView), Play Games sign-in, Saved Games, achievements, In-App Review, local notification reminders with the permission flow. Build the release AAB with debug tools removed.
9. Purchases: RevenueCat with remove_ads, hints_10, starter_pack, restore, one-time grant protection, testing with Play Console license testers.
10. Store readiness: privacy policy draft (AdMob, RevenueCat, Firebase Analytics, Play Games, notifications), Data safety answers, content rating answers, ads declaration, Arabic and English store listing (title, short and full description), screenshot plan (a pour mid-flight, a player-named sign, the shop growing, a customer order, a seasonal theme), final licensed music in CREDITS.md, and a closed-testing checklist with the analytics funnel to watch (level 1 to 10 completion, naming popup skip rate and drop-off; if drop-off is noticeable, switch nameAskTiming to "after_level_1").

## 31. Google Play launch checklist (the human does these; guide me)
- Personal developer account: one-time 25 USD fee and identity verification with my real name matching my ID.
- New personal accounts must run a closed test with at least 12 testers opted in for 14 continuous days before applying for production access; testers should actually play during those days (recruit 15 to be safe).
- Target API level 36 (Android 16) for new apps and updates.
- App content: privacy policy URL, Data safety form, ads declaration ("contains ads"), content rating questionnaire, target audience 13+, app access notes.
- Store listing in Arabic and English: 512x512 icon, 1024x500 feature graphic, phone screenshots.
- Payments profile for in-app purchases (Egypt supports merchant registration; payouts in USD or EUR to a bank account in the same country as the profile).
- AdMob: link the app, set up payments (monthly wire transfer after the threshold, address verification). Never click my own ads.
- Create IAP products in Play Console with the product IDs from config.

## 32. Definition of done for v1
- No crashes during 30 minutes of play on a real mid-range phone.
- Levels 1 to 1000 precomputed, solvable, with feasible orders, and load instantly (under 150 ms); tap response under 100 ms.
- Difficulty follows the sawtooth in the generation stats.
- Pours hold 60 fps; tap to skip always works.
- First launch: naming popup exactly once (save and skip both work), then level 1 with the guided move; unlocks appear on schedule; rename works from the sign and settings.
- Daily reward, daily challenge, and streak behave correctly across days, missed days, and clock changes.
- Ads, purchases, and the starter pack behave exactly as section 24 says.
- Analytics events arrive in Firebase DebugView with correct params and no shop name text.
- Cloud save restores everything on a second device; achievements unlock.
- Reminder permission is requested only at the defined moment; reminders follow the limits.
- Rating prompt follows Google's guidelines exactly.
- Arabic and English render correctly, including long shop names.
- Release AAB targets API 36 and contains no debug tools.

---

## Appendix A: placeholder SVG art
Save each block as its own file in assets/svg/ with the given name.

spice_0_turmeric.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.5 11.2c0-2 2-3.2 4-2.7 1-1.7 3.3-1.9 4.7-.6 1.5-1.2 3.8-.5 4.5 1.1 1.5.5 1.6 2.8.1 3.3-1 1.6-3.2 1.4-4.2.6-1.5 1-3.5 1-4.7 0-2 .9-4.4.4-4.4-1.7z" fill="#e3a21a" stroke="#9a5f0c" stroke-width=".8"/><path d="M7.5 9.2c.4 1.3.4 3 0 4.2M11.6 8.6c.4 1.4.4 3.4 0 4.8" stroke="#b8740f" stroke-width=".8" fill="none"/><path d="M4.5 10.2c1-.8 2.4-.9 3.4-.4" stroke="#f7d27a" stroke-width=".8" fill="none"/></svg>

spice_1_chili.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M3.5 13.2c3.6 1.6 9.2.4 12.3-4.2.5-.8 1.7-.3 1.5.6-1.1 5.2-7.4 8.6-13.3 5.4-.9-.5-.7-2.2-.5-1.8z" fill="#c1121f" stroke="#6e0a12" stroke-width=".7"/><path d="M5.8 13.6c3.1.6 6.4-.4 8.8-3" stroke="#ff8a80" stroke-width=".8" fill="none" opacity=".7"/><path d="M16.4 9.3c.5-1 1.2-1.8 2-2.3" stroke="#5b6b2a" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>

spice_2_cumin.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="2.3" ry="6.5" fill="#8b5a2b" stroke="#4e2f12" stroke-width=".6"/><path d="M10 4v12M8.8 5.5c-.5 3-.5 6 0 9M11.2 5.5c.5 3 .5 6 0 9" stroke="#c49060" stroke-width=".5" fill="none"/></svg>

spice_3_mint.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 1.8c5.2 3 6.2 9.4 0 16.4C3.8 11.2 4.8 4.8 10 1.8z" fill="#3a7d34" stroke="#1f4d1c" stroke-width=".6"/><path d="M10 3.5v13.5M10 7l-2.6-1.8M10 7l2.6-1.8M10 10.5l-3-2M10 10.5l3-2M10 14l-2.4-1.8M10 14l2.4-1.8" stroke="#8fcf7f" stroke-width=".6" fill="none"/></svg>

spice_4_black_pepper.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#2a2522" stroke="#6b625b" stroke-width=".7"/><path d="M6.5 9c1.5-.8 2.5.8 4 0s2.5.8 3.5 0M7 12c1.5-.8 2.5.8 4 0s2.3.6 3 0" stroke="#4a423c" stroke-width=".7" fill="none"/><circle cx="8" cy="7.6" r="1.4" fill="#fff" opacity=".35"/></svg>

spice_5_cardamom.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 2.5c3.2 1.6 4.2 5 4 8.2-.3 3.6-2 6.3-4 6.8-2-.5-3.7-3.2-4-6.8-.2-3.2.8-6.6 4-8.2z" fill="#a9c46b" stroke="#5e7a2c" stroke-width=".7"/><path d="M10 3.5c-1.4 3.8-1.4 9 0 13.3M10 3.5c1.4 3.8 1.4 9 0 13.3" stroke="#7e9a45" stroke-width=".6" fill="none"/><path d="M10 2.5V1" stroke="#7e9a45" stroke-width="1" stroke-linecap="round"/><path d="M8 6c.5-1 1-1.6 1.6-2" stroke="#e2f0b8" stroke-width=".7" fill="none"/></svg>

spice_6_hibiscus.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 1.8l2.3 5.2 5.6.5-4.2 3.8 1.3 5.5L10 14l-5 2.8 1.3-5.5-4.2-3.8 5.6-.5z" fill="#8a0f3c" stroke="#4f0822" stroke-width=".7" stroke-linejoin="round"/><circle cx="10" cy="10" r="2" fill="#c2185b"/><path d="M10 3.8v5M14.5 8.2l-3 1.2M6 8.2l3 1.2" stroke="#b0245a" stroke-width=".6"/></svg>

spice_7_salt.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 3.5l6 3.3v6.6L10 16.7 4 13.4V6.8z" fill="#e9e5dc" stroke="#a8a193" stroke-width=".6"/><path d="M10 3.5l6 3.3L10 10.1 4 6.8z" fill="#ffffff"/><path d="M10 10.1l6-3.3v6.6L10 16.7z" fill="#cfc9bc"/></svg>

spice_8_indigo.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M4.5 8.5c.8-3.2 5-4.6 8.2-3.6 3.3 1 4.2 4.4 3 7.2-1.1 3-4.6 4.6-7.8 3.4C4.8 14.4 3.8 11.4 4.5 8.5z" fill="#2c4fb8" stroke="#162a66" stroke-width=".7"/><path d="M7 7.6c1.2-1.2 3-1.6 4.5-1.2" stroke="#8fa9ff" stroke-width=".9" fill="none" stroke-linecap="round"/><circle cx="12" cy="11.5" r="1" fill="#1d3a8f"/></svg>

spice_9_rose.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7 13.2l3 3.6 3-3.6z" fill="#4c7a3a"/><path d="M10 3.5c3.2 0 4.8 2.6 4.8 5.3 0 3.2-2.2 5.2-4.8 5.2S5.2 12 5.2 8.8C5.2 6.1 6.8 3.5 10 3.5z" fill="#d65a8a" stroke="#8e2a55" stroke-width=".7"/><path d="M7.2 8.4c1.6 1.6 4 1.6 5.6 0M8.4 5.6c1.2.9 2.4.9 3.4-.2" stroke="#f5a3c3" stroke-width=".7" fill="none"/></svg>

decor_lantern.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56"><path d="M20 0v10" stroke="#c9a15a" stroke-width="1.5"/><circle cx="20" cy="28" r="16" fill="#f6c453" opacity=".15"/><path d="M12 16l8-6 8 6z" fill="#d4a24c"/><rect x="12" y="16" width="16" height="20" rx="2" fill="#f6c453"/><path d="M17 16v20M23 16v20" stroke="#9a6a24" stroke-width="1.4"/><rect x="12" y="16" width="16" height="20" rx="2" fill="none" stroke="#b8862f" stroke-width="1.5"/><path d="M12 36h16l-4 6h-8z" fill="#d4a24c"/><circle cx="20" cy="45" r="1.8" fill="#d4a24c"/></svg>

decor_chili_string.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56"><path d="M20 0v52" stroke="#8a6a3a" stroke-width="1.4"/><ellipse cx="15" cy="13" rx="2.8" ry="6.5" transform="rotate(35 15 13)" fill="#d62828"/><ellipse cx="25" cy="21" rx="2.8" ry="6.5" transform="rotate(-35 25 21)" fill="#e0452f"/><ellipse cx="15" cy="29" rx="2.8" ry="6.5" transform="rotate(35 15 29)" fill="#d62828"/><ellipse cx="25" cy="37" rx="2.8" ry="6.5" transform="rotate(-35 25 37)" fill="#e0452f"/><ellipse cx="16" cy="45" rx="2.8" ry="6.5" transform="rotate(30 16 45)" fill="#d62828"/><circle cx="19" cy="8" r="1.4" fill="#3f9142"/><circle cx="21" cy="16" r="1.4" fill="#3f9142"/><circle cx="19" cy="24" r="1.4" fill="#3f9142"/><circle cx="21" cy="32" r="1.4" fill="#3f9142"/><circle cx="19" cy="40" r="1.4" fill="#3f9142"/></svg>

decor_scale.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="16" y="43" width="16" height="4" rx="1" fill="#b8862f"/><rect x="23" y="11" width="2" height="32" fill="#d4a24c"/><circle cx="24" cy="10" r="2.5" fill="#e0b25a"/><rect x="7" y="12" width="34" height="2" rx="1" fill="#d4a24c"/><path d="M9 14l-4 12M9 14l4 12M39 14l-4 12M39 14l4 12" stroke="#c9a15a" stroke-width="1"/><path d="M3 26h12a6 4 0 0 1-12 0z" fill="#e0b25a"/><path d="M33 26h12a6 4 0 0 1-12 0z" fill="#e0b25a"/></svg>

decor_mint_plant.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><ellipse cx="17" cy="18" rx="4" ry="9" transform="rotate(-30 17 18)" fill="#3f9142"/><ellipse cx="31" cy="18" rx="4" ry="9" transform="rotate(30 31 18)" fill="#4caf50"/><ellipse cx="24" cy="14" rx="4.5" ry="11" fill="#58b85c"/><path d="M14 31h20l-3 15H17z" fill="#c46a3a"/><rect x="12" y="28" width="24" height="5" rx="1.5" fill="#d9804d"/></svg>

decor_radio.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M30 18l8-13" stroke="#c9b79c" stroke-width="1.5"/><rect x="5" y="18" width="38" height="27" rx="6" fill="#7a4a2a"/><circle cx="16" cy="31.5" r="8" fill="#3a2414"/><path d="M10 28h12M9 31.5h14M10 35h12" stroke="#6b4a2e" stroke-width="1.2"/><rect x="28" y="23" width="11" height="6" rx="1" fill="#f0c674"/><path d="M31 23v6" stroke="#b8862f"/><circle cx="30" cy="37" r="2.6" fill="#d4a24c"/><circle cx="37" cy="37" r="2.6" fill="#d4a24c"/></svg>

decor_cat.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M37 38c7-1 9-10 4-13" stroke="#e0a45a" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="26" cy="39" rx="13" ry="7.5" fill="#e0a45a"/><path d="M22 33v6M27 32v7M32 33v6" stroke="#c07f36" stroke-width="2"/><circle cx="13" cy="33" r="7" fill="#e0a45a"/><path d="M7.5 29l.5-7 5 4zM14 26l5-4 .5 7z" fill="#e0a45a"/><path d="M10 33.5q1.2 1 2.4 0M14.5 33.5q1.2 1 2.4 0" stroke="#2a1a0c" stroke-width="1.1" fill="none"/><circle cx="13.7" cy="36" r=".9" fill="#c0504a"/></svg>

decor_brass_sign_icon.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M16 8v8M32 8v8" stroke="#9c8a72" stroke-width="1.5"/><rect x="6" y="16" width="36" height="18" rx="4" fill="#e0b25a" stroke="#b8862f" stroke-width="2"/><path d="M13 25h22" stroke="#6b4a1a" stroke-width="2.5" stroke-linecap="round"/></svg>

decor_tea_tray.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><ellipse cx="24" cy="41" rx="21" ry="5" fill="#b8862f"/><ellipse cx="24" cy="40" rx="19" ry="3.8" fill="#e0b25a"/><path d="M9 26h7l-1 13h-5z" fill="rgba(255,255,255,.3)" stroke="#e8e0d0" stroke-width=".8"/><path d="M10 30h5l-.7 9h-3.6z" fill="#b5541c"/><path d="M20.5 23h7l-1 16h-5z" fill="rgba(255,255,255,.3)" stroke="#e8e0d0" stroke-width=".8"/><path d="M21.5 27h5l-.8 12h-3.4z" fill="#b5541c"/><path d="M32 26h7l-1 13h-5z" fill="rgba(255,255,255,.3)" stroke="#e8e0d0" stroke-width=".8"/><path d="M33 30h5l-.7 9h-3.6z" fill="#b5541c"/></svg>

decor_eggs.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><ellipse cx="11" cy="37" rx="6" ry="8" fill="#f28bb3"/><ellipse cx="24" cy="35" rx="6" ry="9" fill="#f5c518"/><ellipse cx="37" cy="37" rx="6" ry="8" fill="#5fb3e0"/><path d="M7 35h8M20 33h8M33 35h8" stroke="#fff" stroke-width="1.5" opacity=".7"/></svg>

char_hassan.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="#3b2a1e"/><circle cx="22" cy="48" r="18" fill="#6b4a2e"/><circle cx="22" cy="22" r="11" fill="#d7a077"/><path d="M11 19a11 9 0 0 1 22 0z" fill="#f4efe6"/><circle cx="18" cy="23" r="1.3" fill="#2a1a0c"/><circle cx="26" cy="23" r="1.3" fill="#2a1a0c"/><path d="M16 28c2-2 4-2 6-1 2-1 4-1 6 1-2 1-4 1-6 0-2 1-4 1-6 0z" fill="#3a2414"/><path d="M19 31q3 2 6 0" stroke="#7a3b22" stroke-width="1.2" fill="none"/></svg>

char_customer.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><circle cx="17" cy="17" r="17" fill="#3b2a1e"/><circle cx="17" cy="38" r="14" fill="#6a4c7a"/><path d="M7 18c0-6.5 4.5-11 10-11s10 4.5 10 11v7H7z" fill="#8e5aa0"/><circle cx="17" cy="18" r="6.3" fill="#d7a077"/><circle cx="15" cy="18" r=".9" fill="#2a1a0c"/><circle cx="19" cy="18" r=".9" fill="#2a1a0c"/><path d="M15.5 21q1.5 1 3 0" stroke="#7a3b22" stroke-width=".8" fill="none"/></svg>

ui_coin.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5" fill="#f0c674" stroke="#b8862f" stroke-width="1.5"/><circle cx="10" cy="10" r="4.5" fill="none" stroke="#b8862f" stroke-width="1.2"/></svg>

ui_hint_bulb.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f0c674" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg>

bg_mashrabiya_tile.svg (tile at 44x44, 8% opacity behind the board)
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><g fill="none" stroke="#f0c674" stroke-width="1.3"><circle cx="22" cy="22" r="10"/><circle cx="0" cy="0" r="10"/><circle cx="44" cy="0" r="10"/><circle cx="0" cy="44" r="10"/><circle cx="44" cy="44" r="10"/><path d="M22 0v12M22 32v12M0 22h12M32 22h12"/></g></svg>

## Appendix B: strings (key | Arabic | English)
Placeholders: {shop} = shop label, {name}, {n}, {m}, {p}, {c}, {h}, {a}, {b}, {days}, {best}, {reward}, {coins}.
Arabic day counting helper for {days}: 1 = "يوم", 2 = "يومين", 3 to 10 = "{n} أيام", 11 and above = "{n} يوم". English: "1 day", "{n} days".

App and shop name
- app.name | رتّب العطارة | Attar Sort
- shop.label | عطارة {name} | {name} Spice Shop
- shop.defaultName | عم حسن | Uncle Hassan
- name.title.first | سمّي محلك | Name your shop
- name.title.rename | غيّر اسم المحل | Rename your shop
- name.body.first | المحل ده بقى بتاعك يا أسطى، وأنا معاك أعلّمك الصنعة. تحب اللافتة يتكتب عليها إيه؟ | This shop is yours now, and I'll teach you the trade. What should the sign say?
- name.body.rename | الاسم الجديد هيظهر على اللافتة على طول. | The new name will show on the sign right away.
- name.prefix | عطارة | (English field suffix) Spice Shop
- name.placeholder | مثلًا: البركة | e.g. Baraka
- name.suggestions | البركة، الخير، الهنا، الأمانة، أبو الدهب، الشرق | Baraka, Khair, Hana, Amana, Abu El Dahab, El Sharq
- name.preview | شكل اللافتة: | Sign preview:
- name.save.first | افتح المحل | Open the shop
- name.save.rename | احفظ الاسم | Save name
- name.skip | بعدين، خليها عطارة عم حسن | Later, keep Uncle Hassan's name
- name.cancel | إلغاء | Cancel
- name.note | تقدر تغيّر الاسم في أي وقت لما تدوس على اللافتة، أو من الإعدادات. | You can rename any time by tapping the sign or from Settings.
- name.err.short | اكتب اسم من حرفين على الأقل، أو اختار من الاقتراحات | Enter at least 2 characters, or pick a suggestion
- name.err.long | الاسم طويل، خليه 18 حرف أو أقل | That's too long, keep it to 18 characters or fewer
- name.err.chars | استخدم حروف وأرقام ومسافات بس | Use letters, numbers, and spaces only

HUD and toolbar
- ui.level | المرحلة {n} | Level {n}
- ui.moves | الحركات {m} | Moves {m}
- ui.target | هدف 3 نجوم {p} | 3-star target {p}
- ui.badge.hard | صعبة | Hard
- ui.badge.rest | راحة | Easy
- ui.daily.title | تحدي النهارده | Today's challenge
- ui.badge.streak | سلسلة {n} | Streak {n}
- ui.world | عالم {n}: {name} | World {n}: {name}
- world.0 | رف البرطمانات | Jar Shelf
- world.1 | مخزن الشكاير | Sack Storeroom
- world.2 | ركن النحاس | Brass Corner
- ui.undo | تراجع | Undo
- ui.hint | تلميح | Hint
- ui.extra | برطمان زيادة | Extra jar
- ui.restart | إعادة | Restart
- ui.ad | إعلان | Ad
- ui.loading | بنجهز المرحلة... | Preparing the level...
- ui.counterEmpty | زيّن المحل بالعملات من زرار المحل فوق | Decorate your shop with coins from the shop button

Order card
- order.title | طلب مستعجل | Rush order
- order.items | {a} و {b} | {a} and {b}
- order.sub | قبل أي بهار تاني · {coins} عملة | Before any other spice · {coins} coins
- order.waiting | مستني | Waiting
- order.done | اتسلّم | Delivered
- order.missed | فات | Missed

Toasts
- toast.closed | البرطمان ده خلصان ومقفول | This jar is done and sealed
- toast.full | البرطمان ده مليان | This jar is full
- toast.mismatch | لازم تصب فوق نفس النوع أو في برطمان فاضي | Pour onto the same spice or into an empty jar
- toast.noUndo | مفيش حركة ترجعها | Nothing to undo
- toast.undoAdded | زوّدنا 5 مرات تراجع | 5 more undos added
- toast.extraAdded | اتضاف برطمان فاضي | Empty jar added
- toast.restarted | المرحلة بدأت من الأول | Level restarted
- toast.hint | صب من البرطمان المرفوع للبرطمان المنوّر | Pour from the lifted jar into the glowing one
- toast.hintUnsolvable | الوضع ده ملوش حل. ارجع كام خطوة أو زوّد برطمان | No solution from here. Undo a few moves or add a jar
- toast.hintNotFound | مش لاقي تلميح دلوقتي، جرّب تراجع خطوة | Can't find a hint right now, try undoing a move
- toast.adsRemoved | الإعلانات اللي بين المراحل اتشالت | Ads between levels removed

عم حسن
- hassan.nameAsk | أهلًا يا أسطى! قبل ما نفتح، سمّي المحل. | Welcome! Before we open, name the shop.
- hassan.welcomeNamed | أهلًا بيك في {shop}! | Welcome to {shop}!
- hassan.welcomeSkipped | ماشي، تقدر تسميه بعدين من اللافتة. | Fine, you can name it later from the sign.
- hassan.tut1 | البرطمان المرفوع ده أول حركة: دوس عليه، وبعدين دوس على البرطمان المنوّر. كل بهار على نوعه أو في برطمان فاضي. | The lifted jar is your first move: tap it, then tap the glowing jar. Each spice goes on its own kind or into an empty jar.
- hassan.renamed | اللافتة الجديدة حلوة! {shop} نورت. | Lovely new sign! {shop} looks great.
- hassan.unlock2 | لو غلطت، زرار التراجع تحت بيرجعك خطوة، والإعادة بتبدأ من الأول. | Made a mistake? Undo takes you back a step, and Restart starts over.
- hassan.unlock3 | بقى عندك تلميح وبرطمان زيادة، والعملات اللي كسبتها بتتجمع فوق. | You now have hints and an extra jar, and your coins collect up top.
- hassan.unlock4 | معاك عملات تكفي تزيّن المحل! دوس على زرار المحل فوق. | You have enough coins to decorate! Tap the shop button up top.
- hassan.unlock5 | من النهارده فيه مكافأة كل يوم وتحدي يومي، من زرار النتيجة فوق. | From today there's a daily reward and a daily challenge, from the calendar button.
- hassan.hidden12 | العلامات دي بهارات مستخبية، هتبان لما اللي فوقها يتشال. ركّز! | Those marks are hidden spices. They show once what's above is gone. Focus!
- hassan.world1 | نقلنا المخزن! الشغل دلوقتي في الشكاير. | We moved to the storeroom! Now we work with sacks.
- hassan.world2 | وصلنا ركن النحاس، ده أغلى حاجة في المحل. | Welcome to the brass corner, the finest part of the shop.
- hassan.world0again | رجعنا للبرطمانات، بس المرة دي الشغل أتقل. | Back to the jars, but the work is tougher now.
- hassan.order | خلي بالك، زبونة عايزة {a} و{b} قبل أي بهار تاني. | Heads up, a customer wants {a} and {b} before any other spice.
- hassan.orderDone | الزبونة مبسوطة! خدنا {coins} عملة. | The customer is happy! We earned {coins} coins.
- hassan.orderMissed | الزبونة مشيت، معلش المرة الجاية. | The customer left. Next time!
- hassan.hard | المرحلة دي تقيلة، والعملات فيها دوبل. فكّر قبل ما تصب. | This one's tough, and coins are doubled. Think before you pour.
- hassan.rest | خد نفسك، المرحلة دي خفيفة. | Catch your breath, this one's light.
- hassan.normal.1 | يلا يا أسطى، الزباين مستنية. | Come on, customers are waiting.
- hassan.normal.2 | رتّبلي الرف ده وليك عندي كوباية شاي. | Sort this shelf and the tea's on me.
- hassan.normal.3 | على مهلك، العطارة عايزة صبر. | Easy now, a spice shop needs patience.
- hassan.normal.4 | كل بهار في مكانه، دي أصول المهنة. | Every spice in its place, that's the trade.
- hassan.praise.1 | تسلم إيدك يا أسطى! | Nice work!
- hassan.praise.2 | الله ينوّر. | Beautiful.
- hassan.praise.3 | كده الشغل ولا بلاش. | Now that's how it's done.
- hassan.praise.4 | برطمان ولا أجدع. | What a jar.
- hassan.praise.5 | عاش يا معلم. | Well done, master.
- hassan.win.1 | {shop} بقت تلمع. | {shop} is shining.
- hassan.win.2 | كده أقدر أفتح بدري بكرة. | Now I can open early tomorrow.
- hassan.win.3 | ده إنت عطار ابن عطار. | You're a born spice merchant.
- hassan.win3stars | تلات نجوم؟ ده إنت معلم! | Three stars? You're a master!
- hassan.invalid | لا لا، كل بهار على نوعه. | No no, each spice on its own kind.
- hassan.stuck | اتزنقنا؟ ارجع خطوة ومتزعلش. | Stuck? Undo a step, no worries.
- hassan.purchase | الله! {shop} بقت حاجة تانية. | Wow! {shop} looks brand new.
- hassan.cat | دي بسبوسة، قطة المحل. متصحيهاش. | That's Basbousa, the shop cat. Don't wake her.
- hassan.dailyReward | مكافأة النهارده في جيبك، استنى بكرة. | Today's reward is yours, see you tomorrow.
- hassan.day7 | اليوم السابع! صينية شاي لـ{shop} هدية مني. | Day seven! A tea tray for {shop}, my gift.
- hassan.dailyStart | تحدي النهارده! نفس المرحلة عند كل الناس، ورّيهم شطارتك. | Today's challenge! Everyone gets the same puzzle, show them your skill.
- hassan.streakFirst | أول يوم في السلسلة، ارجع بكرة نكمّل. | Day one of your streak, come back tomorrow.
- hassan.streakMore | سلسلة {days}! إنت كده من زباين المحل الدايمين. | A {days} streak! You're a regular now.
- hassan.starterThanks | شكرًا يا معلم! جهّزتلك تلميحات وعملات. | Thanks, master! Your hints and coins are ready.
- hassan.theme.normal | رجعنا للشغل العادي. | Back to business as usual.
- hassan.theme.ramadan | رمضان كريم! علّقنا الفوانيس. | Ramadan Kareem! The lanterns are up.
- hassan.theme.eid | كل سنة وإنت طيب، المحل متزيّن للعيد. | Happy Eid, the shop is decorated.
- hassan.theme.spring | شم النسيم! جبنا البيض الملوّن. | Happy Sham El-Nessim! We brought colored eggs.

Themes
- theme.normal | عادي | Normal
- theme.ramadan | رمضان | Ramadan
- theme.eid | العيد | Eid
- theme.spring | شم النسيم | Sham El-Nessim
- theme.auto | تلقائي | Automatic
- greet.ramadan | رمضان كريم | Ramadan Kareem
- greet.eid | عيد سعيد | Happy Eid
- greet.spring | شم نسيم سعيد | Happy Sham El-Nessim

Popups
- win.title | برافو! | Well done!
- win.body | خلّصت المرحلة {n} في {m} حركة، وهدف التلات نجوم كان {p} حركة. | You finished level {n} in {m} moves. The 3-star target was {p}.
- win.coins | كسبت {c} عملة | You earned {c} coins
- win.hardNote | (دوبل المرحلة الصعبة) | (hard level double)
- win.double | ضاعف العملات (إعلان) | Double coins (ad)
- win.next | المرحلة اللي بعدها | Next level
- dailyWin.title | خلّصت تحدي النهارده! | Today's challenge complete!
- dailyWin.body | خلّصته في {m} حركة. السلسلة دلوقتي {days}، وأحسن سلسلة ليك {best}. | Done in {m} moves. Your streak is {days}; your best is {best}.
- dailyWin.back | رجوع للمراحل | Back to levels
- stuck.title | اتزنقت؟ | Stuck?
- stuck.body | مفيش حركة مفيدة دلوقتي. ارجع خطوة، أو زوّد برطمان فاضي، أو ابدأ المرحلة من الأول. | No useful move left. Undo, add an empty jar, or restart the level.
- stuck.undo | تراجع | Undo
- stuck.extra | برطمان زيادة (إعلان) | Extra jar (ad)
- stuck.restart | إعادة المرحلة | Restart level
- rewarded.title | إعلان بمكافأة | Watch an ad for a reward
- rewarded.body | اتفرج على الإعلان وخد: {reward} | Watch an ad and get: {reward}
- rewarded.claim | اتفرج وخد المكافأة | Watch and claim
- rewarded.no | لا شكرًا | No thanks
- reward.undo | 5 مرات تراجع زيادة | 5 more undos
- reward.hint | تلميح | A hint
- reward.extra | برطمان فاضي زيادة | An extra empty jar
- reward.double | ضعف العملات ({c} عملة زيادة) | Double coins (+{c})
- starter.title | عرض البداية | Starter pack
- starter.body | مرة واحدة بس، عشان إنت مكمّل معانا: | One time only, for sticking with us:
- starter.item1 | من غير إعلانات بين المراحل | No ads between levels
- starter.item2 | 10 تلميحات | 10 hints
- starter.item3 | 200 عملة | 200 coins
- starter.buy | اشتري | Buy
- starter.later | مش دلوقتي | Not now
- starter.timer | متاح {h} ساعة كمان | Available for {h} more hours
- shop.title | كبّر {shop} | Grow {shop}
- shop.balance | معاك {c} عملة | You have {c} coins
- shop.note | كل حاجة تشتريها بتظهر في المحل على طول. | Everything you buy appears in your shop right away.
- shop.buy | اشتري | Buy
- shop.need | محتاج {c} | Need {c}
- shop.owned | موجود في المحل | In your shop
- shop.hints | 10 تلميحات | 10 hints
- shop.hintsHave | معاك {n} تلميح | You have {n} hints
- shop.removeAds | إزالة الإعلانات | Remove ads
- shop.back | رجوع للعب | Back to the game
- item.chili | عقد شطة معلّق | Chili string
- item.plant | زرعة نعناع | Mint plant
- item.lantern | فانوس نحاس | Brass lantern
- item.scale | ميزان نحاس | Brass scale
- item.radio | راديو قديم | Old radio
- item.sign | لافتة نحاس | Brass sign
- item.cat | قطة المحل | Shop cat
- item.tray | صينية شاي | Tea tray
- daily.title | اليومي | Daily
- daily.rewardTitle | مكافأة كل يوم | Daily reward
- daily.day | يوم {n} | Day {n}
- daily.gift | هدية | Gift
- daily.claim | خد مكافأة النهارده | Claim today's reward
- daily.claimed | خدت مكافأة النهارده. تعالى بكرة، ولو فوّت يوم العد بيبدأ من الأول. | Claimed for today. Come back tomorrow; missing a day restarts the count.
- daily.challengeTitle | تحدي النهارده | Today's challenge
- daily.streakLine | السلسلة: {days} · أحسن سلسلة: {best} | Streak: {days} · Best: {best}
- daily.noStreak | لسه مبدأتش | not started
- daily.noBest | مفيش لسه | none yet
- daily.play | العب تحدي النهارده | Play today's challenge
- daily.done | خلّصت تحدي النهارده ✓ ارجع بكرة | Done for today ✓ Come back tomorrow
- daily.restartNote | المرحلة اللي إنت فيها هتبدأ من الأول لما ترجع. | Your current level will restart when you return.
- daily.back | رجوع | Back

Settings
- settings.title | الإعدادات | Settings
- settings.shopName | اسم المحل | Shop name
- settings.change | غيّر | Change
- settings.sound | المؤثرات الصوتية | Sound effects
- settings.music | الموسيقى | Music
- settings.haptics | الاهتزاز | Haptics
- settings.motion | حركة القطع | Piece motion
- settings.reminder | التذكير اليومي | Daily reminder
- settings.language | اللغة | Language
- settings.theme | الثيم الموسمي | Seasonal theme
- settings.privacy | خيارات الخصوصية | Privacy options
- settings.restore | استرجاع المشتريات | Restore purchases
- settings.playGames | Google Play Games | Google Play Games
- settings.on | شغال | On
- settings.off | مقفول | Off
- settings.version | الإصدار {v} | Version {v}

Reminders
- reminder.ask.title | نفكّرك كل يوم؟ | Daily reminder?
- reminder.ask.body | عم حسن يبعتلك تذكير واحد بس في اليوم عشان سلسلتك متقطعش. تقدر تقفله من الإعدادات في أي وقت. | Uncle Hassan sends at most one reminder a day so your streak survives. Turn it off any time in Settings.
- reminder.ask.yes | ماشي | Sure
- reminder.ask.no | لا شكرًا | No thanks
- reminder.streak | عم حسن: سلسلتك {days}، متقطعهاش! تحدي النهارده مستنيك. | Uncle Hassan: your streak is {days}, keep it going! Today's challenge is waiting.
- reminder.reward | عم حسن: مكافأة النهارده في {shop} مستنياك. | Uncle Hassan: today's reward is waiting at {shop}.
- reminder.generic | عم حسن: الزباين بتسأل عليك يا أسطى. | Uncle Hassan: customers are asking for you.

## Appendix C: constants (put all in config.ts)
- CAP 4; EMPTY_VESSELS 2
- spices per level: L1 2, L2 3, then min(10, 4 + floor((L - 3) / 3)); hard +1; rest -1 (min 3)
- candidates K: hard 9, normal 5, tutorial and rest 3; attempts K x 5; node budget 220000; per-candidate limit 15000; fallback limit 60000
- normal pick percentile 0.7
- adjacency limit max(1, floor(n / 2))
- par buffer 0.15 (when optimal is known)
- stars: 2-star extra ceil(0.35 x par)
- hidden: start level 12; base 0.40; +0.03 per level; max 0.90; hard 1.0; daily 0.6 on about half the days
- orders: start level 7; reward 20 per spice; hard x2
- coins per win 10 + 5 x stars; hard x2
- undo free 5, ad +5; hint free 1 per level; hint solver limit 60000; extra vessel 1 per level
- unlocks: undo and restart 2; hint, extra, coins 3; shop and double coins 4; daily 5
- interstitial: first after level 6, every 3rd level, min 90 s apart
- starter pack: after level 10, window 48 h, contents remove_ads + 10 hints + 200 coins
- rating: from level 15, 3-star wins, every 30 days max
- daily reward: [20 coins, 1 hint, 40 coins, 2 hints, 60 coins, 3 hints, 100 coins + tray]
- daily challenge: spices 7 to 9, reward 50 + 10 x min(streak, 7)
- shop prices: chili 40, plant 70, lantern 110, scale 160, radio 220, sign 300, cat 400
- shop name: 2 to 18 characters; nameAskTiming "first_launch"
- animation: tilt 24 deg, lead 200 ms, flight 520 ms, stagger min(40, 420 / pieces) ms, apex 40dp, spin 140 to 280 deg, jitter 8dp, landing bounce 240 ms, reduced-motion drop 300 ms with 45 ms stagger
- reminders: permission after 2 daily challenges; 1 per day max; stop after 3 ignored; default hour 19
