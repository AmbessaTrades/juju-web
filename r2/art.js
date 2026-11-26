/* Juju art, round 2. The ONE hand for every drawn thing. Rooms compose from here and draw nothing of their own.
   How it draws: every object is a real solid, rendered once in build/ (numpy, lit from the upper left, shadow and
   engraving included) into skin-neutral light maps (light.js). Here a flat skin colour is laid through the object's
   shape and the light map on top, so all four skins switch and the light stays true.
   Colour is state, the same everywhere: dim = asleep or absent, bone = it exists, gold (need) = it wants a person,
   jade (work) = running by itself or money that is there, ember (stop) = locked, stopped or refused. One glow per room.
   Every function returns an SVG string. Read PARTS.md for which to use where.

   Art.jar({state,label,near,size,badge})    a channel. asleep | needs | working | done | stopped | new.  near: 'l'|'r' lit by a neighbour. badge:'large' = the big done seal
   Art.wallet({mind,state,level})      one mind's money. mind: tongue pigment elder griot scribe watcher. state: asleep | ok | low | locked
   Art.tree({boughs,focus})            the channel tree. bough: {state:'bare'|'bud'|'bloom'|'gold'|'prune', flowers:['2.1x',...], check:true = a check in the badge (kept)}
   Art.seal({state,emblem})            wax: blank | pressed | live | void
   Art.knob({value,state}) Art.effort(i)   a turned setting; the three-step effort knob
   Art.sound({state,seed,progress})    gong and waveform: empty | made | playing | kept | rejected      Art.wave({...}) waveform alone
   Art.voice({state})                  horn: none | standin | chosen | speaking
   Art.chest({state})                  companion product: asleep | wanted | ready | live
   Art.lock({locked})                  the spending lock
   Art.emblem(name) Art.medal(name,{state}) Art.glyph(name) Art.pip({state}) Art.path(states) Art.plate({w,h,state}) Art.cardback() Art.cat()
*/
(()=>{
const J=window.JujuLight||{img:{},meta:{}},M=J.meta,IMG=J.img;
let N=0;const uid=p=>'a'+p+(++N);
const r=n=>Math.round(n*10)/10;
const svg=(vb,body,cls,o={})=>`<svg class="art ${cls||''}" viewBox="${vb}" ${o.size?`width="${o.size}"`:''} ${o.ar?`preserveAspectRatio="${o.ar}"`:''} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const rnd=(s,i)=>{const x=Math.sin(s*127.1+i*311.7)*43758.5453;return x-Math.floor(x)};
const pt=(cx,cy,R,deg)=>{const t=deg*Math.PI/180;return [r(cx+Math.cos(t)*R),r(cy+Math.sin(t)*R)]};
const arc=(cx,cy,R,a0,a1)=>{const p=pt(cx,cy,R,a0),q=pt(cx,cy,R,a1);return `M${p[0]} ${p[1]}A${R} ${R} 0 ${Math.abs(a1-a0)>180?1:0} ${a1>a0?1:0} ${q[0]} ${q[1]}`};
const loz=(x,y,s)=>`M${r(x)} ${r(y-s*1.25)}L${r(x+s)} ${r(y)}L${r(x)} ${r(y+s*1.25)}L${r(x-s)} ${r(y)}Z`;
const CHECK=(x,y,s)=>`M${r(x-4.2*s)} ${r(y+.2*s)}l${r(2.9*s)} ${r(2.9*s)} ${r(5.4*s)}-${r(6*s)}`;
const V={lit:'var(--obj-lit)',dim:'var(--obj-dim)',metal:'var(--metal)',need:'var(--need)',work:'var(--work)',stop:'var(--stop)',line:'var(--a-line)',hot:'var(--hot)',rim:'var(--rimc)',deep:'var(--a-deep)',wax:'var(--wax)'};

/* ---------- the sprite: every light map is defined once, every use is a <use> ---------- */
function sprite(){if(document.getElementById('juju-light'))return;
 let d='';for(const k in IMG){const m=M[k]||[100,100];d+=`<image id="L-${k}" href="${IMG[k]}" width="${m[0]}" height="${m[1]}" preserveAspectRatio="none"/>`;d+=`<mask id="K-${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${m[0]}" height="${m[1]}"><use href="#L-${k}"/></mask>`}
 document.body.insertAdjacentHTML('afterbegin',`<svg id="juju-light" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true"><defs>${d}</defs></svg>`)}
const has=k=>!!IMG[k];
const size=k=>M[k]||[100,100];
/* a lit object: flat colour through its shape, its light on top, then the cool rim from behind */
function lit(k,fill,o={}){const[w,h]=size(k);let s=`<rect width="${w}" height="${h}" fill="${fill}" mask="url(#K-${k}-a)"/><use href="#L-${k}"${o.op?` opacity="${o.op}"`:''}/>`;
 if(has(k+'-rim')&&o.rim!==false)s+=`<rect width="${w}" height="${h}" fill="${V.rim}" mask="url(#K-${k}-rim)" opacity="${o.rimop||.55}"/>`;return s}
const tint=(k,fill,op=1)=>{const[w,h]=size(k);return `<rect width="${w}" height="${h}" fill="${fill}" mask="url(#K-${k})" opacity="${op}"/>`};
const at=(x,y,s,body)=>`<g transform="translate(${r(x)} ${r(y)}) scale(${s})">${body}</g>`;
/* a flipbook: frames side by side in one map, stepped by CSS (.flip) */
function flip(k,o={}){const m=M[k]||[1500,230,10],fw=m[0]/m[2],fh=m[1],id=uid('f');
 const body=o.fill?`<rect width="${m[0]}" height="${fh}" fill="${o.fill}" mask="url(#K-${k})"/>`:`<use href="#L-${k}"/>`;
 return `<svg x="${r(o.x)}" y="${r(o.y)}" width="${r(o.w)}" height="${r(o.w*fh/fw)}" viewBox="0 0 ${fw} ${fh}" overflow="hidden"><g class="flip" style="--fw:${fw}px;--n:${m[2]};animation-duration:${o.dur||1}s;animation-delay:${o.delay||0}s">${body}</g></svg>`}
const halo=(id,col,a)=>`<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset=".42" stop-color="${col}" stop-opacity="${r(a*.36*100)/100}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;

/* ---------- a channel: the jar ----------
   asleep  = hat lid on, slate. Nothing waits, nothing runs.
   needs   = lid off, a gold flame in its mouth that lights its own shoulders. It is calling a person.
   working = lid off, jade vapour rising, jade light inside. It is making something by itself.
   done    = lid on, bone, a jade wax seal on its belly. Something finished waits to be looked at.
   stopped = lid on, an ember cord and seal across the neck. It was stopped or is locked.
   new     = no body, only the glass ghost of one and a plus. A channel can be opened here. */
function jar(o={}){const st=o.state||'asleep',jm=M.jar||{mouth:[210,200],belly:[210,485],base:[210,707],rx:90},W=420,H=770,top=-120,id=uid('j');
 const vb=`0 ${top} ${W} ${H-top}`;let s='';const [mx,my]=jm.mouth,[bx,by]=jm.belly,base=jm.base[1];
 const shadow=`<ellipse cx="${bx+16}" cy="${base+2}" rx="168" ry="20" fill="#000" opacity=".55"/><ellipse cx="${bx+6}" cy="${base}" rx="118" ry="12" fill="#000" opacity=".5"/>`;
 if(st==='new'){s+=`<ellipse cx="${bx}" cy="${base+2}" rx="130" ry="15" fill="none" stroke="${V.line}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>`+tint('jar-ghost',V.lit,.8)+`<g class="plus"><circle cx="${bx}" cy="${by-10}" r="58" fill="var(--card)" stroke="${V.lit}" stroke-width="6"/><path d="M${bx} ${by-40}v60M${bx-30} ${by-10}h60" stroke="${V.lit}" stroke-width="11" stroke-linecap="round"/></g>`;
  return svg(vb,s,'jar new',o)}
 const open=st==='needs'||st==='working',k=open?'jar-open':'jar-shut',fill=st==='asleep'?V.dim:V.lit;
 if(st==='needs')s+=`<defs>${halo(id+'h','#F5B942',.55)}${halo(id+'g','#F5B942',.45)}</defs><circle class="halo" cx="${mx}" cy="${my-70}" r="250" fill="url(#${id}h)"/><ellipse cx="${bx}" cy="${base+4}" rx="210" ry="30" fill="url(#${id}g)"/>`;
 if(st==='working')s+=`<defs>${halo(id+'h','var(--work)',.30)}</defs><circle class="halo" cx="${mx}" cy="${my-90}" r="210" fill="url(#${id}h)"/>`;
 s+=shadow+lit(k,fill,{rimop:st==='asleep'?.45:.5});
 if(o.near)s+=`<g ${o.near==='r'?`transform="translate(${W} 0) scale(-1 1)"`:''}>${tint('jar-near','#F5B942',st==='asleep'?.42:.32)}</g>`;
 if(o.label){const L=String(o.label),fs=L.length>2?62:80;s+=`<g font-family="'Spectral SC',serif" font-weight="600" font-size="${fs}" text-anchor="middle" letter-spacing="2"><text x="${bx+2.5}" y="${by+fs*.36+2.5}" fill="#fff" opacity="${st==='asleep'?.12:.4}">${L}</text><text x="${bx}" y="${by+fs*.36}" fill="#0B0E12" opacity="${st==='asleep'?.7:.74}">${L}</text></g>`}
 if(st==='needs')s+=tint('jar-open-fire','#FFC560',.95)+`<g class="sparks" fill="${V.need}"><path d="${loz(mx-66,my-176,6)}"/><path d="${loz(mx+74,my-120,4.5)}"/><path d="${loz(mx+40,my-226,3.6)}"/></g>`+flip('flame',{x:mx-92,y:my-238,w:184,dur:1.1});
 if(st==='working')s+=tint('jar-open-fire','var(--work)',.8)+`<ellipse cx="${mx}" cy="${my+3}" rx="${jm.rx*.82}" ry="13" fill="var(--work)" opacity=".55"/>`+flip('vapour',{x:mx-92,y:my-236,w:184,fill:'var(--work)',dur:1.5});
 /* badge:'large' (opt-in): the jade seal is pressed big and low on the belly with a heavy check, so done never reads as asleep */
 if(st==='done'&&o.badge==='large')s+=`<ellipse cx="${bx+36}" cy="${by+214}" rx="92" ry="16" fill="#000" opacity=".45"/>`+at(bx+24-104,by+122-104,.8,lit('seal','var(--work)',{rim:false})+`<path d="${CHECK(130,130,10)}" fill="none" stroke="#04130E" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/><path d="${CHECK(132,133,10)}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/>`);
 else if(st==='done')s+=at(bx+70,by+60,.46,lit('seal','var(--work)',{rim:false}))+`<path d="${CHECK(bx+70+60,by+60+60,4.2)}" fill="none" stroke="#04130E" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".7" transform="translate(-0 0)"/>`;
 if(st==='stopped'){s+=`<path d="M${mx-132} ${my+52}Q${mx} ${my+84} ${mx+132} ${my+52}" fill="none" stroke="var(--stop-lo)" stroke-width="14" stroke-linecap="round"/><path d="M${mx-132} ${my+48}Q${mx} ${my+80} ${mx+132} ${my+48}" fill="none" stroke="${V.stop}" stroke-width="8" stroke-linecap="round"/>`+at(mx-46,my+44,.36,lit('seal','var(--stop)',{rim:false}))}
 return svg(vb,s,'jar '+st,o)}

