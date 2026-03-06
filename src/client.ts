import { ClobClient } from "@polymarket/clob-client";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { CLOB_URL, POLYGON_CHAIN_ID, RPC_URL } from "./lib/config.js";
import { deriveGnosisSafeWallet } from "./lib/wallet.js";

export function createReadonlyClobClient(): ClobClient {
  return new ClobClient(CLOB_URL, POLYGON_CHAIN_ID);
}

export async function createAuthenticatedClobClient(
  privateKey: `0x${string}`,
): Promise<ClobClient> {
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: polygon,
    transport: http(RPC_URL),
  });

  const derivedAddress = deriveGnosisSafeWallet(account.address);

  let creds: { key: string; secret: string; passphrase: string };
  const tempClient = new ClobClient(
    CLOB_URL,
    POLYGON_CHAIN_ID,
    walletClient as any,
    undefined,
    2, // POLY_GNOSIS_SAFE
    derivedAddress,
  );

  // Suppress noisy CLOB client logs during key derivation
  const origError = console.error;
  console.error = () => {};

  try {
    creds = await tempClient.deriveApiKey();
    if (!creds?.key || !creds?.secret) throw new Error("empty");
  } catch {
    try {
      creds = await tempClient.createApiKey();
      if (!creds?.key || !creds?.secret) {
        throw new Error("API key creation returned empty credentials");
      }
    } catch (e: any) {
      console.error = origError;
      throw new Error(`Failed to obtain CLOB API key: ${e.message || e}`);
    }
  } finally {
    console.error = origError;
  }

  return new ClobClient(
    CLOB_URL,
    POLYGON_CHAIN_ID,
    walletClient as any,
    creds,
    2, // POLY_GNOSIS_SAFE
    derivedAddress,
  );
}
