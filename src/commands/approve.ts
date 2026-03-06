import { Command } from "commander";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { resolvePrivateKey, RPC_URL } from "../lib/config.js";
import { deriveGnosisSafeWallet } from "../lib/wallet.js";
import {
  USDCE_ADDRESS,
  CTF_ADDRESS,
  CTF_EXCHANGE,
  NEG_RISK_CTF_EXCHANGE,
  ERC20_ABI,
  ERC1155_ABI,
} from "../lib/contracts.js";
import { relayMultiSend, buildApproveCalldata, deploySafe } from "../lib/relayer.js";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

export const approveCommand = new Command("approve").description(
  "Token approval management"
);

approveCommand
  .command("check [address]")
  .description("Check approval status")
  .option("--private-key <key>", "Private key")
  .action(async (address, opts) => {
    let targetAddress: string;

    if (address) {
      targetAddress = address;
    } else {
      const key = resolvePrivateKey(opts.privateKey);
      const account = privateKeyToAccount(key);
      targetAddress = deriveGnosisSafeWallet(account.address);
    }

    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(RPC_URL),
    });

    const [usdcCtfExchange, usdcNegRisk, ctfCtfExchange, ctfNegRisk] =
      await Promise.all([
        publicClient.readContract({
          address: USDCE_ADDRESS,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [targetAddress as `0x${string}`, CTF_EXCHANGE],
        }),
        publicClient.readContract({
          address: USDCE_ADDRESS,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [targetAddress as `0x${string}`, NEG_RISK_CTF_EXCHANGE],
        }),
        publicClient.readContract({
          address: CTF_ADDRESS,
          abi: ERC1155_ABI,
          functionName: "isApprovedForAll",
          args: [targetAddress as `0x${string}`, CTF_EXCHANGE],
        }),
        publicClient.readContract({
          address: CTF_ADDRESS,
          abi: ERC1155_ABI,
          functionName: "isApprovedForAll",
          args: [targetAddress as `0x${string}`, NEG_RISK_CTF_EXCHANGE],
        }),
      ]);

    out({
      address: targetAddress,
      "usdc.e": {
        ctfExchange: usdcCtfExchange.toString(),
        negRiskExchange: usdcNegRisk.toString(),
      },
      ctf: {
        ctfExchange: ctfCtfExchange,
        negRiskExchange: ctfNegRisk,
      },
    });
  });

approveCommand
  .command("set")
  .description("Set all approvals for trading (gas-free via relayer)")
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const key = resolvePrivateKey(opts.privateKey);
    const account = privateKeyToAccount(key);
    const safeAddress = deriveGnosisSafeWallet(account.address);

    const txns = buildApproveCalldata();
    const result = await relayMultiSend(key, txns, "approve");
    out({
      address: account.address,
      safeAddress,
      method: "relayer (gas-free)",
      ...result,
    });
  });

approveCommand
  .command("deploy")
  .description("Deploy Gnosis Safe wallet via relayer (gas-free)")
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const key = resolvePrivateKey(opts.privateKey);
    const account = privateKeyToAccount(key);
    const safeAddress = deriveGnosisSafeWallet(account.address);

    console.log(`EOA: ${account.address}`);
    console.log(`Safe: ${safeAddress}`);
    console.log("Deploying...");

    const result = await deploySafe(key);
    out(result);
  });
