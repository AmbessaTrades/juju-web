/* Juju, the one way a room talks to the server. Load order in every live room: kit2.css, kit2.js, light.js, art.js, api.js.
   Contract: runs/app/API.md and api.json. Nothing here makes data up: a room shows nothing until an answer comes.

   JUJU.get(path) .post(path,body) .patch(path,body) .del(path)   a promise of the answer. Same origin, 8 s.
       It fails with {error, say, status, ...the refusal's own fields}. error 'offline' = no server, 'slow' = 8 s passed.
       A 401 goes to the Gate with ?next= and never comes back to the caller (a wrong PIN does come back).
   JUJU.offline                 true when the page was opened as file://: every call fails at once with 'offline'.
   JUJU.poll(path, fn, {every, fail})   reads now and each 2 s, rests while the page is hidden. fn(answer) returning false ends it;
       every (ms) may be a function.
       Gives back {stop(), now()}.
   JUJU.once(button, work, {at, done})  one press, sent once: .busy until work() settles, a second tap does nothing.
       A refusal's say goes by the control (or at `at`). done(error) may return true when it dealt with a refusal itself.
       Gives back work's answer, or undefined after a refusal.
   JUJU.say(at, words, state) / JUJU.unsay(at)   words by a control or in a given place. state: stop (default), need, work.
   JUJU.copy(text)              a promise of true only when the text really is on the clipboard (works over plain http).
   JUJU.money()                 reads the money line into the Tank chip again.
   JUJU.chan(name, state)       the channel's name under the room's name. state: need, work, stop or nothing.
   JUJU.go(href)                leave for another room. JUJU.to.pact(id) .run(id) .room(film) .strip(film) .kit(film) name the hrefs.
   JUJU.esc(text) .minutes(n) .count(n) .param(key) .vessel .who
   JUJU.ready(fn)               after the kit has built the room.
   Built for every room but the Gate: the money line, the person button and its sheet with Sign out (#person, #signout).
   Looks set here for every room (the kit is not edited; a room's own <style> comes later and wins): the cat never moves and the
   rail's stands on a ledge; the Tank chip is plain text, unseen until a line is heard, shown on the phone too; the person button
   is in the phone's bar; .busy takes no tap; .juju-say; .deck .aside fills the deck so words stand next to the primary; on the
   phone .main is the screen less the 74 px bar, so a room that fits does not scroll. */
