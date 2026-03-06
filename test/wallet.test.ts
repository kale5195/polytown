import { describe, test, expect } from "bun:test";
import {
  deriveGnosisSafeWallet,
  createRandomWallet,
} from "../src/lib/wallet.js";

// Known test vector: a well-known EOA address
const TEST_EOA = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth

describe("deriveGnosisSafeWallet", () => {
  test("returns a valid checksum address", () => {
    const derived = deriveGnosisSafeWallet(TEST_EOA);
    expect(derived).toMatch(/^0x[0-9a-fA-F]{40}$/);
    // Should not equal the input EOA
    expect(derived.toLowerCase()).not.toBe(TEST_EOA.toLowerCase());
  });

  test("is deterministic", () => {
    const a = deriveGnosisSafeWallet(TEST_EOA);
    const b = deriveGnosisSafeWallet(TEST_EOA);
    expect(a).toBe(b);
  });

  test("different owners produce different derived addresses", () => {
    const a = deriveGnosisSafeWallet(TEST_EOA);
    const b = deriveGnosisSafeWallet(
      "0x0000000000000000000000000000000000000001"
    );
    expect(a).not.toBe(b);
  });

  test("handles lowercase input", () => {
    const a = deriveGnosisSafeWallet(TEST_EOA);
    const b = deriveGnosisSafeWallet(TEST_EOA.toLowerCase());
    expect(a).toBe(b);
  });
});

describe("createRandomWallet", () => {
  test("returns privateKey and address", () => {
    const wallet = createRandomWallet();
    expect(wallet.privateKey).toMatch(/^0x[0-9a-f]{64}$/);
    expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test("generates different wallets each time", () => {
    const a = createRandomWallet();
    const b = createRandomWallet();
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.address).not.toBe(b.address);
  });
});
