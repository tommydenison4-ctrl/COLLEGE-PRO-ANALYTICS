const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const A=require('../advantage-model.js'),d=require('../data/advantage-nfl.json'),fixture=require('./fixtures/nfl-week3.json');
const source=fs.readFileSync(__dirname+'/../nfl-center.js','utf8');const start=source.indexOf(' function model(g)'),end=source.indexOf(' function market(g)',start);
const c={AdvantageModel:A,AWM_DATA:{NFL:d}};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
for(const event of fixture.events){const cs=event.competitions[0].competitors,side=s=>{const t=cs.find(x=>x.homeAway===s).team;return{id:String(t.id),name:t.displayName,abbr:t.abbreviation}};const g={id:event.id,date:event.date,away:side('away'),home:side('home'),market:{}};const p=c.model(g);assert(p,'Current fixture needs a grounded forecast');assert.deepEqual(c.model({...g,market:{margin:100,total:200}}),p);assert.equal(p.hp,p.forecast.home_win_prob);assert.equal(p.away.points,p.forecast.away_score);assert.equal(c.model({...g,date:'2020-01-01'}),null);}
console.log('PASS NFL presentation adapter: verified fixture coverage, shared model, market exclusion and historical guard');
