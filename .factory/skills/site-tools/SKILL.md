---
name: site-tools
description: Use the public toolbox scripts published from docs/tools via tool-runner.js. Covers listing tools, executing them safely with droid exec context, and required environment variables.
---

# Site Toolbox Skill

## Capability

Operate the public toolbox that ships with this repo. Each tool lives under `docs/tools/<tool>/script.js` and is mirrored to GitHub Pages (default base URL `https://factory-ben.github.io/feed-aggregator`). Use `tool-runner.js` to list, download (if needed), and execute tools so every automation step stays lightweight and reproducible.

## How to use

1. **List tools**
   ```bash
   node docs/tools/tool-runner.js --list
   ```
2. **Run a tool locally** (prefers local script, falls back to public copy):
   ```bash
   node docs/tools/tool-runner.js <tool-name> --flag value
   ```
   Example (dry run):
   ```bash
   FACTORY_API_KEY=*** \
   node docs/tools/tool-runner.js classify-feed --input docs/data/feed.json --dry-run
   ```
3. **Environment**: export `FACTORY_API_KEY` (Factory CLI auth), optional `MODEL_ID=glm-4.6`, `MODEL_REASONING=low`, `CLASSIFIER_MAX_BATCH=10`. Legacy `GLM_*` vars are still read but will be removed once all workflows migrate.
4. **Autonomy & safety**: prefer `droid exec` read-only flows; only enable higher autonomy or repo mutations if the tool explicitly states so. Inspect scripts under `docs/tools/` before running remote copies.

## Verification

- After running toolbox commands that mutate repo files, run `npm run build:tools` (keeps manifest fresh) and any relevant validation commands noted by the tool. For the classifier, rerun with `--dry-run` to confirm GLM responses before writing.
- All artifacts land in `docs/data/` unless overridden. Commit outputs only after reviewing diffs.

## When to reach for this skill

- Need to classify feed entries, export stats, or run future automation hosted as simple scripts without inflating the app server.
- Want a reproducible workflow that GitHub Actions can mirror (install Factory CLI, call `tool-runner`, push results).

## References

- Skills format: https://docs.factory.ai/cli/configuration/skills
- droid exec usage: https://docs.factory.ai/cli/droid-exec/overview.md
