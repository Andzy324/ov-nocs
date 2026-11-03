'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const asset = (path) => window.ATLAS_ASSETS?.[path] || path;

function drawCoordinateGizmo(ctx,w,h,projection){
 const x=18,y=h-158,size=120,origin=[x+55,y+65],base=projection([0,0,0]);
 const axes=[{v:[.3,0,0],color:'#ee9d94',label:'X'},{v:[0,0,-.3],color:'#b6d790',label:'Y'},{v:[0,.3,0],color:'#8dbfe9',label:'Z'}];
 const vectors=axes.map(a=>{const p=projection(a.v);return [p[0]-base[0],p[1]-base[1]];}),scale=27/Math.max(...vectors.map(v=>Math.hypot(...v)),1);
 ctx.save();ctx.fillStyle='rgba(10,25,30,.94)';ctx.strokeStyle='#455953';ctx.lineWidth=.7;ctx.fillRect(x,y,size,size);ctx.strokeRect(x,y,size,size);ctx.font='8px monospace';ctx.fillStyle='#c0cfc6';ctx.fillText('CANONICAL',x+12,y+16);
 axes.forEach((a,i)=>{const d=vectors[i].map(v=>v*scale),end=[origin[0]+d[0],origin[1]+d[1]],angle=Math.atan2(d[1],d[0]);ctx.strokeStyle=a.color;ctx.fillStyle=a.color;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(...origin);ctx.lineTo(...end);ctx.stroke();ctx.beginPath();ctx.moveTo(...end);ctx.lineTo(end[0]-6*Math.cos(angle-.45),end[1]-6*Math.sin(angle-.45));ctx.lineTo(end[0]-6*Math.cos(angle+.45),end[1]-6*Math.sin(angle+.45));ctx.fill();ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(a.label,end[0]+10*Math.cos(angle),end[1]+10*Math.sin(angle)+4);});
 ctx.font='8px monospace';ctx.textAlign='left';ctx.fillStyle='#c0cfc6';ctx.fillText('+Z UP  +Y FRONT',x+8,y+size-8);ctx.restore();
}