(()=>{
const FILE=location.protocol==='file:',HERE=location.pathname.split('/').pop()||'gate.html',GATE=HERE==='gate.html';
const q=new URLSearchParams(location.search);
const J=window.JUJU={offline:FILE,who:null,vessel:q.get('vessel')||'lot',param:k=>q.get(k)};
let leaving=false;
const never=()=>new Promise(()=>{});
class Refusal extends Error{constructor(status,body){super(body.error||'failed');Object.assign(this,body);this.status=status;this.error=body.error||'failed';this.say=body.say||(body.not_built?body.not_built+' is missing':'Failed')}}
const offline=()=>new Refusal(0,{error:'offline',say:'Offline'});

/* ---------- calls ---------- */
async function call(method,path,body,ms=8000){
 if(FILE)throw offline();
 const c=new AbortController(),t=setTimeout(()=>c.abort(),ms),o={method,credentials:'same-origin',cache:'no-store',signal:c.signal,headers:{}};
 if(method!=='GET')o.headers['X-Juju']='1';
 if(body instanceof Blob){o.headers['Content-Type']=body.type||'application/octet-stream';o.body=body}
 else if(body!==undefined){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
 let r,text;
 try{r=await fetch(path,o);text=await r.text()}
 catch(e){throw c.signal.aborted?new Refusal(0,{error:'slow',say:'No answer'}):offline()}
 finally{clearTimeout(t)}
 let a=null;try{a=text?JSON.parse(text):{}}catch(e){a=null}
 if(r.ok){if(a===null)throw new Refusal(r.status,{error:'unreadable',say:'Failed'});return a}
 if(r.status===401&&!path.startsWith('/api/session')&&!GATE){toGate();return never()}
 throw new Refusal(r.status,a&&typeof a==='object'?a:{});
}
J.get=p=>call('GET',p);J.post=(p,b)=>call('POST',p,b===undefined?{}:b);J.patch=(p,b)=>call('PATCH',p,b);J.del=p=>call('DELETE',p);
/* the High Juju check asks Claude itself: up to 15 s on the server */
J.slow=(p,b)=>call('POST',p,b===undefined?{}:b,16000);
/* a call that waits longer (a YouTube channel read takes about 12 s), and a picture sent as it is */
J.long=(p,b,ms)=>call('POST',p,b===undefined?{}:b,ms||90000);J.send=(p,blob)=>call('POST',p,blob,30000);
function toGate(){if(leaving)return;leaving=true;location.replace('gate.html?next='+encodeURIComponent(location.pathname+location.search))}
J.go=href=>{leaving=true;location.href=href};
J.to={pact:id=>'pact.html?pact='+encodeURIComponent(id),run:id=>'conjuring.html?run='+encodeURIComponent(id),room:id=>'viewing-room.html?film='+encodeURIComponent(id),strip:id=>'spell-strip.html?film='+encodeURIComponent(id),kit:id=>'publish-kit.html?film='+encodeURIComponent(id)};

/* ---------- polling: one call at a time, none while hidden ---------- */
J.poll=(path,fn,o={})=>{
 let dead=false,t=null,live=false,asked=false;
 const stop=()=>{dead=true;clearTimeout(t);document.removeEventListener('visibilitychange',seen)};
 const now=async()=>{
  clearTimeout(t);if(dead||leaving)return;if(live){asked=true;return}
  live=true;asked=false;
  try{const a=await J.get(path);if(!dead&&fn(a)===false)stop()}catch(e){if(!dead&&e.error&&o.fail)o.fail(e);else if(!e.error)console.error(e)}
  live=false;if(dead)return;
  if(asked)now();else if(!document.hidden)t=setTimeout(now,(typeof o.every==='function'?o.every():o.every)||2000);
 };
 const seen=()=>{if(document.hidden)clearTimeout(t);else now()};
 document.addEventListener('visibilitychange',seen);now();
 return{stop,now};
};

/* ---------- one press, sent once ---------- */
J.once=async(b,work,o={})=>{
 if(!b||b.dataset.sending||leaving)return;
 b.dataset.sending='1';b.classList.add('busy');b.setAttribute('aria-busy','true');J.unsay(o.at||b);
 try{return await work()}
 catch(e){if(!e.error){console.error(e);e.say='Failed'}if(!(o.done&&o.done(e)))J.say(o.at||b,e.say)}
 finally{if(!leaving){delete b.dataset.sending;b.classList.remove('busy');b.removeAttribute('aria-busy')}}
};
/* where a control's words stand: the deck's aside for a deck control, else straight after its group */
const spot=(el,make)=>{
 const deck=el.closest('.deck'),box=deck?deck.querySelector('.aside'):el.matches('button,a,input,textarea,select')?null:el;
 if(box){let s=box.querySelector(':scope>.juju-say');if(!s&&make){s=document.createElement('span');box.append(s)}return s}
 const after=el.closest('.acts,.row,.stepper,.tabs')||el;let s=after.nextElementSibling;if(s&&s.classList.contains('juju-say'))return s;
 if(!make)return null;s=document.createElement('span');after.after(s);return s;
};
J.say=(at,words,state='stop')=>{if(!at)return;const s=spot(at,true);s.className='status juju-say '+state;s.setAttribute('role','status');
 s.innerHTML=(window.Art?Art.pip({state:state==='stop'?'failed':state==='work'?'now':'next'}):'')+'<span></span>';s.lastChild.textContent=words};
J.unsay=at=>{const s=at&&spot(at,false);if(s)s.remove()};

/* ---------- copy: the clipboard API is missing on plain http over Wi-Fi ---------- */
J.copy=async text=>{
 if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return true}catch(e){}}
 const was=document.activeElement,a=document.createElement('textarea');a.value=text;a.readOnly=true;a.setAttribute('aria-hidden','true');
 a.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:0;opacity:.01;font-size:16px';
 (document.querySelector('.sheet:not([hidden])')||document.body).append(a);a.focus();a.select();a.setSelectionRange(0,text.length);
 let ok=false;try{ok=document.execCommand('copy')}catch(e){}
 a.remove();if(was&&was.focus)was.focus({preventScroll:true});return ok;
};

/* ---------- words ---------- */
J.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
J.minutes=n=>n==null?'':Math.max(1,Math.ceil(n))+' min';
J.count=n=>n==null?'':Number(n).toLocaleString('en-US');
J.chan=(name,state)=>{const p=document.querySelector('.place');if(!p)return;let c=p.querySelector('.chan');if(!name){if(c)c.remove();return}
 if(!c){c=document.createElement('span');c.className='chan';p.append(c)}c.setAttribute('data-d','');c.innerHTML=`<i class="dot ${state||''}"></i>${J.esc(name)}`};
J.ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();

/* ---------- the same in every room ---------- */
const css=document.createElement('style');
css.textContent=`
.cat,.cat .eyes{animation:none!important}
.rail .mark{position:relative}
.rail .mark::after{content:"";position:absolute;left:4px;right:4px;top:54px;height:6px;background:linear-gradient(180deg,var(--frame-hi),var(--frame) 2px,var(--lift) 3px,var(--ink));box-shadow:0 6px 8px -2px rgba(0,0,0,.7)}
.chip.tank,.chip.tank:hover{border-color:transparent;background:none;cursor:default;padding:0 0 0 8px}
.chip.tank:not(.heard){visibility:hidden}
.chip.tank .lbl{font:600 16px/1 "JetBrains Mono",monospace;letter-spacing:0;white-space:nowrap;color:var(--bone)}
.chip.tank.low .lbl{color:var(--need)}
.rail .who .emblem{width:22px;height:22px}
.busy{pointer-events:none}
.btn.busy,.row.busy{opacity:.6}
.deck .aside{flex:1} .deck .juju-say{margin-left:auto}
.juju-say.stop{color:var(--stop-hi)} .juju-say.need{color:var(--need)} .juju-say.work{color:var(--work)}
[data-skin="daylight"] .juju-say.stop{color:var(--stop)}
#person .row{-webkit-mask:none;mask:none}
@media (max-width:760px){
  /* the bottom bar's 74 px is inside the screen, so a room that fits never scrolls into nothing */
  .main{min-height:calc(100vh - 74px - env(safe-area-inset-bottom));min-height:calc(100dvh - 74px - env(safe-area-inset-bottom))}
  .deck .juju-say{margin-left:0}
  .chip.tank .lbl{display:inline;font-size:14px} .chip.tank{gap:8px}
  .rail .who{display:grid;margin:0 8px;align-self:center;flex:none;width:44px;height:44px}
}`;
document.head.append(css);
/* no picture for the browser's tab: without this it asks the server for one that is not there */
if(!document.querySelector('link[rel=icon]')){const l=document.createElement('link');l.rel='icon';l.href='data:,';document.head.append(l)}

J.money=async()=>{const c=document.querySelector('.chip.tank');if(!c||GATE)return;
 try{const m=await J.get('/api/money');c.querySelector('.lbl').textContent=m.line;c.className='chip tank heard '+(m.state==='ok'?'ok':'low')}catch(e){/* no line is shown until one is heard */}};
document.addEventListener('DOMContentLoaded',()=>{
 const old=document.querySelector('.chip.tank');
 if(old){const c=document.createElement(GATE?'span':'button');c.className='chip tank';c.innerHTML=old.innerHTML;c.querySelector('.lbl').textContent='';c.querySelector('.lbl').setAttribute('data-d','');old.replaceWith(c)
  if(!GATE){c.dataset.open='mojo';c.setAttribute('aria-label','Mojo Bag: money left');c.addEventListener('click',()=>J.mojo());
   document.body.insertAdjacentHTML('beforeend',`<section class="sheet" id="mojo" hidden aria-labelledby="mojoTitle"><h3 id="mojoTitle">Mojo Bag</h3><div class="total" id="mojoTotal"></div><div class="pots" id="mojoPots"></div></section>`)}}
 if(GATE)return;
 const who=document.querySelector('.rail .who');
 if(who){const had=document.getElementById('person');if(had)had.remove();
  who.innerHTML=window.Art?Art.emblem('gate'):'';who.dataset.open='person';
  document.body.insertAdjacentHTML('beforeend',`<section class="sheet" id="person" hidden><h3 id="personName" data-d></h3><div class="rows"><button class="row" id="signout"><span class="tile">${window.Art?Art.emblem('gate'):''}</span><b class="name">Sign out</b></button></div></section>`);
  const out=document.getElementById('signout');
  out.addEventListener('click',()=>J.once(out,async()=>{await J.del('/api/session');leaving=true;location.replace('gate.html')}))}
 J.get('/api/session').then(s=>{if(!s.who){toGate();return}J.who=s.who;const p=(s.people||[]).find(x=>x.id===s.who);if(!p||!who)return;
  who.textContent=p.name[0];who.setAttribute('aria-label',p.name);document.getElementById('personName').textContent=p.name}).catch(()=>{});
 J.money();J.mode();
});
/* one question before a long job (Ambi, 26 Nov: a tap on an idea started a whole film by itself). J.confirm({title, lines, go, stay}) -> true or false */
J.confirm=({title,lines=[],go='Go',stay='Not now',type=null,danger=false})=>new Promise(res=>{let s=document.getElementById('jconfirm');
 if(!s){document.body.insertAdjacentHTML('beforeend',`<section class="sheet" id="jconfirm" hidden aria-labelledby="jcT"><h3 id="jcT"></h3><button class="x btn bare" data-close aria-label="Close">×</button><div class="jcl"></div><label class="jct" hidden><span></span><input class="field" id="jcIn" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><div class="sheetfoot jcf"><button class="btn bare" id="jcStay"></button><button class="btn need" id="jcGo"></button></div></section>`);s=document.getElementById('jconfirm');
  const st=document.createElement('style');st.textContent='#jconfirm .jcl p{margin:8px 0;color:var(--bone);font:400 16px/1.45 "Josefin Sans",sans-serif}#jconfirm .jcl p.warn{color:var(--need)}#jconfirm .jcl p.t{font-weight:600}#jconfirm .jcf{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}#jconfirm .jct{display:grid;gap:8px;margin-top:10px;color:var(--ash);font:600 13px/1.3 "Josefin Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase}#jconfirm .jct input{text-transform:uppercase;letter-spacing:.12em}#jconfirm #jcGo[aria-disabled=true]{opacity:.4}#jconfirm.danger #jcGo{color:var(--need);border-color:var(--need)}';document.head.append(st)}
 s.querySelector('#jcT').textContent=title;s.querySelector('.jcl').innerHTML=lines.filter(Boolean).map(l=>typeof l==='string'?`<p>${J.esc(l)}</p>`:`<p class="${l.cls||''}">${J.esc(l.text)}</p>`).join('');
 const g=s.querySelector('#jcGo'),n=s.querySelector('#jcStay'),tl=s.querySelector('.jct'),ti=s.querySelector('#jcIn');g.textContent=go;n.textContent=stay;let done=false;
 s.classList.toggle('danger',!!danger);tl.hidden=!type;ti.value='';tl.querySelector('span').textContent=type?`Type ${type} to confirm`:'';
 const okTyped=()=>!type||ti.value.trim().toUpperCase()===String(type).toUpperCase();g.setAttribute('aria-disabled',String(!okTyped()));ti.oninput=()=>g.setAttribute('aria-disabled',String(!okTyped()));
 ti.onkeydown=e=>{if(e.key==='Enter'&&okTyped()){e.preventDefault();end(true)}};
 const end=v=>{if(done)return;done=true;ob.disconnect();Kit.sheet('jconfirm').close();res(v)};
 const ob=new MutationObserver(()=>{if(s.hidden)end(false)});ob.observe(s,{attributes:true,attributeFilter:['hidden']});
 g.onclick=()=>{if(!okTyped()){ti.focus();J.say(g,`Type ${type} first`,'need');return}end(true)};n.onclick=()=>end(false);Kit.sheet('jconfirm').open();setTimeout(()=>(type?ti:g).focus(),50)});
/* delete a channel: one sheet that names what goes, and the word typed (Ambi 26 Nov) */
J.deleteChannel=async(c)=>{const name=c.handle||c.name||'this channel';
 const ok=await J.confirm({title:`Delete ${name}?`,go:'Delete',stay:'Keep it',type:'DELETE',danger:true,lines:[
  {text:'This removes the channel, its look and colours, its ideas, what Juju learned for it, and films waiting to start.',cls:'t'},
  'Films already made stay in the Cauldron. This cannot be undone here.']});
 if(!ok)return false;await call('DELETE','/api/tap/channels/'+encodeURIComponent(c.slug)+'?confirm=DELETE',undefined,20000);Kit.toast(`${name} is deleted`);return true};
/* how long a film takes to make here: measured 26 Nov on the phone, a 3.6 min film in 11.4 min, about 3.2 times its length */
J.makeMinutes=m=>Math.max(5,Math.round(m*3.2/5)*5);
/* Gris-gris and High Juju (Ambi, 26 Nov 2026): a chip in the head, a sheet behind it. No model is named here. */
const MCSS=document.createElement('style');MCSS.textContent=`.chip.mode{gap:8px}.chip.mode .tag{color:var(--ash);font-weight:400}.chip.mode.high{color:var(--need);border-color:var(--need)}
#mode .rows .row{display:grid;grid-template-columns:minmax(0,1fr) auto;-webkit-mask:none;mask:none;padding:8px 12px;min-height:56px;align-items:center;border:2px solid var(--line);background:var(--lift);color:var(--bone);text-align:left;font:600 16px/1.2 "Josefin Sans",sans-serif;cursor:pointer}
#mode .rows .row.on{border-color:var(--act)}#mode .rows .row small{color:var(--ash);font-weight:400}
#mode .ways{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}#mode .ways .wl{flex-basis:100%;color:var(--ash);font:600 12px/1.2 "Josefin Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase}#mode .ways .btn[aria-pressed=true]{color:var(--act);border-color:var(--act)}
#mode .say{margin-top:12px;color:var(--bone);font:400 15px/1.4 "Josefin Sans",sans-serif}#mode .say.warn{color:var(--need)}
@media (max-width:760px){.chip.mode .tag{display:none}}`;document.head.append(MCSS);
J.mode=async()=>{const head=document.querySelector('.head');if(!head||GATE)return;
 let chip=head.querySelector('.chip.mode');
 if(!chip){chip=document.createElement('button');chip.className='chip mode';chip.dataset.open='mode';const t=head.querySelector('.chip.tank');t?t.before(chip):head.append(chip);
  document.body.insertAdjacentHTML('beforeend',`<section class="sheet" id="mode" hidden aria-labelledby="modeTitle"><h3 id="modeTitle">Thinking</h3><button class="x btn bare" data-close aria-label="Close">×</button>
<div class="rows"><button class="row" id="mGris"><span>Gris-gris <small>· Recommended</small></span><span></span></button>
<button class="row" id="mHigh" aria-label="Check High Juju"><span>High Juju</span><span class="btn" id="mCheck" aria-hidden="true">Check High Juju</span></button></div>
<div class="ways"><span class="wl">When High Juju is on, it uses</span><button class="btn" id="wPlan" aria-pressed="true">Lean on the plan</button><button class="btn" id="wApi" aria-pressed="true">Lean on the API (cached)</button></div>
<p class="say" id="mSay" aria-live="polite"></p><p class="say warn" id="mWarn" hidden></p></section>`);
  const $=id=>document.getElementById(id),put=v=>{draw(v)};
  $('mGris').addEventListener('click',()=>J.once($('mGris'),async()=>put(await J.post('/api/mode',{mode:'gris-gris'}))));
  $('mHigh').addEventListener('click',()=>{$('mSay').textContent='Checking…';J.once($('mHigh'),async()=>{const v=await J.slow('/api/mode/check');put(v);$('mSay').textContent=v.say})});
  for(const [id,k] of [['wPlan','plan'],['wApi','api']])$(id).addEventListener('click',()=>J.once($(id),async()=>{const on=$(id).getAttribute('aria-pressed')!=='true';put(await J.post('/api/mode',{lean:{[k]:on}}))}));
 }
 const draw=v=>{const hi=v.mode==='high-juju',$=id=>document.getElementById(id);
  chip.className='chip mode'+(hi?' high':'');chip.innerHTML=`<span>${hi?'High Juju':'Gris-gris'}</span><span class="tag">· ${hi?'Use sparingly':'Recommended'}</span>`;chip.setAttribute('aria-label',hi?'High Juju, use sparingly':'Gris-gris, recommended');
  $('mGris').classList.toggle('on',!hi);$('mHigh').classList.toggle('on',hi);
  $('wPlan').setAttribute('aria-pressed',String(v.lean.plan));$('wApi').setAttribute('aria-pressed',String(v.lean.api));
  /* Gris-gris is the everyday mix the films are made with; High Juju adds Claude for ideas and storyboards (Ambi 28 Nov: Gris-gris said "the Claude API is ready") */
  $('mSay').textContent=hi?`High Juju is on: Claude (Opus 5.5) thinks up the ideas and the storyboard; the everyday mix does the rest. Use sparingly. ${v.room}.`
   :`Gris-gris: the everyday mix. Pen of the Scribe (DeepSeek) writes, Eye of the Judges (GLM 5.3, Jev) checks, Choice of the Seer (Neon) plans.`+(v.why_not?` High Juju is not open: ${v.why_not}.`:' High Juju is ready when you want it.');
  const w=$('mWarn'),o=(v.opens||[]);w.hidden=!hi||!o.length;
  w.textContent=hi&&o.length?`Open now: ${o.map(x=>x.name).join(', ')}. Duppy Night and Duppy Day films are posted every other day or every two days, never daily.`:''};
 try{draw(await J.get('/api/mode'))}catch(e){chip.remove()}};
/* The Mojo Bag (Ambi, 26 Nov 2026): the money left in every pot, opened from the head's money chip in every room, phone and web.
   Each pot has a Juju name that says its job, then its real service in small brackets. High Juju's row is the week's room. */
const PCSS=document.createElement('style');PCSS.textContent=`button.chip.tank{cursor:pointer}
#mojo .total{display:flex;align-items:baseline;gap:4px 10px;flex-wrap:wrap;margin:2px 0 14px}#mojo .total .cap{flex-basis:100%} #mojo #mojoAgain{margin-left:auto;min-height:36px;font-size:13px} #mojo .pot .nr{color:var(--ash);font:400 14px/1.2 "Josefin Sans",sans-serif;white-space:normal} #mojo .pot.stale .m i{color:var(--need)}#mojo .total .fig{font:600 34px/1 "Spectral SC",serif;color:var(--bone)}#mojo .total span{color:var(--ash);font:400 15px/1.2 "Josefin Sans",sans-serif}
#mojo .pots{display:grid;gap:8px} #mojo .qbar{display:block;height:6px;margin-top:8px;background:var(--line);border-radius:3px;overflow:hidden} #mojo .qbar i{display:block;height:100%;background:var(--act)} #mojo .pot.low .qbar i{background:var(--need)}
#mojo .pot{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;min-height:56px;padding:8px 14px;border:2px solid var(--line);background:var(--lift);color:var(--bone)}
#mojo .pot b{font:600 17px/1.2 "Spectral SC",serif}#mojo .pot small{color:var(--smoke);font:400 11px/1 "Josefin Sans",sans-serif;margin-left:6px;white-space:nowrap}
#mojo .pot .m{font:600 17px/1 "Josefin Sans",sans-serif;text-align:right;white-space:nowrap}#mojo .pot.low{border-color:var(--need)}#mojo .pot.low .m{color:var(--need)}
#mojo .pot .m i{display:block;font:400 12px/1.3 "Josefin Sans",sans-serif;font-style:normal;color:var(--ash);margin-top:3px}`;document.head.append(PCSS);
const usd=n=>'$'+(+n).toFixed(2),day=s=>{const d=new Date(s+'T12:00:00');return isNaN(d)?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})};
/* one call: /api/purse here, the Door's GET /v1/purse on the phone (docs/PHONE-CORE.md section 3); the same rows either way */
/* only a balance read from the service is money, each with the time it was read; a service with no balance to read says so.
   A tap reads them all again; the bag does it by itself when it opens with a figure older than 10 minutes. */
