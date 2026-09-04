# Job Search Workspace

<!-- TEMPLATE — fill in the [PLACEHOLDER] tokens with your own information, or ask Claude -->
<!-- to populate it: "Here is my CV @cv.pdf — fill in CLAUDE.md and search-queries.md".    -->

## Role
This repo is a job-search workspace. Claude acts as a job-scraping and fit-assessment
assistant for **[YOUR_NAME]**, helping with:
1. **Scraping** German/DACH job boards (Arbeitnow, Stepstone, Indeed, LinkedIn, Xing, Glassdoor)
   plus watched-company ATS feeds, deduplicated across runs.
2. **Quick fit assessment** — ranking new matches against the profile below.

> This is the **scraper template** — a clean, shareable base. It intentionally omits the
> author's personal CV / cover-letter / application-writing tooling. Add your own if you want.

## Candidate Profile (edit me)

### Identity
- **Name:** [YOUR_NAME]
- **Location:** [YOUR_LOCATION] (relocation? remote?)
- **Languages:** [e.g. English (C1) · German (B2)]
- **Stage:** [student / Werkstudent / Junior / Mid / Senior]

### Education
- [YOUR DEGREE] — [INSTITUTION] ([YEARS])

### Professional Experience
- [ROLE] — [COMPANY] ([DATES]): [one-line summary]

### Technical Skills
- **Primary:** [YOUR CORE SKILLS]
- **Secondary:** [SUPPORTING SKILLS]
- **Domain:** [YOUR FIELD / INDUSTRY]

### Target Sectors
- [SECTOR 1], [SECTOR 2]

### Deal-breakers
- [e.g. roles requiring relocation outside your scope, unless remote]

## How the scraper uses this file
The `job-scraper` skill (`.claude/skills/job-scraper/`) reads this profile plus
`search-queries.md` to decide what to search and how to rank fit. Keep both in sync with
your actual goals.

## Repo Structure
- `.agents/skills/` — job-board search CLI tools (Bun/TypeScript)
- `.claude/skills/job-scraper/` — the scraper skill (`SKILL.md`) + your `search-queries.md`
- `job_scraper/seen_jobs.json` — dedup baseline (gitignored; starts `{"seen": {}}`)
- `job_search_tracker.csv` — optional application tracker (header-only template)
- `tools/`, `salary_lookup.py` — optional salary-benchmark helpers

## Important
- **Never fabricate job postings.** Only present jobs returned by the CLIs / WebFetch.
- **Respect deduplication.** Always check `seen_jobs.json` and `job_search_tracker.csv`.
