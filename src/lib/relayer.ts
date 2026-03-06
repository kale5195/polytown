import {
  encodeFunctionData,
  encodePacked,
  hashTypedData,
  hexToBytes,
  hexToBigInt,
  concat,
  toHex,
  numberToHex,
  zeroAddress,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { RELAYER_URL, POLYGON_CHAIN_ID } from "./config.js";
import { deriveGnosisSafeWallet } from "./wallet.js";
import {
  USDCE_ADDRESS,
  CTF_ADDRESS,
  NEG_RISK_ADAPTER,
  CTF_ABI,
  NEG_RISK_ADAPTER_ABI,
  ERC20_ABI,
  ERC1155_ABI,
  CTF_EXCHANGE,
  NEG_RISK_CTF_EXCHANGE,
} from "./contracts.js";

const MULTISEND_ADDRESS = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761" as const;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const POLYMARKET_SAFE_FACTORY = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b" as const;
const SAFE_FACTORY_NAME = "Polymarket Contract Proxy Factory";
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;

// EIP-712 types for Safe transaction
const SAFE_TX_TYPES = {
  SafeTx: [
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "data", type: "bytes" },
    { name: "operation", type: "uint8" },
    { name: "safeTxGas", type: "uint256" },
    { name: "baseGas", type: "uint256" },
    { name: "gasPrice", type: "uint256" },
    { name: "gasToken", type: "address" },
    { name: "refundReceiver", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

interface RelayerSubmitPayload {
  type: string;
  from: string;
  to: string;
  proxyWallet: string;
  data: string;
  nonce: string;
  signature: string;
  signatureParams: {
    gasPrice: string;
    operation: string;
    safeTxnGas: string;
    baseGas: string;
    gasToken: string;
    refundReceiver: string;
  };
  metadata?: string;
}

// Builder API Key credentials for relayer authentication
interface BuilderCreds {
  key: string;
  secret: string;
  passphrase: string;
}

function resolveBuilderCreds(): BuilderCreds | null {
  const key = process.env.POLYMARKET_BUILDER_API_KEY;
  const secret = process.env.POLYMARKET_BUILDER_SECRET;
  const passphrase = process.env.POLYMARKET_BUILDER_PASSPHRASE;
  if (key && secret && passphrase) {
    return { key, secret, passphrase };
  }
  return null;
}

// HMAC signature generation matching Polymarket's builder-signing-sdk
async function buildHmacSignature(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
  body?: string,
): Promise<string> {
  // Decode base64url secret
  const secretBytes = Uint8Array.from(atob(secret.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

  let message = `${timestamp}${method}${requestPath}`;
  if (body) {
    // Replace single quotes with double quotes for cross-language compat
    message += body.replace(/'/g, '"');
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));

  // Base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateBuilderHeaders(
  creds: BuilderCreds,
  method: string,
  path: string,
  body?: string,
): Promise<Record<string, string>> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return buildHmacSignature(creds.secret, timestamp, method, path, body).then(sig => ({
    "Content-Type": "application/json",
    "POLY_BUILDER_API_KEY": creds.key,
    "POLY_BUILDER_PASSPHRASE": creds.passphrase,
    "POLY_BUILDER_SIGNATURE": sig,
    "POLY_BUILDER_TIMESTAMP": timestamp,
  }));
}

export class RelayerClient {
  private creds: BuilderCreds | null;

  constructor(private baseUrl: string = RELAYER_URL) {
    this.creds = resolveBuilderCreds();
    if (!this.creds && baseUrl.includes("relayer-v2.polymarket.com")) {
      throw new Error(
        "Relayer requires authentication. Either:\n" +
        "  1. Set POLYMARKET_BUILDER_API_KEY, POLYMARKET_BUILDER_SECRET, POLYMARKET_BUILDER_PASSPHRASE, or\n" +
        "  2. Set POLYMARKET_RELAYER_URL to a proxy that injects builder credentials (e.g. https://proxy.polytown.app/relayer)"
      );
    }
  }

  private async authedHeaders(method: string, path: string, body?: string): Promise<Record<string, string>> {
    if (!this.creds) {
      return { "Content-Type": "application/json" };
    }
    return generateBuilderHeaders(this.creds, method, path, body);
  }

  async getNonce(safeAddress: string, type: string = "SAFE"): Promise<string> {
    const path = `/nonce?address=${safeAddress}&type=${type}`;
    const headers = await this.authedHeaders("GET", "/nonce");
    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Relayer /nonce failed: ${res.status} ${res.statusText} — ${text}`);
    }
    const data = await res.json();
    return String(data.nonce ?? data);
  }

  async isDeployed(safeAddress: string): Promise<boolean> {
    const path = `/deployed?address=${safeAddress}`;
    const headers = await this.authedHeaders("GET", "/deployed");
    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Relayer /deployed failed: ${res.status} ${res.statusText} — ${text}`);
    }
    const data = await res.json();
    return !!data.deployed;
  }

  async submit(payload: RelayerSubmitPayload): Promise<any> {
    const body = JSON.stringify(payload);
    const headers = await this.authedHeaders("POST", "/submit", body);
    const res = await fetch(`${this.baseUrl}/submit`, {
      method: "POST",
      headers,
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Relayer /submit failed: ${res.status} ${res.statusText} — ${text}`);
    }
    return res.json();
  }

  async getTransaction(txId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/transaction?id=${txId}`);
    if (!res.ok) throw new Error(`Relayer /transaction failed: ${res.status}`);
    return res.json();
  }
}

// Sign a Safe transaction hash following the SDK's exact approach:
// 1. hashTypedData → EIP-712 hash
// 2. signMessage with raw bytes (personal_sign prefix)
// 3. splitAndPackSig: adjust v, then encodePacked(r, s, v)
async function signSafeTransaction(
  privateKey: `0x${string}`,
  safeAddress: `0x${string}`,
  to: `0x${string}`,
  data: Hex,
  nonce: string,
  operation: number = 0
): Promise<Hex> {
  const account = privateKeyToAccount(privateKey);

  const structHash = hashTypedData({
    domain: {
      chainId: POLYGON_CHAIN_ID,
      verifyingContract: safeAddress,
    },
    types: SAFE_TX_TYPES,
    primaryType: "SafeTx",
    message: {
      to,
      value: 0n,
      data,
      operation,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZERO_ADDRESS,
      refundReceiver: ZERO_ADDRESS,
      nonce: BigInt(nonce),
    },
  });

  const signature = await account.signMessage({
    message: { raw: hexToBytes(structHash) },
  });

  // splitAndPackSig: match SDK exactly
  return splitAndPackSig(signature as Hex);
}

function splitAndPackSig(sig: Hex): Hex {
  let sigV = parseInt(sig.slice(-2), 16);
  switch (sigV) {
    case 0:
    case 1:
      sigV += 31;
      break;
    case 27:
    case 28:
      sigV += 4;
      break;
    default:
      throw new Error("Invalid signature v value");
  }
  const adjusted = (sig.slice(0, -2) + sigV.toString(16)) as Hex;
  const r = hexToBigInt(('0x' + adjusted.slice(2, 66)) as Hex);
  const s = hexToBigInt(('0x' + adjusted.slice(66, 130)) as Hex);
  const v = parseInt(adjusted.slice(130, 132), 16);
  return encodePacked(["uint256", "uint256", "uint8"], [r, s, v]);
}

// Encode multiple transactions into a single MultiSend call
function encodeMultiSend(
  txns: Array<{ to: `0x${string}`; data: Hex; value?: bigint; operation?: number }>
): Hex {
  let packed = "0x" as Hex;
  for (const txn of txns) {
    const dataBytes = hexToBytes(txn.data);
    const encoded = encodePacked(
      ["uint8", "address", "uint256", "uint256", "bytes"],
      [txn.operation ?? 0, txn.to, txn.value ?? 0n, BigInt(dataBytes.length), txn.data]
    );
    packed = concat([packed, encoded]);
  }

  // multiSend(bytes) selector = 0x8d80ff0a
  return encodeFunctionData({
    abi: [
      {
        name: "multiSend",
        type: "function",
        inputs: [{ name: "transactions", type: "bytes" }],
        outputs: [],
      },
    ],
    functionName: "multiSend",
    args: [packed],
  });
}

export async function relayTransaction(
  privateKey: `0x${string}`,
  to: `0x${string}`,
  data: Hex,
  metadata?: string,
  operation: number = 0,
): Promise<any> {
  const account = privateKeyToAccount(privateKey);
  const safeAddress = deriveGnosisSafeWallet(account.address);

  const relayer = new RelayerClient();
  // SDK passes EOA address to getNonce, not safe address
  const noncePayload = await relayer.getNonce(account.address);

  const signature = await signSafeTransaction(
    privateKey,
    safeAddress as `0x${string}`,
    to,
    data,
    noncePayload,
    operation,
  );

  const payload: RelayerSubmitPayload = {
    type: "SAFE",
    from: account.address,
    to,
    proxyWallet: safeAddress,
    data,
    nonce: noncePayload,
    signature,
    signatureParams: {
      gasPrice: "0",
      operation: String(operation),
      safeTxnGas: "0",
      baseGas: "0",
      gasToken: ZERO_ADDRESS,
      refundReceiver: ZERO_ADDRESS,
    },
    metadata,
  };

  return relayer.submit(payload);
}

// Relay a multi-send batch (approve + redeem, etc.)
export async function relayMultiSend(
  privateKey: `0x${string}`,
  txns: Array<{ to: `0x${string}`; data: Hex }>,
  metadata?: string,
): Promise<any> {
  const multiSendData = encodeMultiSend(txns);
  return relayTransaction(
    privateKey,
    MULTISEND_ADDRESS,
    multiSendData,
    metadata,
    1, // DelegateCall for MultiSend
  );
}

// ─── High-level relay helpers ───

export function buildRedeemCalldata(
  conditionId: Hex,
  indexSets: bigint[] = [1n, 2n],
  collateral: `0x${string}` = USDCE_ADDRESS,
  parentCollectionId: Hex = ZERO_BYTES32,
): { to: `0x${string}`; data: Hex } {
  const data = encodeFunctionData({
    abi: CTF_ABI,
    functionName: "redeemPositions",
    args: [collateral, parentCollectionId, conditionId, indexSets],
  });
  return { to: CTF_ADDRESS, data };
}

export function buildNegRiskRedeemCalldata(
  conditionId: Hex,
  amounts: bigint[],
): { to: `0x${string}`; data: Hex } {
  const data = encodeFunctionData({
    abi: NEG_RISK_ADAPTER_ABI,
    functionName: "redeemPositions",
    args: [conditionId, amounts],
  });
  return { to: NEG_RISK_ADAPTER, data };
}

export function buildSplitCalldata(
  conditionId: Hex,
  amount: bigint,
  partition: bigint[] = [1n, 2n],
  collateral: `0x${string}` = USDCE_ADDRESS,
  parentCollectionId: Hex = ZERO_BYTES32,
): { to: `0x${string}`; data: Hex } {
  const data = encodeFunctionData({
    abi: CTF_ABI,
    functionName: "splitPosition",
    args: [collateral, parentCollectionId, conditionId, partition, amount],
  });
  return { to: CTF_ADDRESS, data };
}

export function buildMergeCalldata(
  conditionId: Hex,
  amount: bigint,
  partition: bigint[] = [1n, 2n],
  collateral: `0x${string}` = USDCE_ADDRESS,
  parentCollectionId: Hex = ZERO_BYTES32,
): { to: `0x${string}`; data: Hex } {
  const data = encodeFunctionData({
    abi: CTF_ABI,
    functionName: "mergePositions",
    args: [collateral, parentCollectionId, conditionId, partition, amount],
  });
  return { to: CTF_ADDRESS, data };
}

export async function deploySafe(
  privateKey: `0x${string}`,
): Promise<any> {
  const account = privateKeyToAccount(privateKey);
  const safeAddress = deriveGnosisSafeWallet(account.address);

  const relayer = new RelayerClient();

  // Check if already deployed
  const deployed = await relayer.isDeployed(safeAddress);
  if (deployed) {
    return { alreadyDeployed: true, safeAddress };
  }

  // Sign EIP-712 CreateProxy message
  const signature = await account.signTypedData({
    domain: {
      name: SAFE_FACTORY_NAME,
      chainId: BigInt(POLYGON_CHAIN_ID),
      verifyingContract: POLYMARKET_SAFE_FACTORY,
    },
    types: {
      CreateProxy: [
        { name: "paymentToken", type: "address" },
        { name: "payment", type: "uint256" },
        { name: "paymentReceiver", type: "address" },
      ],
    },
    primaryType: "CreateProxy",
    message: {
      paymentToken: zeroAddress,
      payment: 0n,
      paymentReceiver: zeroAddress,
    },
  });

  const payload = {
    from: account.address,
    to: POLYMARKET_SAFE_FACTORY,
    proxyWallet: safeAddress,
    data: "0x",
    signature,
    signatureParams: {
      paymentToken: zeroAddress,
      payment: "0",
      paymentReceiver: zeroAddress,
    },
    type: "SAFE-CREATE",
  };

  const body = JSON.stringify(payload);
  const headers = await relayer["authedHeaders"]("POST", "/submit", body);
  const res = await fetch(`${relayer["baseUrl"]}/submit`, {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Relayer deploy failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json();
}

export function buildApproveCalldata(): Array<{ to: `0x${string}`; data: Hex }> {
  const maxUint256 = 2n ** 256n - 1n;
  return [
    {
      to: USDCE_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CTF_EXCHANGE, maxUint256],
      }),
    },
    {
      to: USDCE_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [NEG_RISK_CTF_EXCHANGE, maxUint256],
      }),
    },
    {
      to: CTF_ADDRESS,
      data: encodeFunctionData({
        abi: ERC1155_ABI,
        functionName: "setApprovalForAll",
        args: [CTF_EXCHANGE, true],
      }),
    },
    {
      to: CTF_ADDRESS,
      data: encodeFunctionData({
        abi: ERC1155_ABI,
        functionName: "setApprovalForAll",
        args: [NEG_RISK_CTF_EXCHANGE, true],
      }),
    },
  ];
}
