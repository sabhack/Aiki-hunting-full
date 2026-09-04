# Aiki-hunting — Job Scraper Template

A clean, shareable **AI job-search scraper** for the German/DACH market, driven by
[Claude Code](https://docs.anthropic.com/en/docs/claude-code). It searches six job boards
plus watched-company ATS feeds, deduplicates across runs, and ranks new matches against
your profile — interactively or on a schedule.

> This is a **template**. Fork it, fill in your profile, and make it yours. It ships with no
> personal data — just the scraper machinery and example config to customize.

## What it does

- Searches **six boards** — Arbeitnow (free), Stepstone, Indeed, LinkedIn, Xing, Glassdoor —
  through portable Bun CLIs that all emit the same normalized JSON.
- Fetches **watched-company ATS feeds** (Greenhouse / SmartRecruiters / Personio / …) directly.
- **Deduplicates** every run against `job_scraper/seen_jobs.json` so you only see new postings.
- **Ranks fit** (high / medium / low) against the profile in `CLAUDE.md`.
- Optional: **salary benchmarking** and a CSV **application tracker**.

## Quick start

1. **Fork & clone** this repo.
2. Install prerequisites and configure — see **[SETUP.md](SETUP.md)**.
3. Edit **`CLAUDE.md`** (your profile) and **`.claude/skills/job-scraper/search-queries.md`**
   (your roles, keywords, locations, ATS feeds) — or ask Claude to fill them from your CV.
4. In the repo, run `claude`, then `/scrape` or `/scrape broad`.

## Boards

| Board | Auth | Best for |
|-------|------|----------|
| **Arbeitnow** | none (free) | tech, startup, remote, English-speaking, visa-sponsorship roles |
| **Stepstone** | `APIFY_TOKEN` | broad coverage, all sectors, Germany's largest board |
| **Indeed** | `APIFY_TOKEN` | broadest aggregator, deep German coverage, cheapest |
| **LinkedIn** | `APIFY_TOKEN` | professional / tech / corporate (bills min 150 results/run) |
| **Xing** | `APIFY_TOKEN` | professional / management roles, DACH-wide |
| **Glassdoor** | `APIFY_TOKEN` | listings with company ratings + salary data |

Arbeitnow always runs for free; the other five use pay-per-result [Apify](https://apify.com)
actors and run only when `APIFY_TOKEN` is set.

## Structure

```
.agents/skills/            # job-board search CLIs (Bun/TypeScript)
.claude/skills/job-scraper/  # the scraper skill (SKILL.md) + search-queries.md
job_scraper/seen_jobs.json # dedup baseline (starts {"seen": {}})
job_search_tracker.csv     # optional application tracker (header only)
tools/, salary_lookup.py   # optional salary-benchmark helpers
CLAUDE.md                  # your profile (drives fit assessment)
SETUP.md                   # full setup guide
```

## Credit

Job-board CLI framework based on the open-source
[ai-job-search](https://github.com/MadsLorentzen/ai-job-search) template. See `LICENSE`.
