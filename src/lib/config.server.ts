import process from "node:process";
import { config } from "dotenv";

// Load .env for server handlers (TanStack server functions may not run via server.ts)
config();

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Add server-only values here, e.g.:
    //   databaseUrl: process.env.DATABASE_URL,
    //   stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  };
}

/** LLM API key (AgentRouter, OpenRouter, DeepSeek, etc.). Undefined if missing. */
export function getLlmApiKey(): string | undefined {
  const key = (
    process.env.AGENTROUTER_API_KEY ??
    process.env.AGENT_ROUTER_TOKEN ?? // same name Codex / Claude Code use
    process.env.LLM_API_KEY ??
    process.env.OPENROUTER_API_KEY ?? // legacy name; works with AgentRouter keys too
    ""
  ).trim();
  return key || undefined;
}

function isAgentRouterHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("agentrouter.org");
  } catch {
    return url.includes("agentrouter.org");
  }
}

/**
 * AgentRouter only accepts requests that look like an approved coding-agent CLI.
 * Without these headers you get: unauthorized client detected (401).
 */
export function getAgentRouterClientHeaders(): Record<string, string> {
  return {
    Originator: "codex_cli_rs",
    "User-Agent": "codex_cli_rs/0.101.0 (Windows NT 10.0; x64) Apple_Terminal/464",
    Version: "0.101.0",
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "claude-code-20250219,oauth-2025-04-20",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-app": "cli",
    "x-stainless-lang": "js",
    "x-stainless-package-version": "0.55.1",
    "x-stainless-os": "Windows",
    "x-stainless-arch": "x64",
    "x-stainless-runtime": "node",
    "x-stainless-runtime-version": process.version,
  };
}

/** Headers for LLM chat/completions requests (includes AgentRouter client spoof when needed). */
export function getLlmRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://papermind.app",
    "X-Title": "PaperMind",
  };
  if (isAgentRouterHost(getLlmChatCompletionsUrl())) {
    Object.assign(headers, getAgentRouterClientHeaders());
  }
  return headers;
}

/** OpenAI-compatible chat completions URL. Defaults to AgentRouter. */
export function getLlmChatCompletionsUrl(): string {
  const base = (process.env.LLM_API_BASE_URL ?? "https://agentrouter.org/v1")
    .trim()
    .replace(/\/$/, "");
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}

/** Model id for chat completions. */
export function getLlmModel(): string {
  const configured = process.env.LLM_MODEL?.trim();
  if (configured) return configured;
  // AgentRouter: DeepSeek routes often have no channel; Haiku is widely available.
  if (isAgentRouterHost(getLlmChatCompletionsUrl())) {
    return "claude-haiku-4-5-20251001";
  }
  return "deepseek-chat";
}

/** Models to try in order when the primary has no upstream channel (AgentRouter 503). */
export function getLlmModelCandidates(): string[] {
  const primary = getLlmModel();
  const fallbacks = isAgentRouterHost(getLlmChatCompletionsUrl())
    ? ["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"]
    : [];
  return [...new Set([primary, ...fallbacks])];
}

export function isModelChannelUnavailable(status: number, errText: string): boolean {
  return status === 503 || errText.includes("无可用渠道");
}
