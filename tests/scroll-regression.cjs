/* Run with node tests/scroll-regression.cjs. No network or dependencies. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('js/main.js', 'utf8');
const code = source.slice(source.indexOf('  var ahScrollToken = 0;'), source.indexOf('  function ahOnHomePage()'));
function setup() {
  let now=0, seq=0; const frames=new Map(), timers=new Map(), events={};
  const window={scrollY:0,matchMedia:()=>({matches:false}),scrollTo:({top})=>{window.scrollY=top},addEventListener:(name,fn)=>events[name]=fn};
  const ctx={window,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++seq,fn);return seq},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(fn,ms)=>{timers.set(++seq,{fn,at:now+ms});return seq},clearTimeout:id=>timers.delete(id)};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  return {ctx,window,events,frame(t){now=t;let f=[...frames.values()];frames.clear();f.forEach(fn=>fn(t))},tick(t){now=t;for(const [id,v] of timers)if(v.at<=t){timers.delete(id);v.fn()}}};
}
function runFrames(s, start=0, interval=16, count=60) { for(let n=0;n<count;n++)s.frame(start+n*interval); }
let s=setup();s.ctx.ahSmoothScroll(6000);runFrames(s,0,16,21);assert(s.window.scrollY>2500&&s.window.scrollY<3500);runFrames(s,336);assert.equal(s.window.scrollY,6000);
s=setup();s.ctx.ahSmoothScroll(6000);s.tick(2000);assert.equal(s.window.scrollY,0,'no deadline teleport when frames withheld');s.frame(2000);s.frame(4000);assert(s.window.scrollY>0&&s.window.scrollY<100,'late frame advances only small visible step');runFrames(s,4016);assert.equal(s.window.scrollY,6000);
s=setup();s.ctx.ahSmoothScroll(6000);runFrames(s,0,250,6);assert(s.window.scrollY>0&&s.window.scrollY<3000,'slow frames retain progressive movement');runFrames(s,1500,250,20);assert.equal(s.window.scrollY,6000);
s=setup();s.ctx.ahSmoothScroll(6000);s.ctx.ahSmoothScroll(0);runFrames(s);assert.equal(s.window.scrollY,0,'near-top click cancels previous glide');
s=setup();s.ctx.ahSmoothScroll(6000);runFrames(s,0,16,8);s.events.wheel();let y=s.window.scrollY;s.tick(1000);runFrames(s,1000);assert.equal(s.window.scrollY,y,'manual input cancels');
s=setup();s.ctx.ahSmoothScroll(6000);runFrames(s,0,16,8);s.ctx.ahSmoothScroll(1500);runFrames(s,200);assert.equal(s.window.scrollY,1500,'new destination wins');
s=setup();let complete=false;s.ctx.ahSmoothScroll(6000,()=>complete=true);s.tick(1000);assert(!complete,'completion waits for visible motion');runFrames(s,1000);assert(complete);
s=setup();s.window.matchMedia=()=>({matches:true});s.ctx.ahSmoothScroll(6000);assert.equal(s.window.scrollY,6000,'reduced motion remains respected');
console.log('PASS: progressive glide, withheld/late/slow frames, cancellation, rapid retap, completion');
