# Phase 8 — Android build and platform services

## Implemented

- Added Capacitor Android 8.5.2 and generated the native Android project.
- Configured Android API 36, portrait orientation, `appCategory="game"`, version code 1 / version name 0.1.0, Arabic and English launcher labels, and Google's official AdMob test app ID.
- Added the Capacitor Preferences, Haptics, and Local Notifications packages named in GAME_SPEC §27. Player saves migrate from localStorage into native Preferences; haptics use the native plugin on Android.
- Added the daily reminder permission explanation after two daily challenges, opt-out/settings toggle, at-most-one pending reminder, usual start-hour median (default 19:00), daily-play cancellation, and an ignored-reminder limit.
- Added `npm run android:sync` and `npm run android:open`. Web CSS already uses Android safe-area insets; target API 36 is set by the generated Capacitor project.
- Kept the generated Capacitor launcher and splash as placeholders. No upload key or signing secret was created or added.

## Validation

- `npm run build`: passed; Vite reports the existing large JavaScript chunk warning.
- `npm run android:sync`: passed and found all four Android plugins.
- `npm run typecheck` / `npx tsc --noEmit`: passed.
- `npx eslint src/ui/app.ts src/meta/player.ts src/services/storage.ts src/main.ts`: passed.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Focused tests passed: `tests/core.test.ts` (29), `tests/dailyMeta.test.ts` (8), `tests/meta.test.ts` (6), `tests/monetization.test.ts` (4), and `tests/session.test.ts`, `tests/shortestPath.test.ts`, `tests/flight.test.ts`, `tests/levelLoader.test.ts` (46 combined).
- Full `npm test` does not finish in this Windows workspace: it stalls during `tests/generator.test.ts` level generation. The first two generator cases pass, then the process hangs on a later generation case. Run the prescribed full suite again locally and inspect that test if it persists.
- `gradlew assembleDebug --offline --no-daemon` was blocked twice by Java `Unable to establish loopback connection` before Gradle could compile. No APK was produced and no connected Android device was available. Run the Android build in Android Studio, which uses the same Gradle project but may avoid this environment's loopback restriction.

## Services requiring an approved implementation choice

Per GAME_SPEC §27, Firebase Analytics needs the user's plugin selection. Per §26–27, Play Games Services v2 / Saved Games / achievements and the official Play In-App Review API need maintained-plugin or thin-native-bridge choices before implementation. Back-gesture and keyboard-specific Capacitor packages are not listed in §27; native behavior remains to be implemented after the dependency choice is approved. Phase 8 is therefore only partially complete and Phase 9 has not started.

## Upload key and signed release

In Android Studio, open the project, wait for Gradle sync, then run **Build > Build Bundle(s) / APK(s) > Build APK(s)** to make a debug APK. For release, use **Build > Generate Signed Bundle / APK** and choose Android App Bundle. Create the upload key locally in that wizard, store its password outside the repository, and make a second offline backup. Never commit the key or passwords. A signed release AAB cannot be created until this local key exists and is backed up.
