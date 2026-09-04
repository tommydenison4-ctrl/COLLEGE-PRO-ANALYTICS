module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  const live=String(req.query?.live||'')==='1';
  res.setHeader('Cache-Control',live?'s-maxage=15, stale-while-revalidate=20':'s-maxage=45, stale-while-revalidate=90');
  const key=process.env.ODDS_API_KEY;
  if(!key){res.statusCode=503;return res.end(JSON.stringify({error:'ODDS_API_KEY is not configured in Vercel'}));}
  const preferred=['fanduel','betrivers','bet365','bet365_us','draftkings','caesars'];
  const wanted=new Set(preferred);
  const base={apiKey:key,markets:'h2h,spreads,totals',oddsFormat:'american',dateFormat:'iso'};
  async function ask(extra){
    const params=new URLSearchParams({...base,...extra});
    const url='https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?'+params.toString();
    const r=await fetch(url,{headers:{accept:'application/json'}});const txt=await r.text();
    if(!r.ok)throw new Error(`Odds provider ${r.status}: ${txt.slice(0,240)}`);
    return {events:JSON.parse(txt),remaining:r.headers.get('x-requests-remaining')||'',used:r.headers.get('x-requests-used')||''};
  }

  function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(university|college|state university|the)\b/g,' ').trim();}
  function teamScore(a,b){
    a=norm(a);b=norm(b);if(!a||!b)return 0;
    if(a===b)return 100;
    let score=0;
    const aa=a.split(' ').filter(Boolean),bb=b.split(' ').filter(Boolean);
    for(const x of aa)if(x.length>=4&&bb.includes(x))score+=12;
    if(a.includes(b)||b.includes(a))score+=45;
    return score;
  }
  try{
    let data,mode;
    if(live){
      // In-game: query full U.S. market. Preferred books are sorted first,
      // but do not discard DraftKings/Caesars/other books if they are the only ones posting live.
      data=await ask({regions:'us,us2'});
      mode='regions=us,us2 live';
      let events=(data.events||[]).map(e=>{
        const books=[...(e.bookmakers||[])].sort((a,b)=>{
          const ai=preferred.indexOf(a.key),bi=preferred.indexOf(b.key);
          const av=ai<0?999:ai,bv=bi<0?999:bi;
          return av-bv;
        });
        return {...e,bookmakers:books};
      }).filter(e=>e.bookmakers.length);
      const qh=String(req.query?.home||''),qa=String(req.query?.away||'');
      let matched_event=null;
      if(qh&&qa){
        let best=null,bestScore=-1;
        for(const e of events){
          const s1=teamScore(e.home_team,qh)+teamScore(e.away_team,qa);
          const s2=teamScore(e.home_team,qa)+teamScore(e.away_team,qh);
          const s=Math.max(s1,s2);
          if(s>bestScore){bestScore=s;best=e;}
        }
        if(bestScore>=24)matched_event=best;
      }
      return res.end(JSON.stringify({source:'The Odds API',mode,live_requested:true,updated_at:new Date().toISOString(),event_count:events.length,matched_event_id:matched_event?.id||null,matched_event_score:matched_event?bestScore:null,requests_remaining:data.remaining,requests_used:data.used,events:matched_event?[matched_event]:events}));
    }
    mode='bookmakers=fanduel,betrivers';
    try{data=await ask({bookmakers:'fanduel,betrivers'});}catch(first){data=await ask({regions:'us'});mode='regions=us fallback';}
    let events=(data.events||[]).map(e=>({...e,bookmakers:(e.bookmakers||[]).filter(b=>wanted.has(b.key))})).filter(e=>e.bookmakers.length);
    return res.end(JSON.stringify({source:'The Odds API',mode,live_requested:false,updated_at:new Date().toISOString(),requests_remaining:data.remaining,requests_used:data.used,events}));
  }catch(err){res.statusCode=502;return res.end(JSON.stringify({error:'Direct sportsbook feed failed',detail:err?.message||String(err)}));}
};
