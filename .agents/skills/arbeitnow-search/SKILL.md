---
name: arbeitnow-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs in Germany or the wider
  DACH/EU region via Arbeitnow, find German job listings, look up tech/remote roles,
  or asks about the German job market — even if they don't mention arbeitnow.com
  explicitly. Invoke for open positions, vacancies, hiring in Germany, remote jobs in
  Europe, visa-sponsorship roles, or "find me a job in Berlin/Munich/Hamburg". Trigger
  phrases include: arbeitnow, jobs in germany, stellenangebote, stellensuche, job in
  deutschland, remote jobs germany, english speaking jobs germany, visa sponsorship
  jobs germany, tech jobs berlin, developer jobs munich, IT jobs germany, python jobs
  germany, data engineer job deutschland, jobs berlin, jobs münchen, jobs hamburg.
context: fork
allowed-tools: Bash(bun run skills/arbeitnow-search/cli/src/cli.ts *)
---

# Arbeitnow Search Skill

Search live German/EU job listings from **Arbeitnow.com** via its free public JSON API.
No authentication, no API key, no anti-bot — the most reliable of the three German
boards. Strong for tech, startup, remote, English-speaking, and visa-sponsorship roles.

## When to use this skill

- Search jobs in Germany / DACH by keyword, technology, or role
- Find **remote** or **English-language** roles in Germany
- Filter by job type (`berufserfahren`, `praktikum`, etc.) or tag (skill/category)
- Get the full description of a specific listing

## Commands

### Search

```bash
bun run skills/arbeitnow-search/cli/src/cli.ts search [flags]
```

Flags:
- `--query <text>` / `-q <text>` — keyword filter (matched across title, company, description, tags). Multiple words are AND-ed.
- `--location <text>` / `-l <text>` — city/region substring filter (e.g. `berlin`, `münchen`)
- `--remote` — only remote-flagged jobs
- `--jobtype <type>` — filter by job type (e.g. `berufserfahren`, `praktikum`)
- `--tag <tag>` — filter by Arbeitnow tag/category (e.g. `Software Development`)
- `--limit <n>` / `-n <n>` — max results to return (default 20)
- `--maxpages <n>` — max API pages to scan (default 5, 100 jobs/page)
- `--format json|table` — output format (default json)

> **Filtering is client-side.** Arbeitnow's API returns the full feed ordered by
> recency; the `?search=` param is **not** honoured server-side, so the CLI paginates
> and filters locally. For rare keywords, raise `--maxpages`.

### Detail

```bash
bun run skills/arbeitnow-search/cli/src/cli.ts detail <slug> [--format plain|json]
```

`slug` is the `id` from a search result. Returns the full (HTML-stripped) description.
Note: Arbeitnow has no per-job endpoint, so `detail` scans recent pages for the slug —
if the job has aged out of the feed, open its `url` directly instead.

## Usage examples

```bash
# Remote Python jobs
bun run skills/arbeitnow-search/cli/src/cli.ts search --query python --remote --limit 15 --format table

# Data engineer roles in Berlin
bun run skills/arbeitnow-search/cli/src/cli.ts search --query "data engineer" --location berlin --format table

# English-speaking jobs (broad scan)
bun run skills/arbeitnow-search/cli/src/cli.ts search --query "english" --maxpages 8 --limit 30

# Full detail for one job
bun run skills/arbeitnow-search/cli/src/cli.ts detail office-hr-managerin-sachsen-bei-ansbach-432784
```

## Notes

- 100% free; no `APIFY_TOKEN` needed (unlike the Stepstone and Xing skills).
- Jobs are updated hourly and ordered by `created_at` (newest first).
- No structured salary data is exposed by the API (`salary` is always `null`).
- All errors print to **stderr** as `{ "error": "...", "code": "..." }` with exit code 1.
- Per the API terms, do not abuse the endpoint; keep `--maxpages` reasonable.
