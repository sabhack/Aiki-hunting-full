import { expect, test } from "bun:test"
import { join } from "path"

const CLI = join(import.meta.dir, "../src/cli.ts")

async function runCLI(
  args: string[],
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", CLI, ...args], { stdout: "pipe", stderr: "pipe", env: env ?? process.env })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

test("missing APIFY_TOKEN errors with NO_TOKEN", async () => {
  const { stderr, exitCode } = await runCLI(["search", "--query", "developer"], { ...process.env, APIFY_TOKEN: "" })
  expect(exitCode).toBe(1)
  expect(JSON.parse(stderr).code).toBe("NO_TOKEN")
})

test("unknown command errors with BAD_COMMAND", async () => {
  const { stderr, exitCode } = await runCLI(["frobnicate"])
  expect(exitCode).toBe(1)
  expect(JSON.parse(stderr).code).toBe("BAD_COMMAND")
})

const live = process.env.APIFY_TOKEN ? test : test.skip
live("live: search returns normalized jobs", async () => {
  const { stdout, exitCode } = await runCLI([
    "search", "--query", "data scientist", "--location", "Berlin, Germany", "--limit", "3", "--format", "json",
  ])
  expect(exitCode).toBe(0)
  const parsed = JSON.parse(stdout)
  expect(parsed.meta.source).toBe("linkedin")
  if (parsed.jobs.length > 0) expect(parsed.jobs[0].source).toBe("linkedin")
}, 90000)
