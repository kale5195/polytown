import { describe, test, expect } from "bun:test";
import {
  USDCE_ADDRESS,
  CTF_ADDRESS,
  CTF_EXCHANGE,
  NEG_RISK_CTF_EXCHANGE,
  NEG_RISK_ADAPTER,
  ERC20_ABI,
  ERC1155_ABI,
  CTF_ABI,
  NEG_RISK_ADAPTER_ABI,
} from "../src/lib/contracts.js";

describe("contract addresses", () => {
  test("USDC.e address is correct Polygon USDC.e", () => {
    expect(USDCE_ADDRESS).toBe("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174");
  });

  test("CTF address is correct", () => {
    expect(CTF_ADDRESS).toBe("0x4D97DCd97eC945f40cF65F87097ACe5EA0476045");
  });

  test("all addresses are valid checksummed format", () => {
    for (const addr of [
      USDCE_ADDRESS,
      CTF_ADDRESS,
      CTF_EXCHANGE,
      NEG_RISK_CTF_EXCHANGE,
      NEG_RISK_ADAPTER,
    ]) {
      expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
  });
});

describe("ABIs", () => {
  test("ERC20_ABI has approve, allowance, balanceOf", () => {
    const names = ERC20_ABI.map((f) => f.name);
    expect(names).toContain("approve");
    expect(names).toContain("allowance");
    expect(names).toContain("balanceOf");
  });

  test("ERC1155_ABI has setApprovalForAll, isApprovedForAll, balanceOf", () => {
    const names = ERC1155_ABI.map((f) => f.name);
    expect(names).toContain("setApprovalForAll");
    expect(names).toContain("isApprovedForAll");
    expect(names).toContain("balanceOf");
  });

  test("CTF_ABI has all expected functions", () => {
    const names = CTF_ABI.map((f) => f.name);
    expect(names).toContain("splitPosition");
    expect(names).toContain("mergePositions");
    expect(names).toContain("redeemPositions");
    expect(names).toContain("getConditionId");
    expect(names).toContain("getCollectionId");
    expect(names).toContain("getPositionId");
  });

  test("NEG_RISK_ADAPTER_ABI has redeemPositions", () => {
    const names = NEG_RISK_ADAPTER_ABI.map((f) => f.name);
    expect(names).toContain("redeemPositions");
  });
});
