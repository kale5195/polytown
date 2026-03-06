import { describe, test, expect } from "bun:test";

const run = (args: string[]) => {
  const result = Bun.spawnSync(["bun", "src/index.ts", ...args]);
  return {
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
    exitCode: result.exitCode,
  };
};

describe("CLI integration", () => {
  test("--version prints version", () => {
    const { stdout } = run(["--version"]);
    expect(stdout).toBe("0.1.0");
  });

  test("--help lists all commands", () => {
    const { stdout } = run(["--help"]);
    expect(stdout).toContain("markets");
    expect(stdout).toContain("events");
    expect(stdout).toContain("clob");
    expect(stdout).toContain("wallet");
    expect(stdout).toContain("data");
    expect(stdout).toContain("resolve");
    expect(stdout).toContain("approve");
    expect(stdout).toContain("ctf");
    expect(stdout).toContain("setup");
    expect(stdout).toContain("status");
  });

  test("clob --help lists subcommands", () => {
    const { stdout } = run(["clob", "--help"]);
    expect(stdout).toContain("ok");
    expect(stdout).toContain("price");
    expect(stdout).toContain("book");
    expect(stdout).toContain("create-order");
    expect(stdout).toContain("cancel");
    expect(stdout).toContain("rewards");
    expect(stdout).toContain("api-keys");
  });

  test("wallet --help lists subcommands", () => {
    const { stdout } = run(["wallet", "--help"]);
    expect(stdout).toContain("create");
    expect(stdout).toContain("import");
    expect(stdout).toContain("address");
    expect(stdout).toContain("show");
    expect(stdout).toContain("reset");
  });

  test("wallet create outputs valid JSON with privateKey and address", () => {
    const { stdout } = run(["wallet", "create"]);
    const data = JSON.parse(stdout);
    expect(data.privateKey).toMatch(/^0x[0-9a-f]{64}$/);
    expect(data.eoa).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(data.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    // address should be the derived Safe, not the EOA
    expect(data.address).not.toBe(data.eoa);
  });

  test("wallet import derives correct address", () => {
    const key =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const { stdout } = run(["wallet", "import", key]);
    const data = JSON.parse(stdout);
    expect(data.eoa).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    expect(data.address).toBeTruthy();
    expect(data.address).not.toBe(data.eoa);
  });

  test("unknown command shows error", () => {
    const { stderr, exitCode } = run(["nonexistent"]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("unknown command");
  });
});
