module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','s-maxage=45, stale-while-revalidate=90');
  const key=process.env.ODDS_API_KEY;
  if(!key){res.statusCode=503;return res.end(JSON.stringify({error:'ODDS_API_KEY is not configured in Vercel'}));}
  const wanted=new Set(['fanduel','betrivers','bet365','bet365_us','bet365_ca']);
  const base={apiKey:key,markets:'h2h,spreads,totals',oddsFormat:'american',dateFormat:'iso'};
  async function ask(extra){
    const params=new URLSearchParams({...base,...extra});
    const url='https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?'+params.toString();
    const r=await fetch(url,{headers:{accept:'application/json'}});const txt=await r.text();
    if(!r.ok)throw new Error(`Odds provider ${r.status}: ${txt.slice(0,240)}`);
    return {events:JSON.parse(txt),remaining:r.headers.get('x-requests-remaining')||'',used:r.headers.get('x-requests-used')||''};
  }
  try{
    let data,mode='bookmakers=fanduel,betrivers';
    try{data=await ask({bookmakers:'fanduel,betrivers'});}catch(first){data=await ask({regions:'us'});mode='regions=us fallback';}
    let events=(data.events||[]).map(e=>({...e,bookmakers:(e.bookmakers||[]).filter(b=>wanted.has(b.key))})).filter(e=>e.bookmakers.length);
    return res.end(JSON.stringify({source:'The Odds API',mode,updated_at:new Date().toISOString(),requests_remaining:data.remaining,requests_used:data.used,events}));
  }catch(err){res.statusCode=502;return res.end(JSON.stringify({error:'Direct sportsbook feed failed',detail:err?.message||String(err)}));}
};
