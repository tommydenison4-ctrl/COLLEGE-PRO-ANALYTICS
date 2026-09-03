# GRIDLOCK V15 — live sportsbook odds setup

1. Create an API key at The Odds API.
2. In Vercel: Project Settings → Environment Variables.
3. Add `ODDS_API_KEY` with your key for Production, Preview, and Development as desired.
4. Redeploy the project.
5. Open a college game → Post a Play. GRIDLOCK will request `/api/odds` and show current FanDuel and BetRivers moneyline/spread/total choices.

Bet365 note: The current The Odds API bookmaker list does not provide a standard US NCAA bet365 feed. The GRIDLOCK picker is coded to render bet365 if a future/alternate feed returns a bet365 bookmaker key, but V15 does not fabricate bet365 prices.

If the live odds endpoint is not configured or a market is unavailable, GRIDLOCK falls back to the ESPN spread/total already attached to the schedule game.
