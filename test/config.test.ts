import { describe, test, expect, afterEach } from "bun:test";
import {
  POLYGON_CHAIN_ID,
  resolvePrivateKey,
} from "../src/lib/config.js";

describe("config constants", () => {
  test("POLYGON_CHAIN_ID defaults to 137", () => {
    expect(POLYGON_CHAIN_ID).toBe(137);
  });
});

describe("resolvePrivateKey", () => {
  const originalEnv = process.env.POLYMARKET_PRIVATE_KEY;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.POLYMARKET_PRIVATE_KEY = originalEnv;
    } else {
      delete process.env.POLYMARKET_PRIVATE_KEY;
    }
  });

  test("returns flag when provided with 0x prefix", () => {
    expect(resolvePrivateKey("0xabc123")).toBe("0xabc123");
  });

  test("adds 0x prefix when missing", () => {
    expect(resolvePrivateKey("abc123")).toBe("0xabc123");
  });

  test("falls back to env var", () => {
    process.env.POLYMARKET_PRIVATE_KEY = "0xenvkey";
    expect(resolvePrivateKey()).toBe("0xenvkey");
  });

  test("flag takes priority over env var", () => {
    process.env.POLYMARKET_PRIVATE_KEY = "0xenvkey";
    expect(resolvePrivateKey("0xflagkey")).toBe("0xflagkey");
  });

  test("throws when no key available", () => {
    delete process.env.POLYMARKET_PRIVATE_KEY;
    expect(() => resolvePrivateKey()).toThrow("No wallet configured");
  });
});