const ago=t=>{if(!t)return'';const d=Math.max(0,Date.now()/1000-t);return d<90?'just now':d<3600?Math.round(d/60)+' min ago':d<86400?Math.round(d/3600)+' h ago':new Date(t*1000).toLocaleDateString('en-GB',{day:'numeric',month:'short'})};
let mojoBusy=false;
J.mojo=async(again)=>{const body=document.getElementById('mojoPots'),top=document.getElementById('mojoTotal');if(!body)return;
 let p;try{p=again?await call('POST','/api/purse/refresh',{},20000):await J.get('/api/purse')}catch(e){top.innerHTML=`<span>${J.esc(e.say||'Not read yet')}</span>`;return}
 /* each pot as a quota card (Hermes' quota plugin): the balance or the plan's percentage, a bar for a percentage, the 7-day spend and when it was read */
 const pct=r=>r.unit==='pct_week'?Math.round(r.left):r.unit==='week'?Math.round(r.left*100):null,
  fig=r=>r.left==null?`<span class="nr">${J.esc(r.week_line||r.say||'No balance to read')}</span>`:pct(r)!=null?`${pct(r)}% left`:usd(r.left),
  bar=r=>pct(r)!=null?`<span class="qbar" aria-hidden="true"><i style="width:${Math.max(2,Math.min(100,pct(r)))}%"></i></span>`:'',
  until=t=>{const d=(Date.parse(t)-Date.now())/36e5;return isFinite(d)&&d>0?(d<48?`resets in ${Math.round(d)} h`:`resets in ${Math.round(d/24)} days`):''},
  under=r=>[r.left!=null&&r.week_line?r.week_line:'',r.as_of?'read '+ago(r.as_of):'',r.resets_at?until(r.resets_at):'',r.runs_out?'lasts to '+day(r.runs_out):'',r.left==null&&r.note?r.note:''].filter(Boolean).join(' · ');
 top.innerHTML=`<b class="fig">${usd(p.total)}</b><span>${J.esc(p.total_line||'read from the services')}</span><button class="btn bare" id="mojoAgain" type="button">${mojoBusy?'Reading':'Read again'}</button>`;
 body.innerHTML=p.rows.map(r=>`<div class="pot${r.low?' low':''}${r.stale?' stale':''}"><span><b>${J.esc(r.name)}</b><small>(${J.esc(r.service)})</small>${bar(r)}</span><span class="m">${fig(r)}${under(r)?`<i>${J.esc(under(r))}</i>`:''}</span></div>`).join('');
 const b2=document.getElementById('mojoAgain');b2.onclick=()=>{if(mojoBusy)return;mojoBusy=true;b2.textContent='Reading';J.mojo(true).finally(()=>{mojoBusy=false;const x=document.getElementById('mojoAgain');if(x)x.textContent='Read again'})};
 if(!again&&p.stale&&!mojoBusy){mojoBusy=true;b2.textContent='Reading';J.mojo(true).finally(()=>{mojoBusy=false})}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!leaving)J.money()});
/* a page brought back by the browser's Back holds old answers: read everything again */
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
})();
