GRIDLOCK V51

UNIFIED SPORTSBOOK ROUTE
- /api/odds is canonical everywhere.
- Same handler also shipped as /api/market-feed for backward compatibility.
- Uses the user's updated odds.js.
- Added /api/odds?health=1.
- Both live GameCast and Post-a-Play use the same server API.

POST-A-PLAY CURRENT GAME FIX
- Odds cache now stores GRIDLOCK_ODDS_GAME_ID.
- Opening a new College GameCast invalidates old sportsbook cache.
- Post-a-Play binds to the currently visible game ID.
- It passes current home/away to /api/odds?live=1.
- Moving to a new matchup forces a fresh sportsbook request.
- It can no longer intentionally reuse the first game's cached odds.

V50 football UI, field-goal hero, ESPN PBP, field, momentum, live model retained.

VALIDATION
- Every inline script and server handler passed node --check.
