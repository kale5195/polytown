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

