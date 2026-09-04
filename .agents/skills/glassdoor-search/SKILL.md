---
name: glassdoor-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search Glassdoor for jobs, even if they don't
  say glassdoor.com explicitly. Glassdoor pairs job listings with company ratings and
  salary data — useful when the user cares about company reputation or pay. Trigger
  phrases include: glassdoor, glassdoor jobs, company ratings, salary jobs, jobs with
  salary, best companies to work for, jobs in germany, stellenangebote, software job
  berlin, jobs with good reviews.
context: fork
allowed-tools: Bash(bun run skills/glassdoor-search/cli/src/cli.ts *)
---

# Glassdoor Search Skill

Search live job listings from **Glassdoor** via the Apify actor
`valig/glassdoor-jobs-scraper`. Glassdoor's edge is **company ratings + salary data**
attached to listings — use it when reputation or pay transparency matters.

## Requirements

Calls Apify — **requires `APIFY_TOKEN`** (~$0.0004 per result, the cheapest of the
paid boards). If unset, the CLI exits with `{ "code": "NO_TOKEN" }`.

## Commands

### Search

```bash
bun run skills/glassdoor-search/cli/src/cli.ts search [flags]
```

Flags:
- `--query <text>` / `-q <text>` — **required** keyword (title / skill / company)
- `--location <text>` / `-l <text>` — **required** by the actor, e.g. `"Berlin, Germany"`
- `--posted <days>` — only jobs posted within N days (`daysOld`)
- `--remote` — remote roles only
- `--minrating <0.0-5.0>` — minimum company rating
- `--sort <relevant|date>` — sort order (default relevant)
- `--limit <n>` / `-n <n>` — max results (default 25)
- `--format json|table`

> **No `detail` command.** This actor searches by keyword, not by job URL, so
> `detail` returns `{ "code": "UNSUPPORTED" }`. Read the inline `description` from
> `search`, or open the job `url` directly.

## Examples

```bash
bun run skills/glassdoor-search/cli/src/cli.ts search -q "product manager" -l "Berlin, Germany" --posted 14 --minrating 3.5 --format table
bun run skills/glassdoor-search/cli/src/cli.ts search -q "data engineer" -l "München, Germany" --remote --format table
```

## Notes

- Same normalized output shape as the other board skills. `date` is derived from the
  actor's `ageInDays`; `salary` is built from the structured `pay` range when present.
- `remote` is not exposed as a per-job field by this actor (use `--remote` to filter at search time).
- Errors print to stderr as `{ "error": "...", "code": "..." }`, exit code 1.
- See `url-reference.md` for the actor input mapping and alternatives.
