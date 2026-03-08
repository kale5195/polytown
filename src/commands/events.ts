import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

export const eventsCommand = new Command("events").description(
  "Events commands"
);

eventsCommand
  .command("list")
  .description("List events")
  .option("--full", "Output full format (default: simplified)")
  .option("--active", "Only active events")
  .option("--closed", "Only closed events")
  .option("--archived", "Include archived events")
  .option("--featured", "Only featured events")
  .option("--cyom", "Filter by create-your-own-market")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .option("--order <field>", "Order by field")
  .option("--ascending", "Sort ascending")
  .option("--id <ids>", "Filter by event IDs (comma-separated)")
  .option("--tag <tag>", "Filter by tag slug")
  .option("--tag-id <id>", "Filter by tag ID", parseInt)
  .option("--exclude-tag-id <ids>", "Exclude tag IDs (comma-separated)")
  .option("--slug <slugs>", "Filter by slug(s)")
  .option("--related-tags", "Include related tags")
  .option("--include-tag", "Include tag data")
  .option("--recurrence <pattern>", "Filter by recurrence pattern")
  .option("--liquidity-min <n>", "Min liquidity", parseFloat)
  .option("--liquidity-max <n>", "Max liquidity", parseFloat)
  .option("--volume-min <n>", "Min volume", parseFloat)
  .option("--volume-max <n>", "Max volume", parseFloat)
  .option("--start-date-min <date>", "Earliest start date")
  .option("--start-date-max <date>", "Latest start date")
  .option("--end-date-min <date>", "Earliest end date")
  .option("--end-date-max <date>", "Latest end date")
  .action(async (opts) => {
    const gamma = new GammaClient();
    const params: any = {
      active: opts.active ?? true,
      closed: opts.closed ?? false,
      archived: opts.archived ?? false,
      order: opts.order ?? "volume24hr",
      ascending: opts.ascending ?? false,
    };
    if (opts.featured) params.featured = true;
    if (opts.cyom) params.cyom = true;
    if (opts.limit) params.limit = opts.limit;
    if (opts.offset) params.offset = opts.offset;
    if (opts.id) params.id = opts.id;
    if (opts.tag) params.tag_slug = opts.tag;
    if (opts.tagId) params.tag_id = opts.tagId;
    if (opts.excludeTagId) params.exclude_tag_id = opts.excludeTagId.split(",");
    if (opts.slug) params.slug = opts.slug;
    if (opts.relatedTags) params.related_tags = true;
    if (opts.includeTag) params.include_tag = true;
    if (opts.recurrence) params.recurrence = opts.recurrence;
    if (opts.liquidityMin) params.liquidity_min = opts.liquidityMin;
    if (opts.liquidityMax) params.liquidity_max = opts.liquidityMax;
    if (opts.volumeMin) params.volume_min = opts.volumeMin;
    if (opts.volumeMax) params.volume_max = opts.volumeMax;
    if (opts.startDateMin) params.start_date_min = opts.startDateMin;
    if (opts.startDateMax) params.start_date_max = opts.startDateMax;
    if (opts.endDateMin) params.end_date_min = opts.endDateMin;
    if (opts.endDateMax) params.end_date_max = opts.endDateMax;
    const result = await gamma.getEvents(params);

    // Default: simplified format. Use --full for complete data
    if (opts.full) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const simplified = result.map((e: any) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: e.description,
        closed: e.closed,
        endDate: e.endDate,
        volume: e.volume,
        ...(opts.includeTag && e.tags ? { tags: e.tags } : {}),
        markets: (e.markets || []).map((m: any) => ({
          id: m.id,
          question: m.question,
          slug: m.slug,
          conditionId: m.conditionId,
          clobTokenIds: m.clobTokenIds,
          outcomes: m.outcomes,
          outcomePrices: m.outcomePrices,
          active: m.active,
          closed: m.closed,
          endDate: m.endDate,
          volume: m.volumeNum || m.volume,
          volume24hr: m.volume24hr,
          liquidity: m.liquidityNum || m.liquidity,
          lastTradePrice: m.lastTradePrice,
          oneWeekPriceChange: m.oneWeekPriceChange,
        })),
      }));
      console.log(JSON.stringify(simplified, null, 2));
    }
  });

eventsCommand
  .command("get <id_or_slug>")
  .description("Get event by ID or slug")
  .action(async (idOrSlug) => {
    const gamma = new GammaClient();
    const result = await gamma.getEvent(idOrSlug);
    console.log(JSON.stringify(result, null, 2));
  });
