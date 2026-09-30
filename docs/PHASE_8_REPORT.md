# Phase 8 — Android build and platform services

## Implemented

- Added Capacitor Android 8.5.2 and generated the native Android project. Android targets API 36, locks to portrait, declares the app as a game, and reports version code 1 / version name 0.1.0. Launcher labels are Arabic and English, and the launcher/splash artwork remains a replaceable placeholder.
- Added the spec-listed Capacitor Preferences, Haptics, and Local Notifications packages. Player saves migrate from `localStorage` into native Preferences; Android haptics use the native bridge.
- Added the daily-reminder explanation after two daily challenges, an optional settings toggle, and a rolling queue of one reminder per day for three days at the player's recent median start hour (default 19:00). Playing or opening a reminder replaces the queue with future days, while three ignored notifications exhaust the queue until the player opens the app again.
- Added Capacitor App and Keyboard handling: Android back skips the first-run naming dialog, closes the top dialog, or asks before exit; keyboard display scrolls the active name field into view.
- Added Google Play In-App Review integration: only after a three-star win from level 15, no missed order or rewarded/interstitial ad in that flow, and at most once per 30 days according to the local save.
- Added Firebase Analytics event submission after native Firebase initialization and UMP consent setup, with event/field/value allowlists that exclude free-form shop names and personal text. UMP's Firebase Consent Mode integration must be enabled in AdMob Privacy & Messaging. The analytics queue is held until UMP completes; Firebase's native consent state also filters the events.
- Added `npm run android:sync` and `npm run android:open`. Existing game CSS already uses safe-area insets; the generated Capacitor Android project targets API 36.
- The project applies Google's Services Gradle plugin only when `android/app/google-services.json` exists. Add your own Firebase Android app configuration locally; `.gitignore` excludes that file. Never commit it.
- Added a Kotlin Capacitor bridge on Google's official Play Games Services v2 SDK for background sign-in, Saved Games snapshots, custom conflict merging, achievement unlocks, and the achievements screen. The bridge follows the spec's max-level then total-stars rule and unions decorations without adding currency. Android Gradle Plugin 8.13.2, Kotlin Gradle Plugin 2.3.21, and Play Games SDK 22.1.0 are included.
- Set the placeholder PGS project ID and six achievement IDs in `android/app/src/main/res/values/strings.xml` using [the Play Games setup guide](PLAY_GAMES_SETUP.md) before testing PGS. Local play stays available if PGS is not configured or the player is offline.
- An upload key was generated outside the repository at `C:\Users\Marco Ehab\Documents\Attar Sort Signing\attar-upload.jks` with its password in the same local folder. A matching backup copy is at `C:\Users\Marco Ehab\Desktop\Attar Sort Upload Key Backup`; the owner must copy the key and password to separate offline storage. No key or password is committed.

## Validation

- `npm test`: passed, 12 files / 103 tests, including cloud-save conflict selection.
- `npm run typecheck`: passed.
- `npm run lint`: passed after excluding generated Android web assets from ESLint.
- `npm run build`: passed; Vite reports the existing >500 kB application chunk warning.
- `npm run android:sync`: passed and found eight Capacitor plugins.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Reinstalled the missing Android SDK Build Tools 35.0.0 with the official SDK Manager. The app and Capacitor plugins now compile with Android Studio JBR 21; the first compile exposed and fixed nullable Play Games snapshot results and the non-Task `unlock` API usage in the native bridge.
- Added `android/app/src/main/res/resources.properties` (`unqualifiedResLocale=en`) required by AGP's automatic locale configuration. Restricted `androidResources.localeFilters` to `en` and `ar`, so third-party library translations do not expand the app's supported system-language list.
- `gradlew compileDebugKotlin --no-daemon '-Djava.io.tmpdir=C:\Temp'`: passed.
- `gradlew assembleDebug --no-daemon '-Djava.io.tmpdir=C:\Temp'`: passed. Produced a 10.0 MiB debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`, signed with Android's debug certificate (SHA-1 `97df0bc8f92e2bcfd1660ce862a3ab6d9e6dac86`). `aapt dump badging` confirmed package `com.marcoehab.attarsort`, min SDK 24, target SDK 36, Arabic launcher label, debug flag, and locale config exactly `en` and `ar`.
- `npm test`: 103 tests passed; `npm run typecheck`, `npm run lint`, and `npm run build` passed. ESLint ignores generated Android `build/` intermediates so generated minified assets do not get linted as source.
- Installed the debug APK on the API 36.1 Google Play emulator. After Android's first-boot package optimization and system UI/phone ANRs settled, the app opened the Arabic shop-naming screen, entered level 1, and accepted a legal pour; the displayed move count advanced from 0 to 1. The final run had no `AndroidRuntime` fatal exception. Play Games sign-in/cloud saves and Firebase analytics/consent remain unverified because Play Console IDs and the local Firebase configuration are intentionally placeholders/missing.
- The owner supplied a Firebase Android configuration for project `attar-sort` and package `com.marcoehab.attarsort`. It was copied to ignored `android/app/google-services.json`. `:app:processDebugGoogleServices` and `assembleDebug` passed, producing an updated local debug APK. No Android device was connected for a DebugView event check, so Analytics delivery and consent behavior remain unverified.
- The owner reported testing the APK on a phone, without detailed results or DebugView evidence. This report does not treat the 30-minute no-crash, performance, consent, notifications, or Play Games checks as verified.
- `npm run android:sync` and `gradlew bundleRelease` passed with the Firebase configuration. The bundle was signed with the local upload key and `jarsigner -verify` passed. The test-signed AAB is local at `android/app/build/outputs/bundle/release/app-release-test-signed.aab`; it still uses Google test ad IDs, placeholder Play Games IDs, and lacks Phase 9 purchases, so it is not a Play submission candidate.
- Moved the development panel CSS into the development-only module. Scanned the signed AAB's web assets and found no `debug-panel`, `metaPanel`, `motionBench`, or `debug-oud` code tokens. The debug-only controls are excluded from the bundle.
- Firebase DebugView, Play Games behavior, notification delivery, keyboard behavior, and review UI need testing on a configured Android app/device.

## Remaining Phase 8 decisions and setup

- Play Games native code compiles successfully. Play Console IDs still need to be filled and real sign-in, achievements, and cross-device save tests remain unverified.
- Firebase project `attar-sort` has the Android app `com.marcoehab.attarsort` registered and its configuration installed locally. Verify Google Analytics is enabled, enable UMP Consent Mode in AdMob Privacy & Messaging, then use Firebase DebugView on a connected Android device while testing the updated debug build.
- Android SDK Build Tools 35.0.0 was repaired and the debug build passed; no further SDK repair is currently required.
- Follow [the account setup guide](PLAY_CONSOLE_ACCOUNT_SETUP.md) to create and verify the owner's Play Console account and create the game draft.
- The local upload key and its password have been created outside the repository, with a same-PC backup. Move an additional copy of both to separate offline storage. For later Play releases, use **Build > Generate Signed Bundle / APK** and choose Android App Bundle with this key and alias `attar-upload`. Never commit the key or password. Register the Play App Signing certificate fingerprint as well as any local test fingerprint with Play Games; Google re-signs distributed APKs.

Phase 8 remains open until Play Games IDs are configured in Play Console, Firebase DebugView and device behavior are checked, and the owner's offline upload-key backup is confirmed. Debug APK and test-signed AAB builds are verified. Phase 9 has not started.
