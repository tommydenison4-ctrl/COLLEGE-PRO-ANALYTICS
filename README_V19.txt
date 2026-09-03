GRIDLOCK V19
Base: index(20260903-215213).html

FIXED
- Value boards now live INSIDE the College schedule home page and are visible in College mode.
- Ranking engine reads the actual lexical College `games` slate and `projFor()` model used by the schedule.
- TOP VALUE OF THE WEEK ranks the strongest spread/total model edges across the full loaded weekly slate.
- Direct sportsbook lines are used where available; ESPN market reference is used for spread/total fallback.
- UPSET WATCH uses actual +money sportsbook prices only and ranks positive expected value (EV) underdogs.
- No fabricated moneylines.
- Pregame College projections are snapshotted automatically in localStorage.
- When the schedule feed marks a snapshotted game complete, the final score is archived and graded automatically.
- Archive reports projected vs final, margin error, total error, winner accuracy and average score error.

NOTE
Direct moneyline rankings require the existing /api/odds feed to be configured on the deployed Vercel build.

SERVERLESS API
- api/odds.js: Vercel function for direct NCAA sportsbook odds from The Odds API.
- Requires ODDS_API_KEY in Vercel environment variables.
- vercel.json included.
