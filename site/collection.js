(() => {
 const host=document.getElementById('collection-map');if(!host)return;
 const datasets=window.COVERAGE_DATA.datasets, samples=window.ATLAS_DATA.samples;
 const sources=[['oxl','Objaverse-XL'],['omni','Omni6DPose'],['future','3D-FUTURE'],['hssd','HSSD'],['shapenet','ShapeNet']];
 const scenes=[['Hypersim','hypersim','Indoor scenes'],['V-KITTI','v-kitti','Driving scenes'],['Real275','real275','Tabletop scenes']];
 let mode='objects',mainView=null;
 function select(index,category=null){
  document.querySelectorAll('.collection-node').forEach((b,i)=>b.classList.toggle('active',i===index));
  const panel=document.getElementById('collection-example');panel.replaceChildren();
  const make=(tag,text,cl)=>{const e=document.createElement(tag);e.textContent=text;if(cl)e.className=cl;return e;};
  const image=(path,alt)=>{const e=document.createElement('img');e.src=asset(path);e.alt=alt;return e;};
  if(mode==='objects'){
   const ds=datasets.find(d=>d.id===sources[index][0]),c=category||window.COVERAGE_DATA.categories.filter(c=>c.dataset===ds.id&&c.preview).sort((a,b)=>b.count-a.count)[0];
   if(mainView)mainView.select(c);
   panel.append(make('p',ds.name,'eyebrow'),make('h3',c?c.label.replaceAll('_',' '):ds.name));
   if(c){panel.append(make('p',c.count.toLocaleString('en-US')+' catalogue entries','collection-caption'));const stages=make('ul','','artifact-stages');[['Catalogue entries',c.count],['Reported orientations',c.orientation_count],['Reported valid renders',c.render_count]].forEach(([label,count])=>{const row=make('li','','');row.append(make('span',label),make('strong',(count==null?'Not reported':count.toLocaleString('en-US'))));row.classList.toggle('unavailable',count==null);stages.append(row);});panel.append(stages);}
   if(c?.preview)panel.append(image(c.preview,c.preview_kind+' for '+c.label),make('p',c.preview_kind,'small-note'));
   if(c){const details=make('details','','source-details');details.append(make('summary','Source details'),make('p','Dataset: '+ds.name,'small-note'),make('p','Source category: '+c.source_category,'small-note'),make('p',ds.scope,'small-note'),make('p','Metadata: '+ds.metadata_source,'small-note'));if(c.preview_instance)details.append(make('p','Preview source ID','source-detail-label'),make('p',c.preview_instance,'coverage-id'));panel.append(details);}
   const link=make('a','Explore catalogue categories →','quiet-link');link.href='#coverage';link.addEventListener('click',()=>document.querySelector(`#coverage-sources [data-source="${ds.id}"]`).click());panel.append(link);
  }else{
   const s=scenes[index];panel.append(make('p',s[2].toUpperCase(),'eyebrow'),make('h3',s[0]),image('assets/scene-'+s[1]+'-coordinates.webp',s[0]+' scene-space representation'),make('p','Image-space annotations and scene-space object frames','collection-caption'));
   const link=make('a','Explore scene representations →','quiet-link');link.href='#scenes';link.addEventListener('click',()=>document.querySelectorAll('#scene-tabs button')[index].click());panel.append(link);
  }
 }
 function render(){
  mainView?.dispose();mainView=null;host.replaceChildren();host.classList.toggle('scene-mode',mode==='scenes');
  document.getElementById('collection-object-metrics').hidden=mode!=='objects';document.getElementById('collection-scene-metrics').hidden=mode!=='scenes';
  if(mode==='objects'){
   const canvas=document.createElement('canvas');canvas.id='collection-canvas';canvas.tabIndex=0;canvas.setAttribute('aria-label','Rotatable 3D object category constellation. Drag to orbit, scroll to zoom, and click a cluster to inspect catalogue statistics and representative results.');host.append(canvas);
   mainView=window.createObjectConstellation(canvas,{onPick:c=>select(sources.findIndex(s=>s[0]===c.dataset),c)});
   const hud=document.createElement('div');hud.className='collection-3d-hud';hud.innerHTML='<span>3D / CATEGORY CONSTELLATION</span>';const orbit=document.createElement('button');orbit.textContent=mainView.orbiting?'Pause orbit Ⅱ':'Auto orbit ↻';orbit.setAttribute('aria-pressed',String(mainView.orbiting));orbit.addEventListener('click',()=>{const running=mainView.toggleOrbit();orbit.textContent=running?'Pause orbit Ⅱ':'Auto orbit ↻';orbit.setAttribute('aria-pressed',String(running));});hud.append(orbit);const reset=document.createElement('button');reset.textContent='Reset ↺';reset.addEventListener('click',()=>mainView.reset());hud.append(reset);host.append(hud);
   sources.forEach((s,i)=>{const ds=datasets.find(d=>d.id===s[0]),c=window.COVERAGE_DATA.categories.find(c=>c.dataset===s[0]&&c.preview);const b=document.createElement('button');b.className='collection-node object-node node-'+i;b.style.setProperty('--node-color',ds.color);b.innerHTML=`<img src="${asset(c.preview)}" alt="${s[1]} processed example"><span>${s[1]}<small>View example ↗</small></span>`;b.addEventListener('click',()=>select(i));b.addEventListener('pointerenter',()=>select(i));b.addEventListener('focus',()=>select(i));host.append(b);});
  }else scenes.forEach((s,i)=>{const b=document.createElement('button');b.className='collection-node scene-node node-'+i;b.innerHTML=`<img src="${asset('assets/scene-'+s[1]+'-rgb.webp')}" alt="${s[0]} image-space object annotations"><span>${s[0]}<small>${s[2]} ↗</small></span>`;b.addEventListener('click',()=>select(i));b.addEventListener('pointerenter',()=>select(i));b.addEventListener('focus',()=>select(i));host.append(b);});
  document.getElementById('collection-map-note').textContent=mode==='objects'?'134,644 catalogue entries · 1,100 source-category groups · Drag to orbit · Scroll to zoom':'Indoor · Driving · Tabletop / Select a dataset to inspect its object frames';select(0);
 }
 document.getElementById('collection-switch').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.collection;document.querySelectorAll('#collection-switch button').forEach(x=>x.classList.toggle('active',x===b));render();});render();
})();
