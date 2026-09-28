# AGENTS.md

## Project
Attar Sort (Arabic: رتّب العطارة) is a hybrid-casual sort puzzle game for Android, published on Google Play. The complete product spec is in `docs/GAME_SPEC.md`. Read the relevant sections before every task and follow them exactly. If a request conflicts with the spec, ask me before acting.

## How we work
- One phase per task, in the order of spec section 30. Never start the next phase until I reply "OK".
- End every task with: files changed, exact commands to run, what I should see when testing, test results, and a commit message.
- Explain every terminal command in one short line.
- Keep changes small and reviewable. Do not rewrite working files without explaining why.
- Do not guess APIs. Check the docs or type definitions of the installed version. Say when you are unsure. If no maintained plugin exists for a native feature, propose a thin native Capacitor plugin and ask me first.
- Ask before adding any dependency that is not listed in spec section 27.
- Never commit secrets: keystores, passwords, API keys, google-services.json, RevenueCat keys, AdMob IDs for release. Keep them in .gitignore'd local files.
- Use Google's official TEST ad unit IDs until I explicitly say "release build".
- Warn me before anything that could break a Google Play or AdMob policy.
- If you run in a cloud sandbox without the Android SDK, do everything that Node can verify (unit tests, typecheck, web build, level precompute) and give me exact step-by-step commands to run the Android parts on my computer.

## Commands (keep this list updated)
- Install: `npm install`
- Dev server (phone on same Wi-Fi): `npm run dev -- --host`
- Unit tests: `npm test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Precompute levels: `npm run levels`
- Web build: `npm run build`
- Android sync: `npx cap sync android`

## Every task is done only when
- `npm test`, `npm run typecheck`, and `npm run lint` pass.
- No hardcoded UI strings (everything through i18n).
- Debug-only tools are excluded from release builds.
