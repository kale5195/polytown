import { Command } from "commander";
import { createReadonlyClobClient, createAuthenticatedClobClient } from "../client.js";
import { resolvePrivateKey } from "../lib/config.js";
import { AssetType } from "@polymarket/clob-client";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

// Suppress noisy [CLOB Client] logs, surface clean error messages
async function quietCall<T>(fn: () => Promise<T>): Promise<T> {
  const origLog = console.log;
  const origError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await fn();
  } catch (e: any) {
    console.log = origLog;
    console.error = origError;
    console.error(`Error: ${formatError(e)}`);
    process.exit(1);
  } finally {
    console.log = origLog;
    console.error = origError;
  }
}

function formatError(e: any): string {
  const data = e?.response?.data || e?.data;
  if (data?.error) return data.error;
  return e?.message || String(e);
}

async function getAuthClient(opts: any) {
  try {
    const key = resolvePrivateKey(opts.privateKey);
    return await createAuthenticatedClobClient(key);
  } catch (e: any) {
    console.error(`Error: ${formatError(e)}`);
    process.exit(1);
  }
}

export const clobCommand = new Command("clob").description("CLOB commands");

// ─── Phase 1: Read-only ───

clobCommand
  .command("ok")
  .description("Check CLOB API health")
  .action(async () => {
    const client = createReadonlyClobClient();
    const result = await client.getOk();
    out(result);
  });

clobCommand
  .command("price <token_id>")
  .description("Get price for token")
  .requiredOption("--side <side>", "buy or sell")
  .action(async (tokenId, opts) => {
    const client = createReadonlyClobClient();
    const result = await client.getPrice(tokenId, opts.side);
    out(result);
  });

clobCommand
  .command("batch-prices <ids>")
  .description("Get prices for multiple tokens (comma-separated)")
  .requiredOption("--side <side>", "buy or sell")
  .action(async (ids, opts) => {
    const client = createReadonlyClobClient();
    const tokenIds = ids.split(",");
    const result = await client.getPrices(tokenIds.map((token_id: string) => ({ token_id, side: opts.side })));
    out(result);
  });

clobCommand
  .command("midpoint <token_id>")
  .description("Get midpoint for token")
  .action(async (tokenId) => {
    const client = createReadonlyClobClient();
    const result = await client.getMidpoint(tokenId);
    out(result);
  });

clobCommand
  .command("midpoints <token_ids>")
  .description("Get midpoints for multiple tokens (comma-separated)")
  .action(async (tokenIds) => {
    const client = createReadonlyClobClient();
    const result = await client.getMidpoints(tokenIds.split(","));
    out(result);
  });

clobCommand
  .command("spread <token_id>")
  .description("Get spread for token")
  .option("--side <side>", "buy or sell")
  .action(async (tokenId, opts) => {
    const client = createReadonlyClobClient();
    const result = await client.getSpread(tokenId);
    out(result);
  });

clobCommand
  .command("spreads <token_ids>")
  .description("Get spreads for multiple tokens (comma-separated)")
  .action(async (tokenIds) => {
    const client = createReadonlyClobClient();
    const result = await client.getSpreads(tokenIds.split(","));
    out(result);
  });

clobCommand
  .command("book <token_id>")
  .description("Get order book for token")
  .action(async (tokenId) => {
    const client = createReadonlyClobClient();
    const result = await client.getOrderBook(tokenId);
    out(result);
  });

clobCommand
  .command("books <token_ids>")
  .description("Get order books for multiple tokens (comma-separated)")
  .action(async (tokenIds) => {
    const client = createReadonlyClobClient();
    const result = await client.getOrderBooks(tokenIds.split(","));
    out(result);
  });

clobCommand
  .command("last-trade <token_id>")
  .description("Get last trade price")
  .action(async (tokenId) => {
    const client = createReadonlyClobClient();
    const result = await client.getLastTradePrice(tokenId);
    out(result);
  });

clobCommand
  .command("last-trades <token_ids>")
  .description("Get last trade prices (comma-separated)")
  .action(async (tokenIds) => {
    const client = createReadonlyClobClient();
    const result = await client.getLastTradesPrices(tokenIds.split(","));
    out(result);
  });

clobCommand
  .command("market <condition_id>")
  .description("Get CLOB market by condition ID")
  .action(async (conditionId) => {
    const client = createReadonlyClobClient();
    const result = await client.getMarket(conditionId);
    out(result);
  });

clobCommand
  .command("tick-size <token_id>")
  .description("Get tick size for token")
  .action(async (tokenId) => {
    const client = createReadonlyClobClient();
    const result = await client.getTickSize(tokenId);
    out(result);
  });

clobCommand
  .command("fee-rate <token_id>")
  .description("Get fee rate for token")
  .option("--private-key <key>", "Private key")

  .action(async (tokenId, opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getFeeRateBps(tokenId);
    out(result);
  });

