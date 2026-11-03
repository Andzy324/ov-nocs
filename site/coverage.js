(() => {
 const data=window.COVERAGE_DATA;if(!data)return;
 const sources=new Map(data.datasets.map(d=>[d.id,d])),golden=Math.PI*(3-Math.sqrt(5));
 const extent=data.datasets.reduce((b,d)=>{d.center3d.forEach((v,k)=>{b[0][k]=Math.min(b[0][k],v-d.sphere_radius);b[1][k]=Math.max(b[1][k],v+d.sphere_radius);});return b;},[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]]);
 const center=extent[0].map((v,k)=>(v+extent[1][k])/2),radius=Math.max(...data.datasets.map(d=>Math.hypot(...d.center3d.map((v,k)=>v-center[k]))+d.sphere_radius));
 const points=data.categories.map(c=>{const p=new Float32Array(c.count*3),s=c.sphere;for(let i=0;i<c.count;i++){const z=2*((i*.754877666+.5)%1)-1,a=i*golden,r=s[3]*Math.cbrt((i+.5)/c.count),xy=Math.sqrt(1-z*z);p[3*i]=s[0]-center[0]+r*xy*Math.cos(a);p[3*i+1]=s[1]-center[1]+r*xy*Math.sin(a);p[3*i+2]=s[2]-center[2]+r*z;}return p;});
 window.createObjectConstellation=(canvas,options={})=>{
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let yaw=3,pitch=-1,zoom=1.45,panX=0,panY=0,w=100,h=100,scale=1,drag=null,moved=false,visible=false,auto=!reduced,raf=0,last=0,progress=1,lightStart=0,picked=options.selected||null,hover=null,stage=1,filter=()=>true,screenCats=[];
  let cy=1,sy=0,cp=1,sp=0;
  const project=(x,y,z)=>{const xx=x*cy+z*sy,zz=-x*sy+z*cy,yy=y*cp-zz*sp,depth=y*sp+zz*cp,perspective=3.8*radius/(3.8*radius+depth);return [w/2+panX+xx*scale*zoom*perspective,h/2+panY+yy*scale*zoom*perspective,depth,perspective];};
  function draw(){
   cy=Math.cos(yaw);sy=Math.sin(yaw);cp=Math.cos(pitch);sp=Math.sin(pitch);
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b171e';ctx.fillRect(0,0,w,h);
   const ambient=ctx.createRadialGradient(w*.46,h*.4,0,w*.5,h*.5,w*.7);ambient.addColorStop(0,'#19323c');ambient.addColorStop(1,'#0b171e');ctx.fillStyle=ambient;ctx.fillRect(0,0,w,h);
   screenCats=data.categories.map((c,i)=>({c,i,p:project(c.sphere[0]-center[0],c.sphere[1]-center[1],c.sphere[2]-center[2])})).sort((a,b)=>b.p[2]-a.p[2]);
   data.datasets.forEach(d=>{const p=project(...d.center3d.map((v,k)=>v-center[k])),r=Math.max(10,d.sphere_radius*scale*zoom*p[3]);if(r>2500)return;const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r*1.3);g.addColorStop(0,d.color+'0e');g.addColorStop(1,d.color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r*1.3,0,Math.PI*2);ctx.fill();});
   ctx.globalCompositeOperation='lighter';
   screenCats.forEach(({c,i,p})=>{
    const active=filter(c),color=sources.get(c.dataset).color,selected=c===picked||c===hover,coords=points[i];
    const fog=Math.max(.22,Math.min(.95,.65-p[2]/(radius*2.5))),size=Math.max(.65,Math.min(3.3,1.0*zoom*p[3]*(w<500?.8:1))),limit=Math.floor(c.count*progress);
    ctx.globalAlpha=active?fog*(selected?.95:.65):.12;ctx.fillStyle=active?color:'#69828e';
    for(let j=0;j<c.count;j++){
     const lit=active&&(c.flags[j]&stage)&&j<limit;if(active&&!lit)continue;
     const q=project(coords[j*3],coords[j*3+1],coords[j*3+2]);if(q[0]<0||q[1]<0||q[0]>w||q[1]>h)continue;ctx.fillRect(q[0],q[1],size,size);
    }
    if(selected&&active){ctx.globalAlpha=.07;ctx.beginPath();ctx.arc(p[0],p[1],c.sphere[3]*scale*zoom*p[3]+5,0,Math.PI*2);ctx.fill();}
   });
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
   const focus=hover||picked;
   if(focus&&filter(focus)){
    const s=focus.sphere,r=s[3]*1.12;ctx.strokeStyle=sources.get(focus.dataset).color+'a0';ctx.lineWidth=.8;
    for(let axis=0;axis<2;axis++){ctx.beginPath();for(let j=0;j<=80;j++){const a=j/80*Math.PI*2,q=project(s[0]-center[0]+r*Math.cos(a),s[1]-center[1]+(axis?r*Math.sin(a):0),s[2]-center[2]+(axis?0:r*Math.sin(a)));if(j)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1]);}ctx.stroke();}
   }
   data.datasets.forEach(d=>{if(!data.categories.some(c=>c.dataset===d.id&&filter(c)))return;const v=d.center3d.map((x,k)=>x-center[k]);v[1]-=d.sphere_radius;const p=project(...v);ctx.textAlign='center';ctx.font='600 11px system-ui';const tw=ctx.measureText(d.name).width;ctx.fillStyle='#0b171ed9';ctx.fillRect(p[0]-tw/2-7,p[1]-14,tw+14,22);ctx.fillStyle=d.color;ctx.fillText(d.name,p[0],p[1]);});
   screenCats.forEach(({c,p})=>{if(!filter(c)||!(c===focus||zoom>1.8&&c.count>1500))return;const text=c.label.replaceAll('_',' ')+' · '+c.count.toLocaleString('en-US');ctx.font='11px system-ui';ctx.textAlign='center';const tw=ctx.measureText(text).width;ctx.fillStyle='#0b171eeb';ctx.fillRect(p[0]-tw/2-8,p[1]-12,tw+16,23);ctx.fillStyle='#f0f5eb';ctx.fillText(text,p[0],p[1]+3);});
   const ox=w-41,oy=h-43;[['X','#de947c',1,0,0],['Y','#b3ce96',0,1,0],['Z','#79bfcf',0,0,1]].forEach(([label,color,x,y,z])=>{const q=project(x*22/scale/zoom,y*22/scale/zoom,z*22/scale/zoom),origin=project(0,0,0);ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+q[0]-origin[0],oy+q[1]-origin[1]);ctx.stroke();ctx.fillStyle=color;ctx.font='9px system-ui';ctx.fillText(label,ox+q[0]-origin[0],oy+q[1]-origin[1]-4);});
  }
  function tick(now){raf=0;if(!visible)return;const dt=last?Math.min(40,now-last):16;last=now;if(auto&&!drag)yaw+=dt*.000075;if(lightStart){progress=Math.min(1,(now-lightStart)/2200);if(progress===1)lightStart=0;}draw();if(auto||lightStart)raf=requestAnimationFrame(tick);}
  function request(){if(!raf&&visible)raf=requestAnimationFrame(tick);}
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(w,h)/radius*.45;draw();}
  const hit=(x,y)=>{let best=null,dist=Infinity;screenCats.forEach(({c,p})=>{if(!filter(c))return;const d=Math.hypot(x-p[0],y-p[1]),r=Math.max(6,c.sphere[3]*scale*zoom*p[3]);if(d<r+4&&d/r<dist){best=c;dist=d/r;}});return best;};
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch,panX,panY,pan:e.shiftKey};moved=false;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const rect=canvas.getBoundingClientRect();if(!drag){const next=hit(e.clientX-rect.left,e.clientY-rect.top);if(next!==hover){hover=next;canvas.style.cursor=hover?'pointer':'grab';options.onHover?.(hover);request();}return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(drag.pan){panX=drag.panX+dx;panY=drag.panY+dy;}else{yaw=drag.yaw+dx*.007;pitch=Math.max(-1.4,Math.min(1.4,drag.pitch+dy*.007));}request();});
  canvas.addEventListener('pointerup',e=>{if(!drag)return;if(!moved){const r=canvas.getBoundingClientRect(),c=hit(e.clientX-r.left,e.clientY-r.top);if(c){picked=c;options.onPick?.(c);}}drag=null;request();});
  canvas.addEventListener('pointercancel',()=>{drag=null;request();});canvas.addEventListener('pointerleave',()=>{hover=null;options.onHover?.(null);request();});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.6,Math.min(7,zoom*Math.exp(-e.deltaY*.001)));request();},{passive:false});
  canvas.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')zoom=Math.min(7,zoom*1.2);else if(e.key==='-')zoom=Math.max(.6,zoom/1.2);else if(e.key==='ArrowLeft')yaw-=.1;else if(e.key==='ArrowRight')yaw+=.1;else if(e.key==='ArrowUp')pitch=Math.max(-1.4,pitch-.1);else if(e.key==='ArrowDown')pitch=Math.min(1.4,pitch+.1);else return;e.preventDefault();request();});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;if(visible)request();else{cancelAnimationFrame(raf);raf=0;}},{threshold:.05});observer.observe(canvas);
  canvas.closest('.coverage-plot')?.classList.add('ready');
  return {setFilter(fn){filter=fn;request();},setStage(value){stage=value;request();},select(c){picked=c;request();},reset(){yaw=3;pitch=-1;zoom=1.45;panX=panY=0;request();},toggleOrbit(){auto=!auto;request();return auto;},get orbiting(){return auto;},replay(){progress=0;lightStart=performance.now();request();},dispose(){auto=false;resizeObserver.disconnect();observer.disconnect();cancelAnimationFrame(raf);},save(){draw();const a=document.createElement('a');a.download='OV-NOCS-3D-object-atlas.png';a.href=canvas.toDataURL('image/png');a.click();}};
 };
 const canvas=document.getElementById('coverage-canvas');if(!canvas)return;
 const format=n=>n.toLocaleString('en-US');let stage=1,filter='all',query='';
 const matches=c=>(filter==='all'||c.dataset===filter)&&(!query||c.label.toLowerCase().includes(query));
 const view=window.createObjectConstellation(canvas,{onPick:show});
 function show(c){view.select(c);const box=document.getElementById('coverage-detail');box.replaceChildren();
  const el=(tag,text,cl)=>{const e=document.createElement(tag);e.textContent=text;if(cl)e.className=cl;return e;};
  box.append(el('p',sources.get(c.dataset).name,'eyebrow'),el('h3',c.label.replaceAll('_',' ')),el('p',`${format(c.count)} instances`,'coverage-detail-counts'));
  const stages=el('ul','','artifact-stages');[['Mesh exports',c.count],['RGB / NOCS outputs',c.render_count],['Canonical previews',c.preview_count]].forEach(([label,count])=>{const row=el('li','','');row.append(el('span',label),el('strong',format(count)));row.classList.toggle('unavailable',count===0);stages.append(row);});box.append(stages);
  if(c.preview){const img=document.createElement('img');img.src=asset(c.preview);img.alt=c.preview_kind+' for '+c.label;box.append(img,el('p',c.preview_kind,'small-note'));}
  const details=el('details','','source-details');details.append(el('summary','Source details'));
  details.append(el('p',`Source category: ${c.source_category}`,'small-note'));
  if(c.preview_instance)details.append(el('p','Preview source ID','source-detail-label'),el('p',c.preview_instance,'coverage-id'));
  details.append(el('p','Exported instance IDs','source-detail-label'));const ids=el('div','','coverage-ids');c.instances.forEach(id=>ids.append(el('div',id)));details.append(ids);box.append(details);
 }
 function update(){const cats=data.categories.filter(matches),count=cats.reduce((n,c)=>n+c.flags.filter(f=>f&stage).length,0);document.getElementById('coverage-lit').textContent=format(count);document.getElementById('coverage-groups').textContent=format(cats.length);document.getElementById('coverage-state').textContent=({1:'MESH EXPORTS',2:'RGB / NOCS OUTPUTS',4:'CANONICAL PREVIEWS'})[stage];view.setFilter(matches);view.setStage(stage);}
 function choose(){const c=data.categories.find(c=>matches(c)&&c.preview)||data.categories.find(matches);if(c)show(c);else document.getElementById('coverage-detail').textContent='No matching categories.';}
 document.getElementById('coverage-sources').innerHTML='<button data-source="all" class="active">All datasets</button>'+data.datasets.map(d=>`<button data-source="${d.id}" style="--source-color:${d.color}">${d.name} <span>${format(d.instances)}</span></button>`).join('');
 document.getElementById('coverage-sources').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filter=b.dataset.source;document.querySelectorAll('#coverage-sources button').forEach(x=>x.classList.toggle('active',x===b));update();choose();});
 document.getElementById('coverage-stages').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;stage=+b.dataset.stage;document.querySelectorAll('#coverage-stages button').forEach(x=>x.classList.toggle('active',x===b));update();});
 document.getElementById('coverage-search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();update();choose();});
 document.getElementById('coverage-replay').addEventListener('click',()=>view.replay());document.getElementById('coverage-reset').addEventListener('click',()=>view.reset());document.getElementById('coverage-save').addEventListener('click',()=>view.save());
 const orbit=document.getElementById('coverage-orbit');orbit.textContent=view.orbiting?'Pause orbit Ⅱ':'Auto orbit ↻';orbit.setAttribute('aria-pressed',String(view.orbiting));orbit.addEventListener('click',()=>{const active=view.toggleOrbit();orbit.textContent=active?'Pause orbit Ⅱ':'Auto orbit ↻';orbit.setAttribute('aria-pressed',String(active));});
 update();choose();
})();