/* ---------- a wallet: one mind's money, as liquid standing in its own glass ----------
   All six glasses share one floor and one brim, so levels compare across them. The shape says which mind it is.
   asleep = stopper on, glass dark, metal dim, nothing inside: no key, no money yet. ok = jade liquid. low = gold liquid,
   under three days of films. locked = an ember seal over the stopper: spending is locked. */
const MINDS=['tongue','pigment','elder','griot','scribe','watcher'];
function wallet(o={}){const mind=o.mind||'tongue',st=o.state||'asleep',F=(M.flask||{})[mind];if(!F)return '';
 const lv=st==='asleep'?0:Math.max(0,Math.min(1,o.level||0)),id=uid('w'),cx=F.x,y0=F.y0,y1=F.y1,n=F.r.length,R=i=>F.r[i],Y=i=>y0+(y1-y0)*i/(n-1);
 let L='',Rt='';for(let i=0;i<n;i++){L+=(i?'L':'M')+r(cx-R(i))+' '+r(Y(i));Rt=`L${r(cx+R(i))} ${r(Y(i))}`+Rt}const inner=L+Rt+'Z';
 const ly=y0+(y1-y0)*lv,li=Math.min(n-1,Math.round(lv*(n-1))),lr=R(li),liq=st==='low'?'var(--need)':'var(--work)';
 const metal=st==='asleep'?V.dim:V.metal;let s=`<defs><clipPath id="${id}"><path d="${inner}"/></clipPath><linearGradient id="${id}b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient></defs>`;
 s+=`<ellipse cx="${cx+10}" cy="${F.foot+4}" rx="130" ry="13" fill="#000" opacity=".55"/>`;
 s+=`<path d="${inner}" fill="var(--a-well)"/><path d="${inner}" fill="url(#${id}b)"/>`;
 // quarter marks, on the glass, the same for every mind
 let tk='';[0,.25,.5,.75,1].forEach(t=>{const y=y0+(y1-y0)*t,big=t===0||t===.5||t===1;tk+=`<path d="M${cx-8} ${r(y)}h${big?16:9}" />`});
 if(lv>0){s+=`<g clip-path="url(#${id})"><g class="rise"><rect x="0" y="${r(ly)}" width="340" height="${r(y0-ly+4)}" fill="${liq}"/><svg x="0" y="0" width="340" height="520" viewBox="0 0 340 520"><defs><clipPath id="${id}c"><rect x="0" y="${r(ly)}" width="340" height="520"/></clipPath></defs><use href="#L-fl-${mind}-liq" clip-path="url(#${id}c)"/></svg>`+
  `<ellipse cx="${cx}" cy="${r(ly)}" rx="${r(lr)}" ry="${r(lr*F.e+1.5)}" fill="var(--hot)" opacity=".5"/><ellipse cx="${cx}" cy="${r(ly+1.5)}" rx="${r(lr-3)}" ry="${r(lr*F.e)}" fill="${liq}"/>`+
  `<g fill="var(--hot)" opacity=".55"><circle cx="${cx-lr*.3}" cy="${r(Math.min(y0-14,ly+40))}" r="3"/><circle cx="${cx+lr*.15}" cy="${r(Math.min(y0-22,ly+70))}" r="2.2"/><circle cx="${cx-lr*.05}" cy="${r(Math.min(y0-9,ly+18))}" r="1.8"/></g></g></g>`}
 else s+=`<path d="M${cx-R(0)*.7} ${r(y0-6)}H${cx+R(0)*.7}" stroke="${V.line}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>`;
 s+=`<g stroke="${lv>0?'var(--hot)':V.line}" stroke-width="3" stroke-linecap="round" opacity="${lv>0?.55:.8}">${tk}</g>`;
 s+=`<use href="#L-fl-${mind}-glass" opacity="${st==='asleep'?.42:.9}"/>`+lit(`fl-${mind}-metal`,metal,{rim:false});
 if(st==='locked')s+=at(cx-40,F.knob-26,.31,lit('seal','var(--stop)',{rim:false}));
 return svg('0 0 340 520',s,'wallet '+mind+' '+st,o)}

