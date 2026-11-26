/* The daily loop, shared by Altar, Crossroads, Cauldron and Shelf (APP-FLOW, 26 Nov 2026). Server: /api/tap (crates/juju-serve/src/make.rs, chan.rs).
   Load after api.js. A film's picture is its package thumbnail when one was drawn, else a frame of the film itself; Juju draws no picture here. */
(()=>{
const esc=s=>JUJU.esc(s),ok=s=>/^[a-z0-9-]{1,47}$/.test(s||'');
const F=window.Flow={};
{const st=document.createElement('style');st.textContent=`@media (max-width:760px){
 .head{gap:8px} .head .seal-mark{display:none} .head .back{display:none}
 .head .title{white-space:nowrap;font-size:21px} .head .place{min-width:0;flex:1 1 auto}
 .head .chan{white-space:normal;font-size:11px;line-height:1.25;letter-spacing:.08em}
 .head .tools{gap:6px;flex:none} .chip.mode{white-space:nowrap;height:40px;min-width:0;padding:0 8px;font-size:12px}
 .chip.tank{white-space:nowrap;flex:none;height:40px;padding:0 8px}
 .deck .aside .phone-off{display:none}}`;document.head.append(st)}
/* the channel in hand: ?ch=, else the last one opened */
F.ch=()=>{let c=JUJU.param('ch');try{if(ok(c))localStorage.setItem('juju.ch',c);else c=localStorage.getItem('juju.ch')}catch(e){}return ok(c)?c:''};
F.lock='<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1.5c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-13C4.7 22 4 21.3 4 20.5v-9C4 10.7 4.7 10 5.5 10zm2.5 0h5V7a2.5 2.5 0 0 0-5 0z"/></svg>';
F.clock=s=>s==null?'':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
F.size=h=>h===1440?'2K':h?h+'p':'';
F.who=c=>c.handle||c.name;
/* a picture for a film: its thumbnail, or a frame of it fetched only when it comes into view */
F.pic=f=>f.thumb?`<img src="${esc(f.thumb)}" alt="" loading="lazy">`:f.film?`<video data-src="${esc(f.film)}#t=25" muted playsinline preload="none" tabindex="-1" aria-hidden="true"></video>`:`<span class="nopic">${Art.emblem('cauldron')}</span>`;
let io=null;
F.lazy=root=>{if(!io)io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const v=e.target;io.unobserve(v);if(v.dataset.src&&!v.getAttribute('src')){v.preload='metadata';v.src=v.dataset.src;
  /* a frame from the middle of the film: the opening seconds are often a dark title, and Chrome may paint nothing until it seeks */
  v.addEventListener('loadedmetadata',()=>{if(isFinite(v.duration)&&v.duration>2)v.currentTime=Math.min(v.duration*.4,v.duration-1)},{once:true})}}),{rootMargin:'200px'});
 (root||document).querySelectorAll('video[data-src]:not([src])').forEach(v=>io.observe(v))};
/* Every door opens at any time (Ambi, 26 Nov, ADR 0027 item 73: "what's the point of the menu then"). A room with no channel
   in hand opens the last one used, or the first; Cauldron alone may show every channel. */
