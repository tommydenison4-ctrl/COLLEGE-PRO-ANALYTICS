GRIDLOCK V43

COLLEGE TOP SCOREBOARD
- College mode now owns the top score strip.
- Any NFL game tiles are removed and hidden while College is active.
- NFL renderer refuses to run while body.college-mode is active.
- Possession-state fetch no longer depends only on stale schedule status.
- Active/recently-started games are checked via ESPN summary so the football marker is much more reliable.

FIELD / GAMECAST
- Replaced boxy down/distance/field-position cards with a single clean broadcast ribbon.
- Ribbon: possession team/logo | down & distance | field position | clock/quarter/direction.
- Field and last play remain directly below.
- Momentum, alerts, live projection and PBP preserved.

LIVE BETTING
- Live Odds API query expanded from US to US + US2 regions.
- Server accepts home/away team names and fuzzy-matches the event before sending it back.
- Client matching includes common NCAA aliases.
- Live spread/total/moneyline card remains visible and includes provider diagnostics if no in-play line is posted.
