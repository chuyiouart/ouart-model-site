import importlib.util,json,subprocess,tempfile,unittest,hashlib
from pathlib import Path
spec=importlib.util.spec_from_file_location('bundle',Path(__file__).with_name('build-pages-bundle.py'));b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
class BundleTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.base=Path(self.tmp.name);self.root=self.base/'site';self.root.mkdir();self.head='a'*40
  self.put('data/models.js','window.OUART_MODELS = '+json.dumps([{'id':'old','date':'2026-11-01','published':True,'image':'./assets/models/old/有 空格.png'},{'id':'new','date':'2026-11-07','published':True,'batchId':'batch-new','image':'./assets/models/new/original.png'}])+';')
  self.put('data/batches.js','window.OUART_BATCHES = '+json.dumps([{'id':'batch-new','date':'2026-11-07','image':'./assets/batches/current.png'}])+';')
  for rel in ('assets/models/old/有 空格.png','assets/models/new/original.png','assets/batches/current.png','assets/thumbs/old.webp'):self.put(rel,'original image bytes '+rel)
  self.put('content/posts/1.html','<img src="../../assets/models/old/有 空格.png"><a href="../../model.html?id=old">old</a>')
  self.put('index.html','<script src="data/models.js"></script>');self.put('backups/private.html','old backup');self.put('scripts/tool.py','private script')
  subprocess.run(['git','init','-q'],cwd=self.root,check=True);subprocess.run(['git','add','.'],cwd=self.root,check=True)
 def tearDown(self):self.tmp.cleanup()
 def put(self,rel,text):
  p=self.root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text);return p
 def test_bounded_history_keeps_every_model_and_original(self):
  before=(self.root/'assets/models/old/有 空格.png').read_bytes();proof=b.build(self.root,self.base/'out',self.head)
  self.assertEqual(proof['model_count'],2);self.assertEqual(proof['offloaded_originals'],1)
  data=b.array((self.base/'out/data/models.js').read_text());self.assertIn(self.head,data[0]['image']);self.assertIn('%20',data[0]['image']);self.assertTrue(data[1]['image'].startswith('./assets/'))
  self.assertEqual((self.root/'assets/models/old/有 空格.png').read_bytes(),before)
  self.assertEqual((self.base/'out/assets/models/new/original.png').read_bytes(),(self.root/'assets/models/new/original.png').read_bytes())
  self.assertIn(b.RAW,(self.base/'out/content/posts/1.html').read_text());self.assertIn('../../model.html?id=old',(self.base/'out/content/posts/1.html').read_text())
  self.assertFalse((self.base/'out/backups').exists());self.assertFalse((self.base/'out/scripts/tool.py').exists());self.assertTrue((self.base/'out/assets/thumbs/old.webp').exists())
 def test_oversize_is_refused_before_upload(self):
  with self.assertRaisesRegex(ValueError,'budget'):b.build(self.root,self.base/'out',self.head,limit=1)
 def test_existing_output_refused(self):
  with self.assertRaises(ValueError):b.build(self.root,self.root,self.head)
 def test_symlinks_and_path_traversal_not_public(self):
  self.assertFalse(b.public_file('../outside.html'));self.assertFalse(b.public_file('.github/workflows/pages.yml'))
  (self.root/'link.js').symlink_to(self.root/'index.html');subprocess.run(['git','add','link.js'],cwd=self.root,check=True)
  with self.assertRaisesRegex(ValueError,'unsafe tracked'):b.build(self.root,self.base/'out',self.head)
 def test_current_missing_is_not_faked(self):
  (self.root/'assets/models/new/original.png').unlink()
  with self.assertRaisesRegex(ValueError,'tracked file missing'):b.build(self.root,self.base/'out',self.head)
 def test_queries_and_external_links_preserved(self):
  p='assets/models/old/x.png';s={p}
  self.assertEqual(b.rewrite_url('https://other.test/x.png','index.html',s,self.head),'https://other.test/x.png')
  self.assertTrue(b.rewrite_url('./'+p+'?v=1#view','index.html',s,self.head).endswith('?v=1#view'))
if __name__=='__main__':unittest.main()