F.first=async()=>{try{const a=await JUJU.get('/api/tap/channels');return (a.channels[0]||{}).slug||''}catch(e){return ''}};
F.need=room=>{F.first().then(c=>location.replace(c?room+'.html?ch='+c:'altar.html'))};
/* the channel switcher: the channel's name in the head opens a list of every channel; a pick opens this room on it */
const SW=document.createElement('style');SW.textContent=`.head .chan.pick{cursor:pointer;border:0;background:none;color:inherit;font:inherit;padding:4px 0;display:inline-flex;align-items:center;gap:6px;text-align:left}
.head .chan.pick::after{content:"";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
#chsw .rows{display:grid;gap:8px} #chsw a{display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;min-height:56px;padding:6px 12px;border:2px solid var(--line);background:var(--lift);color:var(--bone);text-decoration:none;font:600 17px/1.2 "Spectral SC",serif}
#chsw a.on{border-color:var(--act)} #chsw a img,#chsw a .e{width:40px;height:40px;border-radius:50%;object-fit:cover} #chsw a .e svg{width:40px;height:40px}`;document.head.append(SW);
F.switcher=(room,cur,all)=>{const c=document.querySelector('.head .chan');if(!c)return;
 const b=document.createElement('button');b.className='chan pick';b.innerHTML=c.innerHTML;b.setAttribute('aria-label','Channel: '+c.textContent.trim()+'. Change');b.dataset.open='chsw';c.replaceWith(b);
 if(!document.getElementById('chsw'))document.body.insertAdjacentHTML('beforeend',`<section class="sheet" id="chsw" hidden aria-labelledby="chswT"><h3 id="chswT">Channel</h3><div class="rows" id="chswRows"></div></section>`);
 b.addEventListener('click',async()=>{const r=document.getElementById('chswRows');try{const a=await JUJU.get('/api/tap/channels');
  r.innerHTML=(all?`<a href="${room}.html?all=1"${!cur?' class="on"':''}><span class="e">${Art.emblem('cauldron')}</span><span>Every channel</span></a>`:'')+
   a.channels.map(x=>`<a href="${room}.html?ch=${esc(x.slug)}"${x.slug===cur?' class="on"':''}><span class="e">${x.avatar?`<img src="${esc(x.avatar)}" alt="">`:Art.emblem('altar')}</span><span>${esc(F.who(x))}</span></a>`).join('')}catch(e){r.innerHTML=''}})};

/* Tell Juju (Ambi, 26 Nov, ADR 0027 item 73): on any open film, a pop-out on the right edge (a slide-up on the phone) with one
   line and one send. Juju mends the film by itself and shows its words here, then the before and after. No timeline, no edit box.
   The server runs ju mend <film> --file <words> (contract: juju-maps/make/CONTRACT.md); "Use this one" runs the same words again with --apply. */
const MEND_BUILT=true;
const TC=document.createElement('style');TC.textContent=`.tell-tab{position:fixed;right:0;top:50%;z-index:33;transform:translateY(-50%);writing-mode:vertical-rl;padding:16px 10px;border:2px solid var(--act);border-right:0;background:var(--card);color:var(--act);font:600 15px/1 "Spectral SC",serif;letter-spacing:.08em;cursor:pointer}
.tell{position:fixed;right:0;top:0;bottom:0;z-index:34;width:min(360px,100%);display:flex;flex-direction:column;gap:12px;padding:24px 20px calc(20px + env(safe-area-inset-bottom));background:linear-gradient(180deg,var(--panel-a),var(--panel-b));border-left:2px solid var(--line-hi);color:var(--bone);animation:tellin .22s cubic-bezier(.2,.9,.25,1.05)}
@keyframes tellin{from{transform:translateX(100%)}to{transform:none}}
.tell h3{font:600 22px/1.15 "Spectral SC",serif;padding-right:48px} .tell .x{position:absolute;right:10px;top:12px;width:44px;height:44px;font:400 28px/1 "Lato",sans-serif;color:var(--bone)}
.tell .log{flex:1;overflow:auto;display:grid;align-content:start;gap:10px;font:400 15px/1.4 "Lato",sans-serif}
.tell .log .me{justify-self:end;max-width:90%;padding:10px 12px;background:var(--lift);border:2px solid var(--line)} .tell .log .ju{color:var(--ash)} .tell .log .ju.need{color:var(--need)}
.tell .pair{display:grid;gap:6px} .tell .pair .was{color:var(--ash);text-decoration:line-through} .tell .pair .now{border-left:3px solid var(--act);padding-left:8px}
.tell.wide{width:min(760px,100%)} .tell .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px} .tell .cards b{display:block;margin-bottom:6px;color:var(--ash);font:600 13px/1 "Josefin Sans",sans-serif;letter-spacing:.06em}
.tell .cards p{margin:0 0 6px;padding:8px 10px;border:2px solid var(--line);background:var(--lift);font-size:14px} .tell .cards .was{color:var(--ash)} .tell .cards .now{border-color:var(--act)}
.tell .takes{display:grid;grid-template-columns:1fr 1fr;gap:10px} .tell .takes figure{margin:0} .tell .takes figcaption{color:var(--ash);font:600 13px/1 "Josefin Sans",sans-serif;margin-bottom:6px} .tell .takes video{width:100%;aspect-ratio:16/9;background:#000}
.tell .use{justify-self:end;color:var(--ash)} .tell .use:hover{color:var(--bone)}
.tell .reach{display:flex;gap:6px;flex-wrap:wrap} .tell .reach .btn{min-height:36px;padding:0 10px;font-size:13px} .tell .reach .btn.on{color:var(--act);box-shadow:inset 0 0 0 2px var(--act)}
.tell form{display:flex;gap:8px} .tell input{flex:1;min-width:0;min-height:48px;padding:0 12px;background:var(--a-well);color:var(--bone);border:2px solid var(--line-hi);font:400 17px/1 "Lato",sans-serif}
@media (max-width:760px){.tell-tab{top:calc(14px + env(safe-area-inset-top));bottom:auto;writing-mode:horizontal-tb;transform:none;border-right:2px solid var(--act);right:12px;padding:12px 14px}
 .tell .cards,.tell .takes{grid-template-columns:1fr} .tell,.tell.wide{top:auto;left:0;width:100%;max-height:80vh;border-left:0;border-top:2px solid var(--line-hi);animation-name:tellup} @keyframes tellup{from{transform:translateY(100%)}to{transform:none}}}`;document.head.append(TC);
