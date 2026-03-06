import { Command } from "commander";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, formatUnits } from "viem";
import { polygon } from "viem/chains";
import { select, confirm, password } from "@inquirer/prompts";
import { resolvePrivateKey, RPC_URL } from "../lib/config.js";
import { createRandomWallet, deriveGnosisSafeWallet } from "../lib/wallet.js";
import {
  USDCE_ADDRESS,
  CTF_ADDRESS,
  CTF_EXCHANGE,
  NEG_RISK_CTF_EXCHANGE,
  ERC20_ABI,
  ERC1155_ABI,
} from "../lib/contracts.js";
import { deploySafe, buildApproveCalldata, relayMultiSend, RelayerClient } from "../lib/relayer.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { CONFIG_DIR, CONFIG_ENV_PATH } from "../lib/config.js";

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function step(n: number, total: number, title: string) {
  console.log(`\n${bold(`[${n}/${total}]`)} ${bold(title)}`);
}

async function pollTransaction(relayer: RelayerClient, txId: string): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const tx = await relayer.getTransaction(txId);
      const state = Array.isArray(tx) ? tx[0]?.state : tx?.state;
      if (state === "STATE_CONFIRMED" || state === "STATE_MINED") {
        console.log(` ${green("done")}`);
        return true;
      }
      if (state === "STATE_FAILED") {
        console.log(` ${red("failed")}`);
        return false;
      }
    } catch {}
    process.stdout.write(".");
  }
  console.log(` ${red("timeout")}`);
  return false;
}

function updateEnvFile(vars: Record<string, string>) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  let content = "";
  if (existsSync(CONFIG_ENV_PATH)) {
    content = readFileSync(CONFIG_ENV_PATH, "utf-8");
  }

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content = content.trimEnd() + `\n${key}=${value}\n`;
    }
  }

  writeFileSync(CONFIG_ENV_PATH, content, { mode: 0o600 });
}

export const setupCommand = new Command("setup")
  .description("Interactive setup wizard for Polymarket trading")
  .action(async () => {
    console.log(bold("\nPolymarket CLI Setup\n"));

    // Step 1: Wallet
    let privateKey: `0x${string}`;
    let eoaAddress: string;
    const existingKey = process.env.POLYMARKET_PRIVATE_KEY;

    if (existingKey) {
      privateKey = resolvePrivateKey(existingKey);
      const account = privateKeyToAccount(privateKey);
      eoaAddress = account.address;
      step(1, 4, "Wallet");
      console.log(`  ${green("Found existing key in environment")}`);
      console.log(`  EOA: ${cyan(eoaAddress)}`);
    } else {
      step(1, 4, "Wallet");

      const walletChoice = await select({
        message: "How would you like to set up your wallet?",
        choices: [
          { name: "Import existing private key", value: "import" },
          { name: "Generate new wallet", value: "generate" },
        ],
      });

      if (walletChoice === "import") {
        const keyInput = await password({
          message: "Enter your private key:",
          mask: "*",
        });
        privateKey = resolvePrivateKey(keyInput);
        const account = privateKeyToAccount(privateKey);
        eoaAddress = account.address;
        updateEnvFile({ POLYMARKET_PRIVATE_KEY: privateKey });
        console.log(`  EOA: ${cyan(eoaAddress)}`);
        console.log(`  ${green("Saved to ~/.polytown/.env")}`);
      } else {
        const wallet = createRandomWallet();
        privateKey = wallet.privateKey as `0x${string}`;
        eoaAddress = wallet.address;
        updateEnvFile({ POLYMARKET_PRIVATE_KEY: privateKey });
        console.log(`  EOA: ${cyan(eoaAddress)}`);
        console.log(`  Private Key: ${yellow(wallet.privateKey)}`);
        console.log(`  ${green("Saved to ~/.polytown/.env")}`);
      }
    }

    // Step 2: Gnosis Safe
    step(2, 4, "Gnosis Safe");

    const safeAddress = deriveGnosisSafeWallet(eoaAddress);
    console.log(`  Safe: ${cyan(safeAddress)}`);

    const relayer = new RelayerClient();
    const deployed = await relayer.isDeployed(safeAddress);

    if (deployed) {
      console.log(`  Status: ${green("deployed")}`);
    } else {
      console.log(`  Status: ${yellow("not deployed")}`);

      const doDeploy = await confirm({
        message: "Deploy your Gnosis Safe now? (gas-free via relayer)",
        default: true,
      });

      if (doDeploy) {
        process.stdout.write("  Deploying...");
        const result = await deploySafe(privateKey);

        if (result.alreadyDeployed) {
          console.log(` ${green("already deployed")}`);
        } else {
          await pollTransaction(relayer, result.transactionID);
        }
      } else {
        console.log(dim("  Skipped. Run later: polymarket approve deploy"));
      }
    }

    // Step 3: Approvals
    step(3, 4, "Token Approvals");

    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(RPC_URL),
    });

    const [usdcCtf, usdcNeg, ctfCtf, ctfNeg] = await Promise.all([
      publicClient.readContract({
        address: USDCE_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [safeAddress as `0x${string}`, CTF_EXCHANGE],
      }),
      publicClient.readContract({
        address: USDCE_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [safeAddress as `0x${string}`, NEG_RISK_CTF_EXCHANGE],
      }),
      publicClient.readContract({
        address: CTF_ADDRESS,
        abi: ERC1155_ABI,
        functionName: "isApprovedForAll",
        args: [safeAddress as `0x${string}`, CTF_EXCHANGE],
      }),
      publicClient.readContract({
        address: CTF_ADDRESS,
        abi: ERC1155_ABI,
        functionName: "isApprovedForAll",
        args: [safeAddress as `0x${string}`, NEG_RISK_CTF_EXCHANGE],
      }),
    ]);

    const allApproved = usdcCtf > 0n && usdcNeg > 0n && ctfCtf && ctfNeg;
    const tag = (ok: boolean) => (ok ? green("approved") : red("not approved"));

    console.log(`  USDC.e -> CTF Exchange:      ${tag(usdcCtf > 0n)}`);
    console.log(`  USDC.e -> Neg Risk Exchange:  ${tag(usdcNeg > 0n)}`);
    console.log(`  CTF    -> CTF Exchange:       ${tag(ctfCtf as boolean)}`);
    console.log(`  CTF    -> Neg Risk Exchange:   ${tag(ctfNeg as boolean)}`);

    if (!allApproved) {
      const doApprove = await confirm({
        message: "Set all approvals now? (gas-free via relayer)",
        default: true,
      });

      if (doApprove) {
        process.stdout.write("  Approving...");
        try {
          const txns = buildApproveCalldata();
          const result = await relayMultiSend(privateKey, txns, "approve");
          await pollTransaction(relayer, result.transactionID);
        } catch (e: any) {
          console.log(` ${red("failed")}: ${e.message}`);
        }
      } else {
        console.log(dim("  Skipped. Run later: polymarket approve set"));
      }
    }

    // Step 4: Balance
    step(4, 4, "Balance");

    const balance = await publicClient.readContract({
      address: USDCE_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [safeAddress as `0x${string}`],
    });

    const formatted = formatUnits(balance, 6);

    if (balance > 0n) {
      console.log(`  USDC.e: ${green(`$${formatted}`)}`);
      console.log(green(bold("\n  Setup complete! You're ready to trade.\n")));
    } else {
      console.log(`  USDC.e: ${yellow("$0.00")}`);
      console.log(`\n  Send ${bold("USDC.e")} on ${bold("Polygon")} to:`);
      console.log(`  ${cyan(safeAddress)}\n`);
    }
  });
