import { GAMMA_URL } from "./config.js";

type ParamValue = string | number | boolean | undefined;

interface QueryParams {
  [key: string]: ParamValue | ParamValue[];
}

function buildUrl(base: string, path: string, params?: QueryParams): string {
  const url = new URL(path, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v !== undefined) {
            url.searchParams.append(key, String(v));
          }
        }
      } else if (value !== undefined) {
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

export class GammaClient {
  constructor(private baseUrl: string = GAMMA_URL) {}

  // Markets
  async getMarkets(params?: {
    active?: boolean;
    closed?: boolean;
    limit?: number;
    offset?: number;
    order?: string;
    ascending?: boolean;
    id?: string;
    slug?: string;
    clob_token_ids?: string;
    condition_ids?: string;
    market_maker_address?: string;
    liquidity_num_min?: number;
    liquidity_num_max?: number;
    volume_num_min?: number;
    volume_num_max?: number;
    start_date_min?: string;
    start_date_max?: string;
    end_date_min?: string;
    end_date_max?: string;
    tag_id?: number;
    related_tags?: boolean;
    cyom?: boolean;
    uma_resolution_status?: string;
    game_id?: string;
    sports_market_types?: string;
    rewards_min_size?: number;
    question_ids?: string;
    include_tag?: boolean;
  }) {
    return fetchJson(buildUrl(this.baseUrl, "/markets", params as QueryParams));
  }

  async getMarket(idOrSlug: string) {
    if (/^\d+$/.test(idOrSlug)) {
      return fetchJson(buildUrl(this.baseUrl, `/markets/${idOrSlug}`));
    }
    const results = await fetchJson(buildUrl(this.baseUrl, "/markets", { slug: idOrSlug }));
    return Array.isArray(results) ? results[0] : results;
  }

  async searchMarkets(query: string, params?: { limit?: number; closed?: boolean }) {
    return fetchJson(
      buildUrl(this.baseUrl, "/markets", { text_query: query, ...params } as QueryParams)
    );
  }

  // Events
  async getEvents(params?: {
    active?: boolean;
    closed?: boolean;
    archived?: boolean;
    featured?: boolean;
    cyom?: boolean;
    limit?: number;
    offset?: number;
    order?: string;
    ascending?: boolean;
    id?: string;
    tag_id?: number;
    exclude_tag_id?: string;
    slug?: string;
    tag_slug?: string;
    tag?: string;
    related_tags?: boolean;
    include_chat?: boolean;
    include_template?: boolean;
    recurrence?: string;
    liquidity_min?: number;
    liquidity_max?: number;
    volume_min?: number;
    volume_max?: number;
    start_date_min?: string;
    start_date_max?: string;
    end_date_min?: string;
    end_date_max?: string;
  }) {
    return fetchJson(buildUrl(this.baseUrl, "/events", params as QueryParams));
  }

  async getEvent(idOrSlug: string) {
    return fetchJson(buildUrl(this.baseUrl, `/events/${idOrSlug}`));
  }

  // Tags
  async getTags(params?: {
    limit?: number;
    offset?: number;
    ascending?: boolean;
  }) {
    return fetchJson(buildUrl(this.baseUrl, "/tags", params as QueryParams));
  }

  async getTag(idOrSlug: string) {
    return fetchJson(buildUrl(this.baseUrl, `/tags/${idOrSlug}`));
  }

  async getRelated(idOrSlug: string) {
    return fetchJson(buildUrl(this.baseUrl, `/tags/${idOrSlug}/related`));
  }

  async getRelatedTags(idOrSlug: string) {
    return fetchJson(buildUrl(this.baseUrl, `/tags/${idOrSlug}/related-tags`));
  }

  // Series
  async getSeries(params?: {
    limit?: number;
    offset?: number;
    order?: string;
    ascending?: boolean;
    closed?: boolean;
  }) {
    return fetchJson(buildUrl(this.baseUrl, "/series", params as QueryParams));
  }

  async getSeriesById(id: string) {
    return fetchJson(buildUrl(this.baseUrl, `/series/${id}`));
  }

  // Comments
  async getComments(params: {
    parent_entity_type: string;
    parent_entity_id: number;
    limit?: number;
    offset?: number;
    order?: string;
    ascending?: boolean;
    holders_only?: boolean;
  }) {
    return fetchJson(
      buildUrl(this.baseUrl, "/comments", params as QueryParams)
    );
  }

  async getComment(id: string) {
    return fetchJson(buildUrl(this.baseUrl, `/comments/${id}`));
  }

  async getCommentsByUser(
    address: string,
    params?: { limit?: number; offset?: number }
  ) {
    return fetchJson(
      buildUrl(this.baseUrl, `/comments/user_address/${address}`, params as QueryParams)
    );
  }

  // Profiles
  async getProfile(address: string) {
    return fetchJson(`https://polymarket.com/api/profile/userData?address=${address}`);
  }

  async getProfileStats(proxyAddress: string) {
    return fetchJson(`https://data-api.polymarket.com/v1/user-stats?proxyAddress=${proxyAddress}`);
  }

  // Sports
  async getSports() {
    return fetchJson(buildUrl(this.baseUrl, "/sports"));
  }

  async getMarketTypes() {
    return fetchJson(buildUrl(this.baseUrl, "/sports/market-types"));
  }

  async getTeams(params?: {
    limit?: number;
    offset?: number;
    league?: string;
    ascending?: boolean;
  }) {
    return fetchJson(
      buildUrl(this.baseUrl, "/sports/teams", params as QueryParams)
    );
  }

  // Health
  async getStatus() {
    const res = await fetch(buildUrl(this.baseUrl, "/status"));
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  }
}
