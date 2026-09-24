window.COLLEGE_AWM=(()=>{
 const A=window.AdvantageModel,data=window.AWM_DATA.NCAA;
 function project(g){
  const parts=g.date?Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(g.date.length===10?g.date+'T12:00:00Z':g.date)).map(p=>[p.type,p.value])):{};const date=parts.year?parts.year+'-'+parts.month+'-'+parts.day:'';
  const keys=t=>[t.school,t.name,t.short,t.abbr].filter(Boolean).map(A.canonical);
  const a=keys(g.away),h=keys(g.home);
  const matches=(window.AWM_EXACT||[]).filter(p=>p.date===date&&a.includes(A.canonical(p.awayName))&&h.includes(A.canonical(p.homeName)));
  if(matches.length===1)return matches[0];
  return A.project(data,{...g,league:'NCAA'});
 }
 function live(g,p,state,summary){
  if(!p?.available)return null;
  const s=A.espnState(summary,g);if(!s)return null;
  const l=A.live(data,p,s);if(!l)return null;
  const f=1-(s.remaining??0)/3600;
  return {...l,total:l.away+l.home,margin:l.home-l.away,f,reason1:'Advantage Winner Model: '+(l.mode||'Final result'),reason2:'Frozen pregame prior and verified game state. No market inputs.',prior:{priorTotal:p.total,priorMargin:p.margin,source:p.source,marketMargin:null},statAdj:{homeEdge:0,summary:l.mode||'Final'},fieldAdj:0};
 }
 return {project,live,data};
})();

window.GRIDLOCK_COLLEGE_PROJ_FOR=g=>{const p=COLLEGE_AWM.project(g);return p.available?p:null;};

// Load the season panels after the existing page has initialized.
(function(){
 async function panels(){if(window.AWM_BUNDLED)return;for(const file of ['season-watch-data.js', 'season-watch.js', 'player-stats-nfl-data.js', 'player-stats-ncaa-data.js', 'football-tabs.js']){try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=file+'?v=20260924tabs';script.onload=resolve;script.onerror=reject;document.head.append(script)})}catch(error){console.warn('Season panel unavailable:',file);break}}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',panels,{once:true});else panels();
})();
