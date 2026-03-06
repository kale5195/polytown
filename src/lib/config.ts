import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const CONFIG_DIR = join(homedir(), ".polytown");
export const CONFIG_ENV_PATH = join(CONFIG_DIR, ".env");

// Load env files: local .env > ~/.polytown/.env (neither overrides existing env vars)
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const LOCAL_ENV_PATH = join(process.cwd(), ".env");
loadEnvFile(LOCAL_ENV_PATH);
loadEnvFile(CONFIG_ENV_PATH);

export const POLYGON_CHAIN_ID = Number(process.env.POLYMARKET_CHAIN_ID || "137");
export const RPC_URL = process.env.POLYMARKET_RPC_URL || "https://polygon.drpc.org";
export const CLOB_URL = process.env.POLYMARKET_CLOB_URL || "https://proxy.polytown.app";
export const GAMMA_URL = process.env.POLYMARKET_GAMMA_URL || "https://gamma-api.polymarket.com";
export const DATA_URL = process.env.POLYMARKET_DATA_URL || "https://data-api.polymarket.com";
export const BRIDGE_URL = process.env.POLYMARKET_BRIDGE_URL || "https://bridge-api.polymarket.com";
export const RELAYER_URL = process.env.POLYMARKET_RELAYER_URL || "https://proxy.polytown.app/relayer";

export function resolvePrivateKey(flag?: string): `0x${string}` {
  const key = flag || process.env.POLYMARKET_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "No wallet configured. Run `polytown setup` to create or import a wallet."
    );
  }
  const normalized = key.startsWith("0x") ? key : `0x${key}`;
  return normalized as `0x${string}`;
}

