// Shared core for the German/DACH job-board CLIs.
//
// - The normalized `JobCard` shape every board emits.
// - Apify plumbing (`getToken`, `runActor`) used by the actor-backed boards.
// - A generic `runCli(adapter)` driver: each board only supplies an actor id, an input
//   builder, and an output mapper. Arbeitnow (free public API) reuses the JobCard type
//   and formatters but has its own fetch loop.
//
// All errors print to stderr as { "error": "...", "code": "..." } with exit code 1.

/** Normalized job record shared across all board CLIs. */
export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null // ISO date posted, if known
  salary: string | null
  remote: string | null // "remote" | "hybrid" | null
  url: string
  source: string // arbeitnow | stepstone | xing | linkedin | glassdoor | indeed
  description: string | null // snippet (search) or full text (detail)
}

export type Flags = Record<string, string | boolean>

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

// ---- Flag parsing ----

export function parseFlags(argv: string[], shortMap: Record<string, string> = {}): {
  positional: string[]
  flags: Flags
} {
  const flags: Flags = {}
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("--")) flags[key] = true
      else {
        flags[key] = next
        i++
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const key = shortMap[arg[1]] ?? arg[1]
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

export function str(flags: Flags, key: string): string | undefined {
  const v = flags[key]
  return typeof v === "string" ? v : undefined
}

export function num(flags: Flags, key: string, fallback: number): number {
  const v = str(flags, key)
  if (v === undefined) return fallback
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

export function bool(flags: Flags, key: string): boolean {
  return flags[key] === true || flags[key] === "true"
}

/** Exit with a MISSING_ARG error if a required flag is absent. */
export function requireFlag(flags: Flags, key: string): string {
  const v = str(flags, key)
  if (!v) {
    writeError(`search requires --${key} <text>`, "MISSING_ARG")
    process.exit(1)
  }
  return v
}

// ---- Apify ----

export function getToken(): string {
  const token = process.env.APIFY_TOKEN
  if (!token) {
    writeError(
      "APIFY_TOKEN environment variable is not set. Get a token at https://console.apify.com/account/integrations and export APIFY_TOKEN=...",
      "NO_TOKEN",
    )
    process.exit(1)
  }
  return token
}

/** Run an Apify actor synchronously and return its dataset items. */
export async function runActor<T>(actorId: string, input: Record<string, unknown>, token: string): Promise<T[]> {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`
  const maxRetries = 3
  let delay = 1000
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) throw new Error(`Apify run failed: ${response.status} ${response.statusText}`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 401) throw new Error("Apify rejected the token (401). Check APIFY_TOKEN.")
    if (!response.ok) throw new Error(`Apify run failed: ${response.status} ${response.statusText}`)
    return response.json() as Promise<T[]>
  }
  throw new Error("Apify run failed after max retries")
}

// ---- Output formatting ----

export function formatJson(jobs: JobCard[], meta: Record<string, unknown>): string {
  return JSON.stringify({ jobs, meta }, null, 2)
}

export function formatTable(jobs: JobCard[]): string {
  if (jobs.length === 0) return "No jobs found."
  const rows = jobs.map((j, i) => {
    const n = String(i + 1).padStart(2)
    const title = (j.title || "").slice(0, 40).padEnd(40)
    const company = (j.company || "—").slice(0, 22).padEnd(22)
    const loc = (j.location || "—").slice(0, 18).padEnd(18)
    const src = (j.source || "").slice(0, 9).padEnd(9)
    const date = j.date || "—"
    return `${n}  ${title}  ${company}  ${loc}  ${src}  ${date}`
  })
  const header =
    "  #  " + "Title".padEnd(40) + "  " + "Company".padEnd(22) + "  " + "Location".padEnd(18) + "  " + "Source".padEnd(9) + "  Date"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export function formatPlain(job: JobCard): string {
  return [
    job.title,
    `Company:  ${job.company ?? "—"}`,
    `Location: ${job.location ?? "—"}`,
    `Remote:   ${job.remote ?? "—"}`,
    `Salary:   ${job.salary ?? "—"}`,
    `Posted:   ${job.date ?? "—"}`,
    `Source:   ${job.source}`,
    `URL:      ${job.url}`,
    "",
    job.description ?? "(no description)",
  ].join("\n")
}

// ---- Generic Apify-board CLI driver ----

export interface SearchSpec {
  input: Record<string, unknown>
  limit: number
  meta?: Record<string, unknown>
}

export interface BoardAdapter<Raw> {
  source: string
  actorId: string
  shortFlags?: Record<string, string>
  /** Map generic CLI flags to the actor's search input. May exit on missing args. */
  buildSearchInput(flags: Flags): SearchSpec
  /** Map a single job URL to the actor's detail input. Omit if the board has no URL detail. */
  buildDetailInput?(url: string): Record<string, unknown>
  /** Map one raw actor item to the normalized JobCard. */
  mapJob(raw: Raw, full: boolean): JobCard
}

/** Drives an actor-backed board CLI end to end based on process.argv. */
export async function runCli<Raw>(adapter: BoardAdapter<Raw>): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)
  const { positional, flags } = parseFlags(rest, adapter.shortFlags)
  try {
    if (command === "search") {
      const token = getToken()
      const { input, limit, meta } = adapter.buildSearchInput(flags)
      const items = await runActor<Raw>(adapter.actorId, input, token)
      const jobs = items
        .map((r) => adapter.mapJob(r, false))
        .filter((j) => j.title || j.url) // drop empty/error items (some actors push these)
        .slice(0, limit)
      const format = str(flags, "format") ?? "json"
      if (format === "table") process.stdout.write(formatTable(jobs) + "\n")
      else process.stdout.write(formatJson(jobs, { source: adapter.source, total: jobs.length, ...(meta ?? {}) }) + "\n")
    } else if (command === "detail") {
      if (!adapter.buildDetailInput) {
        writeError(`detail is not supported for ${adapter.source}; open the job URL directly or use search`, "UNSUPPORTED")
        process.exit(1)
      }
      const token = getToken()
      const url = positional[0]
      if (!url || !url.startsWith("http")) {
        writeError("detail requires a full job URL", "MISSING_ARG")
        process.exit(1)
      }
      const items = await runActor<Raw>(adapter.actorId, adapter.buildDetailInput(url), token)
      const valid = items.map((r) => adapter.mapJob(r, true)).filter((j) => j.title || j.url)
      if (valid.length === 0) {
        writeError(`No job data returned for: ${url}`, "NOT_FOUND")
        process.exit(1)
      }
      const format = str(flags, "format") ?? "plain"
      if (format === "json") process.stdout.write(formatJson([valid[0]], { source: adapter.source }) + "\n")
      else process.stdout.write(formatPlain(valid[0]) + "\n")
    } else {
      writeError(`Unknown command: ${command ?? "(none)"}. Use 'search' or 'detail'.`, "BAD_COMMAND")
      process.exit(1)
    }
  } catch (err) {
    writeError(err instanceof Error ? err.message : String(err), "APIFY_ERROR")
    process.exit(1)
  }
}