clobCommand
  .command("neg-risk <token_id>")
  .description("Check if token is neg-risk")
  .action(async (tokenId) => {
    const client = createReadonlyClobClient();
    const result = await client.getNegRisk(tokenId);
    out(result);
  });

clobCommand
  .command("price-history <token_id>")
  .description("Get price history")
  .requiredOption("--interval <interval>", "Time interval (e.g. max, 1d, 1w)")
  .option("--fidelity <fidelity>", "Data fidelity", parseInt)
  .action(async (tokenId, opts) => {
    const client = createReadonlyClobClient();
    const result = await client.getPricesHistory({
      market: tokenId,
      interval: opts.interval,
      fidelity: opts.fidelity,
    });
    out(result);
  });

clobCommand
  .command("time")
  .description("Get server time")
  .action(async () => {
    const client = createReadonlyClobClient();
    const result = await client.getServerTime();
    out(result);
  });

clobCommand
  .command("geoblock")
  .description("Check geo-blocking status")
  .action(async () => {
    const client = createReadonlyClobClient();
    try {
      const result = await client.getOk();
      out({ geoblocked: false, response: result });
    } catch (e: any) {
      out({ geoblocked: true, error: e.message });
    }
  });

// ─── Phase 2: Authenticated Trading ───

clobCommand
  .command("create-order")
  .description("Place a limit order")
  .requiredOption("--token <token_id>", "Token ID")
  .requiredOption("--side <side>", "buy or sell")
  .requiredOption("--price <price>", "Price", parseFloat)
  .requiredOption("--size <size>", "Size", parseFloat)
  .option("--order-type <type>", "Order type (GTC, GTD, FOK)", "GTC")
  .option("--post-only", "Post-only order")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const order = await client.createOrder({
      tokenID: opts.token,
      side: opts.side.toUpperCase(),
      price: opts.price,
      size: opts.size,
      ...(opts.postOnly ? { postOnly: true } : {}),
    });
    const result = await quietCall(() => client.postOrder(order, opts.orderType));
    out(result);
  });

clobCommand
  .command("market-order")
  .description("Place a market order")
  .requiredOption("--token <token_id>", "Token ID")
  .requiredOption("--side <side>", "buy or sell")
  .requiredOption("--amount <amount>", "Amount", parseFloat)
  .option("--order-type <type>", "Order type", "FOK")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const order = await client.createMarketOrder({
      tokenID: opts.token,
      side: opts.side.toUpperCase(),
      amount: opts.amount,
    });
    const result = await quietCall(() => client.postOrder(order, opts.orderType));
    out(result);
  });

clobCommand
  .command("post-orders")
  .description("Batch post orders")
  .requiredOption("--tokens <ids>", "Token IDs (comma-separated)")
  .requiredOption("--side <side>", "buy or sell")
  .requiredOption("--prices <prices>", "Prices (comma-separated)")
  .requiredOption("--sizes <sizes>", "Sizes (comma-separated)")
  .option("--order-type <type>", "Order type", "GTC")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const tokens = opts.tokens.split(",");
    const prices = opts.prices.split(",").map(Number);
    const sizes = opts.sizes.split(",").map(Number);
    const orders = await Promise.all(
      tokens.map((token: string, i: number) =>
        client.createOrder({
          tokenID: token,
          side: opts.side.toUpperCase(),
          price: prices[i],
          size: sizes[i],
        })
      )
    );
    const result = await client.postOrders(orders.map((order) => ({ order, orderType: opts.orderType })));
    out(result);
  });

clobCommand
  .command("orders")
  .description("List open orders")
  .option("--market <condition_id>", "Filter by market")
  .option("--asset <token_id>", "Filter by asset")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const params: any = {};
    if (opts.market) params.market = opts.market;
    if (opts.asset) params.asset_id = opts.asset;
    if (opts.cursor) params.next_cursor = opts.cursor;
    const result = await client.getOpenOrders(params);
    out(result);
  });

clobCommand
  .command("order <order_id>")
  .description("Get order details")
  .option("--private-key <key>", "Private key")

  .action(async (orderId, opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getOrder(orderId);
    out(result);
  });

clobCommand
  .command("cancel <order_id>")
  .description("Cancel an order")
  .option("--private-key <key>", "Private key")

  .action(async (orderId, opts) => {
    const client = await getAuthClient(opts);
    const result = await client.cancelOrder({ orderID: orderId });
    out(result);
  });

clobCommand
  .command("cancel-orders <ids>")
  .description("Cancel multiple orders (comma-separated)")
  .option("--private-key <key>", "Private key")

  .action(async (ids, opts) => {
    const client = await getAuthClient(opts);
    const orderIds = ids.split(",");
    const result = await client.cancelOrders(
      orderIds.map((id: string) => ({ orderID: id }))
    );
    out(result);
  });

