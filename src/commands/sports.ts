import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

export const sportsCommand = new Command("sports").description(
  "Sports commands"
);

sportsCommand
  .command("list")
  .description("List sports")
  .action(async () => {
    const gamma = new GammaClient();
    const result = await gamma.getSports();
    console.log(JSON.stringify(result, null, 2));
  });

sportsCommand
  .command("market-types")
  .description("List market types")
  .action(async () => {
    const gamma = new GammaClient();
    const result = await gamma.getMarketTypes();
    console.log(JSON.stringify(result, null, 2));
  });

sportsCommand
  .command("teams")
  .description("List teams")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .option("--league <league>", "Filter by league")
  .option("--ascending", "Sort ascending")
  .action(async (opts) => {
    const gamma = new GammaClient();
    const result = await gamma.getTeams(opts);
    console.log(JSON.stringify(result, null, 2));
  });
