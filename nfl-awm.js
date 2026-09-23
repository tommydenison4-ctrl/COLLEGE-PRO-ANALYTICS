(()=>{
 const A=window.AdvantageModel,data=window.AWM_DATA.NFL;
 const host=document.createElement('section');host.className='awm-nfl';host.id='awm-nfl';document.querySelector('.main').before(host);
 const style=document.createElement('style');style.textContent='body:not(.college-mode) .main,body:not(.college-mode) .matchup-head,body:not(.college-mode) .tabs-wrap,body:not(.college-mode) .score-strip-wrap,body:not(.college-mode) .top-actions{display:none!important}body.college-mode .awm-nfl{display:none!important}';document.head.appendChild(style);
 let games=data.schedule.map(g=>({...g,league:'NFL'})).sort((a,b)=>a.date.localeCompare(b.date)),selected=null,poll=null,requestId=0,week='';
 const weekKey=date=>{const d=new Date(date);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);};
 const logo=t=>t.logo?`<img src="${A.esc(t.logo)}" alt="">`:'';
 const pred=g=>A.project(data,g);
 function render(){
  if(selected)return;const weeks=[...new Set(games.map(g=>weekKey(g.date)))];if(!weeks.includes(week))week=weeks[0]||'';
  host.innerHTML=`<div class="awm-status">NFL · ADVANTAGE WINNER MODEL V3</div><h1>Schedule & predictions</h1><p class="awm-status">Pregame forecasts from verified football history. Data through ${A.esc(data.asOf)}.</p><div class="awm-toolbar"><label>Week of <select id="awm-nfl-week">${weeks.map(w=>`<option ${w===week?'selected':''} value="${w}">${w}</option>`).join('')}</select></label><button id="awm-refresh">Refresh live schedule</button><span class="awm-status" id="awm-nfl-status"></span></div><div class="awm-games">${games.filter(g=>weekKey(g.date)===week).map(g=>`<button class="awm-game" data-awm-id="${A.esc(g.id)}"><small>${new Date(g.date).toLocaleString([],{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small><div class="awm-team">${logo(g.away)}${A.esc(g.away.name)}</div><div class="awm-team">${logo(g.home)}${A.esc(g.home.name)}</div>${A.card(pred(g))}<small>OPEN GAMECENTRE →</small></button>`).join('')||'<p>No games in the loaded schedule.</p>'}</div>`;
  host.querySelector('#awm-nfl-week').onchange=e=>{week=e.target.value;render();};host.querySelector('#awm-refresh').onclick=sync;
  host.querySelectorAll('[data-awm-id]').forEach(b=>b.onclick=()=>open(b.dataset.awmId));
 }
 async function sync(){
  const status=host.querySelector('#awm-nfl-status');if(status)status.textContent='Refreshing…';
  try{const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');if(!r.ok)throw Error('schedule');const j=await r.json();
   for(const e of j.events||[]){const c=e.competitions?.[0],a=c?.competitors?.find(x=>x.homeAway==='away'),h=c?.competitors?.find(x=>x.homeAway==='home');if(!a||!h)continue;
    const convert=t=>({id:String(t.team.id),name:t.team.displayName,short:t.team.location,abbr:t.team.abbreviation,logo:t.team.logo});
    const g={id:String(e.id),league:'NFL',date:e.date,neutral:!!c.neutralSite,away:convert(a),home:convert(h),complete:!!e.status?.type?.completed};const i=games.findIndex(x=>x.id===g.id);if(i<0)games.push(g);else games[i]={...games[i],...g};
   }games.sort((a,b)=>a.date.localeCompare(b.date));render();const msg=host.querySelector('#awm-nfl-status');if(msg)msg.textContent='Schedule refreshed';
  }catch{if(status)status.textContent='Feed unavailable; showing saved schedule.';}
 }
 function open(id){
  const g=games.find(g=>g.id===id);if(!g)return;selected=g;clearInterval(poll);requestId++;const p=pred(g);
  host.innerHTML=`<div class="awm-gamecenter"><button id="awm-back">← NFL schedule</button><h1>${A.esc(g.away.name)} at ${A.esc(g.home.name)}</h1><p class="awm-status">${new Date(g.date).toLocaleString()}</p><div id="awm-nfl-live"></div>${A.card(p,true,data)}<section class="awm-card"><h3>Official game feed</h3><div id="awm-nfl-gamebook" class="awm-status">Loading official feed…</div></section></div>`;
  host.querySelector('#awm-back').onclick=()=>{selected=null;requestId++;clearInterval(poll);render();};tick();poll=setInterval(tick,30000);
 }
 async function tick(){
  if(!selected||document.hidden||document.body.classList.contains('college-mode'))return;const g=selected,token=requestId;
  try{const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event='+encodeURIComponent(g.id));if(!r.ok)throw Error('feed');const j=await r.json();if(token!==requestId)return;
   const s=A.espnState(j,g),live=s&&A.live(data,pred(g),s),running=j.header?.competitions?.[0]?.status?.type?.state!=='pre';
   const el=host.querySelector('#awm-nfl-live'),box=host.querySelector('#awm-nfl-gamebook');
   if(s&&running)el.innerHTML=`<section class="awm-card"><small>${s.complete?'FINAL':'LIVE'} · ${A.esc(s.clock||'')}</small><div class="awm-live-score"><b>${A.esc(g.away.abbr)} ${s.awayScore}</b><b>${A.esc(g.home.abbr)} ${s.homeScore}</b></div>${live?`<b>${A.esc(g.home.name)} win probability ${(live.homeWin*100).toFixed(1)}%</b><p>${A.esc(live.mode||'Final result')}</p>`:'<p>Live probability unavailable for this game state.</p>'}</section>`;
   else el.innerHTML='<p class="awm-status">Pregame · waiting for verified live action</p>';
   const plays=[...(j.drives?.previous||[]),...(j.drives?.current?[j.drives.current]:[])].flatMap(d=>d.plays||[]).slice(-20).reverse();
   box.innerHTML=`<div class="awm-live-plays">${plays.map(p=>`<p>${A.esc(p.clock?.displayValue||'')} ${A.esc(p.text||'')}</p>`).join('')||'No play-by-play posted yet.'}</div>`;
  }catch{if(token===requestId){const box=host.querySelector('#awm-nfl-gamebook');if(box)box.textContent='Live feed unavailable. The saved pregame forecast remains visible.';}}
 }
 window.NFL_AWM={open,render,sync};render();
 // No seeded NFL prediction or synthetic player projections enter this surface.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
})();
