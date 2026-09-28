# Level precompute report

Generated and verified 1000 levels in 220.7 seconds.

| Type | Count | Par min / median / p90 / max | Mean generation ms | p95 generation ms | Orders | Optimal par | Fallbacks |
|---|---:|---|---:|---:|---:|---:|---:|
| tutorial | 2 | 7 / 7 / 7 / 11 | 3.4 | 1.9 | 0 (0.0%) | 2 | 0 |
| normal | 599 | 14 / 37 / 41 / 56 | 125.0 | 385.2 | 521 (87.0%) | 4 | 0 |
| hard | 200 | 19 / 38 / 43 / 54 | 158.6 | 447.3 | 159 (79.5%) | 3 | 0 |
| rest | 199 | 14 / 32 / 35 / 39 | 2.8 | 7.3 | 0 (0.0%) | 3 | 0 |

## Difficulty after the initial ramp (levels 25–1000)

| Type | Count | Mean par | Median par | Mean DFS length |
|---|---:|---:|---:|---:|
| normal | 585 | 37.55 | 37 | 37.55 |
| hard | 196 | 38.65 | 38 | 38.64 |
| rest | 195 | 31.95 | 32 | 31.96 |

## Verification and interpretation

- Each stored board has a legally replayed winning DFS solution. Every order also has a separately replayed constrained solution.
- Hidden IDs, spice counts, ordering, world, types, and file version pass schema validation before writing.
- BFS uses at most 4000 expanded nodes, 16000 retained states and 100 ms per level. Only a proven shortest solution receives the 15% par buffer. All other levels retain the DFS path length.
- Search covers all legal moves, deduplicating equivalent vessel permutations. Timing is machine-dependent: a search near its deadline may change par provenance on regeneration; board seeds and orders remain deterministic.
- Generation timings include order selection but exclude the additional certificate replay and shortest-path search. This is build-time work, not level-load latency.
- Par is not a pure difficulty measure when it comes from DFS. The configured hard/normal/rest selection is preserved; aggregate values do not promise that every hard level has a larger par than its neighbors.
- Detailed per-level timings, par provenance and fallback flags are saved in `LEVEL_STATS.json`, outside the game bundle.
