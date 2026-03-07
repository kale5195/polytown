import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

export const marketsCommand = new Command("markets").description(
  "Markets commands"
);

marketsCommand
  .command("list")
  .description("List markets")
  .option("--full", "Output full format (default: simplified)")
  .option("--active", "Only active markets")
  .option("--closed", "Only closed markets")
  .option("--cyom", "Filter by create-your-own-market")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .option("--order <field>", "Order by field")
  .option("--ascending", "Sort ascending")
  .option("--id <ids>", "Filter by market IDs (comma-separated)")
  .option("--slug <slugs>", "Filter by slug(s)")
  .option("--clob-token-ids <ids>", "Filter by CLOB token IDs")
  .option("--condition-ids <ids>", "Filter by condition IDs")
  .option("--tag-id <id>", "Filter by tag ID", parseInt)
  .option("--related-tags", "Include related tags")
  .option("--include-tag", "Include tag data")
  .option("--liquidity-min <n>", "Min liquidity", parseFloat)
  .option("--liquidity-max <n>", "Max liquidity", parseFloat)
  .option("--volume-min <n>", "Min volume", parseFloat)
  .option("--volume-max <n>", "Max volume", parseFloat)
  .option("--start-date-min <date>", "Earliest start date")
  .option("--start-date-max <date>", "Latest start date")
  .option("--end-date-min <date>", "Earliest end date")
  .option("--end-date-max <date>", "Latest end date")
  .option("--uma-resolution-status <status>", "UMA resolution status")
  .option("--game-id <id>", "Filter by game ID")
  .option("--sports-market-types <types>", "Filter by sports market types")
  .option("--rewards-min-size <n>", "Min rewards size", parseFloat)
  .option("--question-ids <ids>", "Filter by question IDs")
  .action(async (opts) => {
    const gamma = new GammaClient();
    const params: any = {
      active: opts.active ?? true,
      closed: opts.closed ?? false,
      order: opts.order ?? "volume24hr",
      ascending: opts.ascending ?? false,
    };
    if (opts.cyom) params.cyom = true;
    if (opts.limit) params.limit = opts.limit;
    if (opts.offset) params.offset = opts.offset;
    if (opts.id) params.id = opts.id;
    if (opts.slug) params.slug = opts.slug;
    if (opts.clobTokenIds) params.clob_token_ids = opts.clobTokenIds;
    if (opts.conditionIds) params.condition_ids = opts.conditionIds;
    if (opts.tagId) params.tag_id = opts.tagId;
    if (opts.relatedTags) params.related_tags = true;
    if (opts.includeTag) params.include_tag = true;
    if (opts.liquidityMin) params.liquidity_num_min = opts.liquidityMin;
    if (opts.liquidityMax) params.liquidity_num_max = opts.liquidityMax;
    if (opts.volumeMin) params.volume_num_min = opts.volumeMin;
    if (opts.volumeMax) params.volume_num_max = opts.volumeMax;
    if (opts.startDateMin) params.start_date_min = opts.startDateMin;
    if (opts.startDateMax) params.start_date_max = opts.startDateMax;
    if (opts.endDateMin) params.end_date_min = opts.endDateMin;
    if (opts.endDateMax) params.end_date_max = opts.endDateMax;
    if (opts.umaResolutionStatus) params.uma_resolution_status = opts.umaResolutionStatus;
    if (opts.gameId) params.game_id = opts.gameId;
    if (opts.sportsMarketTypes) params.sports_market_types = opts.sportsMarketTypes;
    if (opts.rewardsMinSize) params.rewards_min_size = opts.rewardsMinSize;
    if (opts.questionIds) params.question_ids = opts.questionIds;
    const result = await gamma.getMarkets(params);
    
    // Default: simplified format. Use --full for complete data
    if (opts.full) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const simplified = result.map((m: any) => ({
        id: m.id,
        question: m.question,
        slug: m.slug,
        conditionId: m.conditionId,
        clobTokenIds: m.clobTokenIds,
        description: m.description,
        outcomes: m.outcomes,
        outcomePrices: m.outcomePrices,
        closed: m.closed,
        endDate: m.endDate,
        volume: m.volumeNum || m.volume,
        volume24hr: m.volume24hr,
        image: m.image,
      }));
      console.log(JSON.stringify(simplified, null, 2));
    }
  });

marketsCommand
  .command("get <id_or_slug>")
  .description("Get market by ID or slug")
  .action(async (idOrSlug) => {
    const gamma = new GammaClient();
    const result = await gamma.getMarket(idOrSlug);
    console.log(JSON.stringify(result, null, 2));
  });

marketsCommand
  .command("search <query>")
  .description("Search markets")
  .option("--limit <n>", "Limit results", parseInt)
  .action(async (query, opts) => {
    const gamma = new GammaClient();
    const result = await gamma.searchMarkets(query, opts);
    console.log(JSON.stringify(result, null, 2));
  });

