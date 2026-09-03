GRIDLOCK V20 FIX
- Fixes empty Top Value caused by V19 running before the College slate finished loading.
- Waits for games.length > 0, then calculates immediately.
- Refreshes value/upset boards every 10 seconds.
- Forces the direct odds feed to load after the schedule exists so team matching can occur.
- Archive now visibly reports the number of frozen pregame snapshots even when 0 games are final.
- Includes api/odds.js and vercel.json.
