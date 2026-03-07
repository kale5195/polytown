import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { DataClient } from "../src/lib/data.js";

const MOCK_BASE = "https://mock-data.test";
let client: DataClient;
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
  client = new DataClient(MOCK_BASE);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("DataClient URL building", () => {
  test("getPositions", async () => {
    await client.getPositions("0xabc", { limit: 10 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/positions?user=0xabc&limit=10`);
  });

  test("getClosedPositions", async () => {
    await client.getClosedPositions("0xabc");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/positions?user=0xabc&closed=true`);
  });

  test("getValue", async () => {
    await client.getValue("0xabc");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/value?user=0xabc`);
  });

  test("getTraded", async () => {
    await client.getTraded("0xabc");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/traded?user=0xabc`);
  });

  test("getTrades with pagination", async () => {
    await client.getTrades("0xabc", { limit: 5, offset: 10 });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/trades?user=0xabc&limit=5&offset=10`
    );
  });

  test("getActivity", async () => {
    await client.getActivity("0xabc");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/activity?user=0xabc`);
  });

  test("getHolders", async () => {
    await client.getHolders("cond123", { limit: 50 });
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/holders?market=cond123&limit=50`);
  });

  test("getOpenInterest", async () => {
    await client.getOpenInterest("cond123");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/open-interest?conditionId=cond123`);
  });

  test("getVolume", async () => {
    await client.getVolume("evt123");
    expect(fetchCalls[0]).toBe(`${MOCK_BASE}/volume?eventId=evt123`);
  });

  test("getLeaderboard maps orderBy to order_by", async () => {
    await client.getLeaderboard({ period: "weekly", orderBy: "profit" });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/v1/leaderboard?period=weekly&order_by=profit`
    );
  });

  test("getBuilderLeaderboard", async () => {
    await client.getBuilderLeaderboard({ period: "daily", limit: 10 });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/v1/leaderboard?builders=true&period=daily&limit=10`
    );
  });

  test("getTrades with market filter", async () => {
    await client.getTrades("0xabc", { market: "0xcond123" });
    expect(fetchCalls[0]).toBe(
      `${MOCK_BASE}/trades?user=0xabc&market=0xcond123`
    );
  });
});
