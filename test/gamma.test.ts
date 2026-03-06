import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { GammaClient } from "../src/lib/gamma.js";

const MOCK_BASE = "https://mock-gamma.test";
let client: GammaClient;
let fetchCalls: string[];
const originalFetch = globalThis.fetch;

beforeEach(() => {
  fetchCalls = [];
  globalThis.fetch = mock(async (url: any) => {
    fetchCalls.push(url.toString?.() ?? String(url));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as any;
  client = new GammaClient(MOCK_BASE);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GammaClient URL building", () => {
  test("getMarkets builds correct URL with params", async () => {
    await client.getMarkets({ active: true, limit: 5 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/markets?active=true&limit=5`);
  });

  test("getMarkets with volume and liquidity filters", async () => {
    await client.getMarkets({ volume_num_min: 1000, liquidity_num_min: 500, limit: 5 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/markets?volume_num_min=1000&liquidity_num_min=500&limit=5`);
  });

  test("getMarkets with date and condition filters", async () => {
    await client.getMarkets({ end_date_min: "2026-06-01", condition_ids: "0xabc" });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/markets?end_date_min=2026-06-01&condition_ids=0xabc`);
  });

  test("getMarkets with no params", async () => {
    await client.getMarkets();
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/markets`);
  });

  test("getMarket by id", async () => {
    await client.getMarket("123");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/markets/123`);
  });

  test("searchMarkets passes text_query param", async () => {
    await client.searchMarkets("bitcoin", { limit: 3 });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/markets?text_query=bitcoin&limit=3`
    );
  });

  test("getEvents with tag filter", async () => {
    await client.getEvents({ tag: "crypto", limit: 10 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/events?tag=crypto&limit=10`);
  });

  test("getEvents with volume and liquidity filters", async () => {
    await client.getEvents({ volume_min: 1000, liquidity_min: 500, limit: 5 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/events?volume_min=1000&liquidity_min=500&limit=5`);
  });

  test("getEvents with date filters", async () => {
    await client.getEvents({ end_date_min: "2026-06-01", active: true });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/events?end_date_min=2026-06-01&active=true`);
  });

  test("getEvents with featured and slug", async () => {
    await client.getEvents({ featured: true, slug: "some-event" });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/events?featured=true&slug=some-event`);
  });

  test("getEvent by slug", async () => {
    await client.getEvent("some-slug");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/events/some-slug`);
  });

  test("getTags with pagination", async () => {
    await client.getTags({ limit: 20, offset: 5 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/tags?limit=20&offset=5`);
  });

  test("getTag by id", async () => {
    await client.getTag("politics");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/tags/politics`);
  });

  test("getRelated", async () => {
    await client.getRelated("crypto");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/tags/crypto/related`);
  });

  test("getRelatedTags", async () => {
    await client.getRelatedTags("crypto");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/tags/crypto/related-tags`);
  });

  test("getSeries", async () => {
    await client.getSeries({ limit: 5, closed: true });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/series?limit=5&closed=true`);
  });

  test("getSeriesById", async () => {
    await client.getSeriesById("42");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/series/42`);
  });

  test("getComments passes parent_entity params", async () => {
    await client.getComments({ parent_entity_type: "Event", parent_entity_id: 123 });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/comments?parent_entity_type=Event&parent_entity_id=123`
    );
  });

  test("getComment by id", async () => {
    await client.getComment("c1");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/comments/c1`);
  });

  test("getCommentsByUser", async () => {
    await client.getCommentsByUser("0xabc", { limit: 10 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/comments/user_address/0xabc?limit=10`);
  });

  test("getProfile", async () => {
    await client.getProfile("0xabc");
    expect(fetchCalls[0]).toBe(`https://polymarket.com/api/profile/userData?address=0xabc`);
  });

  test("getSports", async () => {
    await client.getSports();
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/sports`);
  });

  test("getMarketTypes", async () => {
    await client.getMarketTypes();
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/sports/market-types`);
  });

  test("getTeams with league filter", async () => {
    await client.getTeams({ league: "NBA", limit: 10 });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/sports/teams?league=NBA&limit=10`
    );
  });

  test("getStatus", async () => {
    await client.getStatus();
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/status`);
  });
});

describe("GammaClient error handling", () => {
  test("throws on non-ok response", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Not Found", { status: 404, statusText: "Not Found" });
    }) as any;
    const c = new GammaClient(MOCK_BASE);
    expect(c.getMarket("nonexistent")).rejects.toThrow("HTTP 404");
  });
});
