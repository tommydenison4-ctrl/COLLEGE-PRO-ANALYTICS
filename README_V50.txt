GRIDLOCK V50

WHY LIVE ODDS MAY HAVE BEEN FAILING
- Safari showed "Load failed", not an HTTP/API response.
- That means the browser request itself was likely blocked/unreachable before our API could answer.
- The old route name was /api/odds, which can be targeted by privacy/content blockers.
- Route renamed to neutral /api/market-feed.

MARKET FEED
- Added /api/market-feed?health=1 endpoint.
- Health check confirms Vercel route reachability and whether ODDS_API_KEY exists.
- Client checks health before requesting markets.
- UI distinguishes:
  * route blocked/unreachable
  * ODDS_API_KEY missing
  * provider failure
  * game not returned
  * game found but no live market
  * actual live spread/total/moneyline
- Uses user-provided odds API logic and The Odds API documented NCAAF sport key/regions.

FIELD GOAL HERO
- FIELD GOAL GOOD now has its own gold hero treatment.
- Player/kicker name is shown when ESPN text exposes it.
- Displays yardage / 3 points and full play description.
