/* Exercise the shipped atlas script with DOM/canvas stand-ins and real catalogue data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function setup(fixture){
 const ids=new Map(),frames=[],paint=[],sourceButtons=[],stageButtons=[];
 class Element{
  constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.dataset={};this.value='';this._text='';this.style={setProperty(){}};this.classList={toggle(){},add(){}};}
  set textContent(t){this._text=String(t);}get textContent(){return this._text;}
  append(...children){this.children.push(...children);}replaceChildren(){this.children=[];}setAttribute(){}addEventListener(name,fn){this.events[name]=fn;}
  getBoundingClientRect(){return {left:0,top:0,width:1000,height:600};}setPointerCapture(){}closest(){return null;}
  getContext(){return context;}
 }
 const context=new Proxy({createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:30}),fillRect(){if(/^#[0-9a-f]{6}$/i.test(this.fillStyle)&&this.fillStyle!=='#0b171e')paint.push([this.fillStyle,this.globalCompositeOperation]);}},{get:(target,key)=>key in target?target[key]:()=>{}});
 const document={getElementById:id=>{if(!ids.has(id))ids.set(id,new Element(id.includes('canvas')?'canvas':'div'));return ids.get(id);},createElement:tag=>new Element(tag),querySelectorAll:selector=>selector.includes('coverage-sources')?sourceButtons:stageButtons};
 const sandbox={document,matchMedia:()=>({matches:true}),devicePixelRatio:1,performance:{now:()=>100},requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame(){},ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}},IntersectionObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn([{isIntersecting:true}]);}disconnect(){}},asset:x=>x,Set,Map,Float32Array,console};sandbox.window=sandbox;vm.createContext(sandbox);
 if(fixture)sandbox.COVERAGE_DATA=fixture;else vm.runInContext(fs.readFileSync(path.join(root,'site/coverage-data.js'),'utf8'),sandbox);
 for(const id of ['all',...sandbox.COVERAGE_DATA.datasets.map(d=>d.id)]){const e=new Element('button');e.dataset.source=id;sourceButtons.push(e);}
 for(const stage of [1,2,4]){const e=new Element('button');e.dataset.stage=String(stage);stageButtons.push(e);}
 vm.runInContext(fs.readFileSync(path.join(root,'site/coverage.js'),'utf8'),sandbox);
 const click=(id,button)=>ids.get(id).events.click({target:{closest:()=>button}});
 return {sandbox,Element,paint,ids,source(id){click('coverage-sources',sourceButtons.find(b=>b.dataset.source===id));},stage(n){click('coverage-stages',stageButtons.find(b=>+b.dataset.stage===n));},search(value){ids.get('coverage-search').value=value;ids.get('coverage-search').events.input({target:{value}});},stats(){return ['coverage-lit','coverage-groups','coverage-datasets'].map(id=>ids.get(id)?.textContent);},flush(){frames.splice(0).forEach(fn=>fn(100));}};
}
const test=setup();
test.source('omni');test.search('backpack');test.source('future');
assert.equal(test.ids.get('coverage-lit').textContent,'14,812','Dataset changes must clear the previous category query');
assert.equal(test.ids.get('coverage-search').value,'');
for(const [id,n,groups] of [['oxl',44473,434],['omni',4302,153],['future',14812,49],['hssd',15293,400],['shapenet',52472,55]]){
 test.source(id);assert.deepEqual(test.stats(),[n.toLocaleString('en-US'),String(groups),'1']);
}
test.source('all');assert.deepEqual(test.stats(),['131,352','1,091','5']);
test.stage(4);assert.deepEqual(test.stats(),['89,894','629','5']);
test.source('future');assert.deepEqual(test.stats(),['14,809','49','1']);
test.stage(2);test.source('hssd');assert.deepEqual(test.stats(),['Not reported','Not reported','1']);
test.source('all');assert.deepEqual(test.stats(),['63,587','636','5']);
test.search('nonexistent-category');assert.deepEqual(test.stats(),['0','0','0']);
test.stage(1);test.source('all');test.flush();
const colors=new Set(test.sandbox.COVERAGE_DATA.datasets.map(d=>d.color));
assert.equal(new Set(test.paint.filter(([color,mode])=>colors.has(color)&&mode==='source-over').map(([color])=>color)).size,5,'Dataset point hues must survive compositing');
const tiny={datasets:[{id:'test',name:'Test',color:'#61d6dc',center3d:[0,0,0],sphere_radius:20}],categories:[{id:'hidden',dataset:'test',label:'hidden',count:1,sphere:[0,0,0,10],flags:[1],orientation_count:null,render_count:null},{id:'visible',dataset:'test',label:'visible',count:1,sphere:[0,0,0,10],flags:[3],orientation_count:1,render_count:null}]};
const picking=setup(tiny),canvas=new picking.Element('canvas'),picked=[];
const view=picking.sandbox.createObjectConstellation(canvas,{onPick:c=>picked.push(c.id)});view.setStage(2);picking.flush();
canvas.events.pointerdown({clientX:500,clientY:300,pointerId:1});canvas.events.pointerup({clientX:500,clientY:300,pointerId:1});
assert.deepEqual(picked,['visible'],'An invisible category must not intercept a click');
console.log('Constellation interactions verified: dataset/search reset, stage counts, five hues, and visible-category picking');
