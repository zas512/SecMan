import { spawnSync } from "node:child_process";
import { Command } from "commander";

function fromGit(): string | null {
  const r = spawnSync("git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
  if (r.status !== 0) return null;
  const m = r.stdout.match(/^password=(.*)$/m);
  return m ? m[1].trim() : null;
}

function fromGh(): string | null {
  const r = spawnSync("gh", ["auth", "token"], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return r.stdout.trim() || null;
}

async function verify(token: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "secman" }
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  return { login: data.login as string, scopes: res.headers.get("x-oauth-scopes") };
}

const program = new Command("secman");

program
  .command("login")
  .description("Find and verify GitHub credentials")
  .action(async () => {
    const sources: [string, () => string | null][] = [
      ["git credential helper", fromGit],
      ["GitHub CLI", fromGh]
    ];

    for (const [name, get] of sources) {
      const token = get();
      if (!token) {
        console.log(`✗ ${name}: nothing found`);
        continue;
      }
      const info = await verify(token);
      if (!info) {
        console.log(`✗ ${name}: token found but GitHub rejected it`);
        continue;
      }
      console.log(`✓ ${name}: logged in as ${info.login}`);
      console.log(`  scopes: ${info.scopes || "none reported (fine grained or OAuth app token)"}`);
      return;
    }
    console.log("No working credentials. Device flow login comes next.");
    process.exitCode = 1;
  });

program.parseAsync();
