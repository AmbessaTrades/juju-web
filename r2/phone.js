/* Juju on a phone, with the Mac off (docs/PHONE-CORE.md 4): loaded before api.js. A room's fetch('/api/...') is answered by Rust in
   this same process; the Door is reached by Rust, never by the room. In a browser there is no JujuPhone and every call goes over http. Pictures, the film and the
   thumbnail are not turned: the app answers those addresses itself, with Range. */
(()=>{
const real0=window.fetch.bind(window);
/* the Gate: a setup code field, only while someone's PIN is not set yet */
if(/\/gate\.html$/.test(location.pathname))document.addEventListener('DOMContentLoaded',()=>real0('/api/session').then(r=>r.json()).then(s=>{
 if(!(s.people||[]).some(p=>p.pin==='none'))return;const pin=document.getElementById('pin');if(!pin)return;
 const i=document.createElement('input');i.id='jujuCode';i.type='text';i.inputMode='text';i.autocomplete='off';i.autocapitalize='characters';i.spellcheck=false;i.maxLength=8;i.placeholder='Setup code';i.setAttribute('aria-label','Setup code');
 i.style.cssText='display:block;margin:12px auto 0;width:200px;height:44px;padding:0 12px;background:transparent;border:2px solid var(--line,#333);color:var(--bone,#eee);font:600 16px "Josefin Sans",sans-serif;text-align:center';
 i.addEventListener('input',()=>{const v=i.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);if(v!==i.value)i.value=v;if(v.length===8)i.blur()});
 i.addEventListener('keydown',e=>{if(/^[0-9]$/.test(e.key)&&i.value.length>=8){e.preventDefault();i.blur()}});
 pin.after(i)}).catch(()=>{}));
/* the code rides with the first PIN, here and in the APK */
if(!window.JujuPhone)window.fetch=(what,o={})=>{const u=new URL(typeof what==='string'?what:what.url,location.href);
 if(u.pathname==='/api/session/pin'&&typeof o.body==='string'){try{const b=JSON.parse(o.body),c=document.getElementById('jujuCode');if(c&&c.value.trim())b.code=c.value.trim();o=Object.assign({},o,{body:JSON.stringify(b)})}catch(e){}}
 return real0(what,o)};
})();
(()=>{
const P=window.JujuPhone;if(!P)return;
const wait=new Map;let n=Math.floor(Math.random()*1e9); /* a reply meant for the room before this one finds nobody here */
window.JujuReply=(id,status,body)=>{const w=wait.get(id);if(w){wait.delete(id);w(status,body)}};
const real=window.fetch.bind(window);
/* Reads are answered at the address itself (MainActivity.Client), writes by the bridge: a web view is given no body to pass on.
   api.js gives up on a call after 8 s for a network that went away. There is no network here, so that clock is not passed on:
   a cold start on a busy phone took longer, and the name of the person never came (24 Nov, emulator). */
window.fetch=(what,o={})=>{
 const u=new URL(typeof what==='string'?what:what.url,location.href),method=(o.method||'GET').toUpperCase();
 if(u.origin!==location.origin||!u.pathname.startsWith('/api/'))return real(what,o);
 if(method==='GET'){const {signal,...rest}=o;return real(what,rest)}
 let body=typeof o.body==='string'?o.body:'';
 /* the first PIN of a person is set through the Door with Ambi's setup code (docs/PHONE-CORE.md 3): the Gate has no field for it, so it is added here */
 if(u.pathname==='/api/session/pin'){try{const b=JSON.parse(body||'{}'),c=document.getElementById('jujuCode');if(c&&c.value.trim())b.code=c.value.trim();body=JSON.stringify(b)}catch(e){}}
 return new Promise(ok=>{const id=++n;
  wait.set(id,(status,body)=>ok(new Response(status===204||status===304?null:body,{status:status<200?500:status,headers:{'Content-Type':'application/json'}})));
  P.call(id,method,u.pathname+u.search,body)})};

/* a saved thumbnail goes to Pictures: the web view has no downloads of its own */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[download]');if(!a||!a.href.startsWith('blob:'))return;e.preventDefault();
 real(a.href).then(r=>r.blob()).then(b=>{const f=new FileReader;f.onload=()=>P.save(a.download,String(f.result).split(',')[1]);f.readAsDataURL(b)})},true);
const keep=HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){this.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return}return keep.call(this)};
/* a slow press on a button is a press, not a selection of its word */
document.addEventListener('DOMContentLoaded',()=>document.head.insertAdjacentHTML('beforeend','<style>button,.btn,a,nav,summary{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}</style>'));
})();
/* One unit, one version (lead, 26 Nov): rooms, this shim, the engine and the Door contract ship together. On open and every 6 hours
   the room asks /api/update. A newer version slides up a sheet; closed, it comes back on the next open and stays as a row in the Mojo Bag.
   The phone downloads the APK, checks it and opens Android's installer; the web takes the new files and reloads. A film being made holds it. */
