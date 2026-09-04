GRIDLOCK V54

ODDS 414 FIX
- Provider request reduced to the documented NCAAF shape:
  /v4/sports/americanfootball_ncaaf/odds
  regions=us
  markets=h2h,spreads,totals
  oddsFormat=american
- Removed us2.
- Removed the event-specific second provider request.
- Removed trailing slash before the provider query string.
- API error now returns provider_status, request_shape and URL length.

LIVE GAME DATE / BLANK GAME CENTER FIX
- ESPN live status is authoritative over slate/future-date buckets.
- A scored/in-progress game is promoted into the live scoreboard even if source schedule says tomorrow.
- If a selected game looks live but its ESPN summary has no live state/PBP, GRIDLOCK searches ESPN scoreboard for yesterday/today/tomorrow, matches the two teams, and replaces the stale event ID/date with the actual live event.
- GameCast header date/status then update from ESPN's actual competition data.

HERO
- TD/FG/turnover hero remains fixed at top and now stays visible for ~7 seconds.

VALIDATION
- All inline scripts and api/odds.js passed node --check.
