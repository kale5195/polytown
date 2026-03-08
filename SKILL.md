# Polytown Skill

Polytown is a CLI for interacting with Polymarket — the world's largest prediction market on Polygon. It supports market discovery, trading, portfolio management, and on-chain operations. All output is structured JSON, suitable for piping to other tools or parsing programmatically.

## Quick Start

Install and set up your wallet:

```bash
npm install -g polytown
polytown setup
```

The setup wizard walks through 4 steps: wallet creation/import → Gnosis Safe deployment → token approvals → balance check. Configuration is saved to `~/.polytown/.env`.

### For AI Agents (Non-interactive Setup)

Use `--yes` (`-y`) to skip all confirmations. This will auto-generate a wallet, deploy the Safe, and set all approvals in one shot:

```bash
# Generate new wallet + deploy + approve, no prompts
polytown setup -y

# Import an existing key + deploy + approve, no prompts
polytown setup -y --key 0xYourPrivateKey
```

**What `setup -y` does automatically:**

1. Creates a new wallet (or imports via `--key`) and saves to `~/.polytown/.env`
2. Deploys a Gnosis Safe via the relayer (gas-free)
3. Sets all token approvals (USDC.e + CTF for both exchanges, gas-free)
4. Shows the Safe address to fund with USDC.e on Polygon

After setup, send USDC.e on Polygon to the displayed Safe address to start trading.

## Key Concepts

- **Event**: A top-level question (e.g., "2024 US Presidential Election"). Contains one or more markets.
- **Market**: A specific outcome within an event (e.g., "Will candidate X win?"). Identified by `condition_id`.
- **Token**: Each market has YES and NO tokens, each with a `token_id`. Prices range from $0 to $1.
- **Gnosis Safe**: Polytown uses the same Safe wallet as polymarket.com. Your CLI and web wallets share the same account.
- **CLOB**: Central Limit Order Book — Polymarket's off-chain order matching engine.
- **Gas-free**: All on-chain operations use a relayer. You never need MATIC.

## Workflow: From Research to Trade

### 1. Discover Markets

```bash
# Search for markets by keyword
polytown markets search "bitcoin"

# List active markets sorted by volume
polytown markets list --active --order volume24hr --limit 10

# Get biggest price movers
polytown movers --limit 10
# Filter movers by category
polytown movers --category politics

# Resolve any Polymarket URL to structured IDs
polytown resolve https://polymarket.com/event/<slug>
polytown resolve https://polymarket.com/event/<slug>/<market-slug>

# Resolve a username to wallet address
polytown resolve @username
```

### 2. Analyze a Market

```bash
# Get market details by ID or slug
polytown markets get <id_or_slug>

# Check current price (returns $0-$1)
polytown clob price <token_id> --side buy

# Get midpoint price
polytown clob midpoint <token_id>

# View order book depth
polytown clob book <token_id>

# Check spread
polytown clob spread <token_id>

# Get price history
polytown clob price-history <token_id> --interval 1w

# Check last trade
polytown clob last-trade <token_id>

# View open interest and volume
polytown data open-interest <condition_id>
polytown data volume <event_id>

# See who holds positions
polytown data holders <condition_id>
```

### 3. Place Orders

```bash
# Limit order: buy YES at $0.50 for 100 shares
polytown clob create-order --token <token_id> --side buy --price 0.50 --size 100

# Market order: buy $50 worth at best available price
polytown clob market-order --token <token_id> --side buy --amount 50

# Batch orders
polytown clob post-orders --tokens <id1>,<id2> --side buy --prices 0.3,0.5 --sizes 100,200

# Post-only order (maker only, no taker fees)
polytown clob create-order --token <token_id> --side buy --price 0.45 --size 100 --post-only
```

### 4. Manage Orders

```bash
# List open orders
polytown clob orders

# Filter by market
polytown clob orders --market <condition_id>

# Get order details
polytown clob order <order_id>

# Cancel single order
polytown clob cancel <order_id>

# Cancel multiple orders
polytown clob cancel-orders <id1>,<id2>,<id3>

# Cancel all open orders
polytown clob cancel-all

# Cancel all orders for a specific market
polytown clob cancel-market --market <condition_id>
```

### 5. Portfolio & Tracking

```bash
# View your open positions
polytown data positions

# View closed positions
polytown data closed-positions

# Portfolio value
polytown data value

# Trade history
polytown data trades
# Trade history for a specific market (including settled markets)
polytown data trades --market <condition_id>

# Activity feed
polytown data activity

# Check rewards
polytown clob rewards --date 2025-01-15
polytown clob earnings --date 2025-01-15

# Leaderboard
polytown data leaderboard --period weekly --limit 20
```

### 6. Wallet Operations

```bash
# Show wallet addresses (EOA + Safe)
polytown wallet show

# Check USDC.e balance
polytown wallet balance

# Withdraw USDC.e (gas-free)
polytown wallet withdraw 100 0xRecipientAddress
```

### 7. Advanced: Conditional Token Operations (Gas-free)

```bash
# Split USDC into YES/NO tokens
polytown ctf split --condition <id> --amount 50

# Merge YES/NO tokens back to USDC
polytown ctf merge --condition <id> --amount 50

# Redeem winning positions after market resolution
polytown ctf redeem --condition <id>

# Redeem neg-risk positions
polytown ctf redeem-neg-risk --condition <id> --amounts 1000000,0
```

## Command Reference

