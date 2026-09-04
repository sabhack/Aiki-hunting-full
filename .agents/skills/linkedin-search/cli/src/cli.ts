#!/usr/bin/env bun
// LinkedIn job search CLI — adapter over the shared Apify driver.
// Actor: cheap_scraper/linkedin-job-scraper. Requires APIFY_TOKEN.
//
//   bun run src/cli.ts search --query "data scientist" --location "Berlin, Germany" --posted 7 --worktype remote --limit 25
//   bun run src/cli.ts detail "https://www.linkedin.com/jobs/view/123456789"

import { requireFlag, runCli, str, num, type BoardAdapter, type JobCard } from "../../../_shared/jobs.js"

interface LinkedInJob {
  jobId: string
  jobTitle: string
  companyName: string | null
  location: string | null
  jobUrl: string
  applyUrl: string | null
  publishedAt: string | null
  postedTime: string | null
  jobDescription: string | null
  workType: string | null
  salaryInfo: string[] | null
}

// LinkedIn's "published at" filter uses relative-seconds codes.
const POSTED_CODES: Record<string, string> = { "1": "r86400", "7": "r604800", "30": "r2592000" }

const adapter: BoardAdapter<LinkedInJob> = {
  source: "linkedin",
  actorId: "cheap_scraper~linkedin-job-scraper",
  shortFlags: { q: "query", l: "location", n: "limit" },

  buildSearchInput(flags) {
    const query = requireFlag(flags, "query")
    const location = str(flags, "location")
    const posted = str(flags, "posted") // 1 | 7 | 30
    const worktype = str(flags, "worktype") // remote | hybrid | on-site
    const limit = num(flags, "limit", 25)
    // The actor bills (and requires) a minimum of 150 results per run; asking for fewer
    // returns HTTP 400. Floor maxItems at 150 and slice to --limit client-side downstream.
    const input: Record<string, unknown> = { keyword: [query], maxItems: Math.max(limit, 150) }
    if (location) input.location = location
    if (posted && POSTED_CODES[posted]) input.publishedAt = POSTED_CODES[posted]
    if (worktype) input.workType = [worktype]
    return { input, limit, meta: { query, location: location ?? null, publishedAt: input.publishedAt ?? null } }
  },

  buildDetailInput(url) {
    return { startUrls: [{ url }], maxItems: 1 }
  },

  mapJob(j): JobCard {
    const wt = (j.workType || "").toLowerCase()
    return {
      id: j.jobId || "",
      title: j.jobTitle,
      company: j.companyName || null,
      location: j.location || null,
      date: j.publishedAt || j.postedTime || null,
      salary: j.salaryInfo && j.salaryInfo.length ? j.salaryInfo.join(", ") : null,
      remote: /remote|hybrid/.test(wt) ? wt : null,
      url: j.jobUrl,
      source: "linkedin",
      description: j.jobDescription ? j.jobDescription.slice(0, 300) : null,
    }
  },
}

runCli(adapter)
