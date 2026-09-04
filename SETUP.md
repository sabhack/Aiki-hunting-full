# Setup Guide

Get the job-scraper template running.

## 1. Prerequisites

### Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```
You'll need an Anthropic API key or a Claude Pro/Team subscription — see the
[Claude Code docs](https://docs.anthropic.com/en/docs/claude-code).

### Bun (runs the job-board CLIs)
The board CLIs are TypeScript and run with Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Apify token (for Stepstone, Xing, LinkedIn, Glassdoor, Indeed — optional)
Arbeitnow uses a free public API and needs no credentials. The other five boards are
anti-bot protected, so those CLIs go through [Apify](https://apify.com) actors and need an
API token (pay-per-result, roughly $0.06–0.70 per 1,000 jobs):
```bash
export APIFY_TOKEN="apify_api_..."   # from https://console.apify.com/account/integrations
```
Add it to your shell profile (`~/.zshrc` / `~/.bashrc`) to persist. Without a token,
only Arbeitnow runs (plus a `WebSearch` fallback for the others).

### Python 3.10+ (optional — only for the salary tool)
```bash
python --version
```

## 2. Clone
```bash
git clone <your-fork-url>
cd <repo>
```

## 3. Install CLI dev tooling
The CLIs have no runtime deps (they use Bun's built-in `fetch`), but `bun install` sets up
TypeScript types:
```bash
for tool in arbeitnow-search stepstone-search xing-search linkedin-search glassdoor-search indeed-search; do
  cd .agents/skills/$tool/cli && bun install && cd ../../../..
done
```

Smoke test (Arbeitnow needs no token):
```bash
cd .agents
bun run skills/arbeitnow-search/cli/src/cli.ts search --query python --remote --limit 5 --format table
cd ..
```

## 4. Configure your profile & queries
Edit two files so the scraper knows what to look for:
- **`CLAUDE.md`** — your candidate profile (identity, skills, target sectors, deal-breakers).
- **`.claude/skills/job-scraper/search-queries.md`** — your target roles, keywords, locations,
  and any watched-company ATS feeds.

Or let Claude do it: start `claude` in the repo and say
*"Here's my CV @cv.pdf — fill in CLAUDE.md and search-queries.md for me."*

## 5. Run a scrape
Start Claude Code in the repo:
```bash
claude
```
Then:
```
/scrape            # Priority-1 roles, default location, free board (+ Apify if token set)
/scrape broad      # all six boards + DACH fan-out + watched ATS feeds
/scrape <keyword>  # focused search
```
Claude reads `seen_jobs.json`, runs the board CLIs, dedups, and presents new matches ranked
by fit. All fetched jobs (new + skipped) are written back to `seen_jobs.json` so the next
run only shows genuinely new postings.

## 6. Optional: salary benchmarking
If you have salary data:
```bash
pip install openpyxl
python tools/convert_salary_excel.py path/to/salary-data.xlsx --source "My data 2026"
```
This creates `salary_data.json` (see `tools/README_SALARY_TOOL.md` for the format).

## 7. Optional: schedule it
You can wire `/scrape broad` to a recurring cloud routine so it emails/drafts you matches on
a schedule. In Claude Code, use the schedule/routines feature and point it at your fork.

## Troubleshooting
- **Board CLIs not working:** ensure Bun is installed and you ran `bun install` in each CLI
  dir. Run CLIs from `.agents/` so the `skills/...` paths resolve.
- **`{ "code": "NO_TOKEN" }`:** that board needs `APIFY_TOKEN` exported. Arbeitnow works
  without one.
