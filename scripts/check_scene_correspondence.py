"""Validate source-mask identity and object/camera/canonical geometry of linked scene views."""
from pathlib import Path
import hashlib,json,math
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
data=json.loads((SITE/'scene-correspondence-data.js').read_text().split('=',1)[1].rstrip(';\n'))
matvec=lambda A,p:[sum(a*x for a,x in zip(row,p)) for row in A]
count=0;max_error=0
for ds in data['datasets']:
 assert ds['id'] in {'kitti','arkitscenes'}
 w,h=ds['map_size'];runs=ds['instance_rle'];mask=[]
 assert len(runs)%2==0
 for i in range(0,len(runs),2):assert runs[i]>0;mask.extend([runs[i+1]]*runs[i])
 assert len(mask)==w*h
 assert len({o['id'] for o in ds['objects']})==len(ds['objects'])
 for source in ds['original_annotations'].values():assert hashlib.sha256((SITE/source['file']).read_bytes()).hexdigest()==source['sha256']
 assert (SITE/ds['rgb']).is_file()
 for o in ds['objects']:
  assert all(v>0 for v in o['size']);assert abs(o['max_side_m']-max(o['size']))<1e-12
  assert len(o['points'])==o['display_sample_count']<=o['source_sample_count']
  if o['nocs_crop']:assert (SITE/o['nocs_crop']).is_file()
  if o.get('pick_uv'):
   x,y=int(o['pick_uv'][0]*w),int(o['pick_uv'][1]*h);assert mask[y*w+x]==o['id']
  for p in o['points']:
   assert len(p)==11 and all(math.isfinite(v) for v in p)
   local=[(p[6+k]-.5)*o['size'][k] for k in range(3)];camera=[a+b for a,b in zip(matvec(o['rotation'],local),o['translation'])];canon=[v/o['max_side_m'] for v in local]
   err=max(abs(p[k]-camera[k]) for k in range(3));max_error=max(max_error,err);assert err<2e-6
   assert max(abs(p[3+k]-canon[k]) for k in range(3))<2e-6
   x,y=int(p[9]*w),int(p[10]*h);assert 0<=x<w and 0<=y<h;assert mask[y*w+x]==o['id']
   count+=1
  assert len(o['box_camera'])==len(o['box_canonical'])==8
  for a,b in zip(o['box_camera'],o['box_canonical']):
   camera=[v+t for v,t in zip(matvec(o['rotation'],[x*o['max_side_m'] for x in b]),o['translation'])];assert max(abs(a[k]-camera[k]) for k in range(3))<2e-6
 assert ds['validation']['roundtrip_max_error_m']<1e-10
print(f'Linked scene geometry verified: {len(data["datasets"])} datasets, {count} instance-matched points; max export transform error {max_error:.2g} m')
