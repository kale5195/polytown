# Polytown

Best Polymarket CLI for humans and AI agents.

Fast, lightweight, and scriptable — built with [Bun](https://bun.sh) and TypeScript. Query markets, manage wallets, place trades, and pipe structured output to your agent or workflow.

## Why Polytown

- **Gnosis Safe only** — Uses the same Safe wallet infrastructure as polymarket.com. Your CLI wallet and web wallet share the same account, balances, and positions. Implements Polymarket's custom Safe Factory with CREATE2 derivation — not standard Gnosis Safe.
- **Built-in CLOB proxy** — Access Polymarket's CLOB API from anywhere, no VPN needed. `proxy.polytown.app` is preconfigured out of the box.
- **100% gas-free** — All on-chain operations (Safe deployment, token approvals, splits, merges, redemptions, withdrawals) go through the relayer. You never need MATIC.
- **Complete CLOB coverage** — Built on the official [`@polymarket/clob-client`](https://www.npmjs.com/package/@polymarket/clob-client). 50+ subcommands: real-time pricing, order book depth, limit/market orders, batch operations, rewards tracking, API key management.
- **URL resolver** — Paste any Polymarket URL or `@username` and get back structured IDs (event, market, condition, tokens, wallet address). Useful for piping into other commands.
- **Interactive setup wizard** — Four-step guided setup: wallet create/import → Safe deployment → token approvals → balance check. Zero-to-trading in one command.
- **Agent-friendly** — Every command outputs structured, parseable text. Pipe it into your AI agent, chain commands, or call from any script.

## Install

```bash
npm install -g polytown
```

## Setup

```bash
polytown setup
```

Interactive wizard that walks you through wallet creation/import, Safe deployment, token approvals, and balance verification. Configuration is saved to `~/.polytown/.env`.

You can also override settings with a local `.env` file in your working directory, or via environment variables directly.

### Development

```bash
git clone https://github.com/kale5195/polymarket-cli.git
cd polymarket-cli
bun install
bun run dev
```

## Usage

```
polytown <command> [options]
```

### Commands

| Command               | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `setup`               | Interactive setup wizard (wallet → Safe → approvals → balance) |
| `status`              | API health checks (CLOB, Gamma, Data, RPC)                     |
| `resolve <url>`       | Resolve any Polymarket URL or @username to structured IDs      |
| `markets`             | Search and browse markets with 20+ filters                     |
| `events`              | Search and browse events                                       |
| `movers`              | Biggest price movers by category                               |
| `clob`                | Full CLOB trading suite (pricing, orders, trades, rewards)     |
| `wallet`              | Create, import, show balance, withdraw USDC                    |
| `approve`             | Check and set token approvals (gas-free)                       |
| `ctf`                 | Conditional token operations: split, merge, redeem (gas-free)  |
| `data`                | Portfolio analytics: positions, trades, leaderboard            |
| `profile [address]`   | User profile and stats lookup                                  |
| `comments <event_id>` | Event discussion feed                                          |
| `tags`                | Browse market tags and related items                           |
| `series`              | Browse event series                                            |
| `sports`              | Sports markets, leagues, and teams                             |

Run `polytown <command> --help` for details on any command.

### Examples

```bash
# Zero-to-trading setup
polytown setup

# Check API status
polytown status

# Resolve a URL to tradeable IDs
polytown resolve https://polymarket.com/event/<slug>
polytown resolve https://polymarket.com/event/<slug>/<market-slug>
polytown resolve @username

# Search markets
polytown markets search "bitcoin"

# Get biggest movers
polytown movers --limit 10

# Check order book
polytown clob book <condition_id>

# Place a limit order
polytown clob create-order <token_id> --price 0.5 --size 100 --side BUY

# Check your positions
polytown data positions

# Withdraw USDC (gas-free)
polytown wallet withdraw 100 0x1234...
```

### For AI Agents

```bash
# Pipe market data to your agent
polytown markets search "election" | your-agent-script

# Resolve URL → get token IDs → check price → place order
polytown resolve https://polymarket.com/event/<slug>/<market-slug>
polytown clob price <token_id>
polytown clob create-order <token_id> --price 0.45 --size 50 --side BUY

# Call from any runtime
import { execSync } from "child_process";
const result = execSync("polytown markets search bitcoin").toString();
```
