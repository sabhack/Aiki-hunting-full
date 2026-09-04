#!/usr/bin/env bun
// Stepstone job search CLI — adapter over the shared Apify driver.
// Actor: memo23/stepstone-search-cheerio-ppr. Requires APIFY_TOKEN.
//
//   bun run src/cli.ts search --query "software engineer" --location berlin --posted 7 --limit 25
//   bun run src/cli.ts detail "https://www.stepstone.de/stellenangebote--...html"

import { requireFlag, runCli, str, num, type BoardAdapter, type JobCard } from "../../../_shared/jobs.js"

interface StepstoneJob {
  id: number
  title: string
  companyName: string | null
  location: string | null
  salary: string | null
  datePosted: string | null
  url: string
  textSnippet: string | null
  workFromHome: string | null
}

const adapter: BoardAdapter<StepstoneJob> = {
  source: "stepstone",
  actorId: "memo23~stepstone-search-cheerio-ppr",
  shortFlags: { q: "query", l: "location", n: "limit" },

  buildSearchInput(flags) {
    const query = requireFlag(flags, "query")
    const location = str(flags, "location")
    const posted = str(flags, "posted") ?? "all" // all | 1 | 3 | 7
    const limit = num(flags, "limit", 25)
    const input: Record<string, unknown> = {
      keyword: query,
      postedWithin: ["all", "1", "3", "7"].includes(posted) ? posted : "all",
      maxItems: limit,
      includeRelatedJobs: false,
    }
    if (location) input.location = location
    return { input, limit, meta: { query, location: location ?? null, postedWithin: input.postedWithin } }
  },

  buildDetailInput(url) {
    return { startUrls: [{ url }], maxItems: 1 }
  },

  mapJob(j): JobCard {
    return {
      id: String(j.id ?? ""),
      title: j.title,
      company: j.companyName || null,
      location: j.location || null,
      date: j.datePosted || null,
      salary: j.salary || null,
      remote: j.workFromHome || null,
      url: j.url,
      source: "stepstone",
      description: j.textSnippet ? j.textSnippet.slice(0, 300) : null,
    }
  },
}

runCli(adapter)
