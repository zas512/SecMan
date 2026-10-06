import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function run(cmd: string, args: string[], input?: string) {
  const r = spawnSync(cmd, args, {
    input,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

function fromGit(): string | null {
  const r = run("git", ["credential", "fill"], "protocol=https\nhost=github.com\n\n");
  if (!r.ok) return null;
  const m = r.out.match(/^password=(.*)$/m);
  return m ? m[1].trim() : null;
}

function fromGh(): string | null {
  const r = run("gh", ["auth", "token"]);
  return r.ok && r.out ? r.out : null;
}

async function verify(token: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "secman" }
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  return { login: data.login as string, scopes: res.headers.get("x-oauth-scopes") };
}

function mask(t: string) {
  return t.length > 10 ? `${t.slice(0, 4)}...${t.slice(-4)} (${t.length} chars)` : "***";
}

function tokenType(t: string) {
  if (t.startsWith("ghp_")) return "classic personal access token";
  if (t.startsWith("github_pat_")) return "fine grained personal access token";
  if (t.startsWith("gho_")) return "OAuth token (browser sign in or GCM)";
  if (t.startsWith("ghu_")) return "GitHub App user token";
  if (t.startsWith("ghs_")) return "GitHub App installation token";
  return "unknown format";
}

async function reportToken(label: string, token: string | null) {
  if (!token) return console.log(`${label}: none found`);
  console.log(`token: ${mask(token)}`);
  console.log(`type:  ${tokenType(token)}`);
  const info = await verify(token);
  console.log(
    info ?
      `valid: yes, user ${info.login}, scopes: ${info.scopes || "none reported"}`
    : "valid: NO (rejected by GitHub)"
  );
}

const head = (s: string) => console.log(`\n== ${s} ==`);

export async function doctor() {
  head("Git");
  const gv = run("git", ["--version"]);
  console.log(gv.ok ? gv.out : "git NOT found");

  head("Credential helper config");
  const helpers = run("git", ["config", "--show-origin", "--get-all", "credential.helper"]);
  console.log(helpers.out || "no credential.helper configured");

  head("Current repo");
  if (!run("git", ["rev-parse", "--is-inside-work-tree"]).ok) {
    console.log("not inside a git repo");
  } else {
    console.log(run("git", ["remote", "-v"]).out || "repo has no remotes");
    const origin = run("git", ["remote", "get-url", "origin"]).out;
    if (origin) {
      const ssh = origin.startsWith("git@") || origin.startsWith("ssh://");
      console.log(`origin uses: ${ssh ? "SSH" : "HTTPS"}`);
    }
  }

  head("git user");
  console.log(`name:  ${run("git", ["config", "user.name"]).out || "(not set)"}`);
  console.log(`email: ${run("git", ["config", "user.email"]).out || "(not set)"}`);

  head("Token from git credential helper");
  await reportToken("git helper", fromGit());

  head("Token from GitHub CLI (gh)");
  if (!run("gh", ["--version"]).ok) console.log("gh not installed");
  else {
    const t = fromGh();
    if (!t) console.log("gh installed but not logged in");
    else await reportToken("gh", t);
  }

  head("Environment variables");
  for (const k of ["GITHUB_TOKEN", "GH_TOKEN", "GIT_ASKPASS", "SSH_ASKPASS"]) {
    const v = process.env[k];
    console.log(
      `${k}: ${
        v ?
          k.endsWith("TOKEN") ?
            mask(v)
          : v
        : "(not set)"
      }`
    );
  }

  head("SSH");
  const sshDir = join(homedir(), ".ssh");
  if (!existsSync(sshDir)) console.log("no .ssh folder");
  else {
    const keys = readdirSync(sshDir).filter((f) => f.endsWith(".pub"));
    console.log(keys.length ? `public keys: ${keys.join(", ")}` : "no public keys found");
  }
  const s = run("ssh", ["-T", "-o", "BatchMode=yes", "-o", "ConnectTimeout=5", "git@github.com"]);
  console.log(`github ssh test: ${(s.err || s.out).split("\n")[0] || "no response"}`);
  console.log();
}

// run directly: npx tsx src/doctor.ts
if (process.argv[1]?.replace(/\\/g, "/").endsWith("doctor.ts")) {
  doctor();
}
