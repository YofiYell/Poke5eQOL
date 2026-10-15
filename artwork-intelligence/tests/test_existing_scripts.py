"""Nonmutating baseline checksum and independent-module contract check.

These are byte/metadata checks only, NOT a live browser startup regression.
"""
from pathlib import Path
import hashlib,unittest
ROOT=Path(__file__).resolve().parents[2]
EXPECTATIONS={
 'Poke5e QOL.js':('96f9bf130d1b3d1d4c27e7547f28fd97617f6f59','0.13.4'),
 'Poke5e Theme Overlay.js':('596d03b930fcb4ecfa7b5f8362f532e96a917867','0.3.49'),
 'Poke5e Species Card Adapter.js':('1a2e1ecff3fc67725bbd636e253108cb2e3cf74f','0.1.26')
}
class ExistingScriptIntegrity(unittest.TestCase):
 def test_sha_and_header(self):
  for name,(sha,version) in EXPECTATIONS.items():
   with self.subTest(name=name):
    payload=(ROOT/name).read_bytes()
    gitsha=hashlib.sha1(b'blob '+str(len(payload)).encode()+b'\0'+payload).hexdigest()
    self.assertEqual(gitsha,sha)
    header=payload.decode().split('// ==/UserScript==')[0]
    self.assertIn(f'// @version      {version}',header)
    self.assertIn(f'[v{version}]',header)
 def test_none_of_three_scripts_uses_artwork_intelligence_global(self):
  for name in EXPECTATIONS:
   with self.subTest(name=name):
    self.assertNotIn('__yofiArtworkIntelligence',(ROOT/name).read_text())

if __name__=='__main__':unittest.main()
