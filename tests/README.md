# NFL presentation regression checks

Run `npm install` and `npm test` from this directory with Node 24 or later.

- Compare all 992 NFL matchups and 71 NCAA workbook games against production model commit `9381498`.
- Exercise weekly slate, filtering, six tabs, absent markets, market independence, live/final feed fixtures, simulator, chat isolation and feed failures.
- Load the complete page and verify NFL/NCAA navigation, isolated tabs, player tools, and absence of uncaught script errors.

Fixtures contain public ESPN schedule records. Live/final cases are synthetic and do not assert any real game result. Browser layout must additionally be checked at desktop and narrow/mobile widths.
