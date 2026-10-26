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
let s=setup();s.ctx.ahSmoothScroll(6000);s.frame(310);assert(s.window.scrollY>2500&&s.window.scrollY<3500);s.tick(620);assert.equal(s.window.scrollY,6000);
s=setup();s.ctx.ahSmoothScroll(6000);s.tick(620);assert.equal(s.window.scrollY,6000,'finish even with zero animation frames');
s=setup();s.ctx.ahSmoothScroll(6000);s.frame(500);assert(s.window.scrollY>5700,'late first frame does not restart clock');
s=setup();s.ctx.ahSmoothScroll(6000);s.ctx.ahSmoothScroll(0);s.frame(620);s.tick(1000);assert.equal(s.window.scrollY,0,'near-top click cancels previous glide');
s=setup();s.ctx.ahSmoothScroll(6000);s.frame(100);s.events.wheel();let y=s.window.scrollY;s.tick(1000);s.frame(1000);assert.equal(s.window.scrollY,y,'manual scroll cancels pending motion');
s=setup();s.ctx.ahSmoothScroll(6000);s.frame(100);s.ctx.ahSmoothScroll(1500);s.tick(720);s.frame(720);assert.equal(s.window.scrollY,1500,'new destination wins');
console.log('PASS: eased motion, withheld frames, delayed first frame, near-top cancellation, manual input, rapid retap');
