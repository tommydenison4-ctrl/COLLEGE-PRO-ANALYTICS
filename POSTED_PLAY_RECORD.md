# EDGEWORK Posted Play Record

The prototype logs a play when the user launches the X share, Facebook share, or native share action, or presses LOG PLAY. The browser cannot verify that a user completed a post on an external social platform, so the record represents share/log actions initiated from EDGEWORK.

Current persistence is browser localStorage (`edgework.posted.plays.v1`). Records include timestamp, matchup, play type, title, sportsbook, combined odds, stake, legs, note, sharing destinations, status, unit P/L and dollar P/L where a stake is supplied.

Users can grade each entry PENDING, WIN, LOSS, PUSH or VOID. Record, pending count, unit P/L and ROI update automatically. The ledger can be exported to CSV.

For cross-device/user-account history, move this ledger to Supabase after authentication is added. Recommended table fields: id uuid primary key, user_id uuid, created_at timestamptz, updated_at timestamptz, game_key text, matchup text, type text, title text, book text, odds text, stake numeric, legs jsonb, note text, destinations text[], status text, share_text text. Enable RLS so users can only read/write their own rows.
