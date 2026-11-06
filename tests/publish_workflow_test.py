"""Exercise publishing against a local bare Git repository and a fake deployer."""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile

source=Path(__file__).resolve().parents[1]
root=Path(tempfile.mkdtemp(prefix='3gpp-studio-publish-test-'))
bare=root/'origin.git'; work=root/'work'; bin_dir=root/'bin'; bin_dir.mkdir()
real_git=shutil.which('git')
def run(*args,cwd=None,env=None,check=True):
 p=subprocess.run(args,cwd=cwd,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 if check and p.returncode: raise RuntimeError('command failed: '+str(args)+'\n'+p.stdout[-4000:])
 return p
run(real_git,'clone','--bare',str(source),str(bare))
run(real_git,'clone',str(bare),str(work))
for folder in ('scripts','tools','docs'):
 shutil.copytree(source/folder,work/folder,dirs_exist_ok=True)
for name in ('README.md','public-labs.json'):
 shutil.copy2(source/name,work/name)
run(real_git,'config','user.name','Test Maintainer',cwd=work)
run(real_git,'config','user.email','test@example.invalid',cwd=work)
shim=bin_dir/'git'
shim.write_text('#!/bin/bash\nif [[ "$*" == "remote get-url origin" ]]; then\n  echo https://github.com/qtwhat/3GPP.studio.git\n  exit 0\nfi\nexec '+real_git+' "$@"\n')
shim.chmod(0o755)
stub=root/'wrangler.cjs'
stub.write_text("const fs=require('fs'); if(process.env.STUB_FAIL==='1'){console.error('simulated deployment failure');process.exit(23);} fs.cpSync(process.argv[4],process.env.STUB_SITE_ROOT,{recursive:true}); console.log('simulated Cloudflare deployment');\n")
site=root/'site';site.mkdir()
env=os.environ.copy();env.update(PATH=str(bin_dir)+os.pathsep+env.get('PATH',''),WRANGLER_JS=str(stub),STUB_SITE_ROOT=str(site),SITE_CHECK_URL=site.as_uri())
first=run('bash','scripts/publish.sh',cwd=work,env=env,check=False)
assert first.returncode==0,first.stdout[-6000:]
expected_files=sum(p.is_file() for p in (work/'prototype').rglob('*'))
assert f'Verified {expected_files} published files' in first.stdout,first.stdout[-3000:]
assert run(real_git,'rev-parse','HEAD',cwd=work).stdout.strip()==run(real_git,'rev-parse','main',cwd=bare).stdout.strip()
print(f'PASS: local commit, push, deployment and all {expected_files} file hashes match')
peer=root/'peer';run(real_git,'clone',str(bare),str(peer));run(real_git,'config','user.name','Contributor',cwd=peer);run(real_git,'config','user.email','contributor@example.invalid',cwd=peer)
with (peer/'README.md').open('a') as f:f.write('\nCommunity contribution.\n')
run(real_git,'add','README.md',cwd=peer);run(real_git,'commit','-m','Community update',cwd=peer);run(real_git,'push','origin','main',cwd=peer)
with (work/'README.md').open('a') as f:f.write('\nUnpublished local edit.\n')
second=run('bash','scripts/publish.sh',cwd=work,env=env,check=False)
assert second.returncode!=0 and 'GitHub has changes not present locally' in second.stdout,second.stdout[-4000:]
assert 'Unpublished local edit.' in (work/'README.md').read_text()
print('PASS: upstream changes stop publication and preserve the local edit')
work2=root/'deploy_failure';run(real_git,'clone',str(bare),str(work2));run(real_git,'config','user.name','Test Maintainer',cwd=work2);run(real_git,'config','user.email','test@example.invalid',cwd=work2)
with (work2/'README.md').open('a') as f:f.write('\nUpdated before failed deployment.\n')
env_fail=env.copy();env_fail['STUB_FAIL']='1'
third=run('bash','scripts/publish.sh',cwd=work2,env=env_fail,check=False)
assert third.returncode!=0 and 'GitHub may contain the new commit' in third.stdout,third.stdout[-4000:]
assert run(real_git,'rev-parse','HEAD',cwd=work2).stdout.strip()==run(real_git,'rev-parse','main',cwd=bare).stdout.strip()
print('PASS: a deployment failure reports that GitHub may be ahead')
unknown=work2/'prototype/lab/not-approved';unknown.mkdir(parents=True);(unknown/'index.html').write_text('Not approved')
fourth=run('python3','tools/prepare_release.py','--check',cwd=work2,check=False)
assert fourth.returncode!=0 and 'Lab not listed' in fourth.stdout,fourth.stdout
print('PASS: an unlisted experiment is rejected')
print('Test files:',root)
