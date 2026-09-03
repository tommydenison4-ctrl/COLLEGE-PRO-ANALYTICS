EDGEWORK FULL SITE + POWER 4 SPATIAL LAB

This build preserves the full EDGEWORK NFL site and replaces the prototype heat-map section with the real Power 4 spatial engine.

Data included:
- 52,769 charted target locations from play_feed (16).csv
- 4,290 receiving player rows from pff-data-140.csv
- 2,310 rushing player rows from pff-data-141.csv
- 3,304 linked player profiles

Files:
- index.html: full EDGEWORK site
- app.js: existing site logic
- assets/edgework-logo.png
- power4_data.js: generated compact play/player dataset
- power4_lab.js: interactive heat-map and matchup logic

Heat Map tab features:
- Team and player view
- Target density, completion %, yards/target, explosive %, EPA/target
- Coverage, shell, position, down, route filters
- Selected offense/player vs Power 4 baseline
- Opponent defensive vulnerability map
- Matchup overlap map
- Receiving + rushing player profile cards

The team-name linkage is inferred from team/jersey target distributions between the play feed and PFF player export; mapping confidence is stored in power4_data.js.
