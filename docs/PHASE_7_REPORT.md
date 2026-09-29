# Phase 7 — monetization and ad test flows

## Implemented

- The browser offers an explicit rewarded-ad demo for undo, hint, extra jar and double coins. It says that no video is played. The reward is granted only after the user chooses the demo action and the ad service reports success; cancel/failure grants nothing.
- Native bridge uses the installed `@capacitor-community/admob` 8.1.0 plugin, compatible with the project's Capacitor 8. It requests UMP consent before loading ads and currently contains only Google's official rewarded and interstitial test unit IDs. Application audio is muted while native ads play. No banner or app-open ads are used.
- Interstitial cadence: after completed normal level 6, then each third normal level, with at least 90 seconds between displays. It is skipped after the player watched the double-coins reward, when remove-ads is owned, and for daily challenges. Browser interstitials are labeled placement previews; native interstitials are test ads.
- Level 10 can open the Starter Pack offer once. Its persisted window expires 48 hours later and is available in the shop only during that window. Browser purchase buttons are labeled demos and do not charge money. The mock grants remove-ads, 10 hints and 200 coins exactly once. Hints pack and remove-ads also have local demo purchases.
- Reward eligibility, cadence, expiry, duplicate protection and save migration are tested. Extra jar and ad-granted undos are restored with the in-progress level.

## Verification

- `npm test`: PASS, 97 tests across 9 files.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS. Vite reports the existing large JavaScript chunk advisory; build succeeds.
- The app ran in a fresh browser origin at `http://127.0.0.1:5174/?debug`. Browser interaction automation could not reliably activate the naming buttons; automated tests cover the new pure rules, migration and extra-jar save flow. The browser-only demo flow still needs a hands-on pass using the commands below.

## Limits before the next phase

- There is no Android project, AdMob Application ID or device build. The native plugin bridge is therefore typechecked/bundled only; UMP and test ads have not been exercised on Android.
- Native purchases remain deliberately disabled pending Phase 9/RevenueCat. No price was invented and no Play Console products were created.
- Before native ad testing, Phase 8 must create the Android project and add the Google AdMob test application ID from Google's official setup guide; later replace it only with the owner's real app ID. Do not use release ad units until the owner explicitly requests a release build.

## Files and commands

Files changed: `package.json`, `package-lock.json`, `README.md`, `src/config.ts`, `src/core/session.ts`, `src/i18n/ar.json`, `src/i18n/en.json`, `src/meta/monetization.ts`, `src/meta/player.ts`, `src/services/ads.ts`, `src/services/analytics.ts`, `src/ui/app.ts`, `tests/dailyMeta.test.ts`, `tests/meta.test.ts`, new `tests/monetization.test.ts`, and this report.

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run dev -- --host
```

`npm ci` installs the exact committed dependency versions; the next four commands run unit tests, TypeScript, ESLint and the production web build; the final command starts the browser demo for manual checks.

Expected in the browser: all text follows the selected Arabic/English locale; choose the labeled demo action to see its reward, cancel to see no reward; demo purchase grants the described local items once; the level-10 offer retains its original 48-hour deadline; closing an interstitial preview continues to the next level.

Commit message: `feat: add monetization demos and AdMob test bridge`.
