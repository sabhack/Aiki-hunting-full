# Job Scraper

**name:** job-scraper
**description:** Scrapes German/DACH job boards (Arbeitnow, Stepstone, Xing) for new positions matching your profile. Deduplicates across runs. Triggers on: job scrape, find jobs, search jobs, new jobs, job search, scrape jobs, stellensuche, /scrape
**allowed-tools:** Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent, AskUserQuestion

---

## How It Works

This skill searches the German job market across three boards, deduplicates against
previously seen jobs and the application tracker, and presents new matches with a quick
fit assessment.

The six board CLIs (under `.agents/skills/`) are the primary search mechanism. All emit
the **same normalized JSON** and share an Apify driver (`_shared/jobs.ts`):

| Board | CLI | Auth | Best for |
|-------|-----|------|----------|
| **Arbeitnow** | `arbeitnow-search` | none (free) | tech, startup, remote, English-speaking, visa-sponsorship roles |
| **Stepstone** | `stepstone-search` | `APIFY_TOKEN` | broad coverage, all sectors/seniorities, Germany's largest board |
| **Xing** | `xing-search` | `APIFY_TOKEN` | professional / management roles, DACH-wide |
| **LinkedIn** | `linkedin-search` | `APIFY_TOKEN` | professional / tech / corporate roles (bills min 150 results/run) |
| **Glassdoor** | `glassdoor-search` | `APIFY_TOKEN` | listings with company ratings + salary data |
| **Indeed** | `indeed-search` | `APIFY_TOKEN` | broadest aggregator, deep German coverage (indeed.de), cheapest |

