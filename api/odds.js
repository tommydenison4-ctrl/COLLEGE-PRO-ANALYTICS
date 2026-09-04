
let GRIDLOCK_ODDS_CACHE = globalThis.__GRIDLOCK_ODDS_CACHE || {
  events:null,
  fetchedAt:0,
  expiresAt:0,
  requestsRemaining:null,
  requestsUsed:null,
  inflight:null,
  lastError:null
};
globalThis.__GRIDLOCK_ODDS_CACHE = GRIDLOCK_ODDS_CACHE;

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

  if(String(req.query?.health||'')==='1'){
    return res.end(JSON.stringify({
      ok:true,
      service:'GRIDLOCK sportsbook feed',
      route:'/api/odds',
      provider:'The Odds API',
      key_configured:!!key,
      cache:{
        populated:Array.isArray(GRIDLOCK_ODDS_CACHE.events),
        age_seconds:GRIDLOCK_ODDS_CACHE.fetchedAt?Math.round((Date.now()-GRIDLOCK_ODDS_CACHE.fetchedAt)/1000):null,
        expires_in_seconds:GRIDLOCK_ODDS_CACHE.expiresAt?Math.max(0,Math.round((GRIDLOCK_ODDS_CACHE.expiresAt-Date.now())/1000)):null,
        requests_remaining:GRIDLOCK_ODDS_CACHE.requestsRemaining
      },
      timestamp:new Date().toISOString()
    }));
  }

  if(!key){
    res.statusCode=503;
    return res.end(JSON.stringify({ok:false,error:'ODDS_API_KEY_MISSING'}));
  }

  async function providerFetch(){
    const params=new URLSearchParams();
    params.set('apiKey',key);
    params.set('regions','us');
    params.set('markets','h2h,spreads,totals');
    params.set('oddsFormat','american');

    const url=`https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds?${params.toString()}`;
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),8000);
    try{
      const r=await fetch(url,{headers:{accept:'application/json'},signal:ctl.signal});
      const text=await r.text();
      let parsed=null; try{parsed=JSON.parse(text)}catch(e){}
      if(!r.ok){
        const err=new Error(parsed?.message||`Odds provider ${r.status}`);
        err.providerStatus=r.status;
        err.providerBody=parsed||text.slice(0,500);
        throw err;
      }
      const remainingRaw=r.headers.get('x-requests-remaining');
      const usedRaw=r.headers.get('x-requests-used');
      return {
        events:Array.isArray(parsed)?parsed:[],
        remaining:remainingRaw!==null?Number(remainingRaw):null,
        used:usedRaw!==null?Number(usedRaw):null
      };
    }finally{
      clearTimeout(timer);
    }
  }

  function ttlForRemaining(remaining){
    // One league request returns all books/markets GRIDLOCK needs.
    // Stretch refresh interval automatically as quota gets low.
    if(Number.isFinite(remaining)){
      if(remaining <= 50) return 15*60*1000;
      if(remaining <= 150) return 10*60*1000;
      if(remaining <= 400) return 5*60*1000;
    }
    return 2*60*1000; // normal live cadence: max one provider hit per ~2 min per warm function
  }

  async function getLeagueOdds(){
    const now=Date.now();
    if(Array.isArray(GRIDLOCK_ODDS_CACHE.events) && now < GRIDLOCK_ODDS_CACHE.expiresAt){
      return {events:GRIDLOCK_ODDS_CACHE.events,source:'memory-cache',cacheHit:true};
    }

    // Coalesce simultaneous requests from Top Value, GameCast and Post-a-Play.
    if(GRIDLOCK_ODDS_CACHE.inflight){
      await GRIDLOCK_ODDS_CACHE.inflight;
      return {events:GRIDLOCK_ODDS_CACHE.events||[],source:'coalesced-cache',cacheHit:true};
    }

    GRIDLOCK_ODDS_CACHE.inflight=(async()=>{
      try{
        const data=await providerFetch();
        const ttl=ttlForRemaining(data.remaining);
        GRIDLOCK_ODDS_CACHE.events=data.events;
        GRIDLOCK_ODDS_CACHE.fetchedAt=Date.now();
        GRIDLOCK_ODDS_CACHE.expiresAt=Date.now()+ttl;
        GRIDLOCK_ODDS_CACHE.requestsRemaining=data.remaining;
        GRIDLOCK_ODDS_CACHE.requestsUsed=data.used;
        GRIDLOCK_ODDS_CACHE.lastError=null;
      }catch(e){
        GRIDLOCK_ODDS_CACHE.lastError={
          at:Date.now(),
          message:e?.message||String(e),
          provider_status:e?.providerStatus||null,
          provider_body:e?.providerBody||null
        };
        // If provider fails/quota is exhausted, serve the last successful snapshot for up to 30 minutes.
        if(Array.isArray(GRIDLOCK_ODDS_CACHE.events) &&
           Date.now()-GRIDLOCK_ODDS_CACHE.fetchedAt < 30*60*1000){
          GRIDLOCK_ODDS_CACHE.expiresAt=Date.now()+5*60*1000;
          return;
        }
        throw e;
      }finally{
        GRIDLOCK_ODDS_CACHE.inflight=null;
      }
    })();

    await GRIDLOCK_ODDS_CACHE.inflight;
    return {
      events:GRIDLOCK_ODDS_CACHE.events||[],
      source:GRIDLOCK_ODDS_CACHE.lastError?'stale-cache':'provider',
      cacheHit:!!GRIDLOCK_ODDS_CACHE.lastError
    };
  }

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
    a=norm(a); b=norm(b); if(!a||!b)return 0;
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

  try{
    const league=await getLeagueOdds();
    const home=String(req.query?.home||'').trim();
    const away=String(req.query?.away||'').trim();
    let events=league.events||[];
    let matched=null,bestScore=-1;

    if(home&&away){
      for(const e of events){
        const direct=teamScore(e.home_team,home)+teamScore(e.away_team,away);
        const flipped=teamScore(e.home_team,away)+teamScore(e.away_team,home);
        const s=Math.max(direct,flipped);
        if(s>bestScore){bestScore=s;matched=e;}
      }
      if(bestScore<35)matched=null;
      events=matched?[matched]:[];
    }

    const age=GRIDLOCK_ODDS_CACHE.fetchedAt
      ? Math.max(0,Math.round((Date.now()-GRIDLOCK_ODDS_CACHE.fetchedAt)/1000))
      : null;

    // Vercel/CDN can reuse the league snapshot too. Frontend uses one canonical URL.
    res.setHeader('Cache-Control','public, s-maxage=90, stale-while-revalidate=60');

    return res.end(JSON.stringify({
      ok:true,
      source:'The Odds API',
      mode:'GRIDLOCK shared league cache',
      cache_source:league.source,
      cache_hit:league.cacheHit,
      cache_age_seconds:age,
      next_provider_refresh_seconds:GRIDLOCK_ODDS_CACHE.expiresAt
        ? Math.max(0,Math.round((GRIDLOCK_ODDS_CACHE.expiresAt-Date.now())/1000))
        : null,
      requests_remaining:GRIDLOCK_ODDS_CACHE.requestsRemaining,
      requests_used:GRIDLOCK_ODDS_CACHE.requestsUsed,
      event_count:Array.isArray(GRIDLOCK_ODDS_CACHE.events)?GRIDLOCK_ODDS_CACHE.events.length:0,
      matched:home&&away?!!matched:undefined,
      matched_score:home&&away?bestScore:undefined,
      stale_due_to_provider_error:!!GRIDLOCK_ODDS_CACHE.lastError,
      last_provider_error:GRIDLOCK_ODDS_CACHE.lastError,
      events
    }));
  }catch(err){
    const ps=err?.providerStatus||null;
    const body=err?.providerBody||null;
    res.statusCode=502;
    return res.end(JSON.stringify({
      ok:false,
      error:ps===401 && body?.error_code==='OUT_OF_USAGE_CREDITS'
        ? 'OUT_OF_USAGE_CREDITS'
        : 'ODDS_PROVIDER_FAILED',
      provider_status:ps,
      provider_error:body,
      detail:err?.name==='AbortError'?'timeout':(err?.message||String(err))
    }));
  }
};
