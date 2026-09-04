# LinkedIn — Apify actor reference

**Actor:** `cheap_scraper/linkedin-job-scraper`
([store page](https://apify.com/cheap_scraper/linkedin-job-scraper)) — keyword + filter
search with dedup, ~$0.0007/result, 98.4% success.

## REST endpoint

```
POST https://api.apify.com/v2/acts/cheap_scraper~linkedin-job-scraper/run-sync-get-dataset-items?token=$APIFY_TOKEN
```

## CLI flag → actor input mapping

| CLI flag | Actor input | Notes |
|----------|-------------|-------|
| `--query` | `keyword` (array) | wrapped as `[query]` |
| `--location` | `location` (string) | `"Berlin, Germany"` |
| `--posted` | `publishedAt` | `1`→`r86400`, `7`→`r604800`, `30`→`r2592000` |
| `--worktype` | `workType` (array) | `remote` \| `hybrid` \| `on-site` |
| `--limit` | `maxItems` | **min 150 billed** per run (PPR); driver slices output to `--limit` |
| detail `<url>` | `startUrls: [{ url }]` | |

## Output fields consumed

`jobId`, `jobTitle`, `companyName`, `location`, `jobUrl`, `applyUrl`, `publishedAt`,
`postedTime`, `jobDescription`, `workType`, `salaryInfo[]`. (Also available:
`experienceLevel`, `contractType`, `sector`, `companyUrl`, keyword-match scoring.)

## Alternatives (swap `actorId` in `cli/src/cli.ts`)

- `fantastic-jobs/advanced-linkedin-job-search-api` — real-time 10M-job DB, 36 filters
  (title/description/seniority/industry), 100% success, ~$5/1k. Best for precise,
  large-scale filtering.
- `curious_coder/linkedin-jobs-scraper` — most popular (100k+ users) but URL-driven
  (`urls` input), no keyword search.
