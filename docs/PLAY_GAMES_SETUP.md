# Google Play Games Services setup

The Android integration uses Google's Play Games Services v2 SDK with a small Capacitor bridge. Local saves remain primary when Play Games is unavailable or the player is signed out.

## Before testing

1. In Play Console, create/link a Play Games Services game for package `com.marcoehab.attarsort` and add the SHA-1 certificate fingerprints for the debug and release signing certificates.
2. Create the six achievements listed below and make them available to testers. Copy each generated achievement ID (not its display name).
3. Set the numeric Play Games Services project ID in `android/app/src/main/res/values/strings.xml` as `play_games_app_id`.
4. Replace each `REPLACE_WITH_ACHIEVEMENT_ID` value in that same file with its corresponding ID.
5. Publish the Play Games Services configuration to the test track and add test accounts in Play Console. The game does not need to be publicly released for internal testing.
6. Rebuild and install from a Play test track or a locally signed build whose certificate fingerprint is registered in Play Console.

| Resource key | Trigger |
| --- | --- |
| `pgs_achievement_first_three_star` | First normal level completed with 3 stars |
| `pgs_achievement_levels_50` | Complete level 50 |
| `pgs_achievement_levels_100` | Complete level 100 |
| `pgs_achievement_streak_7` | Complete a daily challenge with a 7-day streak |
| `pgs_achievement_orders_20` | Deliver the 20th customer order |
| `pgs_achievement_all_decorations` | Own all eight shop decorations |

## Behavior and checks

- PGS v2 performs platform authentication automatically at launch. If the player is not authenticated, tapping the Play Games achievements button offers sign-in. A missing account, declined sign-in, no network, or unconfigured IDs does not block local play.
- The whole versioned `Player` save is stored in a single Saved Games snapshot. On a conflict, the save with the higher `maxLevel` wins; equal-level saves are compared by total stars. Owned decorations are unioned. Coins and other currencies are never added together.
- The Settings > Google Play Games button opens Google's achievements screen when the service is configured and the player is authenticated.
- Test automatic authentication, successful and declined sign-in, achievement unlocks, achievements UI, first-time snapshot creation, restoring on another device, conflict merge, and offline save followed by reconnect. Check Android Logcat for PGS configuration errors.

Play Games Services saves are associated with the player's Google Play Games profile. Do not use the PGS player ID as the game's primary account identity.
