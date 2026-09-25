module.exports = function handler(req,res){
  const q=req.query||{};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const team=String(q.teamName||q.team||'GRIDLOCK PICK');
  const line=String(q.line||'');
  const stars=Math.max(0,Math.min(5,Number(q.stars)||0));
  const edge=Number(q.edge);
  const matchup=String(q.matchup||'');
  const away=String(q.away||'AWAY'),home=String(q.home||'HOME');
  const awayScore=Number(q.awayScore),homeScore=Number(q.homeScore);
  const league=String(q.league||'nfl');
  const game=String(q.game||'');
  const pick=String(q.pick||'');
  const starText=stars?'★'.repeat(stars)+' '+stars+'-STAR':'';
  const title=`GRIDLOCK PICK: ${team}${line?' '+line:''}${starText?' • '+starText:''}`;
  const desc=[
    Number.isFinite(edge)?`${edge>=0?'+':''}${edge.toFixed(1)}-pt model edge`:null,
    Number.isFinite(awayScore)&&Number.isFinite(homeScore)?`Projection: ${away} ${awayScore.toFixed(1)} – ${home} ${homeScore.toFixed(1)}`:null,
    matchup||null
  ].filter(Boolean).join(' • ');
  const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
  const host=req.headers.host;
  const self=`${proto}://${host}${req.url}`;
  const target=`/?league=${encodeURIComponent(league)}&game=${encodeURIComponent(game)}&pick=${encodeURIComponent(pick)}&team=${encodeURIComponent(q.team||team)}&line=${encodeURIComponent(line)}&edge=${encodeURIComponent(Number.isFinite(edge)?edge.toFixed(1):'')}&stars=${encodeURIComponent(stars||'')}`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=300');
  res.status(200).send(`<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="GRIDLOCK Football Intelligence">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(self)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<style>body{margin:0;background:#06111d;color:#eef8ff;font-family:system-ui;display:grid;place-items:center;min-height:100vh}.c{max-width:640px;padding:28px}.k{color:#7bc6ff;font-size:12px;font-weight:900;letter-spacing:.12em}.t{font-size:28px;font-weight:1000;margin-top:8px}.d{color:#9ab0c0;line-height:1.55;margin-top:10px}.a{display:inline-block;margin-top:18px;color:#fff;background:#168cff;text-decoration:none;padding:10px 14px;border-radius:9px;font-weight:900}</style>
</head><body>
<div class="c"><div class="k">SHARED GRIDLOCK PICK</div><div class="t">${esc(title)}</div><div class="d">${esc(desc)}</div><a class="a" href="${esc(target)}">OPEN GAME IN GRIDLOCK</a></div>
</body></html>`);
}
