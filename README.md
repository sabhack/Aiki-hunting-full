# Aiki-hunting-full

Full-time robotics/mechatronics job hunt for **Muhammad Idris** (DACH), driven by a
weekly Claude Code cloud routine. This is the full-time counterpart to the internship-era
hunt — same machinery, opposite stage filter.

## What runs

A scheduled cloud routine (`job-search-fulltime-weekly`) fires **every Monday at 08:00
Europe/Berlin** and:

1. Reads `job_scraper/seen_jobs.json` as the dedup baseline.
2. Scrapes six boards (Arbeitnow, Stepstone, Indeed DE/AT/CH, LinkedIn, Glassdoor, Xing)
   plus watched-company ATS feeds (Isar Aerospace, Brainlab, MOIA, Wandelbots) over a
   ~10-day window, so each Monday run captures everything posted across the prior week.
3. Keeps **full-time only** roles in **DACH** (see filters below) and ranks fit
   (broad robotics = HIGH; adjacent engineering = MEDIUM).
4. Updates `seen_jobs.json` and creates a **Gmail draft** (never sends) to the candidate
   with the new matches.

The routine prompt is self-contained — it does not depend on skill files in this repo.

## Filters

- **Stage:** full-time / permanent / entry-to-mid only (Festanstellung, unbefristet,
  Vollzeit, Direkteinstieg, Absolvent, Graduate, Junior). Excludes Werkstudent, Praktikum,
  Intern, Ausbildung, dual study, Thesis/Masterarbeit, and leadership-only roles.
- **Location:** Germany + Austria + Switzerland (on-site/hybrid; remote only if DACH-based).
- **Fit:** HIGH = ROS 2, AMR/AGV, robotics software (C++/Python), perception/SLAM,
  sensor fusion, controls, digital twin, simulation/sim-to-real (Omniverse/Isaac Sim/
  Gazebo/Unity), embedded robotics. MEDIUM = adjacent embedded/automation/test/systems.

## Files

- `job_scraper/seen_jobs.json` — deduplication baseline. Keyed by job URL/id, each entry
  records `first_seen`, `fit`, and `status` (`new`/`skipped`). Starts empty `{}`.
  Tracked in git (not gitignored) so the baseline persists between runs.

## Note on persistence

The cloud routine can only push its `seen_jobs.json` updates back here if the Claude
GitHub app is authorized for the `sabhack` org. Until then, commits made in the cloud
session are local to that run and this baseline must be maintained manually.
