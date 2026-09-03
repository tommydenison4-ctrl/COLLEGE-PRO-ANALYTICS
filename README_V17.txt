GRIDLOCK V17
- Replaces huge base64 pick URLs with compact query-string deep links.
- Shared college links restore College -> exact game -> exact pick card.
- Direct sportsbook feed status no longer calls ESPN fallback "live".
- ESPN sourced lines are labeled "ESPN FEED • <provider>" to distinguish them from direct book API prices.
- /api/odds retries with regions=us if direct bookmaker filtering fails.
- If Vercel shows "Protected Deployment", recipients still cannot access the site until Deployment Protection is disabled or a public production domain is used.
