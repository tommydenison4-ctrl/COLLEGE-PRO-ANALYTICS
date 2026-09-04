GRIDLOCK V52

ONE SPORTSBOOK FUNCTION ONLY:
repo-root/api/odds.js

Do not upload index.html by itself.
Do not put odds.js beside index.html.
The api folder must exist in the repository.

No vercel.json is required. Vercel auto-deploys /api/odds.js.

After deployment open:
https://YOUR-DOMAIN.vercel.app/api/odds?health=1

Expected:
{"ok":true,...,"route":"/api/odds","key_configured":true}

If 404: api/odds.js is not in the deployed repo.
If key_configured is false: add ODDS_API_KEY in Vercel Environment Variables, then redeploy.

Both live GameCast and Post-a-Play now use only /api/odds.
Post-a-Play reloads odds when the visible game changes.