/* plain words for one card of a mend: a new card, a hidden counter, a changed line */
const cardWords=x=>{if(!x)return'';if(x.op==='series_hide')return'Hidden: '+(x.label||x.where||'');
 const t=[x.date,x.title].filter(Boolean).join(' · '),l=x.line||x.text||x.label||'';return (x.added?'New: ':'')+(t&&l?t+': '+l:t||l)};
F.tell=(sheetId,film)=>{let tab=document.querySelector('.tell-tab'),box=document.querySelector('.tell');
 if(!tab){tab=document.createElement('button');tab.className='tell-tab';tab.type='button';tab.textContent='Tell Juju';tab.hidden=true;document.body.append(tab);
  box=document.createElement('aside');box.className='tell';box.hidden=true;box.setAttribute('aria-label','Tell Juju');
  box.innerHTML=`<h3>Tell Juju</h3><button class="btn bare icon x" type="button" aria-label="Close">×</button><div class="log" aria-live="polite"></div><div class="reach" role="radiogroup" aria-label="Who the change is for"><button class="btn on" type="button" data-scope="film" aria-pressed="true">This film</button><button class="btn" type="button" data-scope="channel" aria-pressed="false">This channel</button><button class="btn" type="button" data-scope="all" aria-pressed="false">Every film</button></div><form><input maxlength="2000" autocomplete="off" aria-label="What to change" placeholder="What to change"><button class="btn need">Send</button></form>`;document.body.append(box);
  tab.addEventListener('click',()=>{box.hidden=false;tab.hidden=true;box.querySelector('input').focus()});
  box.querySelector('.x').addEventListener('click',()=>{box.hidden=true;tab.hidden=false});
  box.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const i=box.querySelector('input'),t=i.value.trim(),f=F.tell.film;if(!t||!f)return;
   if(!MEND_BUILT){F.tell.line('me',t);F.tell.line('ju need','Not built yet');return}
   const btn=box.querySelector('form .btn');JUJU.once(btn,async()=>{const scope=(box.querySelector('.reach .on')||{}).dataset?.scope||'film',r=await JUJU.post('/api/tap/films/'+encodeURIComponent(f.id)+'/mend',{text:t,scope});i.value='';F.tell.draw({said:t,state:'running',say:r.say});F.tell.watch();return r},
    {done:x=>{F.tell.line('ju need',x.say||'Failed');return true}})});
  box.querySelector('.reach').addEventListener('click',e=>{const b=e.target.closest('[data-scope]');if(!b)return;box.querySelectorAll('.reach .btn').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b))})});
  box.addEventListener('click',e=>{const u=e.target.closest('[data-use]');if(!u||!F.tell.film)return;
   JUJU.once(u,async()=>{const r=await JUJU.post('/api/tap/films/'+encodeURIComponent(F.tell.film.id)+'/mend',{mend:u.dataset.use,apply:true});F.tell.draw({said:F.tell.last&&F.tell.last.said,state:'running',say:r.say,using:true});F.tell.watch();return r},
    {done:x=>{F.tell.line('ju need',x.say||'Failed');return true}})})}
 F.tell.film=film;F.tell.last=null;box.querySelector('.log').innerHTML='';box.classList.remove('wide');box.hidden=true;tab.hidden=false;
 if(MEND_BUILT&&film)JUJU.get('/api/tap/films/'+encodeURIComponent(film.id)+'/mend').then(v=>{if(F.tell.film!==film)return;
  if(!v.mendable){F.tell.line('ju','Juju cannot change this film yet.');box.querySelector('form').hidden=true;return}box.querySelector('form').hidden=false;
  /* only a mend still running is shown when a film opens; a finished one belongs to the moment it was asked for */
  if(v.state==='running'){F.tell.draw(v);F.tell.watch()}}).catch(()=>{});
 /* the pop-out lives only while the film's sheet is open */
 const s=document.getElementById(sheetId);if(s&&!s._tell){s._tell=new MutationObserver(()=>{if(s.hidden){tab.hidden=true;box.hidden=true;if(F.tell.poll)F.tell.poll.stop()}});s._tell.observe(s,{attributes:true,attributeFilter:['hidden']})}};
