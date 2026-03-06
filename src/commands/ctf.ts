import { Command } from "commander";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
import { resolvePrivateKey, RPC_URL } from "../lib/config.js";
import {
  USDCE_ADDRESS,
  CTF_ADDRESS,
  CTF_ABI,
} from "../lib/contracts.js";
import {
  relayTransaction,
  buildRedeemCalldata,
  buildNegRiskRedeemCalldata,
  buildSplitCalldata,
  buildMergeCalldata,
} from "../lib/relayer.js";
import type { Hex } from "viem";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;

export const ctfCommand = new Command("ctf").description(
  "Conditional Token Framework commands"
);

ctfCommand
  .command("split")
  .description("Split position")
  .requiredOption("--condition <id>", "Condition ID")
  .requiredOption("--amount <amount>", "Amount in USDC.e units", parseFloat)
  .option("--collateral <address>", "Collateral token address", USDCE_ADDRESS)
  .option("--partition <sets>", "Partition index sets (comma-separated)", "1,2")
  .option("--parent-collection <id>", "Parent collection ID", ZERO_BYTES32)
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const key = resolvePrivateKey(opts.privateKey);
    const partition = opts.partition.split(",").map((s: string) => BigInt(s));
    const amount = BigInt(Math.round(opts.amount * 1e6));

    const { to, data } = buildSplitCalldata(
      opts.condition as Hex,
      amount,
      partition,
      opts.collateral as `0x${string}`,
      opts.parentCollection as Hex,
    );
    const result = await relayTransaction(key, to, data, "split");
    out({ action: "splitPosition", ...result });
  });

ctfCommand
  .command("merge")
  .description("Merge positions")
  .requiredOption("--condition <id>", "Condition ID")
  .requiredOption("--amount <amount>", "Amount in USDC.e units", parseFloat)
  .option("--collateral <address>", "Collateral token address", USDCE_ADDRESS)
  .option("--partition <sets>", "Partition index sets (comma-separated)", "1,2")
  .option("--parent-collection <id>", "Parent collection ID", ZERO_BYTES32)
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const key = resolvePrivateKey(opts.privateKey);
    const partition = opts.partition.split(",").map((s: string) => BigInt(s));
    const amount = BigInt(Math.round(opts.amount * 1e6));

    const { to, data } = buildMergeCalldata(
      opts.condition as Hex,
      amount,
      partition,
      opts.collateral as `0x${string}`,
      opts.parentCollection as Hex,
    );
    const result = await relayTransaction(key, to, data, "merge");
    out({ action: "mergePositions", ...result });
  });

ctfCommand
  .command("redeem")
  .description("Redeem positions (via relayer, gas-free)")
  .requiredOption("--condition <id>", "Condition ID")
  .option("--collateral <address>", "Collateral token address", USDCE_ADDRESS)
  .option("--index-sets <sets>", "Index sets (comma-separated)", "1,2")
  .option("--parent-collection <id>", "Parent collection ID", ZERO_BYTES32)
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const key = resolvePrivateKey(opts.privateKey);
    const indexSets = opts.indexSets.split(",").map((s: string) => BigInt(s));

    const { to, data } = buildRedeemCalldata(
      opts.condition as Hex,
      indexSets,
      opts.collateral as `0x${string}`,
      opts.parentCollection as Hex,
    );
    const result = await relayTransaction(key, to, data, "redeem");
    out({ action: "redeemPositions", ...result });
  });

ctfCommand
  .command("redeem-neg-risk")
  .description("Redeem neg-risk positions (via relayer, gas-free)")
  .requiredOption("--condition <id>", "Condition ID")
  .requiredOption("--amounts <amounts>", "Amounts (comma-separated)")
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const key = resolvePrivateKey(opts.privateKey);
    const amounts = opts.amounts.split(",").map((s: string) => BigInt(s));

    const { to, data } = buildNegRiskRedeemCalldata(opts.condition as Hex, amounts);
    const result = await relayTransaction(key, to, data, "redeem");
    out({ action: "redeemPositions (neg-risk)", ...result });
  });

ctfCommand
  .command("condition-id")
  .description("Compute condition ID")
  .requiredOption("--oracle <address>", "Oracle address")
  .requiredOption("--question <id>", "Question ID (bytes32)")
  .requiredOption("--outcomes <n>", "Number of outcomes", parseInt)
  .action(async (opts) => {
    const publicClient = createPublicClient({ chain: polygon, transport: http(RPC_URL) });
    const result = await publicClient.readContract({
      address: CTF_ADDRESS,
      abi: CTF_ABI,
      functionName: "getConditionId",
      args: [opts.oracle as `0x${string}`, opts.question as Hex, BigInt(opts.outcomes)],
    });
    out({ conditionId: result });
  });

ctfCommand
  .command("collection-id")
  .description("Compute collection ID")
  .requiredOption("--condition <id>", "Condition ID")
  .requiredOption("--index-set <n>", "Index set", parseInt)
  .action(async (opts) => {
    const publicClient = createPublicClient({ chain: polygon, transport: http(RPC_URL) });
    const result = await publicClient.readContract({
      address: CTF_ADDRESS,
      abi: CTF_ABI,
      functionName: "getCollectionId",
      args: [ZERO_BYTES32, opts.condition as Hex, BigInt(opts.indexSet)],
    });
    out({ collectionId: result });
  });

ctfCommand
  .command("position-id")
  .description("Compute position ID")
  .requiredOption("--collection <id>", "Collection ID")
  .action(async (opts) => {
    const publicClient = createPublicClient({ chain: polygon, transport: http(RPC_URL) });
    const result = await publicClient.readContract({
      address: CTF_ADDRESS,
      abi: CTF_ABI,
      functionName: "getPositionId",
      args: [USDCE_ADDRESS, opts.collection as Hex],
    });
    out({ positionId: result.toString() });
  });
