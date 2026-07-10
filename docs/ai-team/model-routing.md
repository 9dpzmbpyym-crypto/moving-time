# Model routing — corrected recommendations

**Supersedes** `pack_it_up_model_routing_recommendations.{md,csv}`. The old table optimized per-task API dollars — a bill Eloisa doesn't pay for subscription models — and recommended off-roster models (DeepSeek V4 Pro). This one routes to the actual team, per the org chart.

Columns: **Best quality** ignores cost. **Included-credits pick** is the best answer that burns no out-of-pocket money. **Cheapest safe** is the floor below which quality risk isn't worth the savings.

| Lane | Best quality | Included-credits pick | Cheapest safe | Notes |
|---|---|---|---|---|
| App/game architecture | Fable max | Codex Sol / Terra | Luna max | Fable designs, Codex Sol implements |
| Game UI design | Fable max | Opus | Luna max for implementation | taste ≠ implementation; split the ticket |
| Creative direction | Fable max | Opus | — | no cheap substitute exists; don't look for one |
| Planning | Fable / Codex Sol | Terra / Luna max | Luna low | lane is forgiving; spend down |
| Orchestrating sub-agents | Codex Sol | Grok | Luna max | whoever leads the harness orchestrates |
| Sub-agent use (as worker) | — | Grok / Luna | Composer (tiny delegated edits) | pick by task risk, not model rank |
| Debugging | Codex Sol | Grok / Terra | Luna max | Composer inspect-only, always |
| Small code edits | — | **Composer** | Composer | Luna max scores higher but costs credits; Composer is free labor |
| Cleanup | — | Composer / Luna med | Luna low | flat lane; cheapest wins |
| Notes → tickets | — | Luna med | Luna low / GLM | scores are flat 83–94: model choice barely matters here |
| Pixel art — standards | Fable max | Opus | — | taste lane |
| Pixel art — sprite code | Codex Sol | Grok / Luna max | Composer places assets only | the draw() functions are code, not taste |
| Game mechanic design | Fable max | Codex Sol / Terra | Luna max | design premium, implement cheap |
| Marcy/NPC dialogue | Fable max (voice bible, final judge) | Opus | Luna variants · GLM joke mining | never let the variant generator become the voice authority |

## Standing corrections to the benchmark data

1. **Cost axis ≠ your bill.** Benchmark costs are per-task API dollars (Artificial Analysis). Subscription models — Claude Pro, Codex Pro, Cursor native — bill against credit resets. Dollar figures only bind for OpenRouter/paid-API work (and Cursor's monthly API budget, when not maxed).
2. **Composer was missing from the original dataset.** Added with Fable-estimated fit scores, flagged `estimated=yes` in the CSV. Replace with real benchmarks when available.
3. **Harness column corrected** to the org chart: Fable/Opus → Claude, Grok → Cursor, GLM → OpenRouter/Cursor API. DeepSeek V4 Pro, Kimi K2.6, and Qwen-local are benchmark references, **not roster members** — do not route work to them.
4. **Terra is undervalued** by the old recommendations: ~90 fit on architecture/planning/debugging at mid cost inside Codex credits. If Terra is surfaced in Codex, it is the default "Sol is overkill, Luna isn't enough" gear.
5. **Fable's debugging score (95) assumes a coding harness.** Advisory debugging from pasted code is worth mid-80s. Doesn't change routing: Codex Sol and Grok own that lane.

Graphs: `data/graphs/*.png` (one per lane, corrected). Data: `data/model-task-scores.csv`.
