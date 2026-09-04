# Stepstone — Apify actor reference

**Actor:** `memo23/stepstone-search-cheerio-ppr`
([store page](https://apify.com/memo23/stepstone-search-cheerio-ppr)) — pure-HTTP
Stepstone scraper, ~$0.001/result, residential proxy.

## REST endpoint used by the CLI

```
POST https://api.apify.com/v2/acts/memo23~stepstone-search-cheerio-ppr/run-sync-get-dataset-items?token=$APIFY_TOKEN
Content-Type: application/json
```

`run-sync-get-dataset-items` blocks until the run finishes and returns the dataset
items array directly (no separate polling/dataset fetch needed).

## CLI flag → actor input mapping

| CLI flag | Actor input field | Notes |
|----------|-------------------|-------|
| `--query` | `keyword` | Builds `https://www.stepstone.de/work/{keyword}/in-{location}` |
| `--location` | `location` | Slug segment, e.g. `berlin`; defaults to `deutschland` |
| `--posted` | `postedWithin` | enum `all` \| `1` \| `3` \| `7` (days) |
| `--limit` | `maxItems` | also client-side truncates the result array |
| (fixed) | `includeRelatedJobs: false` | drops padded "recommended" non-matches |
| detail `<url>` | `startUrls: [{ url }]` | crawls the URL as-is, ignores keyword/location |

## Output fields consumed

`id`, `title`, `companyName`, `location`, `salary`, `datePosted`, `url`,
`textSnippet`, `workFromHome`, `section`. The actor emits ~40 fields total (labels,
skills, partnership flags, harmonised salary ranges); the CLI maps the subset above to
the shared `JobCard` shape. To use more fields, extend `StepstoneJob` and `toJobCard`
in `cli/src/helpers.ts`.

## Alternatives (swap `ACTOR_ID` in helpers.ts)

- `santamaria-automations/stepstone-de-scraper` — adds Bundesland, experience level,
  `includeJobDetails`, optional LLM extraction.
- `fatihtahta/stepstone-scraper-fast-reliable-4-1k` — rich filters (remote, employment
  type, experience), .de/.at/.be/.nl domains.
