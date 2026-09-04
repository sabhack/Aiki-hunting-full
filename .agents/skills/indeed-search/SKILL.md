---
name: indeed-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search Indeed for jobs, even if they don't
  say indeed.com explicitly. Indeed is one of the largest job aggregators worldwide with
  deep coverage of the German market (indeed.de). Trigger phrases include: indeed, indeed
  jobs, jobs on indeed, jobs in germany, job in deutschland, stellenangebote, jobsuche,
  software job berlin, warehouse job, part time job, full time job, jobs near me,
  hiring now germany.
context: fork
allowed-tools: Bash(bun run skills/indeed-search/cli/src/cli.ts *)
---

# Indeed Search Skill

Search live job listings from **Indeed** via the Apify actor `kaix/indeed-scraper`.
Indeed is the broadest aggregator and has deep German coverage (indeed.de). Defaults to
the German site (`country=DE`).

## Requirements

Calls Apify — **requires `APIFY_TOKEN`** (~$0.00008 per result — the cheapest board).
If unset, the CLI exits with `{ "code": "NO_TOKEN" }`.

## Commands

### Search

```bash
bun run skills/indeed-search/cli/src/cli.ts search [flags]
```

Flags:
- `--query <text>` / `-q <text>` — **required** keyword (title / skill / company)
- `--location <text>` / `-l <text>` — city / ZIP, e.g. `Berlin`, `München`
- `--country <code>` — Indeed country site (default `de`; e.g. `at`, `ch`, `us`)
- `--posted <1|3|7|14>` — only jobs posted within N days
- `--remote <remote|hybrid>` — work-arrangement filter
- `--jobtype <fulltime|parttime|contract|temporary|internship>`
- `--sort <relevance|date>` — sort order (default relevance)
- `--limit <n>` / `-n <n>` — max results (default 25)
- `--format json|table`

### Detail

```bash
bun run skills/indeed-search/cli/src/cli.ts detail "https://de.indeed.com/viewjob?jk=<key>" [--format plain|json]
```

Looks the job up by its Indeed key (`jk=...`) — useful for checking whether a posting
is still active.

## Examples

```bash
bun run skills/indeed-search/cli/src/cli.ts search -q "software engineer" -l Berlin --posted 7 --remote remote --format table
bun run skills/indeed-search/cli/src/cli.ts search -q "lagerist" -l "München" --jobtype fulltime --format table
```

## Notes

- Same normalized output shape as the other board skills. `remote` comes from the
  actor's `workArrangement.isRemote`; `salary` from parsed `salary.text`/range.
- `--posted` cannot be combined with `--jobtype`/`--remote` on Indeed's side; if you set
  both, recency filtering may be ignored by the source.
- Uses `searchMode: "detailed"` for richer per-job data.
- Errors print to stderr as `{ "error": "...", "code": "..." }`, exit code 1.
- See `url-reference.md` for the actor input mapping and alternatives.
