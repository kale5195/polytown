import { Command } from "commander";
import { CLOB_URL, GAMMA_URL, DATA_URL, RPC_URL } from "../lib/config.js";

async function check(name: string, url: string): Promise<{ name: string; status: string; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - start;
    return { name, status: res.ok ? "ok" : `error (${res.status})`, latency };
  } catch (e: any) {
    return { name, status: `error (${e.message})`, latency: Date.now() - start };
  }
}

export const statusCommand = new Command("status")
  .description("API health checks")
  .action(async () => {
    const results = await Promise.all([
      check("CLOB", `${CLOB_URL}/`),
      check("Gamma", `${GAMMA_URL}/status`),
      check("Data", `${DATA_URL}/`),
      check("RPC", RPC_URL),
    ]);
    console.log(JSON.stringify(results, null, 2));
  });
