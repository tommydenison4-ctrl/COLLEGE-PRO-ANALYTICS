const decode=s=>String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;|&apos;/gi,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();
const norm=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
const same=(a,b)=>{const x=norm(a),y=norm(b);return x&&y&&(x===y||x.includes(y)||y.includes(x))};
async function grab(url){const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 GRIDLOCK/1.0','accept':'text/html'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.text()}
function nflParse(html,away,home){
  for(const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
    const c=[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>decode(x[1])); if(c.length<9)continue;
    const fav=c[4]||'',dog=c[8]||''; if(!((same(fav,away)&&same(dog,home))||(same(fav,home)&&same(dog,away))))continue;
    const sm=(c[5]||'').match(/([WLTP]?)\s*(\d+)-(\d+)/i),sp=(c[6]||'').match(/([WLTP]?)\s*([+-]?\d+(?:\.\d+)?)/i); if(!sm||!sp)continue;
    const favScore=+sm[2],dogScore=+sm[3],favSpread=+sp[2],favIsHome=same(fav,home);
    return {awayFinal:favIsHome?dogScore:favScore,homeFinal:favIsHome?favScore:dogScore,homeSpread:favIsHome?favSpread:-favSpread};
  } return null
}
function ncaaParse(html,away,home,awayAbbr,homeAbbr){
  const text=decode(html); let idx=text.toLowerCase().indexOf((away+' @ '+home).toLowerCase());
  if(idx<0){const a=text.toLowerCase().indexOf(away.toLowerCase()),h=text.toLowerCase().indexOf(home.toLowerCase());if(a>=0&&h>=0)idx=Math.min(a,h)}
  if(idx<0)return null; const seg=text.slice(idx,idx+1600);
  const score=seg.match(/([A-Z0-9]{2,8})\s+(\d+)\s+Final\s+([A-Z0-9]{2,8})\s+(\d+)/i); if(!score)return null;
  let homeSpread=null; const cover=seg.match(/Cover By\s+[+-]?\d+(?:\.\d+)?\s+([A-Z0-9]{2,8})\s+([+-]?\d+(?:\.\d+)?)/i);
  if(cover){const fav=cover[1],s=+cover[2];if(same(fav,homeAbbr)||same(fav,home))homeSpread=s;else if(same(fav,awayAbbr)||same(fav,away))homeSpread=-s}
  return {awayFinal:+score[2],homeFinal:+score[4],homeSpread}
}
module.exports=async function handler(req,res){
  try{
    const q=req.query||{},league=String(q.league||'').toUpperCase(),away=String(q.away||''),home=String(q.home||''),date=String(q.date||''),aa=String(q.awayAbbr||''),ha=String(q.homeAbbr||'');
    if(!away||!home)return res.status(400).json({found:false,note:'Missing teams'});
    if(league==='NFL'){
      const year=(date.match(/^(\d{4})/)||[])[1]||new Date().getFullYear(),url=`https://www.covers.com/sportsoddshistory/nfl-game-season/?y=${year}`,g=nflParse(await grab(url),away,home);
      return res.status(200).json(g?{found:true,source:'Covers Sports Odds History',url,...g}:{found:false,source:'Covers Sports Odds History',url,note:'Game not found in Covers NFL history yet.'});
    }
    const url='https://www.covers.com/sports/ncaaf/matchups',g=ncaaParse(await grab(url),away,home,aa,ha);
    return res.status(200).json(g?{found:true,source:'Covers NCAAF Matchups',url,...g}:{found:false,source:'Covers NCAAF Matchups',url,note:'Covers final card not available on the current matchups page.'});
  }catch(e){return res.status(200).json({found:false,source:'Covers',note:'Covers verification unavailable: '+String(e?.message||e)})}
}