**Always run Arbeitnow** (it's free). Run the Apify boards **only if `APIFY_TOKEN` is
set** — otherwise note they were skipped and fall back to `WebSearch` for those boards.
By default, don't run all five Apify boards every time: pick 2–3 most relevant to the
focus (e.g. Stepstone+Indeed for broad German coverage, LinkedIn+Xing for professional
roles, Glassdoor when pay/reputation matters). Run all on "broad".

---

## Invocation

The user triggers this skill by saying things like "Find new jobs", "Scrape for jobs",
"Any new positions?", or "/scrape".

Optional arguments:
- A focus area, e.g. "/scrape data science" or "/scrape product manager"
- "broad" to widen queries and raise limits, e.g. "/scrape broad"

---

## Execution Steps

### Step 0: Load State

1. Read `job_scraper/seen_jobs.json` (create if missing — start with `{"seen": {}}`)
2. Read `job_search_tracker.csv` to extract already-applied companies+roles
3. Read `search-queries.md` (this directory) for the queries, locations, and boards
4. Check whether `APIFY_TOKEN` is set: `bash -c 'echo ${APIFY_TOKEN:+set}'`. If empty,
   only Arbeitnow runs as a CLI; mark Stepstone/Xing as token-gated.

### Step 1: Search via the board CLIs

Run from the `.agents/` directory (so the `skills/...` paths resolve). Use the queries
and location terms from `search-queries.md`. Run the top categories by default; with
"broad", run all categories and raise `--limit`.

```bash
# Arbeitnow (free) — always run
bun run skills/arbeitnow-search/cli/src/cli.ts search --query "<role/skill>" --location "<city>" --limit 25 --format json

# Stepstone (needs APIFY_TOKEN)
bun run skills/stepstone-search/cli/src/cli.ts search --query "<role/skill>" --location "<city-slug>" --posted 7 --limit 25 --format json

# Xing (needs APIFY_TOKEN)
bun run skills/xing-search/cli/src/cli.ts search --query "<role/skill>" --location "<city>" --discipline "<field>" --limit 20 --format json

# LinkedIn (needs APIFY_TOKEN; bills min 150 results/run)
bun run skills/linkedin-search/cli/src/cli.ts search --query "<role/skill>" --location "<city>, Germany" --posted 7 --limit 25 --format json

# Glassdoor (needs APIFY_TOKEN; --location required; no detail command)
bun run skills/glassdoor-search/cli/src/cli.ts search --query "<role/skill>" --location "<city>, Germany" --posted 14 --limit 25 --format json

# Indeed (needs APIFY_TOKEN; defaults to country=DE)
bun run skills/indeed-search/cli/src/cli.ts search --query "<role/skill>" --location "<city>" --posted 7 --limit 25 --format json
```

All three emit the **same JSON shape**: `{ jobs: [{ id, title, company, location, date,
salary, remote, url, source, description }], meta: {...} }`. Errors go to **stderr** as
`{ "error": "...", "code": "..." }` with exit code 1 — if a CLI errors (e.g. `NO_TOKEN`),
note it and continue with the boards that worked.

Run independent CLI calls in parallel where possible. For boards you can't reach via CLI
(token unset), fall back to `WebSearch` with `site:stepstone.de`, `site:xing.com`,
`site:de.linkedin.com/jobs`, `site:de.indeed.com`, or `site:glassdoor.de` queries.

**Interactive shortcut:** in a session with the Apify MCP connected, you may instead call
the actors directly (`call-actor` / `run-sync-get-dataset-items`) — same actor IDs as the
CLIs (see each board's `url-reference.md`). The CLIs remain the portable, committed path.

### Step 2: Merge, Filter & Parse

- Merge the `jobs` arrays from all boards into one list (keep `source`).
- Drop jobs whose `location` is outside the configured commute area (see
  `search-queries.md` → Location Filter), unless `remote`.
- Drop jobs older than 14 days when a `date` is present.
- Skip any job whose `url`, or `company`+`title` combo, already exists in
  `seen_jobs.json` or `job_search_tracker.csv`.
- For a promising job that needs more detail, call the board's `detail` command.

### Step 3: Quick Fit Assessment

Rapid signal only, judged against the profile in `CLAUDE.md`:
- **High** — role directly involves your core skills
- **Medium** — adjacent to your experience
- **Low** — requires significant skills you lack

### Step 4: Deduplicate & Store

Add ALL fetched jobs (new and skipped) to `seen_jobs.json`:

```json
{
  "seen": {
    "<url_or_company_title_key>": {
      "title": "...",
      "company": "...",
      "source": "arbeitnow|stepstone|xing",
      "url": "...",
      "first_seen": "YYYY-MM-DD",
      "fit": "high/medium/low",
      "status": "new/skipped/evaluated"
    }
  }
}
```

Only present jobs NOT already in the seen list or tracker.

### Step 5: Present Results

Present new jobs in a table sorted by fit (high first):

```
## New Job Matches - YYYY-MM-DD

Found X new positions (Y high, Z medium, W low match) across N boards.

| # | Fit | Title | Company | Location | Source | Date | URL |
|---|-----|-------|---------|----------|--------|------|-----|
| 1 | High | ... | ... | ... | Arbeitnow | ... | [Link](...) |

### High-Match Highlights
For each high-match job, add 2-3 bullet points:
- Why it matches your profile
- Key requirements to check
- Any red flags
```

Then ask:
> "Want me to evaluate any of these in detail? Just give me the number(s)."

If the user picks a number, do a deeper fit review against `CLAUDE.md` (requirements,
gaps, red flags). Wiring up CV / cover-letter generation is left to you — this template
ships the scraper only.

### Step 6: Update Tracker (Optional)

If the user decides to apply, add a row to `job_search_tracker.csv`.

---

## Important Rules

1. **Never fabricate job postings.** Only present jobs returned by the CLIs or actual
   WebSearch/WebFetch results.
2. **Respect deduplication.** Always check `seen_jobs.json` AND `job_search_tracker.csv`.
3. **Focus on the configured area.** Skip jobs outside commute range unless remote.
4. **Only open positions.** Skip expired/closed postings.
5. **Prefer the free board.** Always run Arbeitnow; only spend Apify credits (Stepstone,
   Xing) when `APIFY_TOKEN` is set and broader coverage is needed.
6. **Parallelize.** Run the board CLIs concurrently to speed up the search phase.