| Command               | Description                 | Auth Required | Notes                    |
| --------------------- | --------------------------- | :-----------: | ------------------------ |
| `setup`               | Interactive setup wizard    |      No       |                          |
| `status`              | API health checks           |      No       |                          |
| `resolve <url>`       | Resolve URL/username to IDs |      No       |                          |
| `markets list`        | List/filter markets         |      No       | `--full`, `--include-tag` |
| `markets get <id>`    | Get market details          |      No       |                          |
| `markets search <q>`  | Search markets              |      No       |                          |
| `events list`         | Browse events               |      No       | `--full`, `--include-tag` |
| `events get <id>`     | Get event details           |      No       |                          |
| `movers`              | Biggest price movers        |      No       |                          |
| `tags list`           | List/search tags            |      No       | `--search` to filter     |
| `tags get <id>`       | Get tag by ID or slug       |      No       |                          |
| `tags related <id>`   | Related items for tag       |      No       |                          |
| `tags related-tags`   | Related tags                |      No       |                          |
| `series`              | Browse event series         |      No       |                          |
| `sports`              | Sports markets              |      No       |                          |
| `comments <event_id>` | Event comments              |      No       |                          |
| `profile [address]`   | User profile                |      No       |                          |
| `clob price`          | Token price                 |      No       |                          |
| `clob midpoint`       | Midpoint price              |      No       |                          |
| `clob spread`         | Bid-ask spread              |      No       |                          |
| `clob book`           | Order book                  |      No       |                          |
| `clob last-trade`     | Last trade price            |      No       |                          |
| `clob price-history`  | Historical prices           |      No       |                          |
| `clob market`         | CLOB market info            |      No       |                          |
| `clob tick-size`      | Tick size                   |      No       |                          |
| `clob create-order`   | Place limit order           |      Yes      |                          |
| `clob market-order`   | Place market order          |      Yes      |                          |
| `clob post-orders`    | Batch orders                |      Yes      |                          |
| `clob orders`         | List open orders            |      Yes      |                          |
| `clob order <id>`     | Order details               |      Yes      |                          |
| `clob cancel`         | Cancel order                |      Yes      |                          |
| `clob cancel-all`     | Cancel all orders           |      Yes      |                          |
| `clob trades`         | Trade history               |      Yes      |                          |
| `clob balance`        | CLOB balance                |      Yes      |                          |
| `clob rewards`        | Daily rewards               |      Yes      |                          |
| `clob earnings`       | Daily earnings              |      Yes      |                          |
| `clob api-keys`       | Manage API keys             |      Yes      |                          |
| `wallet show`         | Wallet info                 |      Yes      |                          |
| `wallet balance`      | USDC.e balance              |      Yes      |                          |
| `wallet withdraw`     | Withdraw USDC.e             |      Yes      |                          |
| `data positions`      | Open positions              |      Yes      |                          |
| `data trades`         | Trade history               |      Yes      |                          |
| `data market-trades`  | All trades for a market     |      No       | **New:** No user filter  |
| `data value`          | Portfolio value             |      Yes      |                          |
| `data leaderboard`    | Leaderboard                 |      No       |                          |
| `ctf split`           | Split to tokens             |      Yes      |                          |
| `ctf merge`           | Merge tokens                |      Yes      |                          |
| `ctf redeem`          | Redeem winnings             |      Yes      |                          |
| `approve`             | Token approvals             |      Yes      |                          |

## Output Format

All commands output JSON to stdout. Errors go to stderr. Exit code 0 on success, 1 on failure.

### Simplified vs Full Output

**By default**, `markets list` and `events list` return simplified JSON with only essential fields (13 fields for markets, 8 fields for events). This reduces data size by ~85% and prevents JSON parsing issues.

**Simplified market fields** (default):
- `id`, `question`, `slug`, `conditionId`, `clobTokenIds`
- `description`, `outcomes`, `outcomePrices`
- `active`, `closed`, `endDate`, `volume`, `volume24hr`
- `lastTradePrice`, `oneWeekPriceChange`

**Simplified event fields** (default):
- `id`, `title`, `slug`, `description`
- `closed`, `endDate`, `volume`
- `markets` (array of simplified market objects with `id`, `question`, `slug`, `conditionId`, `clobTokenIds`, `outcomes`, `outcomePrices`, `active`, `closed`, `endDate`, `volume`, `volume24hr`, `liquidity`, `lastTradePrice`, `oneWeekPriceChange`)

Use `--full` to get complete data (90+ fields):

```bash
# Default: simplified output (recommended)
polytown markets list --active --limit 10

# Full output: all fields
polytown markets list --active --limit 10 --full

# Include tag data in simplified output
polytown markets list --active --limit 10 --include-tag
polytown events list --active --limit 10 --include-tag

# Events also support --full
polytown events list --closed --limit 5 --full

# Search tags by label or slug
polytown tags list --search "politics"
```

### New Commands

**Query all trades for a market** (no user filter):

```bash
# Get all trades for a specific market
polytown data market-trades --market <condition_id> --limit 1000

# With pagination
polytown data market-trades --market <condition_id> --limit 1000 --offset 1000
```

This is useful for analyzing market activity, finding insider traders, or tracking large trades.

### Usage Tips

**Important:** Some commands can return very large JSON. Always use `--limit` when available, or save to a file first:

```bash
# Always use --limit with search to avoid huge output
polytown markets search "bitcoin" --limit 5 | jq '.[0].question'

# For large outputs, save to file first then parse
polytown movers > /tmp/movers.json && jq '.[0:10]' /tmp/movers.json

# Use in scripts
TOKEN_ID=$(polytown resolve https://polymarket.com/event/slug/market-slug | jq -r '.tokenIds[0]')
polytown clob price $TOKEN_ID --side buy
```
