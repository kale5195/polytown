import { Command } from "commander";
import { privateKeyToAccount } from "viem/accounts";
import { resolvePrivateKey } from "../lib/config.js";
import { deriveGnosisSafeWallet } from "../lib/wallet.js";
import { DataClient } from "../lib/data.js";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

/** Resolve address: use arg if provided, otherwise derive from env */
function resolveAddr(address?: string, opts?: { privateKey?: string }): string {
  if (address) return address;
  const key = resolvePrivateKey(opts?.privateKey);
  const account = privateKeyToAccount(key);
  return deriveGnosisSafeWallet(account.address);
}

export const dataCommand = new Command("data").description(
  "Data API commands"
);

dataCommand
  .command("positions [address]")
  .description("Get positions (defaults to your wallet)")
  .option("--private-key <key>", "Private key")

  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (address, opts) => {
    const addr = resolveAddr(address, opts);
    const client = new DataClient();
    const result = await client.getPositions(addr, opts);
    out(result);
  });

dataCommand
  .command("closed-positions [address]")
  .description("Get closed positions (defaults to your wallet)")
  .option("--private-key <key>", "Private key")

  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (address, opts) => {
    const addr = resolveAddr(address, opts);
    const client = new DataClient();
    const result = await client.getClosedPositions(addr, opts);
    out(result);
  });

dataCommand
  .command("value [address]")
  .description("Get portfolio value (defaults to your wallet)")
  .option("--private-key <key>", "Private key")

  .action(async (address, opts) => {
    const addr = resolveAddr(address, opts);
    const client = new DataClient();
    const result = await client.getValue(addr);
    out(result);
  });

dataCommand
  .command("traded [address]")
  .description("Check if address has traded (defaults to your wallet)")
  .option("--private-key <key>", "Private key")

  .action(async (address, opts) => {
    const addr = resolveAddr(address, opts);
    const client = new DataClient();
    const result = await client.getTraded(addr);
    out(result);
  });

dataCommand
  .command("trades [address]")
  .description("Get trade history (defaults to your wallet)")
  .option("--private-key <key>", "Private key")

  .option("--market <condition_id>", "Filter by market condition ID")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (address, opts) => {
    const addr = resolveAddr(address, opts);
    const client = new DataClient();
    const result = await client.getTrades(addr, {
      limit: opts.limit,
      offset: opts.offset,
      market: opts.market,
    });
    out(result);
  });

dataCommand
  .command("market-trades")
  .description("Get all trades for a market (no user filter)")
  .option("--market <condition_id>", "Market condition ID")
  .option("--slug <slug>", "Market slug")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (opts) => {
    const client = new DataClient();
    const result = await client.getMarketTrades({
      limit: opts.limit,
      offset: opts.offset,
      market: opts.market,
      slug: opts.slug,
    });
    out(result);
  });

dataCommand
  .command("activity [address]")
  .description("Get activity history (defaults to your wallet)")
  .option("--private-key <key>", "Private key")

  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (address, opts) => {
    const addr = resolveAddr(address, opts);
    const client = new DataClient();
    const result = await client.getActivity(addr, opts);
    out(result);
  });

dataCommand
  .command("holders <condition_id>")
  .description("Get holders for condition")
  .option("--limit <n>", "Limit results", parseInt)
  .action(async (conditionId, opts) => {
    const client = new DataClient();
    const result = await client.getHolders(conditionId, opts);
    out(result);
  });

dataCommand
  .command("open-interest <condition_id>")
  .description("Get open interest")
  .action(async (conditionId) => {
    const client = new DataClient();
    const result = await client.getOpenInterest(conditionId);
    out(result);
  });

dataCommand
  .command("volume <event_id>")
  .description("Get volume for event")
  .action(async (eventId) => {
    const client = new DataClient();
    const result = await client.getVolume(eventId);
    out(result);
  });

dataCommand
  .command("leaderboard")
  .description("Get leaderboard")
  .option("--period <period>", "Time period")
  .option("--order-by <field>", "Order by field")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (opts) => {
    const client = new DataClient();
    const result = await client.getLeaderboard({
      period: opts.period,
      orderBy: opts.orderBy,
      limit: opts.limit,
      offset: opts.offset,
    });
    out(result);
  });

dataCommand
  .command("builder-leaderboard")
  .description("Get builder leaderboard")
  .option("--period <period>", "Time period")
  .option("--limit <n>", "Limit results", parseInt)
  .option("--offset <n>", "Offset results", parseInt)
  .action(async (opts) => {
    const client = new DataClient();
    const result = await client.getBuilderLeaderboard(opts);
    out(result);
  });

