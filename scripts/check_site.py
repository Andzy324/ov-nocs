"""Validate release paths, tracked assets and executable display data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for key,val in attrs:
   if key not in {'src','href','poster'} or not val or val.startswith(('#','data:')):continue
   if urlsplit(val).scheme:continue
   assert not val.startswith('/'),f'Root-relative link breaks project hosting: {val}'
   assert (SITE/urlsplit(val).path).is_file(),f'Missing local asset: {val}'
html=(SITE/'index.html').read_text();Links().feed(html)
assert 'noindex' not in html
for p in SITE.glob('*'):
 if p.suffix in {'.html','.css','.js'}:
  text=p.read_text();assert not re.search(r'/home/|/tmp/|file://|127\.0\.0\.1|localhost',text),f'Local-only path in {p.name}'
  if p.suffix=='.js':subprocess.run(['node','--check',str(p)],check=True)
manifest=json.loads((ROOT/'assets.json').read_text())['files']
for record in manifest:
 p=ROOT/record['file'];assert p.is_file(),record['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==record['sha256'],f'Asset changed; refresh inventory: {record["file"]}'
assert set(p['file'] for p in manifest if p['file'].startswith('site/assets/'))==set(str(p.relative_to(ROOT)) for p in (SITE/'assets').iterdir() if p.is_file())
subprocess.run(['python3',str(ROOT/'scripts/check_catalogue.py')],check=True)
print(f'Validated project-relative links, {len(manifest)} tracked assets, and JavaScript syntax')
