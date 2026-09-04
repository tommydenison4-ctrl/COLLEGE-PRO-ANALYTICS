module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  const live=String(req.query?.live||'')==='1';

  if(String(req.query?.health||'')==='1'){
    return res.end(JSON.stringify({
      ok:true,
      service:'GRIDLOCK sportsbook feed',
      route:'/api/odds',
      provider:'The Odds API',
      key_configured:!!process.env.ODDS_API_KEY,
      timestamp:new Date().toISOString()
    }));
  }

  res.setHeader('Cache-Control',live?'s-maxage=25, stale-while-revalidate=25':'s-maxage=60, stale-while-revalidate=90');

  const key=String(process.env.ODDS_API_KEY||'').trim();
  if(!key){
    res.statusCode=503;
    return res.end(JSON.stringify({ok:false,error:'ODDS_API_KEY_MISSING',detail:'ODDS_API_KEY is not configured in Vercel'}));
  }

  const home=String(req.query?.home||'').trim();
  const away=String(req.query?.away||'').trim();

  function norm(s){
    return String(s||'').toLowerCase()
      .replace(/&/g,' and ')
      .replace(/[^a-z0-9]+/g,' ')
      .replace(/\b(university|college|state university|the)\b/g,' ')
      .trim();
  }
  const aliases={
    'massachusetts':'umass','umass':'massachusetts',
    'central florida':'ucf','ucf':'central florida',
    'connecticut':'uconn','uconn':'connecticut',
    'southern california':'usc','usc':'southern california'
  };
  function teamScore(a,b){
    a=norm(a);b=norm(b);if(!a||!b)return 0;
    if(a===b)return 100;
    let score=0;
    if(a.includes(b)||b.includes(a))score+=50;
    const aa=a.split(' ').filter(Boolean),bb=b.split(' ').filter(Boolean);
    for(const x of aa)if(x.length>=4&&bb.includes(x))score+=14;
    for(const [x,y] of Object.entries(aliases)){
      if((a.includes(x)&&b.includes(y))||(a.includes(y)&&b.includes(x)))score+=65;
    }
    return score;
  }

  const params=new URLSearchParams();
  params.set('apiKey',key);
  params.set('regions','us');
  params.set('markets','h2h,spreads,totals');
  params.set('oddsFormat','american');
  params.set('dateFormat','iso');

  // Match the provider's documented example exactly: no trailing slash before ?.
  const url=`https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds?${params.toString()}`;

  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),8000);
  try{
    const r=await fetch(url,{headers:{accept:'application/json'},signal:ctl.signal});
    const text=await r.text();
    if(!r.ok){
      res.statusCode=502;
      return res.end(JSON.stringify({
        ok:false,
        error:'ODDS_PROVIDER_FAILED',
        provider_status:r.status,
        detail:text.slice(0,500),
        request_shape:'americanfootball_ncaaf / regions=us / h2h,spreads,totals',
        url_length:url.length
      }));
    }

    const events=JSON.parse(text);
    let matched=null,bestScore=-1;
    if(home&&away){
      for(const e of events){
        const direct=teamScore(e.home_team,home)+teamScore(e.away_team,away);
        const flipped=teamScore(e.home_team,away)+teamScore(e.away_team,home);
        const s=Math.max(direct,flipped);
        if(s>bestScore){bestScore=s;matched=e;}
      }
      if(bestScore<35)matched=null;
    }

    return res.end(JSON.stringify({
      ok:true,
      source:'The Odds API',
      mode:'documented regions=us feed',
      live_requested:live,
      fetched_at:new Date().toISOString(),
      event_count:Array.isArray(events)?events.length:0,
      matched:!!matched,
      matched_score:bestScore,
      requests_remaining:r.headers.get('x-requests-remaining')||'',
      requests_used:r.headers.get('x-requests-used')||'',
      events:matched?[matched]:(home&&away?[]:events)
    }));
  }catch(err){
    res.statusCode=502;
    return res.end(JSON.stringify({
      ok:false,
      error:'ODDS_PROVIDER_REQUEST_FAILED',
      detail:err?.name==='AbortError'?'timeout':(err?.message||String(err)),
      request_shape:'americanfootball_ncaaf / regions=us / h2h,spreads,totals',
      url_length:url.length
    }));
  }finally{
    clearTimeout(timer);
  }
};
