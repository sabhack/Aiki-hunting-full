import { expect, test } from "bun:test"
import { join } from "path"

const CLI = join(import.meta.dir, "../src/cli.ts")

async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", CLI, ...args], { stdout: "pipe", stderr: "pipe" })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

test("search returns JSON with jobs and meta", async () => {
  const { stdout, exitCode } = await runCLI(["search", "--limit", "5", "--format", "json"])
  expect(exitCode).toBe(0)
  const parsed = JSON.parse(stdout)
  expect(Array.isArray(parsed.jobs)).toBe(true)
  expect(parsed.meta.source).toBe("arbeitnow")
  if (parsed.jobs.length > 0) {
    expect(parsed.jobs[0]).toHaveProperty("title")
    expect(parsed.jobs[0]).toHaveProperty("url")
    expect(parsed.jobs[0].source).toBe("arbeitnow")
  }
}, 30000)

test("search --remote only returns remote jobs", async () => {
  const { stdout, exitCode } = await runCLI(["search", "--remote", "--limit", "5", "--format", "json"])
  expect(exitCode).toBe(0)
  const parsed = JSON.parse(stdout)
  for (const job of parsed.jobs) expect(job.remote).toBe("remote")
}, 30000)

test("unknown command errors on stderr with code", async () => {
  const { stderr, exitCode } = await runCLI(["frobnicate"])
  expect(exitCode).toBe(1)
  const parsed = JSON.parse(stderr)
  expect(parsed.code).toBe("BAD_COMMAND")
}, 30000)

test("table format renders a header", async () => {
  const { stdout, exitCode } = await runCLI(["search", "--limit", "3", "--format", "table"])
  expect(exitCode).toBe(0)
  expect(stdout).toContain("Title")
}, 30000)
