#!/usr/bin/env python3
"""Publish bounded presentation assets; keep originals immutable in Git history.

Every model, batch, legacy page and current-release byte is retained. Historical
original-image references resolve to commit-pinned raw files; local WebP previews
remain on Pages. No image is regenerated, resized, rebranded or deleted here.
"""
import argparse,hashlib,json,posixpath,re,shutil,subprocess,urllib.parse
from pathlib import Path,PurePosixPath

ORIGINALS=('assets/models/','assets/migrated/','assets/batches/')
IMAGE={'.png','.jpg','.jpeg','.webp','.gif','.avif'}
TEXT={'.html','.css','.js','.mjs','.json','.webmanifest','.xml','.txt'}
MAX_BYTES=700*1024**2
RAW='https://raw.githubusercontent.com/chuyiouart/ouart-model-site/'

def array(text):
    return json.loads(text[text.index('['):text.rindex(']')+1])

def strings(value):
    if isinstance(value,str):yield value
    elif isinstance(value,dict):
        for item in value.values():yield from strings(item)
    elif isinstance(value,list):
        for item in value:yield from strings(item)

def asset_path(value,relative='index.html'):
    parts=urllib.parse.urlsplit(value)
    if parts.scheme or parts.netloc:return None
    decoded=urllib.parse.unquote(parts.path)
    path=posixpath.normpath(posixpath.join(posixpath.dirname(relative),decoded))
    return path if path.startswith('assets/') and '..' not in PurePosixPath(path).parts else None

def public_file(rel):
    p=PurePosixPath(rel)
    if p.is_absolute() or '..' in p.parts:return False
    if any(x.startswith('.') for x in p.parts):return rel=='.nojekyll'
    if rel.startswith(('backups/','design/','tests/','tools/')):return False
    if rel.startswith('scripts/'):return p.suffix in {'.js','.mjs','.css'}
    return rel.startswith(('assets/','data/','content/')) or p.suffix in TEXT|{'.ico'} or rel in {'CNAME','.nojekyll'}

def rewrite_url(value,relative,offloaded,commit):
    path=asset_path(value,relative)
    if path not in offloaded:return value
    parts=urllib.parse.urlsplit(value)
    result=RAW+commit+'/'+urllib.parse.quote(path,safe='/')
    if parts.query:result+='?'+parts.query
    if parts.fragment:result+='#'+parts.fragment
    return result

def rewrite_data(value,offloaded,commit):
    if isinstance(value,str):return rewrite_url(value,'index.html',offloaded,commit)
    if isinstance(value,list):return [rewrite_data(v,offloaded,commit) for v in value]
    if isinstance(value,dict):return {k:rewrite_data(v,offloaded,commit) for k,v in value.items()}
    return value

def rewrite_text(text,relative,offloaded,commit):
    if relative in ('data/models.js','data/batches.js'):
        start=text.index('[');end=text.rindex(']')+1
        return text[:start]+json.dumps(rewrite_data(array(text),offloaded,commit),ensure_ascii=False,indent=2)+text[end:]
    if relative.endswith('.html'):
        def attr(match):
            return match[1]+match[2]+rewrite_url(match[3],relative,offloaded,commit)+match[2]
        text=re.sub(r'((?:src|href|poster)\s*=\s*)(["\'])(.*?)\2',attr,text,flags=re.I)
    if relative.endswith(('.html','.css')):
        def css(match):
            q=match[1];return 'url('+q+rewrite_url(match[2],relative,offloaded,commit)+q+')'
        text=re.sub(r'url\(\s*(["\']?)([^)"\']+)\1\s*\)',css,text)
    return text

def build(root,output,commit,limit=MAX_BYTES):
    root=Path(root).resolve();output=Path(output).absolute()
    if not re.fullmatch('[0-9a-f]{40}',commit):raise ValueError('full source commit required')
    if output.exists() or any(p.is_symlink() for p in (output,*output.parents)):raise ValueError('new non-symlink output required')
    if output==root or root.is_relative_to(output):raise ValueError('unsafe output root')
    tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0');tracked=[p for p in tracked if p]
    for rel in tracked:
        p=root/rel
        if PurePosixPath(rel).is_absolute() or '..' in PurePosixPath(rel).parts or p.is_symlink():raise ValueError('unsafe tracked path')
    models=array((root/'data/models.js').read_text());batches=array((root/'data/batches.js').read_text())
    dates=[m['date'] for m in models if m.get('published') is True and re.fullmatch(r'\d{4}-\d{2}-\d{2}',m.get('date',''))]
    if not dates:raise ValueError('published model date missing')
    latest=max(dates);current=[m for m in models if m.get('published') is True and m.get('date')==latest]
    batch_ids={m.get('batchId') for m in current}
    current_batches=[b for b in batches if b.get('id') in batch_ids or b.get('date')==latest]
    keep={p for value in strings(current+current_batches) if (p:=asset_path(value))}
    offloaded={rel for rel in tracked if rel.startswith(ORIGINALS) and Path(rel).suffix.lower() in IMAGE and rel not in keep}
    output.mkdir(parents=True)
    source_bytes=0;published_bytes=0;count=0
    for rel in tracked:
        source=root/rel
        if not source.is_file():raise ValueError('tracked file missing '+rel)
        source_bytes+=source.stat().st_size
        if not public_file(rel) or rel in offloaded:continue
        dest=output/rel;dest.parent.mkdir(parents=True,exist_ok=True)
        if source.suffix.lower() in TEXT:
            text=rewrite_text(source.read_text(encoding='utf-8'),rel,offloaded,commit);dest.write_text(text,encoding='utf-8')
        else:shutil.copyfile(source,dest)
        published_bytes+=dest.stat().st_size;count+=1
    # Current published objects are copied byte-for-byte, with no new image edits.
    for rel in keep:
        if not (root/rel).is_file() or not (output/rel).is_file():raise ValueError('current asset absent '+rel)
        if hashlib.sha256((root/rel).read_bytes()).digest()!=hashlib.sha256((output/rel).read_bytes()).digest():raise ValueError('current asset changed '+rel)
    # Every data image reference is still either locally supplied or immutable raw.
    for rel in ('data/models.js','data/batches.js'):
        for value in strings(array((output/rel).read_text())):
            path=asset_path(value)
            if path and not (output/path).is_file():raise ValueError('unresolved public data asset '+path)
    proof={'schema':'OUART_BOUNDED_PAGES_V1','source_commit':commit,'latest_date':latest,'source_bytes':source_bytes,'published_bytes':published_bytes,'budget_bytes':limit,'offloaded_originals':len(offloaded),'local_files':count,'model_count':len(models),'batch_count':len(batches),'originals_modified':False,'current_asset_hashes_verified':True}
    data=(json.dumps(proof,indent=2)+'\n').encode();published_bytes+=len(data)
    if published_bytes>limit:raise ValueError('Pages presentation bundle exceeds pre-upload budget: '+str(published_bytes))
    (output/'pages-bundle.json').write_bytes(data);(output/'.nojekyll').touch()
    return proof

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--output',type=Path,required=True);p.add_argument('--commit');a=p.parse_args()
    commit=a.commit or subprocess.check_output(['git','rev-parse','HEAD'],cwd=a.root,text=True).strip()
    print(json.dumps(build(a.root,a.output,commit),ensure_ascii=False))