F.tell.line=(k,t)=>{const l=document.querySelector('.tell .log');l.insertAdjacentHTML('beforeend',`<div class="${k}">${esc(t)}</div>`);l.scrollTop=l.scrollHeight};
/* one mend as words: what was said, where Juju is, then the cards before and after and the two takes */
F.tell.draw=v=>{const box=document.querySelector('.tell'),l=box.querySelector('.log');F.tell.last=v;
 const pair=(v.before||[]).length||(v.after||[]).length?`<div class="cards"><div><b>Before</b>${(v.before||[]).map(x=>`<p class="was">${esc(cardWords(x))}</p>`).join('')||'<p class="was">Nothing</p>'}</div><div><b>After</b>${(v.after||[]).map(x=>`<p class="now">${esc(cardWords(x))}</p>`).join('')}</div></div>`:'';
 /* both takes open where the first changed card is, so the difference shows at once */
 const at=((v.after||[]).find(x=>x&&x.sec!=null)||{}).sec,hash=at!=null?'#t='+Math.max(0,Math.floor(at)):'';
 const takes=v.take?`<div class="takes"><figure><figcaption>Before</figcaption><video src="${esc((v.was||F.tell.film.film)+hash)}" controls playsinline preload="metadata"></video></figure><figure><figcaption>After</figcaption><video src="${esc(v.take+hash)}" controls playsinline preload="metadata"></video></figure></div>`:'';
 /* "Use this one" only for a take of one generation (drawn whole today, or every piece stamped); otherwise a plain first look */
 const use=v.take&&v.one_generation&&!v.applied?`<button class="btn bare use" data-use="${esc(v.mend)}">Use this one</button>`:v.applied?'<div class="ju">This take is the film now.</div>':v.take?'<div class="ju">A first look; the whole film is drawn again before you keep it.</div>':'';
 l.innerHTML=(v.said?`<div class="me">${esc(v.said)}</div>`:'')+`<div class="ju${v.state==='refused'||v.state==='failed'?' need':''}">${esc(v.say||'')}</div>`+(v.rule&&v.state==='done'?`<div class="ju">Kept for every film: ${esc(v.rule)}</div>`:'')+pair+takes+use;
 box.classList.toggle('wide',!!(pair||takes));l.scrollTop=l.scrollHeight};
F.tell.watch=()=>{if(F.tell.poll)F.tell.poll.stop();const f=F.tell.film;if(!f)return;
 F.tell.poll=JUJU.poll('/api/tap/films/'+encodeURIComponent(f.id)+'/mend',v=>{if(F.tell.film!==f)return false;F.tell.draw(v);return v.state==='running'},{every:3000,fail:()=>{}})};
F.head=c=>{if(!c)return;JUJU.chan(F.who(c));document.title='Juju · '+(document.body.dataset.title||'')};
/* the film player sheet: one film plays; its picture, its title and one action */
F.ago=t=>{if(!t)return'';const d=Date.now()/1000-t;return d<3600?Math.max(1,Math.round(d/60))+' min ago':d<86400?Math.round(d/3600)+' h ago':Math.round(d/86400)+' d ago'};
})();
