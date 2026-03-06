import { Command } from "commander";
import { createPublicClient, http, formatUnits, parseUnits, encodeFunctionData, isAddress } from "viem";
import { polygon } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { resolvePrivateKey, RPC_URL } from "../lib/config.js";
import { createRandomWallet, deriveGnosisSafeWallet } from "../lib/wallet.js";
import { USDCE_ADDRESS, ERC20_ABI } from "../lib/contracts.js";
import { relayTransaction } from "../lib/relayer.js";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

function resolveAddress(opts: { privateKey?: string }) {
  const key = resolvePrivateKey(opts.privateKey);
  const account = privateKeyToAccount(key);
  return {
    key,
    eoa: account.address,
    address: deriveGnosisSafeWallet(account.address),
  };
}

export const walletCommand = new Command("wallet").description(
  "Wallet management"
);

walletCommand
  .command("create")
  .description("Create a new random wallet")
  .action(async () => {
    const wallet = createRandomWallet();
    const address = deriveGnosisSafeWallet(wallet.address);
    out({
      privateKey: wallet.privateKey,
      eoa: wallet.address,
      address,
    });
  });

walletCommand
  .command("import <key>")
  .description("Import wallet from private key")
  .action(async (key) => {
    const normalized = key.startsWith("0x") ? key : `0x${key}`;
    const account = privateKeyToAccount(normalized as `0x${string}`);
    const address = deriveGnosisSafeWallet(account.address);
    out({
      eoa: account.address,
      address,
    });
  });

walletCommand
  .command("address")
  .description("Show active wallet address")
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const { address } = resolveAddress(opts);
    out({ address });
  });

walletCommand
  .command("show")
  .description("Show wallet details")
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const { eoa, address } = resolveAddress(opts);
    out({ eoa, address });
  });

walletCommand
  .command("balance")
  .description("Show wallet USDC.e balance")
  .option("--private-key <key>", "Private key")
  .action(async (opts) => {
    const { address } = resolveAddress(opts);
    const publicClient = createPublicClient({ chain: polygon, transport: http(RPC_URL) });

    const usdce = await publicClient.readContract({
      address: USDCE_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    out({
      address,
      "usdc.e": formatUnits(usdce as bigint, 6),
    });
  });

walletCommand
  .command("withdraw <amount> <to>")
  .description("Withdraw USDC.e from Safe wallet via relayer (gasless)")
  .option("--private-key <key>", "Private key")
  .action(async (amount, to, opts) => {
    if (!isAddress(to)) throw new Error(`Invalid address: ${to}`);
    const key = resolvePrivateKey(opts.privateKey);
    const amountInWei = parseUnits(amount, 6); // USDC.e has 6 decimals

    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, amountInWei],
    });

    const result = await relayTransaction(
      key,
      USDCE_ADDRESS,
      data,
      `Withdraw ${amount} USDC.e to ${to}`,
    );
    out(result);
  });

walletCommand
  .command("reset")
  .description("Reset wallet (clear env reminder)")
  .action(async () => {
    out({
      message: "To reset, remove POLYMARKET_PRIVATE_KEY from your .env file",
    });
  });
