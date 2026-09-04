# Indeed — Apify actor reference

**Actor:** `kaix/indeed-scraper`
([store page](https://apify.com/kaix/indeed-scraper)) — 60+ fields, parsed salary,
hiring signals, 54 countries, ~$0.00008/result (~$0.06/1k), 99.9% success.

## REST endpoint

```
POST https://api.apify.com/v2/acts/kaix~indeed-scraper/run-sync-get-dataset-items?token=$APIFY_TOKEN
```

## CLI flag → actor input mapping

| CLI flag | Actor input | Notes |
|----------|-------------|-------|
| `--query` | `keyword` | **required** |
| `--location` | `location` | city / ZIP |
| `--country` | `country` | uppercased; **default `DE`** |
| `--posted` | `fromDays` | `1` \| `3` \| `7` \| `14` |
| `--remote` | `remote` | `remote` \| `hybrid` |
| `--jobtype` | `jobType` | `fulltime` \| `parttime` \| `contract` \| `temporary` \| `internship` |
| `--sort` | `sort` | `relevance` (default) \| `date` |
| `--limit` | `maxItems` | |
| (fixed) | `searchMode: "detailed"` | richer per-job fields |
| detail `<url>` | `jobKeys: [jk]` | extracts `jk=` / `/viewjob/<key>` from the URL |

> Note: Indeed cannot combine `fromDays` with `jobType`/`remote` filters; the source may
> ignore recency when both are set.

## Output fields consumed

`id`, `title.text`, `company.name`, `location.{formattedShort,formatted,city}`,
`dates.posted`, `salary.{text,min,max,currency,period}`,
`workArrangement.{isRemote,remoteWorkType}`, `urls.{indeed,external}`,
`description.text`, `snippet`. (Actor also emits company ratings, GPS, hiring signals,
benefits, requirements.)

## Alternatives (swap `actorId` in `cli/src/cli.ts`)

- `valig/indeed-jobs-scraper` — dead-simple inputs (`country`, `title`, `location`,
  `limit`), 100% success, ~$0.10/1k.
- `borderline/indeed-scraper` — most popular (14k users, 4.91★), rich filters, ~$5/1k.
