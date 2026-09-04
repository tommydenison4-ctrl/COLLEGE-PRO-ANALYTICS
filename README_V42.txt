GRIDLOCK V42 — stable scoreboard hotfix

ROOT CAUSE
- An old College scoreboard startup loop was refreshing every 250ms.
- renderCollegeStrip removed and rebuilt every score chip on each refresh.
- That constantly changed DOM width/scroll position and caused visible page/score-strip jumping.

FIX
- Removed the 250ms boot loop.
- Live College scoreboard polls every ~6 seconds.
- Summary calls are cached for 5.5 seconds.
- Only live games request ESPN summary data.
- Score chips are created once and then updated in place.
- DOM is touched only when status, possession or score actually changes.
- Horizontal score-strip scroll position is preserved.
- Fixed tile widths and tabular-number clock/score text prevent layout shifts.

All V41 live field direction, possession, momentum, PBP, alerts, live projection and odds diagnostics are preserved.
