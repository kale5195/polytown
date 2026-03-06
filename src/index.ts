#!/usr/bin/env bun
import { program } from "commander";
import { statusCommand } from "./commands/status.js";
import { marketsCommand } from "./commands/markets.js";
import { eventsCommand } from "./commands/events.js";
import { tagsCommand } from "./commands/tags.js";
import { seriesCommand } from "./commands/series.js";
import { commentsCommand } from "./commands/comments.js";
import { profilesCommand } from "./commands/profiles.js";
import { sportsCommand } from "./commands/sports.js";
import { clobCommand } from "./commands/clob.js";
import { walletCommand } from "./commands/wallet.js";
import { dataCommand } from "./commands/data.js";
import { approveCommand } from "./commands/approve.js";
import { ctfCommand } from "./commands/ctf.js";
import { resolveCommand } from "./commands/resolve.js";
import { setupCommand } from "./commands/setup.js";
import { moversCommand } from "./commands/movers.js";

program
  .name("polytown")
  .description("Polymarket CLI in Bun/TypeScript")
  .version("0.1.0");

program.addCommand(statusCommand);
program.addCommand(marketsCommand);
program.addCommand(eventsCommand);
program.addCommand(tagsCommand);
program.addCommand(seriesCommand);
program.addCommand(commentsCommand);
program.addCommand(profilesCommand);
program.addCommand(sportsCommand);
program.addCommand(clobCommand);
program.addCommand(walletCommand);
program.addCommand(dataCommand);
program.addCommand(approveCommand);
program.addCommand(ctfCommand);
program.addCommand(resolveCommand);
program.addCommand(setupCommand);
program.addCommand(moversCommand);

process.on("unhandledRejection", (err: any) => {
  console.error(`\x1b[31merror:\x1b[0m ${err?.message ?? err}`);
  process.exit(1);
});

program.parseAsync(process.argv);
