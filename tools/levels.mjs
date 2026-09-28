import { mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { build } from 'vite';

// Bundle the pure TS pipeline with the already-installed Vite, avoiding another
// TS runtime dependency. Temporary files are ignored and never shipped.
const root = fileURLToPath(new URL('../', import.meta.url));
const cache = resolve(root, '.cache/levels');
await build({ root, configFile: false, logLevel: 'error', build: {
  ssr: resolve(root, 'tools/precompute.ts'), outDir: cache, emptyOutDir: true,
  minify: false, rolldownOptions: { output: { entryFileNames: 'precompute.mjs' } },
} });
const { precomputeOne, validateOutput, PRECOMPUTE } = await import(pathToFileURL(resolve(cache, 'precompute.mjs')).href);
const started = performance.now(), levels = [], records = [];
for (let level = 1; level <= PRECOMPUTE.levels; level++) {
  const result = precomputeOne(level);
  levels.push(result.row);
  records.push(result.stats);
  if (level % 50 === 0 || level === 1) console.log(`Verified ${level}/${PRECOMPUTE.levels} (${((performance.now() - started) / 1000).toFixed(1)}s)`);
}
const output = { v: 1, levels };
validateOutput(output);
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const groups = ['tutorial', 'normal', 'hard', 'rest'].map(type => {
  const rows = records.filter(x => x.type === type), pars = rows.map(x => x.par);
  return { type, count: rows.length, parMin: Math.min(...pars), parMedian: percentile(pars, 0.5),
    parP90: percentile(pars, 0.9), parMax: Math.max(...pars), parMean: mean(pars),
    generationMeanMs: mean(rows.map(x => x.generationMs)), generationP95Ms: percentile(rows.map(x => x.generationMs), 0.95),
    orders: rows.filter(x => x.hasOrder).length, orderShare: rows.filter(x => x.hasOrder).length / rows.length,
    optimal: rows.filter(x => x.optimalLength !== null).length, fallbacks: rows.filter(x => x.fallback).length };
});
const plateau = ['normal', 'hard', 'rest'].map(type => {
  const rows = records.filter(x => x.level >= 25 && x.type === type);
  return { type, meanPar: mean(rows.map(x => x.par)), medianPar: percentile(rows.map(x => x.par), 0.5),
    meanDfsLength: mean(rows.map(x => x.dfsLength)), count: rows.length };
});
const report = { generatedAt: new Date().toISOString(), count: levels.length, settings: PRECOMPUTE,
  elapsedMs: performance.now() - started, groups, plateau, records };
const lines = ['# Level precompute report', '',
  `Generated and verified ${levels.length} levels in ${(report.elapsedMs / 1000).toFixed(1)} seconds.`, '',
  '| Type | Count | Par min / median / p90 / max | Mean generation ms | p95 generation ms | Orders | Optimal par | Fallbacks |',
  '|---|---:|---|---:|---:|---:|---:|---:|',
  ...groups.map(x => `| ${x.type} | ${x.count} | ${x.parMin} / ${x.parMedian} / ${x.parP90} / ${x.parMax} | ${x.generationMeanMs.toFixed(1)} | ${x.generationP95Ms.toFixed(1)} | ${x.orders} (${(100 * x.orderShare).toFixed(1)}%) | ${x.optimal} | ${x.fallbacks} |`), '',
  '## Difficulty after the initial ramp (levels 25–1000)', '',
  '| Type | Count | Mean par | Median par | Mean DFS length |', '|---|---:|---:|---:|---:|',
  ...plateau.map(x => `| ${x.type} | ${x.count} | ${x.meanPar.toFixed(2)} | ${x.medianPar} | ${x.meanDfsLength.toFixed(2)} |`), '',
  '## Verification and interpretation', '',
  '- Each stored board has a legally replayed winning DFS solution. Every order also has a separately replayed constrained solution.',
  '- Hidden IDs, spice counts, ordering, world, types, and file version pass schema validation before writing.',
  `- BFS uses at most ${PRECOMPUTE.searchNodes} expanded nodes, ${PRECOMPUTE.searchStates} retained states and ${PRECOMPUTE.searchTimeMs} ms per level. Only a proven shortest solution receives the 15% par buffer. All other levels retain the DFS path length.`,
  '- Search covers all legal moves, deduplicating equivalent vessel permutations. Timing is machine-dependent: a search near its deadline may change par provenance on regeneration; board seeds and orders remain deterministic.',
  '- Generation timings include order selection but exclude the additional certificate replay and shortest-path search. This is build-time work, not level-load latency.',
  '- Par is not a pure difficulty measure when it comes from DFS. The configured hard/normal/rest selection is preserved; aggregate values do not promise that every hard level has a larger par than its neighbors.',
  '- Detailed per-level timings, par provenance and fallback flags are saved in `LEVEL_STATS.json`, outside the game bundle.', '',
];
// Write all results only after all 1000 levels validate; replace files atomically.
for (const [relative, content] of [
  ['src/content/levels.json', JSON.stringify(output) + '\n'],
  ['docs/LEVEL_STATS.json', JSON.stringify(report, null, 2) + '\n'],
  ['docs/LEVEL_STATS.md', lines.join('\n')],
]) {
  const target = resolve(root, relative), temp = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temp, content, 'utf8');
  await rename(temp, target);
}
console.table(groups);
console.log(`Saved src/content/levels.json and docs/LEVEL_STATS.{json,md}. All certificates passed.`);
