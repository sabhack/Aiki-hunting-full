#!/usr/bin/env bun
// Xing job search CLI — adapter over the shared Apify driver.
// Actor: shahidirfan/Xing-Jobs-Scraper. Requires APIFY_TOKEN.
//
//   bun run src/cli.ts search --query "data analyst" --location Berlin --discipline Technology --limit 20
//   bun run src/cli.ts detail "https://www.xing.com/jobs/..."

import { requireFlag, runCli, str, num, type BoardAdapter, type JobCard } from "../../../_shared/jobs.js"

interface XingJob {
  job_id: string | null
  slug: string | null
  title: string
  company: string | null
  location: string | null
  salary: string | null
  date_posted: string | null
  url: string
  job_type: string | null
  description_text: string | null
}

const adapter: BoardAdapter<XingJob> = {
  source: "xing",
  actorId: "shahidirfan~Xing-Jobs-Scraper",
  shortFlags: { q: "query", l: "location", d: "discipline", n: "limit" },

  buildSearchInput(flags) {
    const query = requireFlag(flags, "query")
    const location = str(flags, "location")
    const discipline = str(flags, "discipline")
    const limit = num(flags, "limit", 20)
    const maxPages = num(flags, "maxpages", 20)
    const input: Record<string, unknown> = { keyword: query, results_wanted: limit, max_pages: maxPages }
    if (location) input.location = location
    if (discipline) input.discipline = discipline
    return { input, limit, meta: { query, location: location ?? null, discipline: discipline ?? null } }
  },

  buildDetailInput(url) {
    return { startUrl: url, results_wanted: 1, max_pages: 1 }
  },

  mapJob(j, full): JobCard {
    const remoteHint = `${j.title} ${j.job_type ?? ""}`
    const text = (j.description_text ?? "").replace(/\s+/g, " ").trim()
    return {
      id: j.job_id || j.slug || "",
      title: j.title,
      company: j.company || null,
      location: j.location || null,
      date: j.date_posted || null,
      salary: j.salary || null,
      remote: /remote|homeoffice|home office/i.test(remoteHint) ? "remote" : null,
      url: j.url,
      source: "xing",
      description: full ? text || null : text ? text.slice(0, 300) : null,
    }
  },
}

runCli(adapter)
