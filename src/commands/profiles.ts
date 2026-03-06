import { Command } from "commander";
import { privateKeyToAccount } from "viem/accounts";
import { resolvePrivateKey } from "../lib/config.js";
import { deriveGnosisSafeWallet } from "../lib/wallet.js";
import { GammaClient } from "../lib/gamma.js";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

export const profilesCommand = new Command("profile")
  .description("Get user profile by address")
  .argument("[address]", "Wallet address (use 'resolve' for @username, defaults to your wallet)")
  .option("--private-key <key>", "Private key")
  .action(async (address, opts) => {
    let addr = address;
    if (!addr) {
      const key = resolvePrivateKey(opts.privateKey);
      const account = privateKeyToAccount(key);
      addr = deriveGnosisSafeWallet(account.address);
    }

    const gamma = new GammaClient();
    const [profile, stats] = await Promise.all([
      gamma.getProfile(addr).catch(() => null),
      gamma.getProfileStats(addr).catch(() => null),
    ]);

    out({ ...profile, stats });
  });
