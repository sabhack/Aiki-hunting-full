---
name: xing-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search Xing — the leading professional
  network in the DACH region (Germany, Austria, Switzerland) — for jobs, even if they
  don't mention xing.com explicitly. Invoke for professional/white-collar roles,
  management positions, and DACH-region hiring. Trigger phrases include: xing, xing
  jobs, jobs in germany, job in deutschland, professional jobs germany, manager job,
  fach- und führungskräfte, stellenangebote, jobs berlin, jobs münchen, jobs wien,
  jobs zürich, DACH jobs, karriere deutschland.
context: fork
allowed-tools: Bash(bun run skills/xing-search/cli/src/cli.ts *)
---

# Xing Search Skill

Search live DACH job listings from **Xing** via the Apify actor
`shahidirfan/Xing-Jobs-Scraper`. Xing is the dominant professional network in
Germany/Austria/Switzerland and skews toward professional, management, and
"Fach- und Führungskräfte" roles. Xing has no open jobs API and is anti-bot/login
gated, so this skill goes through Apify (the actor uses Xing's GraphQL internally).

## Requirements

This skill calls the Apify platform and **requires an `APIFY_TOKEN`**:

```bash
export APIFY_TOKEN="apify_api_..."   # from https://console.apify.com/account/integrations
```

Each run consumes a small amount of Apify credit (~$0.0012 per job result). If
`APIFY_TOKEN` is unset, the CLI exits with `{ "code": "NO_TOKEN" }`. Prefer the free
`arbeitnow-search` skill when it can answer the query; use Xing for professional/
management roles and DACH-wide coverage.

## Commands

### Search

```bash
bun run skills/xing-search/cli/src/cli.ts search [flags]
```

Flags:
- `--query <text>` / `-q <text>` — **required** keyword (job title, skill, role)
- `--location <text>` / `-l <text>` — city/region, e.g. `Berlin`, `München`, `Wien`, `Zürich`
- `--discipline <text>` / `-d <text>` — professional field, e.g. `Technology`, `Marketing`, `Finance`
- `--limit <n>` / `-n <n>` — max results (default 20). Drives the actor's `results_wanted`.
- `--maxpages <n>` — safety cap on search pages (default 20)
- `--format json|table` — output format (default json)

### Detail

```bash
bun run skills/xing-search/cli/src/cli.ts detail "<full-xing-job-url>" [--format plain|json]
```

Pass a full Xing job URL (from a search result's `url`). Returns the full job
description text.

## Usage examples

```bash
# Data analyst roles in Berlin, Technology discipline
bun run skills/xing-search/cli/src/cli.ts search -q "data analyst" -l Berlin -d Technology --format table

# Marketing manager roles across DACH
bun run skills/xing-search/cli/src/cli.ts search -q "marketing manager" -d Marketing -n 25 --format table

# Full detail for one posting
bun run skills/xing-search/cli/src/cli.ts detail "https://www.xing.com/jobs/..."
```

## Notes

- Output uses the same normalized shape as the other German board skills.
- `salary` is populated when Xing exposes a range; `remote` is inferred from the title /
  job type containing "remote"/"homeoffice", else `null`.
- The search response already includes `description_text`, so list results carry a
  snippet without a second call; `detail` returns the full text.
- All errors print to **stderr** as `{ "error": "...", "code": "..." }`, exit code 1.
- See `url-reference.md` for the underlying actor input mapping.
