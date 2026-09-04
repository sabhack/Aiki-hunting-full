#!/usr/bin/env bun
// Indeed job search CLI — adapter over the shared Apify driver.
// Actor: kaix/indeed-scraper. Requires APIFY_TOKEN. Defaults to the German site (DE).
//
//   bun run src/cli.ts search --query "software engineer" --location Berlin --posted 7 --remote remote --limit 25
//   bun run src/cli.ts detail "https://de.indeed.com/viewjob?jk=abc123"

import { requireFlag, runCli, str, num, type BoardAdapter, type JobCard } from "../../../_shared/jobs.js"

interface IndeedJob {
  id: string
  title: { text: string; normalized: string } | null
  company: { name: string | null } | null
  location: { formattedShort: string | null; formatted: string | null; city: string | null } | null
  dates: { posted: string | null } | null
  salary: { text: string | null; min: number | null; max: number | null; currency: string | null; period: string | null } | null
  workArrangement: { isRemote: boolean | null; remoteWorkType: string | null } | null
  urls: { indeed: string | null; external: string | null; apply: string | null } | null
  description: { text: string | null } | null
  snippet: string | null
}

function formatSalary(s: IndeedJob["salary"]): string | null {
  if (!s) return null
  if (s.text) return s.text
  if (s.min == null && s.max == null) return null
  const range = s.min != null && s.max != null ? `${s.min}–${s.max}` : `${s.min ?? s.max}`
  return `${range} ${s.currency ?? ""}${s.period ? "/" + s.period : ""}`.trim()
}

const adapter: BoardAdapter<IndeedJob> = {
  source: "indeed",
  actorId: "kaix~indeed-scraper",
  shortFlags: { q: "query", l: "location", n: "limit" },

  buildSearchInput(flags) {
    const query = requireFlag(flags, "query")
    const location = str(flags, "location")
    const country = (str(flags, "country") ?? "de").toUpperCase()
    const limit = num(flags, "limit", 25)
    const input: Record<string, unknown> = { keyword: query, country, maxItems: limit, searchMode: "detailed" }
    if (location) input.location = location
    const posted = str(flags, "posted") // 1 | 3 | 7 | 14
    if (posted && ["1", "3", "7", "14"].includes(posted)) input.fromDays = posted
    const remote = str(flags, "remote") // remote | hybrid
    if (remote) input.remote = remote
    const jobtype = str(flags, "jobtype")
    if (jobtype) input.jobType = jobtype
    const sort = str(flags, "sort")
    if (sort) input.sort = sort === "date" ? "date" : "relevance"
    return { input, limit, meta: { query, location: location ?? null, country } }
  },

  buildDetailInput(url) {
    const m = url.match(/jk=([0-9a-z]+)/i) || url.match(/\/viewjob\/([0-9a-z]+)/i)
    const jk = m ? m[1] : url
    return { jobKeys: [jk], searchMode: "detailed", country: "DE" }
  },

  mapJob(j, full): JobCard {
    const loc = j.location
    const text = j.description?.text ?? j.snippet ?? null
    return {
      id: j.id || "",
      title: j.title?.text ?? "",
      company: j.company?.name || null,
      location: loc?.formattedShort || loc?.formatted || loc?.city || null,
      date: j.dates?.posted || null,
      salary: formatSalary(j.salary),
      remote: j.workArrangement?.isRemote ? "remote" : j.workArrangement?.remoteWorkType || null,
      url: j.urls?.indeed || j.urls?.external || "",
      source: "indeed",
      description: text ? (full ? text.replace(/\s+/g, " ").trim() : text.replace(/\s+/g, " ").trim().slice(0, 300)) : null,
    }
  },
}

runCli(adapter)
