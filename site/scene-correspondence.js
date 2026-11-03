(() => {
 const data=window.SCENE_CORRESPONDENCE_DATA,host=document.getElementById('scene-correspondence');if(!data||!host)return;
 const $=id=>document.getElementById(id),edges=[];for(let i=0;i<8;i++)for(const bit of [1,2,4])if(i<(i^bit))edges.push([i,i^bit]);
 let dataset=null,selected=0,mask=null,rgb=new Image(),imageBox=null,sceneHulls=[];
 const palette=['#68c9c7','#d7ac73','#b5ce89','#c3a9e4','#e799a1','#91b9dc','#d0bd82','#94d4ad','#c6aacd'];
 const mul=(R,x)=>R.map(row=>row.reduce((s,a,i)=>s+a*x[i],0));
 const projectCamera=p=>[dataset.intrinsics.fx*p[0]/p[2]+dataset.intrinsics.cx,dataset.intrinsics.fy*p[1]/p[2]+dataset.intrinsics.cy];
 function makeView(canvas,draw){
  const ctx=canvas.getContext('2d'),v={canvas,ctx,w:1,h:1,yaw:.45,pitch:.22,zoom:1,drag:null,moved:false};
  v.project=p=>{const cy=Math.cos(v.yaw),sy=Math.sin(v.yaw),cp=Math.cos(v.pitch),sp=Math.sin(v.pitch),x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy,y=p[1]*cp-z*sp,depth=p[1]*sp+z*cp,k=Math.min(v.w/1.9,v.h)*.76*v.zoom/(1+depth*.22);return [v.w/2+x*k,v.h/2-y*k,depth];};
  v.paint=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!dataset)return;v.w=r.width;v.h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#10212a';ctx.fillRect(0,0,v.w,v.h);draw(v);};
  canvas.addEventListener('pointerdown',e=>{v.drag={x:e.clientX,y:e.clientY,yaw:v.yaw,pitch:v.pitch};v.moved=false;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!v.drag)return;const dx=e.clientX-v.drag.x,dy=e.clientY-v.drag.y;if(Math.abs(dx)+Math.abs(dy)>4)v.moved=true;v.yaw=v.drag.yaw+dx*.008;v.pitch=Math.max(-1.35,Math.min(1.35,v.drag.pitch+dy*.008));v.paint();});
  canvas.addEventListener('pointerup',e=>{if(v.drag&&!v.moved&&v.pick){const r=canvas.getBoundingClientRect();v.pick(e.clientX-r.left,e.clientY-r.top);}v.drag=null;});canvas.addEventListener('pointercancel',()=>v.drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();v.zoom=Math.max(.5,Math.min(5,v.zoom*Math.exp(-e.deltaY*.001)));v.paint();},{passive:false});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')v.yaw-=.12;if(e.key==='ArrowRight')v.yaw+=.12;if(e.key==='ArrowUp')v.pitch+=.12;if(e.key==='ArrowDown')v.pitch-=.12;if(e.key==='+'||e.key==='=')v.zoom=Math.min(5,v.zoom*1.15);if(e.key==='-')v.zoom=Math.max(.5,v.zoom/1.15);v.paint();});
  new ResizeObserver(v.paint).observe(canvas);return v;
 }
 function line(v,a,b,color,width=1){const p=v.project(a),q=v.project(b);v.ctx.strokeStyle=color;v.ctx.lineWidth=width;v.ctx.beginPath();v.ctx.moveTo(p[0],p[1]);v.ctx.lineTo(q[0],q[1]);v.ctx.stroke();}
 function axes(v,points,convert){[['X','#ef8e83'],['Y','#b8d58f'],['Z','#8bbde8']].forEach(([name,color],i)=>{line(v,convert(points[0]),convert(points[i+1]),color,2);const p=v.project(convert(points[i+1]));v.ctx.fillStyle=color;v.ctx.font='11px system-ui';v.ctx.fillText(name,p[0]+5,p[1]-5);});}
 function cloud(v,points){points.sort((a,b)=>b.q[2]-a.q[2]).forEach(p=>{v.ctx.globalAlpha=p.alpha;v.ctx.fillStyle=`rgb(${p.color.map(x=>Math.round(x*255)).join(',')})`;v.ctx.beginPath();v.ctx.arc(p.q[0],p.q[1],p.size,0,Math.PI*2);v.ctx.fill();});v.ctx.globalAlpha=1;}
 function hull(points){const sorted=points.map(p=>p.slice(0,2)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const lower=[],upper=[];for(const p of sorted){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of sorted.slice().reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
 function inside(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
 function sceneTransform(){const o=dataset.objects[selected],isolate=$('correspondence-isolate').checked,bounds=isolate?[o.box_camera.reduce((a,p)=>a.map((v,k)=>Math.min(v,p[k])),[Infinity,Infinity,Infinity]),o.box_camera.reduce((a,p)=>a.map((v,k)=>Math.max(v,p[k])),[-Infinity,-Infinity,-Infinity])]:dataset.bounds,c=bounds[0].map((v,k)=>(v+bounds[1][k])/2),s=Math.max(...bounds[0].map((v,k)=>bounds[1][k]-v));return p=>[(p[0]-c[0])/s,-(p[1]-c[1])/s,-(p[2]-c[2])/s];}
 const scene=makeView($('correspondence-scene'),v=>{
  const base=sceneTransform(),isolated=$('correspondence-isolate').checked,points=[],count=dataset.objects.length,columns=3,rows=Math.ceil(count/columns);
  const scenePoint=p=>{const q=base(p);return [q[0]*.78-.57,q[1]*.78,q[2]*.78];};
  const objectPoint=(p,index)=>{const scale=isolated?.65:.25,x=isolated?.57:.37+(index%columns)*.29,y=isolated?0:((rows-1)/2-Math.floor(index/columns))*.33;return [x+p[0]*scale,y+p[2]*scale,-p[1]*scale];};
  sceneHulls=[];$('correspondence-scene-markers').replaceChildren();
  if($('correspondence-lines').checked){const o=dataset.objects[selected],step=Math.max(1,Math.floor(o.points.length/12));o.points.filter((p,i)=>i%step===0).slice(0,12).forEach(p=>line(v,scenePoint(p.slice(0,3)),objectPoint(p.slice(3,6),selected),'#dceba338',.8));}
  dataset.objects.forEach((o,index)=>{
   if(isolated&&index!==selected)return;
   const active=index===selected;
   for(const space of ['scene','object']){
    const transform=space==='scene'?scenePoint:p=>objectPoint(p,index),box=(space==='scene'?o.box_camera:o.box_canonical).map(transform),projected=box.map(v.project);
    sceneHulls.push({index,space,poly:hull(projected),depth:projected.reduce((s,p)=>s+p[2],0)/8});
    edges.forEach(([a,b])=>line(v,box[a],box[b],active?'#eef3b4':palette[index%palette.length]+'70',active?1.8:1));
    o.points.forEach(p=>points.push({q:v.project(transform(p.slice(space==='scene'?0:3,space==='scene'?3:6))),color:p.slice(6,9),size:active?2.3:1.4,alpha:active?1:.4}));
    if(active)axes(v,space==='scene'?o.axes_camera:o.axes_canonical,transform);
   }
  });
  cloud(v,points);
  sceneHulls.forEach(h=>{const o=dataset.objects[h.index],x=h.poly.reduce((s,p)=>s+p[0],0)/h.poly.length,y=h.poly.reduce((s,p)=>s+p[1],0)/h.poly.length;if(x<0||y<0||x>v.w||y>v.h)return;const button=document.createElement('button');button.type='button';button.className='correspondence-pick'+(h.index===selected?' active':'');button.textContent=o.id;button.style.left=x+'px';button.style.top=y+'px';button.setAttribute('aria-label',`Select ${o.category} object ${o.id} in ${h.space==='scene'?'3D':'object collection'}`);button.addEventListener('click',()=>select(h.index));$('correspondence-scene-markers').append(button);});
  [['CAMERA-SPACE ARRANGEMENT',[-.57,.59,0]],['CANONICAL OBJECT COLLECTION',[.65,.59,0]]].forEach(([label,p])=>{const q=v.project(p);v.ctx.font='10px system-ui';v.ctx.textAlign='center';v.ctx.fillStyle='#b5c9c6';v.ctx.fillText(label,q[0],q[1]);});v.ctx.textAlign='left';
 });
 scene.yaw=.12;scene.pitch=.18;
 scene.pick=(x,y)=>{const candidates=sceneHulls.filter(h=>inside(h.poly,x,y)).sort((a,b)=>a.depth-b.depth);if(candidates.length)select(candidates[0].index);};
 function selectAtUV(x,y){if(!dataset||x<0||x>=1||y<0||y>=1)return;const id=mask[Math.floor(y*dataset.map_size[1])*dataset.map_size[0]+Math.floor(x*dataset.map_size[0])],index=dataset.objects.findIndex(o=>o.id===id);if(index>=0)select(index);}
 function drawImage(){
  if(!dataset||!rgb.complete||!rgb.naturalWidth)return;const canvas=$('correspondence-image'),r=canvas.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);const fit=Math.min(r.width/dataset.rgb_size[0],r.height/dataset.rgb_size[1]),w=dataset.rgb_size[0]*fit,h=dataset.rgb_size[1]*fit,x=(r.width-w)/2,y=(r.height-h)/2;imageBox={x,y,w,h};ctx.fillStyle='#e6e9e1';ctx.fillRect(0,0,r.width,r.height);ctx.drawImage(rgb,x,y,w,h);$('correspondence-image-markers').replaceChildren();dataset.objects.forEach((object,index)=>{if(!object.pick_uv)return;const button=document.createElement('button');button.type='button';button.className='correspondence-pick'+(index===selected?' active':'');button.textContent=object.id;button.setAttribute('aria-label',`Select ${object.category} object ${object.id} in image`);button.style.left=(x+object.pick_uv[0]*w)+'px';button.style.top=(y+object.pick_uv[1]*h)+'px';button.addEventListener('click',()=>selectAtUV(...object.pick_uv));$('correspondence-image-markers').append(button);});
  const o=dataset.objects[selected],verts=o.box_camera.map(projectCamera);ctx.strokeStyle='#e9f3a3';ctx.lineWidth=2;edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(x+verts[a][0]*fit,y+verts[a][1]*fit);ctx.lineTo(x+verts[b][0]*fit,y+verts[b][1]*fit);ctx.stroke();});
  [['X','#e24a43'],['Y','#7da02b'],['Z','#4e92df']].forEach(([name,color],i)=>{const a=projectCamera(o.axes_camera[0]),b=projectCamera(o.axes_camera[i+1]);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+a[0]*fit,y+a[1]*fit);ctx.lineTo(x+b[0]*fit,y+b[1]*fit);ctx.stroke();ctx.font='11px system-ui';ctx.fillText(name,x+b[0]*fit+3,y+b[1]*fit-3);});
 }
 $('correspondence-image').addEventListener('click',e=>{if(!imageBox||!dataset)return;const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left-imageBox.x)/imageBox.w,y=(e.clientY-r.top-imageBox.y)/imageBox.h;selectAtUV(x,y);});
 function select(index){selected=index;const o=dataset.objects[index];$('correspondence-object').value=String(index);$('correspondence-selection').textContent=`${o.category} · Object ${o.id}`;$('correspondence-samples').textContent=`${o.source_sample_count.toLocaleString('en-US')} valid source NOCS pixels · ${o.display_sample_count.toLocaleString('en-US')} displayed points`;
  $('correspondence-nocs').hidden=!o.source_sample_count;if(o.nocs_crop)$('correspondence-nocs').src=asset(o.nocs_crop);$('correspondence-nocs').alt=`${dataset.dataset} ${o.category} object ${o.id}: source NOCS pixels`;
  $('correspondence-surface-note').textContent=o.source_sample_count?'Visible surface samples from the source annotation; geometry uses uniform max-side normalization.':'No valid source NOCS pixels for this object. Its annotated box and coordinate axes remain available.';
  $('correspondence-metrics').textContent=`Size: ${o.size.map(v=>v.toFixed(2)).join(' × ')} m · Median source reprojection residual: ${o.reprojection_median_px==null?'unavailable':o.reprojection_median_px.toFixed(3)+' px'}`;
  drawImage();scene.paint();
 }
 window.updateSceneCorrespondence=id=>{const next=data.datasets.find(d=>d.id===id||d.dataset===id);host.hidden=!next;if(!next)return;dataset=next;mask=new Uint16Array(dataset.map_size[0]*dataset.map_size[1]);let pos=0;for(let i=0;i<dataset.instance_rle.length;i+=2){mask.fill(dataset.instance_rle[i+1],pos,pos+dataset.instance_rle[i]);pos+=dataset.instance_rle[i];}
  $('correspondence-dataset').textContent=dataset.dataset;$('correspondence-frame').textContent=dataset.frame;$('correspondence-object').replaceChildren();dataset.objects.forEach((o,i)=>{const option=document.createElement('option');option.value=i;option.textContent=`${o.category} · Object ${o.id}`;$('correspondence-object').append(option);});selected=dataset.objects.reduce((best,o,i)=>o.source_sample_count>dataset.objects[best].source_sample_count?i:best,0);scene.zoom=1;rgb=new Image();rgb.onload=drawImage;rgb.src=asset(dataset.rgb);select(selected);
 };
 $('correspondence-object').addEventListener('change',e=>select(+e.target.value));$('correspondence-isolate').addEventListener('change',()=>{scene.zoom=1;scene.paint();});$('correspondence-reset').addEventListener('click',()=>{scene.yaw=.12;scene.pitch=.18;scene.zoom=1;drawImage();scene.paint();});
 $('correspondence-lines').addEventListener('change',()=>scene.paint());
 new ResizeObserver(drawImage).observe($('correspondence-image'));
 window.updateSceneCorrespondence($('scene-dataset-name').textContent);
})();
