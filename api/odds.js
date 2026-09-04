module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json');

  function cleanKey(raw){
    let s=String(raw||'').trim();
    if((s.startsWith('"')&&s.endsWith('"'))||(s.startsWith("'")&&s.endsWith("'")))s=s.slice(1,-1).trim();
    s=s.replace(/^ODDS_API_KEY\s*=\s*/i,'').trim();
    return s;
  }

  const rawKey=String(process.env.ODDS_API_KEY||'');
  const key=cleanKey(rawKey);
  const keyMeta={
    configured:!!rawKey,
    raw_length:rawKey.length,
    cleaned_length:key.length,
    had_assignment_prefix:/^\s*ODDS_API_KEY\s*=/i.test(rawKey),
    had_wrapping_quotes:/^\s*["']/.test(rawKey)&&/["']\s*$/.test(rawKey),
    looks_like_url:/^https?:\/\//i.test(key)
  };

  if(String(req.query?.health||'')==='1'){
    return res.end(JSON.stringify({
      ok:true,
      service:'GRIDLOCK sportsbook feed',
      route:'/api/odds',
      provider:'The Odds API',
      key_configured:!!key,
      key_meta:keyMeta,
      timestamp:new Date().toISOString()
    }));
  }

  if(!key){
    res.statusCode=503;
    return res.end(JSON.stringify({ok:false,error:'ODDS_API_KEY_MISSING',key_meta:keyMeta}));
  }

  // A normal API key should be compact. A huge value is almost certainly a pasted URL/JSON/env assignment.
  if(key.length>128 || keyMeta.looks_like_url){
    res.statusCode=500;
    return res.end(JSON.stringify({
      ok:false,
      error:'ODDS_API_KEY_VALUE_LOOKS_WRONG',
      detail:'The configured ODDS_API_KEY is unexpectedly long or looks like a URL. Replace the environment variable with only the API key value.',
      key_meta:keyMeta
    }));
  }

  async function providerFetch(url,timeout=8000){
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),timeout);
    try{
      const r=await fetch(url,{headers:{accept:'application/json'},signal:ctl.signal});
      const text=await r.text();
      return {
        ok:r.ok,status:r.status,text,
        remaining:r.headers.get('x-requests-remaining')||'',
        used:r.headers.get('x-requests-used')||''
      };
    }finally{clearTimeout(timer)}
  }

  // Credential-only probe. GET /sports is documented and does not consume usage quota.
  if(String(req.query?.probe||'')==='1'){
    const url=`https://api.the-odds-api.com/v4/sports/?apiKey=${encodeURIComponent(key)}`;
    try{
      const p=await providerFetch(url);
      let parsed=null;try{parsed=JSON.parse(p.text)}catch(e){}
      res.statusCode=p.ok?200:502;
      return res.end(JSON.stringify({
        ok:p.ok,
        probe:'GET /v4/sports/',
        provider_status:p.status,
        key_meta:keyMeta,
        response:p.ok?{sport_count:Array.isArray(parsed)?parsed.length:null}:null,
        provider_error:p.ok?null:(parsed||p.text.slice(0,500))
      }));
    }catch(err){
      res.statusCode=502;
      return res.end(JSON.stringify({
        ok:false,probe:'GET /v4/sports/',error:'PROBE_REQUEST_FAILED',
        detail:err?.name==='AbortError'?'timeout':(err?.message||String(err)),
        key_meta:keyMeta
      }));
    }
  }

  const live=String(req.query?.live||'')==='1';
  res.setHeader('Cache-Control',live?'s-maxage=25, stale-while-revalidate=25':'s-maxage=60, stale-while-revalidate=90');

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

  const url=`https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds?${params.toString()}`;

  try{
    const p=await providerFetch(url);
    if(!p.ok){
      let parsed=null;try{parsed=JSON.parse(p.text)}catch(e){}
      res.statusCode=502;
      return res.end(JSON.stringify({
        ok:false,
        error:'ODDS_PROVIDER_FAILED',
        provider_status:p.status,
        provider_error:parsed||p.text.slice(0,500),
        request_shape:'americanfootball_ncaaf / regions=us / h2h,spreads,totals',
        url_length:url.length,
        key_meta:keyMeta
      }));
    }

    const events=JSON.parse(p.text);
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
      mode:'regions=us featured markets',
      live_requested:live,
      fetched_at:new Date().toISOString(),
      event_count:Array.isArray(events)?events.length:0,
      matched:!!matched,
      matched_score:bestScore,
      requests_remaining:p.remaining,
      requests_used:p.used,
      key_meta:{cleaned_length:keyMeta.cleaned_length},
      events:matched?[matched]:(home&&away?[]:events)
    }));
  }catch(err){
    res.statusCode=502;
    return res.end(JSON.stringify({
      ok:false,
      error:'ODDS_PROVIDER_REQUEST_FAILED',
      detail:err?.name==='AbortError'?'timeout':(err?.message||String(err)),
      key_meta:keyMeta
    }));
  }
};