clobCommand
  .command("cancel-all")
  .description("Cancel all open orders")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.cancelAll();
    out(result);
  });

clobCommand
  .command("cancel-market")
  .description("Cancel orders by market")
  .option("--market <condition_id>", "Market condition ID")
  .option("--asset <token_id>", "Asset token ID")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const params: any = {};
    if (opts.market) params.market = opts.market;
    if (opts.asset) params.asset_id = opts.asset;
    const result = await client.cancelMarketOrders(params);
    out(result);
  });

clobCommand
  .command("trades")
  .description("Trade history")
  .option("--market <condition_id>", "Filter by market")
  .option("--asset <token_id>", "Filter by asset")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const params: any = {};
    if (opts.market) params.market = opts.market;
    if (opts.asset) params.asset_id = opts.asset;
    if (opts.cursor) params.next_cursor = opts.cursor;
    const result = await client.getTrades(params);
    out(result);
  });

clobCommand
  .command("balance")
  .description("Check balance")
  .requiredOption("--asset-type <type>", "Asset type (collateral or conditional)")
  .option("--token <token_id>", "Token ID (for conditional)")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const params: any = { asset_type: opts.assetType };
    if (opts.token) params.token_id = opts.token;
    const result = await client.getBalanceAllowance(params);
    out(result);
  });

clobCommand
  .command("update-balance")
  .description("Refresh balance")
  .requiredOption("--asset-type <type>", "Asset type (collateral or conditional)")
  .option("--token <token_id>", "Token ID (for conditional)")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const params: any = { asset_type: opts.assetType };
    if (opts.token) params.token_id = opts.token;
    const result = await client.updateBalanceAllowance(params);
    out(result);
  });

clobCommand
  .command("notifications")
  .description("Get notifications")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getNotifications();
    out(result);
  });

clobCommand
  .command("delete-notifications <ids>")
  .description("Delete notifications (comma-separated)")
  .option("--private-key <key>", "Private key")

  .action(async (ids, opts) => {
    const client = await getAuthClient(opts);
    const result = await client.dropNotifications({ ids: ids.split(",") });
    out(result);
  });

// ─── Phase 3: Rewards + Account ───

clobCommand
  .command("rewards")
  .description("Daily rewards")
  .requiredOption("--date <date>", "Date (YYYY-MM-DD)")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getEarningsForUserForDay(opts.date);
    out(result);
  });

clobCommand
  .command("earnings")
  .description("Daily earnings")
  .requiredOption("--date <date>", "Date (YYYY-MM-DD)")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getTotalEarningsForUserForDay(opts.date);
    out(result);
  });

clobCommand
  .command("earnings-markets")
  .description("Earnings by market")
  .requiredOption("--date <date>", "Date (YYYY-MM-DD)")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getUserEarningsAndMarketsConfig(opts.date);
    out(result);
  });

clobCommand
  .command("reward-percentages")
  .description("Reward percentages")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getRewardPercentages();
    out(result);
  });

clobCommand
  .command("current-rewards")
  .description("Current rewards")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const params: any = {};
    if (opts.cursor) params.next_cursor = opts.cursor;
    const result = await client.getCurrentRewards();
    out(result);
  });

clobCommand
  .command("market-reward <condition_id>")
  .description("Market rewards")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--private-key <key>", "Private key")

  .action(async (conditionId, opts) => {
    const client = await getAuthClient(opts);
    const params: any = { conditionId };
    if (opts.cursor) params.next_cursor = opts.cursor;
    const result = await client.getRawRewardsForMarket(params);
    out(result);
  });

clobCommand
  .command("order-scoring <order_id>")
  .description("Order scoring")
  .option("--private-key <key>", "Private key")

  .action(async (orderId, opts) => {
    const client = await getAuthClient(opts);
    const result = await client.isOrderScoring({ order_id: orderId });
    out(result);
  });

clobCommand
  .command("orders-scoring <ids>")
  .description("Batch order scoring (comma-separated)")
  .option("--private-key <key>", "Private key")

  .action(async (ids, opts) => {
    const client = await getAuthClient(opts);
    const result = await client.areOrdersScoring({
      orderIds: ids.split(","),
    });
    out(result);
  });

clobCommand
  .command("api-keys")
  .description("List API keys")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.getApiKeys();
    out(result);
  });

clobCommand
  .command("create-api-key")
  .description("Create API key")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.createApiKey();
    out(result);
  });

clobCommand
  .command("delete-api-key")
  .description("Delete API key")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    const result = await client.deleteApiKey();
    out(result);
  });

clobCommand
  .command("account-status")
  .description("Account status")
  .option("--private-key <key>", "Private key")

  .action(async (opts) => {
    const client = await getAuthClient(opts);
    // Get multiple account-related info
    const [apiKeys, balance] = await Promise.all([
      client.getApiKeys().catch(() => null),
      client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => null),
    ]);
    out({ apiKeys, balance });
  });
