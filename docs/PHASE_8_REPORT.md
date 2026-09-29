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
- No upload key or release signing secret was created.

## Validation

- `npm test`: passed, 12 files / 103 tests, including cloud-save conflict selection.
- `npm run typecheck`: passed.
- `npm run lint`: passed after excluding generated Android web assets from ESLint.
- `npm run build`: passed; Vite reports the existing >500 kB application chunk warning.
- `npm run android:sync`: passed and found eight Capacitor plugins.
- `npm audit --omit=dev`: zero production vulnerabilities.
- `gradlew compileDebugKotlin --no-daemon '-Djava.io.tmpdir=C:\Temp'` with Android Studio JBR 21 and the installed Android SDK: Gradle configured the app and plugins, then stopped before Kotlin compilation because the local `build-tools;35.0.0` installation is incomplete (`source.properties` is missing). The SDK has API 36 and Build Tools 36.0.0, but Capacitor's Android library also requires the 35.0.0 package selected by AGP.
- Downloaded the official Android command-line tools and verified SHA-256 `90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a`; `sdkmanager` could not fetch Google's package manifest in this environment, so Build Tools could not be repaired here. No APK was produced and no Android device was connected.
- Retry after repairing `Android SDK > SDK Tools > Android SDK Build-Tools 35.0.0` in Android Studio's SDK Manager, then from `android/` run `$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'; $env:ANDROID_HOME = 'C:\Users\Marco Ehab\AppData\Local\Android\Sdk'; $env:TEMP = 'C:\Temp'; $env:TMP = 'C:\Temp'; .\gradlew.bat assembleDebug --no-daemon '-Djava.io.tmpdir=C:\Temp'`.
- Firebase DebugView, Play Games behavior, notification delivery, keyboard behavior, and review UI need testing on a configured Android app/device. The production web bundle excludes the `metaPanel` and `motionBench` debug modules; Android release debug-tool exclusion still needs confirmation in a release build.

## Remaining Phase 8 decisions and setup

- Play Games native code is in place, but Play Console IDs still need to be filled and the native build/device tests are not yet verified.
- Firebase project setup: create/register Android package `com.marcoehab.attarsort`, enable Analytics and UMP Consent Mode in AdMob Privacy & Messaging, download `google-services.json`, and put it in `android/app/` locally. Then use Firebase DebugView while testing a debug build.
- Repair the local Android SDK Build Tools 35.0.0 package before retrying Gradle; this is an SDK installation issue, not a project compilation diagnostic.
- In Android Studio, open the project, wait for Gradle sync, and choose **Build > Build Bundle(s) / APK(s) > Build APK(s)** for a debug APK. For release, use **Build > Generate Signed Bundle / APK** and choose Android App Bundle. Create the upload key locally in that wizard, store its password outside the repository, and keep a second offline backup. Never commit the key or password.

Phase 8 remains open until Play Games IDs are configured, the native build is verified, Firebase DebugView and device behavior are checked, and release debug-tool exclusion is confirmed. Phase 9 has not started.
