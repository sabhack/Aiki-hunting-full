// Arbeitnow uses its free public JSON API (no token, no anti-bot). It reuses the shared
// JobCard shape and formatters but has its own GET-based fetch + client-side filtering.

import type { JobCard } from "../../../_shared/jobs.js"

// Re-export the shared bits so cli.ts can import everything from one place.
export { writeError, formatJson, formatTable, formatPlain, type JobCard } from "../../../_shared/jobs.js"

export const BASE_URL = "https://www.arbeitnow.com"
export const API_PATH = "/api/job-board-api"

/** Fetch JSON with exponential backoff on 429/5xx. */
export async function apiFetch<T>(url: string): Promise<T> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; arbeitnow-cli/1.0)",
        Accept: "application/json",
        "Accept-Language": "de,en;q=0.9",
      },
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((resolve) => setTimeout(resolve, delay + jitter))
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    return response.json() as Promise<T>
  }
  throw new Error("API request failed after max retries")
}

/** Raw Arbeitnow API record. */
export interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description: string // HTML
  remote: boolean
  url: string
  tags: string[]
  job_types: string[]
  location: string
  created_at: number // unix seconds
}

export interface ArbeitnowResponse {
  data: ArbeitnowJob[]
  links: { first: string; last: string; prev: string | null; next: string | null }
  meta: { current_page: number; per_page: number }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function toJobCard(job: ArbeitnowJob, fullDescription = false): JobCard {
  const text = stripHtml(job.description)
  return {
    id: job.slug,
    title: job.title,
    company: job.company_name || null,
    location: job.location || null,
    date: job.created_at ? new Date(job.created_at * 1000).toISOString().slice(0, 10) : null,
    salary: null, // Arbeitnow does not expose structured salary
    remote: job.remote ? "remote" : null,
    url: job.url,
    source: "arbeitnow",
    description: fullDescription ? text : text.slice(0, 300) || null,
  }
}

/** Returns true if the job matches the client-side filters. */
export function matchesFilters(
  job: ArbeitnowJob,
  opts: { query?: string; location?: string; remote?: boolean; jobType?: string; tag?: string },
): boolean {
  if (opts.remote && !job.remote) return false
  if (opts.location) {
    const loc = (job.location || "").toLowerCase()
    if (!loc.includes(opts.location.toLowerCase())) return false
  }
  if (opts.jobType) {
    const jt = opts.jobType.toLowerCase()
    if (!job.job_types.some((t) => t.toLowerCase().includes(jt))) return false
  }
  if (opts.tag) {
    const tg = opts.tag.toLowerCase()
    if (!job.tags.some((t) => t.toLowerCase().includes(tg))) return false
  }
  if (opts.query) {
    const haystack = [job.title, job.company_name, stripHtml(job.description), job.tags.join(" ")]
      .join(" ")
      .toLowerCase()
    const terms = opts.query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.every((term) => haystack.includes(term))) return false
  }
  return true
}