/* ---------- the channel tree ----------
   Five strands rise from five roots, twist into one trunk and open as five boughs: one bough per kind of choice
   (titles, thumbnails, story shapes, design layers, the offering). A jade blossom is a film that beat the channel's
   usual views (its number is the real multiple). Gold = the same choice won five times and is kept. A bone bud is made but
   not proven. A bare bough has nothing yet. An ember cut marks a bough to prune. focus = the bough you picked. */
function tree(o={}){const T=M.tree;if(!T)return '';const B=o.boughs||[{},{},{},{},{}],id=uid('t');let back='',wood='',leaf='',sap='',fl='';
 back+=`<defs>${halo(id+'j','var(--work)',.42)}${halo(id+'r','#7FA9C9',.10)}<filter id="${id}f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs><ellipse cx="560" cy="380" rx="560" ry="360" fill="url(#${id}r)"/><ellipse cx="566" cy="826" rx="330" ry="26" fill="#000" opacity=".5"/>`;
 B.forEach((b,i)=>{const st=b.state||'bare',live=st!=='bare'&&st!=='prune',[x0,y0,w,h]=T.leaf[i];
  wood+=`<rect width="1120" height="840" fill="${live?'var(--wood)':V.dim}" mask="url(#K-tree-w${i}-a)"/>`;
  if(live){leaf+=`<g transform="translate(${x0} ${y0})"><rect width="${w}" height="${h}" fill="${st==='bud'?'var(--leaf-dim)':'var(--leaf)'}" mask="url(#K-tree-l${i}-a)"/><use href="#L-tree-l${i}"/></g>`;
   const P=T.sap[i],d='M'+P.map(p=>p.join(' ')).join('L'),col=st==='gold'?'var(--keep)':st==='bud'?'var(--obj-lit)':'var(--work)';
   sap+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".45" filter="url(#${id}f)"/><path class="sap" d="${d}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>`}
  const sl=T.slots[i],fs=(b.flowers||[]).slice(0,3);
  if(st==='bloom'||st==='gold')fs.forEach((t,j)=>{const[x,y]=sl[j],sc=j?.46:.62,col=st==='gold'?'var(--keep)':'var(--work)';
   
   const fid=id+'b'+i+j;fl+=`<g class="flower"><defs><radialGradient id="${fid}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="${x}" cy="${y}" r="${j?40:56}" fill="${col}" opacity=".45" filter="url(#${id}f)"/>${at(x-110*sc,y-110*sc,sc,lit('bloom',col,{rim:false})+`<circle cx="110" cy="110" r="96" fill="url(#${fid})" mask="url(#K-bloom-a)" style="mix-blend-mode:screen"/>`)}${Array.from({length:9},(_,q)=>{const p=pt(x,y,(26+(q%2)*6)*sc,q*40-90);return `<circle cx="${p[0]}" cy="${p[1]}" r="${r(4.2*sc+1)}" fill="${st==='gold'?'#7A4A08':'#FFF4D6'}"/>`}).join('')}<g ${b.check?'class="chk" ':''}transform="translate(${r(x+(j?30:40))} ${r(y+(j?30:40))})"><circle r="${j?19:23}" fill="#0A0D11" stroke="${col}" stroke-width="2.5"/>${b.check?`<path d="${CHECK(0,3,j?1.9:2.3)}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`:`<text y="${j?6:7}" text-anchor="middle" font-family="'Spectral SC',serif" font-weight="600" font-size="${j?16:19}" fill="var(--bone-fixed)">${t}</text>`}</g></g>`});
  if(st==='bud')sl.forEach(([x,y],j)=>{fl+=`<circle cx="${x}" cy="${y}" r="${j?8:11}" fill="var(--obj-lit)" stroke="#0A0D11" stroke-width="3"/><circle cx="${x-2.5}" cy="${y-2.5}" r="${j?2.5:3.5}" fill="#fff" opacity=".7"/>`});
  if(st==='prune'){const P=T.sap[i],p=P[Math.floor(P.length*.66)],q=P[Math.floor(P.length*.66)+1]||P[P.length-1],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*26,ny=dx/l*26;fl+=`<path d="M${r(p[0]+nx)} ${r(p[1]+ny)}L${r(p[0]-nx)} ${r(p[1]-ny)}" stroke="var(--stop-lo)" stroke-width="13" stroke-linecap="round"/><path d="M${r(p[0]+nx)} ${r(p[1]+ny)}L${r(p[0]-nx)} ${r(p[1]-ny)}" stroke="${V.stop}" stroke-width="7" stroke-linecap="round"/>`}
  if(o.focus===i){const[x,y]=sl[0];fl+=`<circle class="ring" cx="${x}" cy="${y}" r="74" fill="none" stroke="${V.need}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>`}});
 const vb=o.focus!=null&&o.zoom?(()=>{const[x,y]=T.slots[o.focus][0];return `${Math.max(0,Math.min(1120-560,x-280))} ${Math.max(0,y-190)} 560 420`})():'0 0 1120 840';
 return svg(vb,back+wood+`<use href="#L-tree-wood"/><rect width="1120" height="840" fill="${V.rim}" mask="url(#K-tree-rim)" opacity=".55"/>`+sap+leaf+fl,'tree',o)}

/* ---------- wax seal ----------
   blank = an empty ring where a seal will go: nothing agreed. pressed = bone wax: done by you. live = jade wax: it is out
   in the world (on YouTube) or the spend is sealed and running. void = ember wax struck through: stopped. */
function seal(o={}){const st=o.state||'blank';let s='';
 if(st==='blank')return svg('0 0 260 260',`<circle cx="130" cy="130" r="100" fill="none" stroke="${V.line}" stroke-width="5" stroke-dasharray="3 13" stroke-linecap="round"/><circle cx="130" cy="130" r="70" fill="none" stroke="${V.line}" stroke-width="2.5" opacity=".6"/>`,'seal blank',o);
 const col=st==='live'?'var(--work)':st==='void'?'var(--stop)':'var(--wax)';
 s=`<ellipse cx="140" cy="150" rx="118" ry="112" fill="#000" opacity=".35"/>`+lit('seal',col,{rim:false});
 const ink=st==='live'?'#04130E':st==='void'?'#2A0509':'#1A1610';
 if(o.emblem)s+=`<g transform="translate(82 82) scale(2)" color="${ink}" opacity=".78">${(EMB[o.emblem]||EMB.pact)()}</g>`;
 else s+=`<path d="${CHECK(130,130,10)}" fill="none" stroke="${ink}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity=".72"/><path d="${CHECK(132,133,10)}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".25"/>`;
 if(st==='void')s+=`<path d="M40 214L222 40" stroke="var(--stop-lo)" stroke-width="16" stroke-linecap="round"/><path d="M40 210L222 36" stroke="var(--stop-hi)" stroke-width="5" stroke-linecap="round"/>`;
 return svg('0 0 260 260',s,'seal '+st,o)}

/* ---------- a turned setting ----------
   The jade arc is how far it is turned. held = gold: your hand is on it. off = dim: not used in this film. */
function knob(o={}){const v=Math.max(0,Math.min(1,o.value==null?.5:o.value)),st=o.state||'set',a0=135,a1=405,a=a0+(a1-a0)*v,col=st==='off'?V.dim:st==='held'?V.need:'var(--work)';
 let t='';const n=o.stops||10;for(let i=0;i<=n;i++){const d=a0+(a1-a0)*i/n,big=o.stops?true:i%5===0,p=pt(130,130,big?112:116,d),q=pt(130,130,126,d);t+=`<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}" stroke="${d<=a+.1&&st!=='off'?col:V.line}" stroke-width="${big?5:3}" stroke-linecap="round"/>`}
 const tip=pt(130,130,70,a),base=pt(130,130,40,a);
 return svg('0 0 260 260',`${t}<path d="${arc(130,130,101,a0,a1)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>${v>0?`<path d="${arc(130,130,101,a0,a)}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`:''}<ellipse cx="142" cy="146" rx="86" ry="86" fill="#000" opacity=".5"/>${at(42,42,176/260,lit('knob',st==='off'?V.dim:V.metal,{rim:false}))}<path d="M${base[0]} ${base[1]}L${tip[0]} ${tip[1]}" stroke="#0A0D11" stroke-width="13" stroke-linecap="round"/><path d="M${base[0]} ${base[1]}L${tip[0]} ${tip[1]}" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`,'knob '+st,o)}

/* ---------- a sound: the gong it rings, and its waveform ----------
   empty = a dotted line, no gong: nothing made. made = bone bars: it exists, hear it. playing = jade up to the playhead,
   the gong rings. kept = bone bars, the gong carries a check. rejected = dim bars struck in ember. */
function waveBody(o,x0,y0,w,h){const st=o.state||'made',seed=o.seed||1,n=Math.floor(w/6),mid=y0+h/2,pr=o.progress==null?.42:o.progress;
 if(st==='empty')return `<path d="M${x0} ${mid}H${x0+w}" stroke="${V.line}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
 let a='',b='';for(let i=0;i<n;i++){const env=Math.sin(Math.PI*(i+.5)/n)**.5,amp=Math.max(2.2,(.2+.8*rnd(seed,i))*env*h/2*(.5+.5*Math.sin(i*.42+seed)**2)),p=`M${r(x0+i*6)} ${r(mid-amp)}h3.6v${r(amp*2)}h-3.6Z`;if(st==='playing'&&i/n<pr)a+=p;else b+=p}
 let s=`<path d="${b}" fill="${st==='rejected'?V.dim:st==='playing'?'var(--a-line)':V.lit}"/>`;
 if(st==='playing'){const px=x0+w*pr;s+=`<path d="${a}" fill="var(--work)"/><path d="M${r(px)} ${y0-4}V${y0+h+4}" stroke="var(--work)" stroke-width="2"/><path d="${loz(px,y0-6,5)}" fill="var(--work)"/>`}
 if(st==='rejected')s+=`<path d="M${x0-2} ${mid+8}L${x0+w+2} ${mid-12}L${x0+w+2} ${mid-6}L${x0-2} ${mid+14}Z" fill="${V.stop}"/>`;return s}
const wave=(o={})=>svg('-4 -8 408 96',waveBody(o,0,0,400,80),'wave '+(o.state||'made'),o);
function sound(o={}){const st=o.state||'made';let g='';
 if(st==='empty')g=`<circle cx="60" cy="64" r="44" fill="none" stroke="${V.line}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
 else{g=`<path d="M22 12H98" stroke="var(--metal)" stroke-width="6" stroke-linecap="round"/><path d="M38 14L46 26M82 14L74 26" stroke="${V.line}" stroke-width="3"/>`+at(10,14,100/240,lit('gong',st==='rejected'?V.dim:st==='playing'?'var(--work)':V.metal,{rimop:.4}));
  if(st==='kept')g+=`<path d="${CHECK(60,64,4.4)}" fill="none" stroke="#0A0D11" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
  if(st==='playing')g+=`<g class="ringing" fill="none" stroke="var(--work)" stroke-width="3" stroke-linecap="round"><path d="${arc(60,64,58,150,210)}"/><path d="${arc(60,64,58,-30,30)}"/><path d="${arc(60,64,68,160,200)}" opacity=".5"/><path d="${arc(60,64,68,-20,20)}" opacity=".5"/></g>`}
 return svg('0 0 560 128',g+waveBody(o,150,24,400,80),'sound '+st,o)}

/* ---------- the voice: a horn, never a face ----------
   none = a dotted outline: no voice chosen. standin = a dim horn: the silent stand-in used for timing, it costs nothing.
   chosen = a lit horn, still: this voice is set. speaking = jade waves moving: you are hearing it. */
function voice(o={}){const st=o.state||'none';
 if(st==='none')return svg('0 0 520 340',`<g opacity=".55">${tint('horn-a',V.line,.14)}${tint('horn-rim',V.line,1)}</g>`,'voice none',o);
 const col=st==='standin'?V.dim:V.metal,wc=st==='speaking'?'var(--work)':V.line;
 return svg('0 0 520 340',`<ellipse cx="200" cy="300" rx="160" ry="14" fill="#000" opacity=".45"/>`+lit('horn',col)+`<g class="waves" fill="none" stroke="${wc}" stroke-width="7" stroke-linecap="round" ${st==='standin'?'stroke-dasharray="2 14"':''}><path d="${arc(360,150,70,-36,36)}"/><path d="${arc(360,150,112,-36,36)}"/><path d="${arc(360,150,154,-36,36)}"/></g>`,'voice '+st,o)}

/* ---------- the companion product: a chest ----------
   asleep = shut, dim: nobody asked. wanted = shut, gold sparks over it: viewers asked, it wants you. ready = shut, lit,
   tied with a cord: built, not on sale. live = lid open, jade light inside: on sale now. */
function chest(o={}){const st=o.state||'asleep',open=st==='live',k=open?'chest-open':'chest-shut',id=uid('c');let s=`<ellipse cx="210" cy="345" rx="190" ry="22" fill="#000" opacity=".5"/>`;
 if(open)s=`<defs>${halo(id,'var(--work)',.5)}</defs><circle class="halo" cx="200" cy="150" r="200" fill="url(#${id})"/>`+s;
 s+=lit(k,st==='asleep'||st==='wanted'?V.dim:V.metal);
 if(open)s+=tint('chest-open-fire','var(--work)',.85);
 if(st==='ready')s+=`<path d="M196 118C200 190 204 260 208 330" fill="none" stroke="var(--stop-lo)" stroke-width="12" stroke-linecap="round"/><path d="M196 114C200 186 204 256 208 326" fill="none" stroke="var(--wax)" stroke-width="6" stroke-linecap="round"/>`+at(168,200,.26,lit('seal','var(--wax)',{rim:false}));
 if(st==='wanted')s+=`<g class="sparks" fill="${V.need}"><path d="${loz(130,40,8)}"/><path d="${loz(210,14,10)}"/><path d="${loz(282,52,6)}"/></g>`;
 return svg('0 0 400 400',s,'chest '+st,o)}

/* the spending lock: shut and ember = locked, nothing can spend. open and lit = spending may happen. */
function lock(o={}){const on=!!o.locked;return svg('0 0 200 260',`<ellipse cx="108" cy="236" rx="80" ry="10" fill="#000" opacity=".5"/>`+lit(on?'lock-shut':'lock-open',on?'var(--stop)':V.metal,{rim:false}),'lock '+(on?'on':'off'),o)}

/* ---------- emblems: small, exact, solid with cuts (48 grid). Room marks and the six minds. ---------- */
const E=(mass,cuts)=>{const id=uid('e');return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-2" y="-2" width="52" height="52"><rect x="-2" y="-2" width="52" height="52" fill="#fff"/><g fill="#000" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="0">${cuts||''}</g></mask><g mask="url(#${id})" fill="currentColor">${mass}</g>`};
const cut=(d,w)=>`<path d="${d}" fill="none" stroke-width="${w||1.8}"/>`;
const EMB={
 altar:()=>E('<path d="M24 1.5C26.6 9.4 33.2 13.2 32.2 20.6C31.4 26.4 16.6 26.4 15.8 20.6C15.1 15 19.4 13 21 8C22.3 10.6 23.5 9 24 1.5Z"/><path d="M4 29H44V34.5H4Z"/><path d="M12 34.5H36V41.5H12Z"/><path d="M6 41.5H42V47H6Z"/>','<path d="M24 13.6c1.3 3.3 3.7 3.9 3.4 6.9s-6.8 3-6.8 0 2.1-3.6 3.4-6.9Z"/>'),
 crossroads:()=>E('<path d="M21.5 3H26.5V43H21.5Z"/><path d="M26.5 7H38L44 12.5L38 18H26.5Z"/><path d="M21.5 21H10L4 26.5L10 32H21.5Z"/><path d="M12 47C14 41 34 41 36 47Z"/>',cut('M30 12.5H36M12 26.5H18')),
 cauldron:()=>E('<rect x="4" y="17" width="40" height="6.5" rx="3"/><path d="M7.5 23.5H40.5C44 33 37 44 24 44C11 44 4 33 7.5 23.5Z"/><path d="M13 41L9.5 47.5H15L17 43Z"/><path d="M35 41L38.5 47.5H33L31 43Z"/><circle cx="16.5" cy="10" r="3.6"/><circle cx="26.5" cy="5" r="2.8"/><circle cx="32.5" cy="12" r="2.4"/>','<path d="M11 28C10.5 33.5 13.5 38 18.5 40C15 37 13.5 32.5 14 28Z"/>'),
 tank:()=>E('<path d="M14 4H34V8H31V12C40 15 44 22 44 30C44 40 36 46 24 46C12 46 4 40 4 30C4 22 8 15 17 12V8H14Z"/>','<path d="M8 30.5C8 39 15 42.5 24 42.5S40 39 40 30.5Z"/>'+cut('M12 22H36',1.4)),
 gate:()=>E('<path d="M8 47V20C8 9 16 3 24 3C32 3 40 9 40 20V47Z"/>','<path d="M24 20a4 4 0 0 1 2.2 7.3L27.5 36H20.5L21.8 27.3A4 4 0 0 1 24 20Z"/>'+cut('M12.5 47V20C12.5 12 18 7.5 24 7.5',1.6)),
 vessel:()=>E('<path d="M24 2L31 12H17Z"/><path d="M12 13H36V15.5H12Z"/><path d="M18.5 15.5H29.5V19C35 21 41 25 41 33C41 41 34 46 24 46C14 46 7 41 7 33C7 25 13 21 18.5 19Z"/>',cut('M9 30Q24 34 39 30',1.6)+cut('M10 37.5Q24 41.5 38 37.5',1.6)),
 'new-vessel':()=>`<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="1 5.5" stroke-linecap="round"/><path d="M24 14V34M14 24H34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
 'mirror-bend':()=>E('<path d="M21 6V42L5 24Z"/><path d="M27 6L43 24L27 42Z"/>',cut('M31 15L39 24L31 33',1.6))+`<path d="M24 2V46" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3"/>`,
 'feed-sight':()=>E('<path d="M4 6H26V20H4ZM30 6H44V11H30ZM30 15H44V20H30ZM4 24H18V29H4ZM4 33H18V38H4ZM22 24H44V38H22ZM4 42H44V45H4Z"/>'),
 arcana:()=>E('<path d="M12 3H36L40 7V41L36 45H12L8 41V7Z"/>',`<path d="${loz(24,24,7)}"/>`+cut('M13 9H35M13 39H35',1.6)),
 pact:()=>E('<path d="M9 4H39V40L35.25 44L31.5 40L27.75 44L24 40L20.25 44L16.5 40L12.75 44L9 40Z"/>',cut('M15 12H33M15 19H33M15 26H24',2.4)+'<circle cx="31" cy="30" r="5"/>'),
 conjuring:()=>E('<path d="M24 4C29 14 38 18 37 29C36 40 12 40 11 29C10 21 16 18 18 11C20 15 22.5 14 24 4Z"/><path d="M6 42H42V46H6Z"/>','<path d="M24 20c2 5 6 6 5.5 11s-11 5-11 0 3.5-6 5.5-11Z"/>'),
 'spell-strip':()=>E('<path d="M2 14H14V34H2ZM18 10H30V38H18ZM34 14H46V34H34Z"/>',cut('M21 14H27M21 34H27',1.6)),
 'publish-kit':()=>E('<path d="M24 3L36 16H28.5V30H19.5V16H12Z"/><path d="M5 30H11V39H37V30H43V45H5Z"/>'),
 canopy:()=>E('<path d="M21.5 47C22.5 40 22.5 34 22.5 28H25.5C25.5 34 25.5 40 26.5 47Z"/><path d="M24 2L30 10L24 18L18 10Z"/><path d="M10 10L15 17L10 24L5 17Z"/><path d="M38 10L43 17L38 24L33 17Z"/><path d="M23 30L9 21L11 19L24.5 27Z"/><path d="M25 30L39 21L37 19L23.5 27Z"/><path d="M22.5 16H25.5V30H22.5Z"/>'),
 offering:()=>E('<path d="M6 20H34V45H6Z"/><path d="M6 20L13 12H41L34 20Z"/><path d="M34 20L41 12V37L34 45Z"/>',cut('M6.5 20H34L41 12.5',1.6)+'<path d="M17 20H23V45H17Z"/>'),
 sound:()=>E('<circle cx="19" cy="27" r="16"/><path d="M8 4H30V7.5H8Z"/>','<circle cx="19" cy="27" r="10" fill="none" stroke-width="1.6"/><circle cx="19" cy="27" r="3.5"/>')+`<path d="${arc(19,27,22,-35,35)}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
 voice:()=>E('<path d="M3 20H10L27 9C30 7 33 9 33 12V36C33 39 30 41 27 39L10 28H3Z"/>',cut('M10 20.5V27.5',1.6))+`<path d="${arc(30,24,10,-40,40)}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="${arc(30,24,16,-40,40)}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
 reliquary:()=>E('<path d="M24 3L44 15H4Z"/><path d="M8 18h6v20H8ZM21 18h6v20h-6ZM34 18h6v20h-6ZM4 41H44V46H4Z"/>','<circle cx="24" cy="10.5" r="2"/>'),
 /* the six minds */
 tongue:()=>E('<path d="M4 18H12L34 6C38 4 41 6 41 10V38C41 42 38 44 34 42L12 30H4Z"/>',cut('M12 18.5V29.5',1.8)+cut('M33 11.5C35.5 17 35.5 31 33 36.5',2.2)),
 pigment:()=>E('<path d="M30 3L35 8L22 26L17 21Z"/><path d="M15.5 22.5L20.5 27.5C19 32 15 33.5 11 33C12.5 30 12 26 15.5 22.5Z"/><path d="M4 36C4 33 9 31 13 34C17 37 21 34 26 33C33 32 44 33 44 38C44 43 34 46 24 46C12 46 4 42 4 36Z"/>','<circle cx="34" cy="39" r="2.6"/><circle cx="26" cy="41" r="2.2"/><circle cx="17" cy="41" r="2.4"/>'),
 elder:()=>E('<path d="M22 6H26V46H22Z"/><path d="M24 2C30 2 33 6 33 10C33 15 28 17 24 15C27 14 28 11.5 27 9.5C26 7.5 23 7 21 9C19.5 7 20 2 24 2Z"/><path d="M14 30H34L31 34H17Z"/>',''),
 griot:()=>E('<path d="M9 4H39L33 21L39 44H9L15 21Z"/>',cut('M11 7L19 21L11 41M37 7L29 21L37 41',1.6)+cut('M15.5 21H32.5',2.4)),
 scribe:()=>E('<path d="M36 2L44 10L18 36L10 38L12 30Z"/><path d="M4 44H30V47H4Z"/>',cut('M32 6L40 14',1.6)+'<path d="M12.5 33.5L14.5 35.5L11 37Z"/>'),
 watcher:()=>E('<path d="M2 24C8 13 16 8 24 8S40 13 46 24C40 35 32 40 24 40S8 35 2 24Z"/>','<circle cx="24" cy="24" r="10"/>')+`<path d="${loz(24,24,4)}" fill="currentColor"/>`};
const emblem=(n,o={})=>svg('0 0 48 48',(EMB[n]||EMB.altar)(),'emblem em-'+n,o);
/* a struck medal: a lit metal disc with an emblem cut into it. state: on (bone) | off (dim) | need | work | stop */
function medal(n,o={}){const st=o.state||'on',fill=st==='off'?V.dim:st==='need'?V.need:st==='work'?'var(--work)':st==='stop'?'var(--stop)':V.metal;
 return svg('0 0 260 260',`<circle cx="138" cy="140" r="112" fill="#000" opacity=".45"/>`+lit('seal',fill,{rim:false})+`<g transform="translate(70 70) scale(2.5)" color="#0B0E12" opacity=".8">${(EMB[n]||EMB.altar)()}</g><g transform="translate(71.5 71.5) scale(2.5)" color="#fff" opacity=".18">${(EMB[n]||EMB.altar)()}</g>`,'medal '+st,o)}

const GLY={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',plus:'<path d="M12 4.5v15M4.5 12h15"/>',minus:'<path d="M4.5 12h15"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',back:'<path d="M14.5 5L7.5 12l7 7"/>',go:'<path d="M9.5 5l7 7-7 7"/>',more:'<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="4.2"/>',check:'<path d="M5 12.5l4.5 4.5L19 7"/>',play:'<path d="M8 5.5L18.5 12L8 18.5Z" fill="currentColor"/>',pause:'<path d="M8 5.5v13M16 5.5v13"/>',copy:'<path d="M9 4h10v12H9ZM5 8v12h10"/>',retry:'<path d="M19 12a7 7 0 1 1-2.1-5M19 4.5V9h-4.5"/>',swap:'<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',edit:'<path d="M15 5l4 4L9 19H5v-4Z"/>',trim:'<path d="M6 4v16M18 4v16M9 12h6M12 9l3 3-3 3"/>'};
const glyph=(n,o={})=>svg('0 0 24 24',`<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${GLY[n]||''}</g>`,'glyph',o);

/* a step of a film: done = bone with a check; next = gold ring, yours; now = jade, being made; failed = ember cross; none = hollow */
function pipBody(st,x,y,s=1){const D=`M${x} ${y-9*s}L${x+9*s} ${y}L${x} ${y+9*s}L${x-9*s} ${y}Z`;
 return st==='done'?`<path d="${D}" fill="var(--obj-lit)"/><path d="${CHECK(x,y,.95*s)}" fill="none" stroke="#0B0E12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
  :st==='next'?`<path d="${D}" fill="none" stroke="${V.need}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${2.8*s}" fill="${V.need}"/>`
  :st==='now'?`<path d="${D}" fill="var(--work)"/><circle class="beat" cx="${x}" cy="${y}" r="${2.8*s}" fill="#04130E"/>`
  :st==='failed'?`<path d="${D}" fill="var(--stop)"/><path d="M${x-3} ${y-3}l6 6M${x+3} ${y-3}l-6 6" stroke="#1A0306" stroke-width="2.4" stroke-linecap="round"/>`
  :`<path d="M${x} ${y-7*s}L${x+7*s} ${y}L${x} ${y+7*s}L${x-7*s} ${y}Z" fill="none" stroke="${V.line}" stroke-width="1.8" stroke-linejoin="round"/>`}
const pip=(o={})=>svg('-2 -2 24 24',pipBody(o.state||'none',10,10),'pip '+(o.state||'none'),o);
function path(steps,o={}){const gap=o.gap||64,n=steps.length;let s='';steps.forEach((st,i)=>{if(i<n-1){const solid=st==='done'&&steps[i+1]!=='none';s+=`<path d="M${14+i*gap+13} 14H${14+(i+1)*gap-13}" stroke="${solid?'var(--obj-lit)':V.line}" stroke-width="${solid?2.6:1.8}" ${solid?'':'stroke-dasharray="1 5"'} stroke-linecap="round"/>`}});steps.forEach((st,i)=>s+=pipBody(st,14+i*gap,14));return svg(`0 0 ${28+(n-1)*gap} 28`,s,'path',o)}

/* the empty plate: an uncut block with registration marks. Something will be printed here; nothing is yet.
   working: a slow light passes over it. failed: an ember mount. */
function plate(o={}){const w=o.w||320,h=o.h||180,st=o.state||'empty',id=uid('p'),c=10;let hh='';for(let i=-h;i<w;i+=12)hh+=`M${i} ${h}L${i+h} 0`;
 const fr=`M${c} 1.5H${w-c}L${w-1.5} ${c}V${h-c}L${w-c} ${h-1.5}H${c}L1.5 ${h-c}V${c}Z`,col=st==='failed'?V.stop:st==='working'?'var(--work)':V.line;
 const reg=(x,y)=>`<path d="M${x-7} ${y}h14M${x} ${y-7}v14" stroke="${col}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="3.6" fill="none" stroke="${col}" stroke-width="1.6"/>`;
 return svg(`0 0 ${w} ${h}`,`<defs><clipPath id="${id}"><path d="${fr}"/></clipPath><linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="var(--work)" stop-opacity="0"/><stop offset=".5" stop-color="var(--work)" stop-opacity=".22"/><stop offset="1" stop-color="var(--work)" stop-opacity="0"/></linearGradient></defs><path d="${fr}" fill="var(--plate,var(--a-well))"/><g clip-path="url(#${id})"><path d="${hh}" stroke="var(--hatch,var(--a-shade))" stroke-width="1.6" fill="none"/>${st==='working'?`<rect class="sweep" x="-${w}" y="0" width="${w}" height="${h}" fill="url(#${id}s)"/>`:''}</g><path d="${fr}" fill="none" stroke="${col}" stroke-width="${st==='empty'?2:3}" ${st==='empty'?'stroke-dasharray="1 7"':''} stroke-linecap="round"/>${reg(22,22)}${reg(w-22,22)}${reg(22,h-22)}${reg(w-22,h-22)}`,'plate-art '+st,{ar:'none'})}

/* card back: Ambi's mark in a struck ring, on a field of the room's own marks */
function cardback(){const id=uid('b');let m='';for(let y=0;y<6;y++)for(let x=0;x<4;x++)m+=`<path d="${loz(18+x*28+(y%2)*14,20+y*32,4)}"/>`;
 return svg('0 0 120 180',`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1C2632"/><stop offset="1" stop-color="#0B1016"/></linearGradient></defs><path d="M8 0H112L120 8V172L112 180H8L0 172V8Z" fill="url(#${id})"/><g fill="#2B3846">${m}</g><path d="M10 6H110L114 10V170L110 174H10L6 170V10Z" fill="none" stroke="var(--metal)" stroke-opacity=".55" stroke-width="1.5"/><circle cx="60" cy="90" r="34" fill="#0B1016" stroke="var(--metal)" stroke-width="3"/><circle cx="60" cy="90" r="28" fill="none" stroke="var(--metal)" stroke-opacity=".4" stroke-width="1.2"/><g transform="translate(37 66) scale(.046)" color="var(--obj-lit)">${CATB()}</g>`,'cardback')}
const CATB=()=>(window.JujuCat||'').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace(/<g class="eyes"[\s\S]*?<\/g>/,'');

const Art={jar,wallet,tree,seal,knob,sound,wave,voice,chest,lock,emblem,medal,glyph,pip,path,plate,cardback,minds:MINDS,rooms:Object.keys(EMB),sprite};
window.Art=Art;
const css=`:root{--l-wall:url("${IMG.wall||''}");--l-grain:url("${IMG.grain||''}");--l-tl:url("${IMG['cn-tl']||''}");--l-tr:url("${IMG['cn-tr']||''}");--l-br:url("${IMG['cn-br']||''}");--l-bl:url("${IMG['cn-bl']||''}");--l-tl-a:url("${IMG['cn-tl-a']||''}");--l-tr-a:url("${IMG['cn-tr-a']||''}");--l-br-a:url("${IMG['cn-br-a']||''}");--l-bl-a:url("${IMG['cn-bl-a']||''}");--l-crest:url("${IMG.crest||''}");--l-crest-a:url("${IMG['crest-a']||''}");--l-fin-l:url("${IMG['finial-l']||''}");--l-fin-r:url("${IMG['finial-r']||''}");--l-fin-l-a:url("${IMG['finial-l-a']||''}");--l-fin-r-a:url("${IMG['finial-r-a']||''}")}`;
document.head.insertAdjacentHTML('beforeend','<style id="juju-light-css">'+css+'</style>');
document.addEventListener('DOMContentLoaded',()=>{sprite();
 /* <span data-art="jar" data-state="needs" data-label="LT"></span>  ->  drawn in place */
 document.querySelectorAll('[data-art]').forEach(e=>Art.fill(e))},{once:true});
/* fill a placeholder: the element is replaced by its drawing, keeping its classes and data, so Art.fill(svg) redraws it */
Art.fill=e=>{const d=e.dataset,k=d.art,o=Object.assign({},d);['level','value','seed','progress','focus'].forEach(n=>{if(o[n]!=null)o[n]=+o[n]});if(o.locked)o.locked=o.locked==='true';
 const html=k==='emblem'?emblem(d.name):k==='medal'?medal(d.name,o):k==='glyph'?glyph(d.name):k==='tree'?tree(Object.assign(o,{boughs:JSON.parse(d.boughs||'[]')})):k==='path'?path((d.steps||'').split(' ')):Art[k]?Art[k](o):'';
 const t=document.createElement('template');t.innerHTML=html.trim();const s=t.content.firstChild;if(!s)return e;
 (e.getAttribute('class')||'').split(/\s+/).filter(c=>c&&c!=='art').forEach(c=>s.classList.add(c));for(const k2 in d)s.dataset[k2]=d[k2];if(e.id)s.id=e.id;if(e.getAttribute('style'))s.setAttribute('style',e.getAttribute('style'));
 e.replaceWith(s);return s};
})();
