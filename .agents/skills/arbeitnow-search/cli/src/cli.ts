#!/usr/bin/env bun
// Arbeitnow job search CLI — uses the free public JSON API (no token required).
//
//   bun run src/cli.ts search --query "python" --location berlin --remote --limit 20
//   bun run src/cli.ts detail <slug>
//
// All errors go to stderr as { "error": "...", "code": "..." } with exit code 1.

import {
  API_PATH,
  BASE_URL,
  apiFetch,
  formatJson,
  formatPlain,
  formatTable,
  matchesFilters,
  toJobCard,
  writeError,
  type ArbeitnowResponse,
  type JobCard,
} from "./helpers.js"

type Flags = Record<string, string | boolean>

function parseFlags(argv: string[]): { positional: string[]; flags: Flags } {
  const flags: Flags = {}
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true // boolean flag
      } else {
        flags[key] = next
        i++
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const map: Record<string, string> = { q: "query", l: "location", n: "limit" }
      const key = map[arg[1]] ?? arg[1]
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) flags[key] = true
      else {
        flags[key] = next
        i++
      }
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

function str(flags: Flags, key: string): string | undefined {
  const v = flags[key]
  return typeof v === "string" ? v : undefined
}

async function search(flags: Flags): Promise<void> {
  const query = str(flags, "query")
  const location = str(flags, "location")
  const remote = flags.remote === true
  const jobType = str(flags, "jobtype")
  const tag = str(flags, "tag")
  const limit = parseInt(str(flags, "limit") ?? "20", 10)
  const maxPages = parseInt(str(flags, "maxpages") ?? "5", 10)
  const format = str(flags, "format") ?? "json"

  const matches: JobCard[] = []
  let page = 1
  let scanned = 0
  // The ?search= param is not honoured server-side, so we paginate and filter locally.
  while (page <= maxPages && matches.length < limit) {
    const res = await apiFetch<ArbeitnowResponse>(`${BASE_URL}${API_PATH}?page=${page}`)
    if (!res.data || res.data.length === 0) break
    scanned += res.data.length
    for (const job of res.data) {
      if (matchesFilters(job, { query, location, remote, jobType, tag })) {
        matches.push(toJobCard(job))
        if (matches.length >= limit) break
      }
    }
    if (!res.links?.next) break
    page++
  }

  const meta = { source: "arbeitnow", total: matches.length, pagesScanned: page, jobsScanned: scanned, query: query ?? null }
  if (format === "table") {
    process.stdout.write(formatTable(matches) + "\n")
  } else {
    process.stdout.write(formatJson(matches, meta) + "\n")
  }
}

async function detail(positional: string[], flags: Flags): Promise<void> {
  const slug = positional[0]
  if (!slug) {
    writeError("detail requires a job slug (from search results)", "MISSING_ARG")
    process.exit(1)
  }
  const format = str(flags, "format") ?? "plain"
  // Arbeitnow has no per-job endpoint; scan pages for the slug.
  const maxPages = parseInt(str(flags, "maxpages") ?? "10", 10)
  for (let page = 1; page <= maxPages; page++) {
    const res = await apiFetch<ArbeitnowResponse>(`${BASE_URL}${API_PATH}?page=${page}`)
    if (!res.data || res.data.length === 0) break
    const job = res.data.find((j) => j.slug === slug)
    if (job) {
      const card = toJobCard(job, true)
      process.stdout.write((format === "json" ? formatJson([card], { source: "arbeitnow" }) : formatPlain(card)) + "\n")
      return
    }
    if (!res.links?.next) break
  }
  writeError(`Job not found in the current feed: ${slug}. Open the URL directly instead.`, "NOT_FOUND")
  process.exit(1)
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)
  const { positional, flags } = parseFlags(rest)
  try {
    switch (command) {
      case "search":
        await search(flags)
        break
      case "detail":
        await detail(positional, flags)
        break
      default:
        writeError(`Unknown command: ${command ?? "(none)"}. Use 'search' or 'detail'.`, "BAD_COMMAND")
        process.exit(1)
    }
  } catch (err) {
    writeError(err instanceof Error ? err.message : String(err), "FETCH_ERROR")
    process.exit(1)
  }
}

main()
