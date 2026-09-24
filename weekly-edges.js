(function(root){
 'use strict';
 const numeric=v=>typeof v==='number'&&Number.isFinite(v);
 function rank(games,project,league,now=Date.now()){
  const upcoming=games.filter(g=>!g.complete&&g.state==='pre'&&Date.parse(g.date)>now);
  const candidates=upcoming.flatMap(g=>{
   const p=project(g),m=league==='NFL'?g.market?.margin:g.market?.home_margin;
   if(!p||p.available===false||!numeric(p.margin)||!numeric(m)||!g.market?.details)return [];
   const difference=p.margin-m;if(Math.abs(difference)<.05)return [];
   const side=difference>0?'home':'away',edge=Math.abs(difference),spread=side==='home'?-m:m;
   const hp=p.home_win_prob??p.hp,win=side==='home'?hp:1-hp;
   return [{id:String(g.id),g,p,side,edge,spread,win:numeric(win)&&win>=0&&win<=1?win:null,underdog:spread>0}];
  }).sort((a,b)=>b.edge-a.edge||a.id.localeCompare(b.id));
  return {strongest:candidates[0]||null,upset:candidates.find(c=>c.underdog)||null,covered:candidates.length,upcoming:upcoming.length};
 }
 root.WeeklyEdges={rank};if(!root.document)return;
 const esc=root.AdvantageModel.esc,signed=n=>(n>0?'+':'')+n.toFixed(1);
 const style=document.createElement('style');style.textContent=`.college-game.weekly-strongest{border:2px solid #f3c959!important;box-shadow:0 0 0 1px #f3c95922}.college-game.weekly-upset{border:2px solid #6ebfff!important}.college-game.weekly-strongest.weekly-upset{border-color:#f3c959!important;box-shadow:inset 0 -4px #6ebfff}.weekly-edge{background:#102b3b;color:#f2f6ff;border-radius:8px;padding:12px;margin:8px 0;text-align:left;white-space:normal;font-size:12px;line-height:1.55}.weekly-edge strong{display:block;color:#f3c959;font-size:13px;letter-spacing:.02em}.weekly-edge b{font-size:14px}.weekly-edge small{display:block;color:#b6c9d9}.weekly-edge-note{font-size:12px;color:#acc1d4;line-height:1.6;margin:14px 0;padding:12px 16px;border:1px solid #2a4357;border-radius:8px}.weekly-edge-note b{color:#f4f7fb}`;document.head.append(style);
 function badge(c,strong,upset){
  const team=c.g[c.side],margin=c.side==='home'?c.p.margin:-c.p.margin;
  return '<div class="weekly-edge"><strong>'+[strong?'★ STRONGEST PLAY OF THE WEEK':'',upset?'◆ TOP UPSET VALUE':''].filter(Boolean).join(' · ')+'</strong><b>'+esc(team.name)+' '+signed(c.spread)+' · '+c.edge.toFixed(1)+'-point model edge</b><div>Model: '+esc(team.abbr||team.name)+' '+(margin>0?'wins by '+margin.toFixed(1):margin<0?'loses by '+Math.abs(margin).toFixed(1):'ties')+'.'+(c.win!==null?' Win chance: '+(100*c.win).toFixed(1)+'%.':'')+'</div><small>Spread: '+esc(c.g.market.details)+' · '+esc(c.g.market.provider||'ESPN market feed')+'</small></div>';
 }
 function update(league){
  const nfl=league==='NFL',container=document.getElementById(nfl?'nflDays':'collegeDays');if(!container)return;
  const games=nfl?root.GRIDLOCK_NFL_CENTER?.getGames():root.GRIDLOCK_GET_COLLEGE_GAMES?.();if(!games)return;
  const project=nfl?g=>root.GRIDLOCK_NFL_CENTER.getProjection(g)?.forecast:g=>root.GRIDLOCK_GET_COLLEGE_PROJECTION(g);
  const r=rank(games,project,league),selector=nfl?'[data-nfl-game]':'[data-game]';
  for(const card of container.querySelectorAll(selector)){
   const id=nfl?card.dataset.nflGame:card.dataset.game,strong=r.strongest?.id===id,upset=r.upset?.id===id,c=strong?r.strongest:upset?r.upset:null;
   const html=c?badge(c,strong,upset):'';
   card.classList.toggle('weekly-strongest',strong);card.classList.toggle('weekly-upset',upset);
   let panel=card.querySelector('.weekly-edge');if(!html){panel?.remove();continue}
   if(panel?.outerHTML!==html){panel?.remove();card.insertAdjacentHTML('afterbegin',html)}
  }
  let note=document.getElementById('weekly-edge-note-'+league);if(!note){note=document.createElement('div');note.id='weekly-edge-note-'+league;note.className='weekly-edge-note';container.before(note)}
  const text='<b>Weekly model edges</b> · '+(r.strongest?'Gold = largest difference between the model margin and posted spread. Blue = largest positive underdog edge. Rankings use the full selected week, regardless of filters.':'No eligible spread edge available for this week.')+' '+(r.strongest&&!r.upset?'No underdog with a positive spread edge is available. ':'')+'Pregame games only; missing predictions or spreads are excluded. Underdog value does not necessarily mean an outright win. Lines can change; these are model comparisons, not guaranteed results.';
  if(note.innerHTML!==text)note.innerHTML=text;
 }
 let timer;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{update('NFL');update('NCAA')},80)}
 for(const id of ['nflDays','collegeDays']){const el=document.getElementById(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,subtree:true})}
 document.addEventListener('change',schedule);setInterval(schedule,30000);schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
