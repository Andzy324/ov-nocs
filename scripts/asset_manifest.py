"""Refresh the repository-relative inventory after adding or replacing assets."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
files=sorted([p for p in (ROOT/'site').rglob('*') if p.is_file() and p.suffix in {'.png','.jpg','.webp','.mp4'}]+list((ROOT/'figures').glob('*.png'))+[p for p in (ROOT/'site').glob('*-data.js')]+[ROOT/'site/data.js',ROOT/'site/catalogue-statistics.json',ROOT/'site/catalogue-counts.csv'])
records=[{'file':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(ROOT/'assets.json').write_text(json.dumps({'files':records},indent=2)+'\n')
print(f'Indexed {len(records)} media and display-data assets')
