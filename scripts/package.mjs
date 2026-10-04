import {execFileSync} from 'node:child_process';
execFileSync('python',['-c',`import pathlib,zipfile
root=pathlib.Path('.').resolve()
items=['dynamic-lab.html','package.json','package-lock.json','README.md','ATTRIBUTIONS.md','ASSET_MANIFEST.json','src','assets','vendor','licenses','public','scripts','tests','docs']
with zipfile.ZipFile('sharara-lab.zip','w',zipfile.ZIP_DEFLATED) as z:
 parent_index = root.parent / 'index.html'
 if parent_index.is_file():
  z.write(parent_index, 'sharara-lab/index.html')
 for item in items:
  p=root/item
  if p.exists():
   for f in ([p] if p.is_file() else p.rglob('*')):
    if f.is_file(): z.write(f,'sharara-lab/'+str(f.relative_to(root)))
print('sharara-lab.zip created')`],{stdio:'inherit'});
