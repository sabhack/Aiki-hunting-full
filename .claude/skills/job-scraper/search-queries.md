# Search Queries for Job Scraper

<!-- TEMPLATE — customize this file for your own profile. Replace the [PLACEHOLDER] values -->
<!-- and the example query categories below with your target roles, keywords, and locations. -->
<!-- You can also let Claude fill this in: run `/setup --section search` (if you added the    -->
<!-- setup command) or just ask "configure my job search queries" and share your CV.          -->

## Profile summary (edit me)

- **Target roles:** [YOUR TARGET ROLES, e.g. "backend engineer", "UX designer"]
- **Core skills / keywords:** [YOUR KEY SKILLS]
- **Stage:** [Werkstudent / Praktikum / Junior / Mid / Senior — whichever apply]
- **Scope:** [e.g. "all of Germany + remote", or a specific city + commute radius]

## Location config

> Set your scope here. The example is **all of Germany + remote, with DACH (AT/CH) as an extension**.
- **Stepstone:** `--location deutschland` (nationwide) or a city slug.
- **LinkedIn:** `--location "Germany"` (add `"Austria"` / `"Switzerland"` for DACH).
- **Indeed:** `--country de` by default; for DACH also run `--country at` and `--country ch`.
- **Arbeitnow & Xing:** run **without** a location flag — both are already DACH/EU-wide.
- **Remote:** use `--remote` (Arbeitnow/Indeed) or `--worktype remote` (LinkedIn) for
  remote-only passes; otherwise remote roles still surface in nationwide searches.
- **DACH on demand:** fan out to AT/CH only on `/scrape broad` or when asked, to avoid 3×
  Apify cost per run.

## Search Boards

Run via the board CLIs in `.agents/skills/` (all emit the same JSON shape). **Arbeitnow**
always (free); **Stepstone + Indeed** for broad German coverage; **LinkedIn + Xing** for
professional roles; **Glassdoor** when pay/reputation matters. Prioritize the 2–3 boards
where your target employers actually post.

## Languages

Search **both German and English** terms — German postings often use English role titles
but German stage terms ("Werkstudent", "Praktikum"). List both in each category below.

## Query Categories

> These are **examples** (a robotics/mechatronics profile). Replace them with your own.

### Priority 1: Core role (primary target)

```
[core role EN]        | [core role DE]
[specialization A]    | [specialization A DE]
[specialization B]    | [specialization B DE]
```

Per-board examples (nationwide):
```
arbeitnow:  --query "robotics" --limit 30          # single strong term: Arbeitnow AND-matches all words
stepstone:  --query "robotics engineer" --location deutschland --posted 14
indeed:     --query "robotics engineer" --country de --posted 14
linkedin:   --query "mechatronics engineer" --location "Germany" --posted 7
glassdoor:  --query "robotics engineer" --location "Germany" --posted 14
xing:       --query "Robotik" --discipline "Engineering"
```

DACH fan-out (run on `/scrape broad` and scheduled runs):
```
indeed:     --query "robotics engineer" --country at --posted 14
indeed:     --query "robotics engineer" --country ch --posted 14
linkedin:   --query "mechatronics engineer" --location "Austria" --posted 7
linkedin:   --query "mechatronics engineer" --location "Switzerland" --posted 7
# Xing & Arbeitnow are already DACH/EU-wide — no extra location pass needed.
```

### Priority 2: Stage-specific (Werkstudent / Praktikum / Junior — if relevant)

```
Werkstudent [field]   | Praktikum [field]   | Junior [role]   | Absolvent / Berufseinsteiger
working student [field] | internship [field] | graduate [role]
```

### Priority 3: Related / adjacent roles (domain expansion)

```
[adjacent role 1] | [adjacent role 2] | [adjacent role 3]
[transferable-skill role] | [tooling-based role]
```

> **Skip / down-rank:** role types outside your profile (edit this list for your field).

## Location Filter (when evaluating results)

Define which locations are acceptable. Example tiers:
- Anywhere in **Germany** — acceptable
- **Remote / hybrid** — acceptable
- **Austria / Switzerland** — acceptable on DACH runs; otherwise flag, don't auto-drop
- Outside your scope — drop unless fully remote

## Date Filter

Prefer jobs posted within the last 14 days (`--posted 7/14`). Widen niche terms to 30 days.
Skip postings with expired deadlines.

## Role-level Filter

List the seniority terms to **include** (e.g. Werkstudent, Praktikum, Junior, Absolvent,
Graduate, Trainee) and which to **de-prioritize** (e.g. Senior/Lead/Principal) for your stage.

## Adapting Queries

- "/scrape" → Priority 1 (+2 if relevant), default location, free board + Apify if token set.
- "/scrape broad" → all priorities, **all six boards** + DACH fan-out.
- "/scrape <keyword>" → that keyword + the 2–3 most related lines above.

### Scheduled runs

If you wire this to a scheduled cloud routine, the scheduled run is typically the **broad**
run (all boards + DACH fan-out). Note: LinkedIn bills a minimum ~150 results/run and
Glassdoor ~$0.40/1k, so each scheduled run spends a few cents of Apify credit.

### Watched company career boards (ATS) — fetch directly every scheduled run

Some target employers don't index well on job boards but expose a public ATS JSON/XML feed.
On scheduled/broad runs, fetch each URL directly (WebFetch/curl), then apply the SAME
relevance + date + dedup filters as the boards. **These are examples — replace with your own
target employers' ATS feeds** (common providers: Greenhouse, SmartRecruiters, Personio,
Lever, Ashby):

| Company | Domain | ATS feed |
|---------|--------|----------|
| Isar Aerospace | aerospace | https://boards-api.greenhouse.io/v1/boards/isaraerospace/jobs?content=true |
| Brainlab | medical robotics | https://api.smartrecruiters.com/v1/companies/brainlab/postings?limit=100 |
| MOIA | autonomous driving | https://boards-api.greenhouse.io/v1/boards/moia/jobs?content=true |
| Wandelbots | industrial robotics | https://wandelbots.jobs.personio.de/xml |

Add new ATS feeds here as you discover them. To find a company's feed, check its careers
page for a `greenhouse.io`, `smartrecruiters.com`, `personio.de`, `lever.co`, or `ashbyhq.com`
URL, then hit that provider's public API pattern.
