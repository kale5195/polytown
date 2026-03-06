import { getAddress, encodeAbiParameters, keccak256, concat } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Polymarket's own Safe Proxy Factory (NOT standard Gnosis Safe factory)
const POLYMARKET_SAFE_FACTORY = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b";
const SAFE_INIT_CODE_HASH = "0x2bce2127ff07fb632d16c8347c4ebf501f4841168bed00d9e6ef715ddb6fcecf";

export function deriveGnosisSafeWallet(ownerAddress: string): string {
  const owner = getAddress(ownerAddress);

  // Polymarket derive: salt = keccak256(abi.encode(address))
  const salt = keccak256(
    encodeAbiParameters([{ type: "address" }], [owner])
  );

  // CREATE2: keccak256(0xff ++ factory ++ salt ++ initCodeHash)[12:]
  const create2Hash = keccak256(
    concat([
      "0xff" as `0x${string}`,
      POLYMARKET_SAFE_FACTORY as `0x${string}`,
      salt,
      SAFE_INIT_CODE_HASH as `0x${string}`,
    ])
  );

  return getAddress(`0x${create2Hash.slice(26)}`);
}

export function createRandomWallet() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, address: account.address };
}
