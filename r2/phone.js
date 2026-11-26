/* Juju on a phone, with the Mac off (docs/PHONE-CORE.md 4): loaded before api.js. A room's fetch('/api/...') is answered by Rust in
   this same process; the Door is reached by Rust, never by the room. In a browser there is no JujuPhone and every call goes over http. Pictures, the film and the
   thumbnail are not turned: the app answers those addresses itself, with Range. */
(()=>{
const real0=window.fetch.bind(window);
/* the Gate: a setup code field, only while someone's PIN is not set yet */
if(/\/gate\.html$/.test(location.pathname))document.addEventListener('DOMContentLoaded',()=>real0('/api/session').then(r=>r.json()).then(s=>{
 if(!(s.people||[]).some(p=>p.pin==='none'))return;const pin=document.getElementById('pin');if(!pin)return;
 const i=document.createElement('input');i.id='jujuCode';i.type='password';i.inputMode='numeric';i.autocomplete='off';i.placeholder='Setup code';i.setAttribute('aria-label','Setup code');
 i.style.cssText='display:block;margin:12px auto 0;width:200px;height:44px;padding:0 12px;background:transparent;border:2px solid var(--line,#333);color:var(--bone,#eee);font:600 16px "Josefin Sans",sans-serif;text-align:center';
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