(()=>{
if(/\/gate\.html$/.test(location.pathname))return;
const P=window.JujuPhone,esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let U=null,shown=false,timer=null;
const css=document.createElement('style');css.textContent=`
#jujuUpdate .lines{margin:8px 0 16px;color:var(--bone);font:400 15px/1.45 "Lato",sans-serif}#jujuUpdate .lines p{margin:0 0 6px}
#jujuUpdate .say{min-height:20px;margin-top:10px;color:var(--need);font:600 14px/1.35 "Josefin Sans",sans-serif}
#jujuUpdate .bar{height:6px;margin-top:10px;background:var(--line,#333)}#jujuUpdate .bar i{display:block;height:100%;width:0;background:var(--act,#4fd1a5)}
.juju-ver{margin:14px 0 0;color:var(--ash,#8a8f98);font:400 12px/1.3 "JetBrains Mono",monospace;text-align:center}
.juju-ver.ready{color:var(--need)} #mojo .row.juju-upd{width:100%;margin-top:10px}`;
document.head.append(css);
async function check(){try{const r=await fetch('/api/update',{cache:'no-store'});if(!r.ok)return;U=await r.json()}catch(e){return}
 foot();if(U.newer&&!shown&&!(sessionStorage.getItem('juju.upd.closed')===U.latest.version)){shown=true;sheet()}}
function foot(){const m=document.getElementById('mojo');if(!m||!U)return;let f=m.querySelector('.juju-ver');if(!f){f=document.createElement('p');f.className='juju-ver';m.append(f)}
 const core=U.core?' · engine '+String(U.core).slice(0,7):'';f.textContent='Juju '+U.version+core+(U.newer||U.core_old?' · update ready':'');f.classList.toggle('ready',!!(U.newer||U.core_old));
 let b=m.querySelector('.juju-upd');if(U.newer&&!b){b=document.createElement('button');b.className='btn row juju-upd';b.textContent='Update to '+U.latest.version;b.addEventListener('click',()=>{if(window.Kit)Kit.sheet('mojo').close();sheet()});f.before(b)}}
function sheet(){
 let s=document.getElementById('jujuUpdate');
 if(!s){document.body.insertAdjacentHTML('beforeend',`<section class="sheet" id="jujuUpdate" hidden aria-labelledby="jujuUpdT"><h3 id="jujuUpdT"></h3><button class="x btn bare" data-close aria-label="Close">×</button><div class="lines"></div><button class="btn primary" id="jujuUpdGo">Update</button><div class="bar" hidden><i></i></div><p class="say" aria-live="polite"></p></section>`);
  s=document.getElementById('jujuUpdate');
  s.querySelector('[data-close]').addEventListener('click',()=>{try{sessionStorage.setItem('juju.upd.closed',U.latest.version)}catch(e){}});
  document.getElementById('jujuUpdGo').addEventListener('click',go)}
 s.querySelector('h3').textContent='Juju '+U.latest.version+' is ready';
 s.querySelector('.lines').innerHTML=(U.latest.notes||[]).slice(0,3).map(l=>'<p>'+esc(l)+'</p>').join('');
 if(window.Kit&&Kit.sheet)Kit.sheet('jujuUpdate').open();else s.hidden=false}
async function go(){
 const s=document.getElementById('jujuUpdate'),say=t=>{s.querySelector('.say').textContent=t},btn=document.getElementById('jujuUpdGo');
 if(!P){btn.disabled=true;say('Updating…');try{const r=await navigator.serviceWorker.getRegistration();if(r)await r.update()}catch(e){}setTimeout(()=>location.reload(),600);return}
 // the phone: never while a film is being made
 try{const v=await (await fetch('/api/update',{cache:'no-store'})).json();if(v.making){say('Juju updates when the film being made is done');setTimeout(go,20000);return}}catch(e){}
 btn.disabled=true;s.querySelector('.bar').hidden=false;P.update(U.latest.apk_url,U.latest.apk_sha256);
 clearInterval(timer);timer=setInterval(()=>{let st={};try{st=JSON.parse(P.updateState()||'{}')}catch(e){}
  s.querySelector('.bar i').style.width=(st.pct||0)+'%';
  if(st.state==='downloading')say('Downloading '+(st.pct||0)+'%');
  else if(st.state==='installing'){say('Android asks you to install it');clearInterval(timer);btn.disabled=false}
  else if(st.state==='allow'){say('Allow Juju to install updates: Settings › Apps › Juju › Install unknown apps › Allow. Then tap Update again.');clearInterval(timer);btn.disabled=false}
  else if(st.state==='failed'){say(st.say||'The download failed. Try again on Wi-Fi.');clearInterval(timer);btn.disabled=false}},500)}
document.addEventListener('DOMContentLoaded',()=>{check();setInterval(check,6*3600e3);
 new MutationObserver(()=>{const m=document.getElementById('mojo');if(m&&!m.querySelector('.juju-ver'))foot()}).observe(document.body,{childList:true,subtree:true})});
})();