const stages = [
  {
    "key": "A",
    "short": "Semantic prototypes",
    "title": "Semantic Prototype Construction",
    "purpose": "Construct comparable semantic representations within each category to support canonical orientation alignment across instances.",
    "method": "Extract dense DINOv2 descriptors from multi-view RGB images. Lift descriptors onto the object surface using depth, foreground masks and camera parameters, then aggregate them into per-point features.",
    "result": "The resulting object point cloud associates 3D positions with semantic descriptors. Multi-view feature projections show descriptor distributions across viewpoints, while the 3D cloud organizes these observations on the object surface.",
    "image": "assets/run-semantic-features.webp",
    "label": "MULTI-VIEW SEMANTIC FEATURES",
    "status": "PER-POINT DESCRIPTORS",
    "caption": "PCA projections of multi-view features. Colors encode variation in the projected descriptor space and reveal the spatial distribution of surface features."
  },
  {
    "key": "B",
    "short": "Geometry-aware fusion",
    "title": "Geometry-Aware Feature Fusion",
    "purpose": "Combine semantic descriptors with object geometry to form a joint representation for cross-shape correspondence.",
    "method": "Apply joint PCA to descriptors from the source shape and reference prototype, retain 64 semantic components, and concatenate a 3D positional encoding to form a representation containing both semantics and geometry.",
    "result": "The output is a joint feature representation for pointwise matching. Semantic descriptors encode relationships between surface regions, while positional encoding supplies their spatial structure within the object.",
    "image": "assets/run-feature-fusion.webp",
    "label": "SEMANTIC & GEOMETRIC REPRESENTATION",
    "status": "JOINT FEATURES",
    "caption": "Fresh run: the same 2,048 query keypoints colored by the 64-dimensional semantic, 48-dimensional position and 112-dimensional joint matching representations. Select the figure to enlarge."
  },
  {
    "key": "C",
    "short": "Rotation & matching",
    "title": "Best-Match Selection",
    "purpose": "Determine a shape’s orientation relative to the category prototype and align instances to a consistent canonical reference frame.",
    "method": "Evaluate Z-axis rotation candidates of 0°, 90°, 180° and −90°. Establish point correspondences using feature cosine similarity, estimate relative rotation with SVD, and select the candidate using the residual yaw angle.",
    "result": "Candidate yaw annotations initialize within-category alignment. Correspondences connect related surface regions across shapes; orientation review resolves remaining differences before mesh export.",
    "image": "assets/run-correspondences.webp",
    "label": "CROSS-SHAPE CORRESPONDENCE",
    "status": "ROTATION SELECTION",
    "caption": "Fresh run: measured correspondences for the selected candidate and all four residual-yaw scores. Select the figure to enlarge."
  },
  {
    "key": "D",
    "short": "Refinement & export",
    "title": "Category Alignment & Asset Export",
    "purpose": "Convert shape-level orientation estimates into inspectable rotation annotations and canonicalized 3D assets.",
    "method": "Organize shapes through category clustering and prototype selection. Inspect orientations and refine them interactively, save rotation matrices, apply transforms to meshes, and export models with category-level visualizations.",
    "result": "Outputs include per-instance rotation annotations, aligned meshes and category montages. Collection views place diverse geometries in a common frame for inspecting orientation consistency within a category.",
    "image": "assets/mug-collection.webp",
    "label": "CATEGORY-LEVEL ALIGNMENT",
    "status": "CANONICALIZED ASSETS",
    "caption": "Compare instances within each category in a shared +Z-up, +Y-front frame. Reference directions are annotated before yaw matching; the slider compares source and exported orientations. Uniform max-side normalization preserves each mesh’s proportions."
  },
  {
    "key": "E",
    "short": "Multi-dataset rendering",
    "title": "Multi-view Data Generation",
    "purpose": "Generate paired appearance, silhouette and canonical-coordinate representations for objects from different source datasets.",
    "method": "Process the scale of canonicalized assets and sample camera viewpoints. Render RGB, foreground masks and NOCS per view, and store camera intrinsics and extrinsics to associate modalities by instance and view identifiers.",
    "result": "The output is paired multi-view data. The explorer presents instances from five source datasets, with RGB, masks and NOCS sharing the same camera view for comparing appearance, silhouette and canonical coordinates.",
    "image": "assets/dataset-overview.webp",
    "label": "RGB / NOCS REPRESENTATIONS",
    "status": "PAIRED MULTI-VIEW DATA",
    "caption": "Multi-category RGB / NOCS turntable sequence. The original 1,348 × 1,056 video stream shows changing viewpoints of appearance and canonical-coordinate representations."
  }
];
let stageIndex=0,methodCategory='teapot';
$('#method-category').addEventListener('change',e=>{methodCategory=e.target.value;renderStage();});
function setTabState(container,index){[...container.children].forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});}
function keyboardTabs(container){container.addEventListener('keydown',e=>{const buttons=[...container.querySelectorAll('[role=tab]')];const i=buttons.indexOf(document.activeElement);if(i<0)return;let next=i;if(e.key==='ArrowRight')next=(i+1)%buttons.length;else if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else return;e.preventDefault();buttons[next].click();container.querySelectorAll('[role=tab]')[next].focus();});}
function renderStage(){
 window.disposeCanonicalView?.();
 const s={...stages[stageIndex]};
 if(stageIndex<3)s.image='assets/batch-'+methodCategory+'-'+['semantics','fusion','matches'][stageIndex]+'.webp';
 $('#method-category-control').hidden=stageIndex>2;
 $('#stage-media').dataset.category=methodCategory;
 $('#stage-tabs').innerHTML=stages.map((st,i)=>`<button role="tab" id="stage-tab-${i}" aria-controls="stage-media" data-index="${i}"><span class="step-key">${st.key} / ${String(i+1).padStart(2,'0')}</span><span class="step-title">${st.short}</span></button>`).join('');
 setTabState($('#stage-tabs'),stageIndex);
 $('#stage-media').setAttribute('role','tabpanel');$('#stage-media').setAttribute('aria-labelledby',`stage-tab-${stageIndex}`);
 if(s.key==='D'&&window.mountCanonicalCollection){window.mountCanonicalCollection($('#stage-media'));}
 else if(s.key==='E'){$('#stage-media').innerHTML=`<video class="stage-turntable" controls muted loop playsinline preload="metadata" poster="${asset('assets/dataset-turntable-original.jpg')}" src="${asset('assets/dataset-turntable-original.mp4')}"></video>`;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#stage-media video').play().catch(()=>{});}
 else $('#stage-media').innerHTML=`<button class="stage-image-button" aria-label="Enlarge ${s.label}"><img src="${asset(s.image)}" alt="${s.label}"><span>Enlarge figure ↗</span></button>`;
 $('#stage-visual-label').textContent=s.label;$('#stage-evidence').textContent=s.status;$('#stage-caption').textContent=s.caption;
 $('#stage-number').textContent=`STAGE ${s.key} / 0${stageIndex+1}`;$('#stage-title').textContent=s.title;
 $('#stage-details').innerHTML=[['Purpose',s.purpose],['Method',s.method],['Result',s.result]].map(([label,v])=>`<dt>${label}</dt><dd>${v}</dd>`).join('');
}
$('#stage-media').addEventListener('click',e=>{if(!e.target.closest('.stage-image-button'))return;const dialog=$('#lightbox');dialog.querySelector('img').src=asset(stageIndex<3?'assets/batch-'+methodCategory+'-'+['semantics','fusion','matches'][stageIndex]+'.webp':stages[stageIndex].image);dialog.querySelector('img').alt=stages[stageIndex].label;dialog.querySelector('p').textContent=stages[stageIndex].caption;dialog.showModal();});
$('#stage-tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;stageIndex=+b.dataset.index;renderStage();});keyboardTabs($('#stage-tabs'));
let selected=0,viewIndex=0,viewTimer=null;
const data=window.ATLAS_DATA;
function stopViews(){if(viewTimer){clearInterval(viewTimer);viewTimer=null;}$('#play-views').textContent='▶';$('#play-views').setAttribute('aria-label','Play selected camera views');}
function renderExplorer(){const s=data.samples[selected];$('#dataset-tabs').innerHTML=data.samples.map((x,i)=>`<button role="tab" aria-controls="view-rgb" data-index="${i}">${x.dataset}</button>`).join('');setTabState($('#dataset-tabs'),selected);$('#view-slider').max=s.views.length-1;$('#view-slider').value=viewIndex;renderViews();}
function renderViews(){const s=data.samples[selected],view=s.views[viewIndex];['rgb','mask','nocs'].forEach(mode=>{$(`#view-${mode}`).src=asset(s.channels[mode][view]);$(`#view-${mode}`).alt=`${s.dataset} ${mode.toUpperCase()} · ${'original view'} ${view}`;});$('#view-label').textContent=`VIEW ${String(view).padStart(4,'0')}`;$('#view-counter').textContent=`${String(viewIndex+1).padStart(2,'0')} / ${s.views.length}`;$('#view-slider').value=viewIndex;$('#view-slider').setAttribute('aria-valuetext',`Original camera view ${view}`);$('#instance-id').textContent=s.instance;$('#sample-counts').textContent=`${s.counts.rgb} generated views · ${s.views.length} displayed views`;}
$('#dataset-tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;stopViews();selected=+b.dataset.index;viewIndex=0;renderExplorer();});keyboardTabs($('#dataset-tabs'));
$('#view-slider').addEventListener('input',e=>{stopViews();viewIndex=+e.target.value;renderViews();});$('#play-views').addEventListener('click',()=>{if(viewTimer){stopViews();return;}$('#play-views').textContent='Ⅱ';$('#play-views').setAttribute('aria-label','Pause camera views');viewTimer=setInterval(()=>{viewIndex=(viewIndex+1)%data.samples[selected].views.length;renderViews();},650);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopViews();$('#demo-player').pause();}});
const gallery = [
  {
    "image": "mug-collection.webp",
    "cat": "canonical",
    "title": "Within-category orientation consistency",
    "description": "Mug geometries in a shared reference frame, showing shape variation and canonical orientation.",
    "tag": "CANONICALIZATION / MUG"
  },
  {
    "image": "cluster-result.webp",
    "cat": "canonical",
    "title": "Cluster-level shape alignment",
    "description": "A flowerpot-category cluster for inspecting orientation relationships among similar shapes.",
    "tag": "CANONICALIZATION / FLOWERPOT"
  },
  {
    "image": "run-semantic-features.webp",
    "cat": "features",
    "title": "Multi-view semantic features",
    "description": "Surface descriptors from multiple viewpoints, visualized with PCA color projections.",
    "tag": "REPRESENTATION / SEMANTIC FEATURES"
  },
  {
    "image": "dataset-overview.webp",
    "cat": "render",
    "title": "Appearance and canonical coordinates",
    "description": "Paired RGB and NOCS outputs across categories, representing appearance and object-surface coordinates.",
    "tag": "MULTI-VIEW DATA / RGB & NOCS"
  }
];
gallery.push(...['teapot','cabinet','bottle'].map(c=>({image:'batch-'+c+'-renders.webp',cat:'render',title:c[0].toUpperCase()+c.slice(1)+' / aligned multi-view outputs',description:'Selected same-category instances, shown as paired RGB and object-coordinate renders after reference annotation, yaw matching and orientation review.',tag:'FULL PIPELINE / '+c.toUpperCase()})));
gallery.push({image:'run-aligned-pair.webp',cat:'render',title:'Paired renders after alignment',description:'Fresh RGB and NOCS views of query 1053/5268138 after reference-frame annotation and candidate yaw selection.',tag:'FRESH SAMPLE / RGB & NOCS'});
const filters=[['all','All results'],['canonical','Canonicalization'],['features','Semantic features'],['render','Multi-view rendering']];let filter='all';
function renderGallery(){const shown=gallery.filter(g=>filter==='all'||g.cat===filter);$('#gallery-filters').innerHTML=filters.map(([key,label])=>`<button data-filter="${key}" class="${filter===key?'active':''}" aria-pressed="${filter===key}">${label}</button>`).join('');$('#gallery-grid').innerHTML=shown.map(g=>`<figure class="gallery-item"><button class="gallery-image" data-image="${g.image}" aria-label="${'Enlarge'} ${g.title}"><img src="${asset('assets/'+g.image)}" alt="${g.title}"><span class="expand-icon" aria-hidden="true">↗</span></button><figcaption><span>${g.tag}</span><h3>${g.title}</h3><p>${g.description}</p></figcaption></figure>`).join('');}
$('#gallery-filters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filter=b.dataset.filter;renderGallery();});$('#gallery-grid').addEventListener('click',e=>{const b=e.target.closest('button[data-image]');if(!b)return;const g=gallery.find(x=>x.image===b.dataset.image);$('#lightbox img').src=asset('assets/'+g.image);$('#lightbox img').alt=g.title;$('#lightbox p').textContent=g.description;$('#lightbox').showModal();});
const demos = [
  {
    "file": "annotation-workflow",
    "title": "Shape Canonicalization Workflow",
    "body": "Interactive orientation annotation through category grouping, prototype selection, rotation adjustment and collection-level inspection.",
    "caption": "Interactive annotation and canonical-orientation inspection"
  },
  {
    "file": "dataset-turntable-original",
    "title": "Multi-category RGB / NOCS Representations",
    "body": "Observe appearance and canonical-coordinate representations across objects to inspect multi-view rendering outputs.",
    "caption": "Multi-view visualization of paired appearance and canonical coordinates"
  }
];let demoIndex=0;
function renderDemos(changeVideo=false){$('#demo-list').innerHTML=demos.map((d,i)=>`<button data-index="${i}" class="${i===demoIndex?'active':''}" aria-pressed="${i===demoIndex}"><span class="demo-num">0${i+1}</span><div><h3>${d.title}</h3><p>${d.body}</p></div></button>`).join('');const d=demos[demoIndex];if(changeVideo){const v=$('#demo-player');v.pause();v.src=asset(`assets/${d.file}.mp4`);v.poster=asset(`assets/${d.file}.jpg`);v.load();}$('#demo-caption').textContent=d.caption;$('#demo-index').textContent=`0${demoIndex+1} / ${String(demos.length).padStart(2,'0')}`;}
$('#demo-list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;demoIndex=+b.dataset.index;renderDemos(true);});
$$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
function renderPage(){renderStage();renderExplorer();renderGallery();renderDemos();updatePresentationCounter();}
let presenting=false,chapterIndex=0;const chapters=$$('.chapter');
function updatePresentationCounter(){$('#chapter-counter').textContent=`${String(chapterIndex+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')} · ${chapters[chapterIndex].dataset.chapter}`;}
function goChapter(delta){chapterIndex=Math.min(chapters.length-1,Math.max(0,chapterIndex+delta));chapters[chapterIndex].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});updatePresentationCounter();}
function setPresentation(value){presenting=value;document.body.classList.toggle('presenting',value);$('#presentation-controls').hidden=!value;if(value){chapterIndex=chapters.reduce((best,c,i)=>Math.abs(c.getBoundingClientRect().top-86)<Math.abs(chapters[best].getBoundingClientRect().top-86)?i:best,0);updatePresentationCounter();}else $('#demo-player').pause();}
$('#present').addEventListener('click',()=>setPresentation(!presenting));$('#exit-presentation').addEventListener('click',()=>setPresentation(false));$('#prev-chapter').addEventListener('click',()=>goChapter(-1));$('#next-chapter').addEventListener('click',()=>goChapter(1));
document.addEventListener('keydown',e=>{if(!presenting||['INPUT','SELECT','BUTTON','CANVAS','VIDEO'].includes(document.activeElement.tagName)||$$('dialog').some(d=>d.open))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();goChapter(1);}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();goChapter(-1);}if(e.key==='Escape')setPresentation(false);});
// Point positions and descriptor colors come from the stored HDF5; projection is for display only.
const canvas=$('#feature-canvas'),ctx=canvas.getContext('2d');let yaw=-.45,pitch=-.25,zoom=1,cloudMode='features',drag=null;
let cloud=window.FEATURE_DATA;
if(cloud.samples){const choices=cloud.samples;$('#feature-sample').innerHTML=choices.map((s,i)=>`<option value="${i}">${s.category} / ${s.sample}</option>`).join('');cloud=choices[0];$('#feature-sample-label').textContent=cloud.category.toUpperCase()+' / SEMANTIC SURFACE';cloud.views.forEach((v,i)=>{$$('.prototype-thumbs img')[i].src=asset(v.path);});$('#feature-sample').addEventListener('change',e=>{cloud=choices[+e.target.value];$('#feature-sample-label').textContent=cloud.category.toUpperCase()+' / SEMANTIC SURFACE';const thumbs=$$('.prototype-thumbs img');cloud.views.forEach((v,i)=>{thumbs[i].src=asset(v.path);thumbs[i].alt=cloud.category+' RGB view '+v.id;});drawCloud();});}
function project(x,y,z,w,h){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),xx=x*cy-z*sy,zz=x*sy+z*cy,yy=y*cp-zz*sp,depth=y*sp+zz*cp;const s=Math.min(w,h)*.75*zoom/(1+depth*.14);return [w*.5+xx*s,h*.53-yy*s,depth];}
function drawCloud(){const rect=canvas.getBoundingClientRect();if(rect.width===0)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);const points=cloud.points.map(p=>{const q=project(p[0],p[1],p[2],w,h);const c=cloudMode==='features'?p.slice(3,6):(p.length>=9?p.slice(6,9):p.slice(0,3)).map(v=>Math.max(0,Math.min(1,v+.5)));return {q,c};}).sort((a,b)=>b.q[2]-a.q[2]);for(const {q,c} of points){ctx.fillStyle=`rgb(${c.map(v=>Math.round(v*255)).join(',')})`;const radius=Math.max(1,1.45*zoom/(1+q[2]*.2));ctx.beginPath();ctx.arc(q[0],q[1],radius,0,Math.PI*2);ctx.fill();}drawCoordinateGizmo(ctx,w,h,p=>project(...p,w,h));}
canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.009;pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-drag[1])*.009));drag=[e.clientX,e.clientY];drawCloud();});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(2.4,Math.max(.5,zoom-e.deltaY*.001));drawCloud();},{passive:false});canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch-=.12;if(e.key==='ArrowDown')pitch+=.12;if(e.key==='+'||e.key==='=')zoom=Math.min(2.4,zoom+.1);if(e.key==='-')zoom=Math.max(.5,zoom-.1);pitch=Math.max(-1.5,Math.min(1.5,pitch));drawCloud();}});$('#cloud-reset').addEventListener('click',()=>{yaw=-.45;pitch=-.25;zoom=1;drawCloud();});$('#cloud-modes').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(!b)return;cloudMode=b.dataset.mode;$$('#cloud-modes button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});drawCloud();});new ResizeObserver(drawCloud).observe(canvas);

renderPage();drawCloud();canvas.parentElement.classList.add('cloud-ready');
