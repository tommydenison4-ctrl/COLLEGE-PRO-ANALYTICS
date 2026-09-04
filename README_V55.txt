GRIDLOCK V55

SPORTSBOOK DIAGNOSTICS
- /api/odds?health=1 now reports key length metadata without exposing the key.
- Common env paste mistakes are sanitized:
  * surrounding quotes
  * ODDS_API_KEY= prefix
- Keys that are absurdly long or look like URLs are rejected before calling provider.
- /api/odds?probe=1 calls The Odds API /v4/sports endpoint to validate the credential independently of NCAAF odds.
- /sports probe is documented as not counting against quota.
- Live odds request remains minimal: regions=us, markets=h2h,spreads,totals.

LIVE GAME REPAIR
- Retains V54 ESPN live-event/date resolver for games whose slate date/event ID is stale.
- ESPN live status remains authoritative over tomorrow/future buckets.

DEPLOY TESTS
1. /api/odds?health=1
2. /api/odds?probe=1
3. /api/odds?live=1&away=Massachusetts%20Minutemen&home=Rutgers%20Scarlet%20Knights
