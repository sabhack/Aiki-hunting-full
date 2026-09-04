---
name: stepstone-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search Stepstone — Germany's largest job
  board — for jobs in Germany, Austria, or the DACH region, even if they don't mention
  stepstone.de explicitly. Invoke for open positions, vacancies, and hiring across all
  sectors and seniority levels in Germany. Trigger phrases include: stepstone,
  stellenangebote, jobs in germany, job in deutschland, stellensuche, vollzeit job,
  ingenieur job, manager job deutschland, IT jobs germany, jobs berlin, jobs münchen,
  jobs hamburg, jobs frankfurt, jobs köln, festanstellung, jobsuche deutschland.
context: fork
allowed-tools: Bash(bun run skills/stepstone-search/cli/src/cli.ts *)
---

# Stepstone Search Skill

Search live German/DACH job listings from **Stepstone.de** via the Apify actor
`memo23/stepstone-search-cheerio-ppr`. Stepstone is Germany's largest job board and
covers all sectors and seniority levels — broader and more "mainstream" than the
tech-leaning Arbeitnow board.

## Requirements

This skill calls the Apify platform and **requires an `APIFY_TOKEN`**:

```bash
export APIFY_TOKEN="apify_api_..."   # from https://console.apify.com/account/integrations
```

Each run consumes a small amount of Apify credit (~$0.001 per job result). If
`APIFY_TOKEN` is unset, the CLI exits with `{ "code": "NO_TOKEN" }`. Prefer the free
`arbeitnow-search` skill when it can answer the query; use Stepstone for broad,
non-tech, or seniority-specific searches where coverage matters.

## Commands

### Search

```bash
bun run skills/stepstone-search/cli/src/cli.ts search [flags]
```

Flags:
- `--query <text>` / `-q <text>` — **required** keyword (job title, skill, role)
- `--location <slug>` / `-l <slug>` — city/region slug, e.g. `berlin`, `münchen`, `deutschland`
- `--posted <all|1|3|7>` — only jobs posted within N days (default `all`)
- `--limit <n>` / `-n <n>` — max results (default 25). Drives the actor's `maxItems`.
- `--format json|table` — output format (default json)

### Detail

```bash
bun run skills/stepstone-search/cli/src/cli.ts detail "<full-stepstone-url>" [--format plain|json]
```

Pass a full Stepstone job URL (from a search result's `url`). Re-runs the actor against
that single URL to fetch the full record.

## Usage examples

```bash
# Software engineer jobs in Berlin, last 7 days
bun run skills/stepstone-search/cli/src/cli.ts search -q "software engineer" -l berlin --posted 7 --format table

# Project manager roles across Germany
bun run skills/stepstone-search/cli/src/cli.ts search -q "projektmanager" -l deutschland -n 30 --format table

# Full detail for one posting
bun run skills/stepstone-search/cli/src/cli.ts detail "https://www.stepstone.de/stellenangebote--...html"
```

## Notes

- Output uses the same normalized shape as the other German board skills (`title`,
  `company`, `location`, `salary`, `remote`, `date`, `url`, `source`, `description`).
- `salary` and `remote` are populated when Stepstone exposes them; otherwise `null`.
- The actor uses Apify residential proxies internally, so runs take longer than the
  free Arbeitnow API (typically several seconds to ~a minute for large `--limit`).
- All errors print to **stderr** as `{ "error": "...", "code": "..." }`, exit code 1.
- See `url-reference.md` for the underlying actor input mapping.
