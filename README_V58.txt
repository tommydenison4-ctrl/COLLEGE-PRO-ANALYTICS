GRIDLOCK V58 — SPORTSBOOK QUOTA GUARD

WHY V57 BURNED CREDITS
- Top Value refreshed sportsbook data every ~30 seconds.
- GameCast could request sportsbook data separately.
- Post-a-Play could request sportsbook data separately.
- Matchup/timestamp query strings prevented effective cache reuse.

V58 FIX
1. ONE canonical league-wide request:
   /api/odds?live=1
2. The server fetches the full NCAA odds slate once and caches it.
3. Top Value, Upset Watch, GameCast and Post-a-Play all read the same snapshot.
4. Simultaneous requests are coalesced into one provider request.
5. Browser snapshot refresh is ~90 seconds.
6. Provider refresh is normally no more than once every ~2 minutes per warm server instance.
7. Automatic conservation mode:
   <=400 credits: 5-minute provider cache
   <=150 credits: 10-minute provider cache
   <=50 credits: 15-minute provider cache
8. If The Odds API errors or quota is exhausted, GRIDLOCK keeps serving the last successful snapshot for up to 30 minutes.
9. The Refresh button no longer forces a provider call.
10. No game change clears the sportsbook snapshot anymore.

IMPORTANT
The Odds API quota is currently exhausted. V58 prevents the NEXT quota allotment from being burned at the old rate, but live markets cannot resume until the provider account has available credits again.

V57 live-aware value math is preserved:
- Live games compare live sportsbook line to projected FINAL live outcome.
- Pregame games compare current market to frozen pregame model.
- No live game falls back to frozen pregame value math.
