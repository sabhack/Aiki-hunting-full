---
name: linkedin-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search LinkedIn for jobs, even if they don't
  say linkedin.com explicitly. Best for professional, tech, and corporate roles in
  Germany/DACH and worldwide. Trigger phrases include: linkedin, linkedin jobs, jobs on
  linkedin, professional jobs, tech jobs germany, software engineer job berlin, product
  manager job, jobs in germany, stellenangebote linkedin, remote jobs, find me a job on
  linkedin.
context: fork
allowed-tools: Bash(bun run skills/linkedin-search/cli/src/cli.ts *)
---

# LinkedIn Search Skill

Search live job listings from **LinkedIn** via the Apify actor
`cheap_scraper/linkedin-job-scraper`. Broad professional/tech coverage in Germany/DACH
and globally.

## Requirements

Calls Apify — **requires `APIFY_TOKEN`** (`export APIFY_TOKEN="apify_api_..."` from
https://console.apify.com/account/integrations). ~$0.0007 per result. If unset, the CLI
exits with `{ "code": "NO_TOKEN" }`. Prefer the free `arbeitnow-search` when it suffices.

> **Billing note:** LinkedIn's actor bills a **minimum of 150 results per run** under
> pay-per-result, even if `--limit` is lower. Batch your searches accordingly.

## Commands

### Search

```bash
bun run skills/linkedin-search/cli/src/cli.ts search [flags]
```

Flags:
- `--query <text>` / `-q <text>` — **required** keyword (job title / skill)
- `--location <text>` / `-l <text>` — e.g. `"Berlin, Germany"`, `"München, Germany"`
- `--posted <1|7|30>` — only jobs posted within N days
- `--worktype <remote|hybrid|on-site>` — work arrangement filter
- `--limit <n>` / `-n <n>` — max results to return (default 25; see billing note)
- `--format json|table`

### Detail

```bash
bun run skills/linkedin-search/cli/src/cli.ts detail "<linkedin-job-url>" [--format plain|json]
```

## Examples

```bash
bun run skills/linkedin-search/cli/src/cli.ts search -q "data scientist" -l "Berlin, Germany" --posted 7 --worktype remote --format table
bun run skills/linkedin-search/cli/src/cli.ts search -q "product manager" -l "München, Germany" -n 25 --format table
```

## Notes

- Same normalized output shape as the other board skills (`id, title, company, location, date, salary, remote, url, source, description`).
- The actor pushes "error items" to the dataset on empty/failed runs (for fair billing); the shared driver filters items with no title/url before output.
- Errors print to stderr as `{ "error": "...", "code": "..." }`, exit code 1.
- See `url-reference.md` for the actor input mapping and alternatives.
