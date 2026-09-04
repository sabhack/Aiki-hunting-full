# Xing — Apify actor reference

**Actor:** `shahidirfan/Xing-Jobs-Scraper`
([store page](https://apify.com/shahidirfan/Xing-Jobs-Scraper)) — uses Xing's GraphQL
search + detail endpoints internally, ~$0.0012/result, 99.6% success rate.

## REST endpoint used by the CLI

```
POST https://api.apify.com/v2/acts/shahidirfan~Xing-Jobs-Scraper/run-sync-get-dataset-items?token=$APIFY_TOKEN
Content-Type: application/json
```

## CLI flag → actor input mapping

| CLI flag | Actor input field | Notes |
|----------|-------------------|-------|
| `--query` | `keyword` | job title / skill |
| `--location` | `location` | city or region |
| `--discipline` | `discipline` | e.g. `Technology`, `Marketing`, `Finance` |
| `--limit` | `results_wanted` | also client-side truncates |
| `--maxpages` | `max_pages` | safety cap on search pages |
| detail `<url>` | `startUrl` | derives keyword/location from the URL |

## Output fields consumed

`job_id`, `slug`, `title`, `company`, `location`, `salary`, `date_posted`, `url`,
`apply_url`, `employment_type_id`, `job_type`, `career_level_id`, `description_text`.
The actor emits many more (structured `salary_raw`, `company_industry`, `company_size`,
`description_html`, social URLs, tracking tokens); the CLI maps the subset above to the
shared `JobCard` shape. Extend `XingJob` and `toJobCard` in `cli/src/helpers.ts` to use
more.

## Alternatives (swap `ACTOR_ID` in helpers.ts)

- `memo23/xing-scraper` — jobs + companies + profiles, careerLevel/salary/Kununu data,
  $1.19/1k.
- `fatihtahta/xing-jobs-scraper` — seniority/workplace/employment-type filters, optional
  enrichment add-on.
