# Phase 1 verification

Date: 2026-09-28. Environment: Windows, Node 25.3.0, npm 11.6.2.

## Results

- `npm test`: PASS, 33 tests in 2 files, 19.26 seconds total.
- Generation validation replayed legal winning paths for levels 1–100, verified
  four layers per spice, empty-vessel counts, unique layer identities and hidden
  constraints. Every generated order was solved again under its order guard.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS. Vite produced `dist/`; local Cairo font included.
- Browser smoke check: Arabic setup screen displayed; English switch changed
  visible text and title; switching back restored Arabic. Screenshot:
  `phase-1-preview.png`.
- `npm audit --omit=dev`: zero vulnerabilities.
- Full `npm audit`: three moderate entries in the development-only chain
  `@capacitor/cli -> xcode -> uuid`. The installed stable CLI carries this iOS
  tooling dependency. No force upgrade/downgrade or unverified override applied.
  Revisit upstream updates before native service setup. Advisory:
  https://github.com/advisories/GHSA-w5hq-g745-h8pq

## Scope

This milestone contains the pure core and setup screen. It does not claim a
playable board, 1–1000 precomputed content, shortest-path par, Android device
testing, performance measurements, an APK or a signed AAB. Those belong to the
following phases in the specification. Development preview runs locally on
http://127.0.0.1:5173/ while its Vite process is running.

## Tooling references

- Vite installation/build: https://vite.dev/guide/
- TypeScript ESLint configuration: https://typescript-eslint.io/getting-started/
- Installed Capacitor `CapacitorConfig` types checked in
  `node_modules/@capacitor/cli/dist/declarations.d.ts`.
- Exact npm registry versions are saved in the lockfile. TypeScript 6.0.3 is
  compatible with the lint adapter's `<6.1.0` peer range; Vitest 4.1.11 supports
  Node 25, unlike the current Vitest 5 engine range.
