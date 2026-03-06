import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

export const seriesCommand = new Command("series").description(
  "Series commands"
);

seriesCommand
  .command("list")
  .description("List series")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .option("--order <field>", "Order by field")
  .option("--ascending", "Sort ascending")
  .option("--closed", "Include closed")
  .action(async (opts) => {
    const gamma = new GammaClient();
    const result = await gamma.getSeries(opts);
    console.log(JSON.stringify(result, null, 2));
  });

seriesCommand
  .command("get <id>")
  .description("Get series by ID")
  .action(async (id) => {
    const gamma = new GammaClient();
    const result = await gamma.getSeriesById(id);
    console.log(JSON.stringify(result, null, 2));
  });
