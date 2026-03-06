import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

export const tagsCommand = new Command("tags").description("Tags commands");

tagsCommand
  .command("list")
  .description("List tags")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .option("--ascending", "Sort ascending")
  .action(async (opts) => {
    const gamma = new GammaClient();
    const result = await gamma.getTags(opts);
    console.log(JSON.stringify(result, null, 2));
  });

tagsCommand
  .command("get <id_or_slug>")
  .description("Get tag by ID or slug")
  .action(async (idOrSlug) => {
    const gamma = new GammaClient();
    const result = await gamma.getTag(idOrSlug);
    console.log(JSON.stringify(result, null, 2));
  });

tagsCommand
  .command("related <id_or_slug>")
  .description("Get related items for tag")
  .action(async (idOrSlug) => {
    const gamma = new GammaClient();
    const result = await gamma.getRelated(idOrSlug);
    console.log(JSON.stringify(result, null, 2));
  });

tagsCommand
  .command("related-tags <id_or_slug>")
  .description("Get related tags")
  .action(async (idOrSlug) => {
    const gamma = new GammaClient();
    const result = await gamma.getRelatedTags(idOrSlug);
    console.log(JSON.stringify(result, null, 2));
  });
