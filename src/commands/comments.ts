import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

export const commentsCommand = new Command("comments")
  .description("Get comments for an event by ID")
  .argument("<event_id>", "Event ID (use 'resolve' command to get ID from URL)")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .option("--order <field>", "Order by (createdAt, updatedAt, reactionCount)", "createdAt")
  .option("--ascending", "Sort ascending")
  .option("--holders-only", "Only show holders' comments")
  .action(async (eventId, opts) => {
    const gamma = new GammaClient();
    const result = await gamma.getComments({
      parent_entity_type: "Event",
      parent_entity_id: Number(eventId),
      limit: opts.limit,
      offset: opts.offset,
      order: opts.order,
      ascending: opts.ascending,
      holders_only: opts.holdersOnly,
    });
    out(result);
  });
