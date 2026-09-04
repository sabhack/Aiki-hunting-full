# Glassdoor — Apify actor reference

**Actor:** `valig/glassdoor-jobs-scraper`
([store page](https://apify.com/valig/glassdoor-jobs-scraper)) — keyword search with
company ratings + salary, ~$0.0004/result, 99.9% success.

## REST endpoint

```
POST https://api.apify.com/v2/acts/valig~glassdoor-jobs-scraper/run-sync-get-dataset-items?token=$APIFY_TOKEN
```

## CLI flag → actor input mapping

| CLI flag | Actor input | Notes |
|----------|-------------|-------|
| `--query` | `keywords` (string) | **required** |
| `--location` | `location` (string) | **required** by the actor |
| `--posted` | `daysOld` (int) | max age in days |
| `--remote` | `remoteWorkType` (bool) | |
| `--minrating` | `minRating` (number) | 0.0–5.0 |
| `--sort` | `sortBy` | `date`→`date_desc`, else `relevant_desc` |
| `--limit` | `limit` (int) | |

No URL-based detail (the actor has no `startUrl` input) → `detail` returns `UNSUPPORTED`.

## Output fields consumed

`id`, `title`, `url`, `description`, `rating`, `ageInDays`, `employer{name,url}`,
`location{name}`, `pay{min,max,currency,period}`.

## Alternatives (swap `actorId` in `cli/src/cli.ts`)

- `silentflow/glassdoor-jobs-scraper-ppr` — 30+ fields, seniority/industry/size filters,
  multi-keyword, 23 countries, ~$3.5/1k.
- `truefetch/glassdoor-job-listing` — 60+ countries, culture/CEO-approval fields,
  ~$4.5/1k.
