/* Verify the measured data used by the method, matching and scene displays. */
const assert=require('node:assert/strict'),path=require('node:path');
global.window={};
for(const name of ['feature','algorithm','canonical','scene'])require(path.join(__dirname,'../site/'+name+'-data.js'));
const finite=p=>p.every(Number.isFinite),sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(const s of window.FEATURE_DATA.samples){assert.equal(s.points.length,s.point_count);assert.equal(s.feature_dimension,384);assert(s.points.every(finite));}
for(const c of window.ALGORITHM_DATA.cases){
 assert.equal(c.keypoints,2048);assert(c.source.every(finite)&&c.target.every(finite));
 for(const v of Object.values(c.variants)){
  assert.deepEqual(v.candidates.map(x=>x.angle),[0,90,180,-90]);
  assert.equal(v.candidates.find(x=>x.angle===v.selected_angle).residual_yaw,Math.min(...v.candidates.map(x=>x.residual_yaw)));
  for(const x of v.candidates){assert(x.correspondences<=c.keypoints);assert(x.links.every(l=>finite(l.source)&&finite(l.target)));}
 }
}
let rotationError=0;
for(const g of window.CANONICAL_DATA.groups)for(const o of g.objects){
 assert(o.vertices.every(finite)&&o.normals.every(finite));assert(o.faces.every(f=>f.every(i=>Number.isInteger(i)&&i>=0&&i<o.vertices.length)));
 const [w,x,y,z]=o.quaternion,R=[[1-2*y*y-2*z*z,2*x*y-2*w*z,2*x*z+2*w*y],[2*x*y+2*w*z,1-2*x*x-2*z*z,2*y*z-2*w*x],[2*x*z-2*w*y,2*y*z+2*w*x,1-2*x*x-2*y*y]];
 rotationError=Math.max(rotationError,...R.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-o.rotation[i][j]))));
}
assert(rotationError<2e-6,'Interpolated mesh rotations must match the stored export rotation');
const layout=window.SCENE_DATA.layout;assert.equal(layout.objects.length,layout.represented_instances);assert(layout.represented_instances<=layout.source_instances);assert.equal(layout.objects.reduce((n,o)=>n+o.world.length,0),layout.sampled_surface_points);
let sceneError=0;
for(const o of layout.objects){
 assert.equal(o.world.length,o.canonical.length);
 const a=sub(o.canonical_bbox[1],o.canonical_bbox[0]),b=sub(o.canonical_bbox[2],o.canonical_bbox[0]),c=sub(o.canonical_bbox[4],o.canonical_bbox[0]),det=dot(a,cross(b,c)),worldEdges=[1,2,4].map(i=>sub(o.bbox[i],o.bbox[0]));assert(Math.abs(det)>1e-12);
 o.canonical.forEach((p,i)=>{const q=sub(p,o.canonical_bbox[0]),t=[dot(q,cross(b,c)),dot(a,cross(q,c)),dot(a,cross(b,q))].map(v=>v/det);const v=o.bbox[0].map((x,k)=>x+t.reduce((s,y,j)=>s+y*worldEdges[j][k],0));sceneError=Math.max(sceneError,...v.map((x,k)=>Math.abs(x-o.world[i][k])));});
}
assert(sceneError<1e-4,'HSSD canonical and world surfaces must follow the same box transform within export precision');
console.log(`Pipeline data verified: candidate minima, feature counts, mesh rotations; HSSD display transform error ${sceneError.toPrecision(3)}`);
