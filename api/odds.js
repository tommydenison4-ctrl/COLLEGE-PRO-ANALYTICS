module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=120');
  const key=process.env.ODDS_API_KEY;
  if(!key){res.statusCode=503;return res.end(JSON.stringify({error:'ODDS_API_KEY is not configured in Vercel'}));}
  try{
    const params=new URLSearchParams({apiKey:key,markets:'h2h,spreads,totals',oddsFormat:'american',dateFormat:'iso',bookmakers:'fanduel,betrivers,betrivers_ca_on',includeLinks:'true'});
    const url='https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?'+params.toString();
    const r=await fetch(url,{headers:{'accept':'application/json'}});
    const txt=await r.text();
    if(!r.ok){res.statusCode=r.status;return res.end(JSON.stringify({error:'Odds provider error',detail:txt.slice(0,400)}));}
    let events=JSON.parse(txt);
    // Keep only the books GRIDLOCK currently presents. Bet365 is supported by the UI if a future/provider response supplies it.
    const wanted=new Set(['fanduel','betrivers','betrivers_ca_on','bet365','bet365_us','bet365_ca']);
    events=(events||[]).map(e=>({...e,bookmakers:(e.bookmakers||[]).filter(b=>wanted.has(b.key))})).filter(e=>e.bookmakers.length);
    return res.end(JSON.stringify({source:'The Odds API',updated_at:new Date().toISOString(),events}));
  }catch(err){res.statusCode=500;return res.end(JSON.stringify({error:err?.message||String(err)}));}
}
