GRIDLOCK V57 — LIVE-AWARE VALUE ENGINE

CORE FIX
- Once a game is underway, Top Value NEVER compares a current/live sportsbook line to the frozen pregame GRIDLOCK projection.
- Live games fetch current ESPN summary state and run the same GRIDLOCK live projection model used in GameCast.
- If detailed GameCast is unavailable, a scoreboard-based live projection uses current score + time remaining + only the pregame scoring still left to play.
- If a game is live and no live model can be produced, it is skipped from Top Value rather than falling back to a misleading pregame edge.

LIVE VALUE
- Spread: current sportsbook live spread vs GRIDLOCK projected FINAL margin.
- Total: current sportsbook live total vs GRIDLOCK projected FINAL total.
- Moneyline/Upset Watch: sportsbook implied probability vs GRIDLOCK LIVE win probability.
- Live rows show LIVE badge, current score, and LIVE GRIDLOCK FINAL.
- Sportsbook data refreshes approximately every 30 seconds.
- ESPN live projection cache refreshes approximately every 7-10 seconds.
- Stale live bookmaker updates older than 20 minutes are ignored.

PREGAME SANITY
- Pregame values still compare current market to frozen pregame model.
- Extreme spreads/model disagreements receive a reliability penalty instead of automatically dominating the rankings.
- Extreme pregame disagreement is labeled MODEL REVIEW and confidence is capped.

EXPECTED BETHUNE/UCF BEHAVIOR
- At 73-0, Bethune +80.5 can no longer be ranked using the old UCF-by-16 pregame projection.
- The comparator becomes the projected FINAL margin from the 73-0 live state.
