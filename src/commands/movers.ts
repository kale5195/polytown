import { Command } from "commander";

const CATEGORIES = [
  "all",
  "sports",
  "politics",
  "crypto",
  "culture",
  "weather",
  "economics",
  "tech",
  "finance",
] as const;

export const moversCommand = new Command("movers")
  .description("Get biggest movers (highest price change markets)")
  .option(
    "--category <category>",
    `Filter by category (${CATEGORIES.join(", ")})`,
  )
  .option("--limit <n>", "Limit number of results", parseInt)
  .action(async (opts) => {
    const params: Record<string, string> = {};
    if (opts.category && opts.category !== "all") {
      params.category = opts.category;
    }
    const url = new URL("https://polymarket.com/api/biggest-movers");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    let markets = data.markets || [];
    if (opts.limit) {
      markets = markets.slice(0, opts.limit);
    }
    console.log(JSON.stringify(markets, null, 2));
  });
