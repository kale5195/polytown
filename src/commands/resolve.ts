import { Command } from "commander";
import { GammaClient } from "../lib/gamma.js";

const out = (data: any) => console.log(JSON.stringify(data, null, 2));

/**
 * Resolve a Polymarket URL or slug to its underlying entity data.
 *
 * Supported formats:
 *   https://polymarket.com/event/<slug>
 *   https://polymarket.com/event/<slug>/<market-slug>
 *   https://polymarket.com/@username
 */
export const resolveCommand = new Command("resolve")
  .description("Resolve a Polymarket URL/username to event ID, market ID, condition ID, token IDs, or wallet address")
  .argument("<url>", "e.g. https://polymarket.com/event/<slug>, @username")
  .action(async (input) => {
    // Profile: @username or polymarket.com/@username
    const profileMatch = input.match(/(?:polymarket\.com\/)?\@([^/?\s]+)/) ||
      (!input.includes("/") && input.startsWith("@") ? [null, input.slice(1)] : null);
    if (profileMatch) {
      const username = profileMatch[1];
      const res = await fetch(`https://polymarket.com/@${username}`);
      if (!res.ok) throw new Error(`Profile not found: @${username}`);
      const html = await res.text();
      const walletMatch = html.match(/"proxyWallet":"(0x[a-fA-F0-9]+)"/);
      if (!walletMatch) throw new Error(`Could not resolve @${username}`);
      out({ type: "profile", username, address: walletMatch[1] });
      return;
    }

    // Event URL: /event/<slug> or /event/<slug>/<market-slug>
    const eventMatch = input.match(/(?:polymarket\.com\/)?event\/([^/?\s]+)(?:\/([^/?\s]+))?/);
    if (eventMatch) {
      const eventSlug = eventMatch[1];
      const marketSlug = eventMatch[2];
      const gamma = new GammaClient();

      const events = await gamma.getEvents({ slug: eventSlug });
      if (!events || events.length === 0) throw new Error(`Event not found: ${eventSlug}`);
      const event = events[0];

      const result: any = {
        type: "event",
        eventId: event.id,
        slug: event.slug,
        title: event.title,
      };

      // If market slug provided, find the specific market
      if (marketSlug) {
        const markets = await gamma.getMarkets({ slug: marketSlug });
        if (markets && markets.length > 0) {
          const market = markets[0];
          result.type = "market";
          result.marketId = market.id;
          result.marketSlug = market.slug;
          result.conditionId = market.conditionId;
          result.question = market.question;
          if (market.clobTokenIds) {
            try {
              result.tokenIds = JSON.parse(market.clobTokenIds);
            } catch {}
          }
        }
      }

      out(result);
      return;
    }

    throw new Error(`Unrecognized format. Expected a Polymarket URL, event slug, or @username.`);
  });
