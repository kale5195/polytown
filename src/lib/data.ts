import { DATA_URL } from "./config.js";

interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

function buildUrl(base: string, path: string, params?: QueryParams): string {
  const url = new URL(path, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText} — ${url}`);
  }
  return res.json();
}

export class DataClient {
  constructor(private baseUrl: string = DATA_URL) {}

  // User data
  async getPositions(
    address: string,
    params?: { limit?: number; offset?: number }
  ) {
    return fetchJson(
      buildUrl(this.baseUrl, "/positions", { user: address, ...params })
    );
  }

  async getClosedPositions(
    address: string,
    params?: { limit?: number; offset?: number }
  ) {
    return fetchJson(
      buildUrl(this.baseUrl, "/positions", {
        user: address,
        closed: true,
        ...params,
      })
    );
  }

  async getValue(address: string) {
    return fetchJson(buildUrl(this.baseUrl, "/value", { user: address }));
  }

  async getTraded(address: string) {
    return fetchJson(buildUrl(this.baseUrl, "/traded", { user: address }));
  }

  async getTrades(
    address: string,
    params?: { limit?: number; offset?: number; market?: string }
  ) {
    return fetchJson(
      buildUrl(this.baseUrl, "/trades", { user: address, ...params })
    );
  }

  async getActivity(
    address: string,
    params?: { limit?: number; offset?: number }
  ) {
    return fetchJson(
      buildUrl(this.baseUrl, "/activity", { user: address, ...params })
    );
  }

  // Market data
  async getHolders(conditionId: string, params?: { limit?: number }) {
    return fetchJson(
      buildUrl(this.baseUrl, "/holders", { market: conditionId, ...params })
    );
  }

  async getOpenInterest(conditionId: string) {
    return fetchJson(
      buildUrl(this.baseUrl, "/open-interest", { conditionId })
    );
  }

  async getVolume(eventId: string) {
    return fetchJson(buildUrl(this.baseUrl, "/volume", { eventId }));
  }

  // Leaderboards
  async getLeaderboard(params?: {
    period?: string;
    orderBy?: string;
    limit?: number;
    offset?: number;
  }) {
    return fetchJson(
      buildUrl(this.baseUrl, "/v1/leaderboard", {
        period: params?.period,
        order_by: params?.orderBy,
        limit: params?.limit,
        offset: params?.offset,
      })
    );
  }

  async getBuilderLeaderboard(params?: {
    period?: string;
    limit?: number;
    offset?: number;
  }) {
    return fetchJson(
      buildUrl(this.baseUrl, "/v1/leaderboard", {
        builders: true,
        ...params,
      } as QueryParams)
    );
  }
}
