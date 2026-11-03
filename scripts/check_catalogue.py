"""Check published catalogue counts against the independently extracted source rows."""
from pathlib import Path
import csv,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
data=json.loads((SITE/'coverage-data.js').read_text().split('=',1)[1].rstrip(';\n'))
stats=json.loads((SITE/'catalogue-statistics.json').read_text())
rows=list(csv.DictReader((SITE/'catalogue-counts.csv').open()))
categories={c['id']:c for c in data['categories']};export={c['id']:c for c in stats['categories']}
assert len(categories)==len(data['categories'])==len(rows)==stats['source_category_groups']
assert set(categories)==set(export)=={r['category_id'] for r in rows}
for row in rows:
 c=categories[row['category_id']];s=export[c['id']]
 assert c['dataset']==row['dataset'] and c['count']==int(row['count'])
 assert c['count']==s['count'] and c['source_category']==s['source_category']
 assert len(c['flags'])==c['count'] and all(f&1 for f in c['flags'])
 for bit,key in [(2,'orientation_count'),(4,'render_count')]:
  assert c[key]==s[key]
  assert c[key] is None or 0<=c[key]<=c['count']
  assert sum(bool(f&bit) for f in c['flags'])==(c[key] or 0)
 for key in ['preview','overview','coordinate_preview']:
  if c.get(key):assert (SITE/c[key]).is_file(),c[key]
 for key in ['rgb','nocs']:
  if c.get('example'):assert (SITE/c['example'][key]).is_file()
for ds in data['datasets']:
 cc=[c for c in categories.values() if c['dataset']==ds['id']]
 assert len(cc)==ds['categories'] and sum(c['count'] for c in cc)==ds['instances']
 assert next(x for x in stats['datasets'] if x['id']==ds['id'])==ds
n=sum(c['count'] for c in categories.values());assert n==stats['catalogue_entries']==sum(int(r['count']) for r in rows)
html=(SITE/'index.html').read_text();assert f'{n:,}' in html and f'{len(categories):,}' in html
collection=(SITE/'collection.js').read_text();assert f'{n:,}' in collection and f'{len(categories):,}' in collection
images=stats['coordinate_previews']['images'];assert len(images)==stats['coordinate_previews']['matched_categories']
assert len({r['category_id'] for r in images})==len(images)
for row in images:
 c=categories[row['category_id']];assert c['coordinate_source']=={k:v for k,v in row.items() if k!='category_id'}
 assert hashlib.sha256((SITE/c['coordinate_preview']).read_bytes()).hexdigest()==row['image_sha256']
print(f'Catalogue verified: {n:,} entries, {len(categories):,} categories, {len(images)} original coordinate previews')

overviews=stats['category_overviews']['images'];assert len(overviews)==stats['category_overviews']['matched_categories']
assert len({r['category_id'] for r in overviews})==len(overviews)
assert {c['id'] for c in categories.values() if c.get('overview')}=={r['category_id'] for r in overviews}
for row in overviews:
 c=categories[row['category_id']];assert c['overview_source']=={k:v for k,v in row.items() if k!='category_id'}
 assert hashlib.sha256((SITE/c['overview']).read_bytes()).hexdigest()==row['image_sha256']
print(f'Category overview assets verified: {len(overviews)} native-resolution figures')
