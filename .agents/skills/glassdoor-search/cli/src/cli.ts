#!/usr/bin/env bun
// Glassdoor job search CLI — adapter over the shared Apify driver.
// Actor: valig/glassdoor-jobs-scraper. Requires APIFY_TOKEN.
//
//   bun run src/cli.ts search --query "product manager" --location "Berlin, Germany" --posted 14 --minrating 3.5 --limit 25
//
// Note: this board has no URL-based `detail` command (the actor searches by keyword,
// not by job URL). Use `search` and read the inline description / open the URL.

import { requireFlag, runCli, str, num, bool, type BoardAdapter, type JobCard } from "../../../_shared/jobs.js"

interface GlassdoorJob {
  id: number
  title: string
  url: string
  description: string | null
  rating: number | null
  ageInDays: number | null
  employer: { name: string | null; url: string | null } | null
  location: { name: string | null } | null
  pay: { min: number | null; max: number | null; currency: string | null; period: string | null } | null
}

function formatPay(pay: GlassdoorJob["pay"]): string | null {
  if (!pay || (pay.min == null && pay.max == null)) return null
  const cur = pay.currency ?? ""
  const range = pay.min != null && pay.max != null ? `${pay.min}–${pay.max}` : `${pay.min ?? pay.max}`
  return `${range} ${cur}${pay.period ? "/" + pay.period : ""}`.trim()
}

const adapter: BoardAdapter<GlassdoorJob> = {
  source: "glassdoor",
  actorId: "valig~glassdoor-jobs-scraper",
  shortFlags: { q: "query", l: "location", n: "limit" },

  buildSearchInput(flags) {
    const query = requireFlag(flags, "query")
    const location = requireFlag(flags, "location") // actor requires location
    const limit = num(flags, "limit", 25)
    const input: Record<string, unknown> = { keywords: query, location, limit }
    const posted = str(flags, "posted")
    if (posted) input.daysOld = num(flags, "posted", 30)
    if (bool(flags, "remote")) input.remoteWorkType = true
    const minrating = str(flags, "minrating")
    if (minrating) input.minRating = parseFloat(minrating)
    const sort = str(flags, "sort")
    if (sort) input.sortBy = sort === "date" ? "date_desc" : "relevant_desc"
    return { input, limit, meta: { query, location } }
  },

  // No buildDetailInput: Glassdoor's actor does not look up by job URL.

  mapJob(j): JobCard {
    const date =
      j.ageInDays != null ? new Date(Date.now() - j.ageInDays * 86400000).toISOString().slice(0, 10) : null
    return {
      id: String(j.id ?? ""),
      title: j.title,
      company: j.employer?.name || null,
      location: j.location?.name || null,
      date,
      salary: formatPay(j.pay),
      remote: null,
      url: j.url,
      source: "glassdoor",
      description: j.description ? j.description.replace(/\s+/g, " ").trim().slice(0, 300) : null,
    }
  },
}

runCli(adapter)
