"""ART-01 real Fakemon reference fixture, produced from uploaded original bytes.
Add to artwork-intelligence/tests/ without modifying original scanner.
Run: python -m unittest discover -s tests -p 'test_*.py' -v
"""
import hashlib, importlib.util, json, pathlib, unittest
import numpy as np
from PIL import Image
from scipy.ndimage import label, generate_binary_structure

ROOT = pathlib.Path(__file__).resolve().parents[1]
PREFIX = ROOT / 'fixtures' / 'real' / 'BWMC6BSH0WZDR'
IMAGE = PREFIX.with_name('BWMC6BSH0WZDR_normal.png')
EXPECTED = json.loads(PREFIX.with_name('BWMC6BSH0WZDR_python_reference.json').read_text())
MASK = PREFIX.with_name('BWMC6BSH0WZDR_mask_packed_msb_row_v1.bin')
SCANNER = ROOT / 'reference' / 'Poke5e_Offline_Color_Scanner_v1.0.0.py'

class ActualFakemonReferenceFixtureTests(unittest.TestCase):
    def test_exact_original_source_bytes(self):
        self.assertEqual(hashlib.sha256(IMAGE.read_bytes()).hexdigest(), EXPECTED['fixture']['sha256'])
        self.assertEqual(IMAGE.stat().st_size, EXPECTED['fixture']['bytes'])
        self.assertEqual(hashlib.sha256(SCANNER.read_bytes()).hexdigest(), EXPECTED['fixture']['scannerSha256'])

    def test_unmodified_python_color_metrics_and_dual_type_decision(self):
        spec = importlib.util.spec_from_file_location('original_scanner_realfixture', SCANNER)
        scanner = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(scanner)
        colors = scanner.colors(IMAGE, scanner.CONFIG)
        self.assertEqual(colors, EXPECTED['colors'])
        choice = scanner.decide({**colors, 'primary_type':'rock', 'secondary_type':'steel'}, scanner.CONFIG)
        self.assertEqual(choice, EXPECTED['decision'])

    def test_source_alpha_and_lossless_exact_mask(self):
        with Image.open(IMAGE) as im:
            self.assertEqual(im.size, (722,722))
            self.assertEqual(im.convert('RGBA').getpixel((0,0)), (0,0,0,0))
            a=np.asarray(im.convert('RGBA'), dtype=np.uint8)[:,:,3]
        occupied=a>=1
        geo=EXPECTED['geometry']
        self.assertGreater(int((a==0).sum()), 0)
        self.assertEqual(int((a==0).sum()), geo['alphaZeroPixels'])
        self.assertEqual(int(((a>0)&(a<255)).sum()), geo['partiallyTransparentPixels'])
        self.assertEqual(int(occupied.sum()), geo['occupiedPixels'])
        ys,xs=np.where(occupied)
        self.assertEqual({'left':int(xs.min()),'top':int(ys.min()),'right':int(xs.max()+1),'bottom':int(ys.max()+1)},geo['bounds'])
        _,components=label(occupied,generate_binary_structure(2,2))
        self.assertEqual(int(components),geo['components8'])
        inv_labels,count=label(~occupied,generate_binary_structure(2,1))
        exterior=set(np.unique(np.r_[inv_labels[0,:],inv_labels[-1,:],inv_labels[:,0],inv_labels[:,-1]]))
        self.assertEqual(sum(i not in exterior for i in range(1,count+1)),geo['holes4'])
        packed=np.packbits(occupied.astype(np.uint8),axis=1,bitorder='big').tobytes()
        self.assertEqual(packed,MASK.read_bytes())
        self.assertEqual(hashlib.sha256(packed).hexdigest(),geo['maskSha256'])
        self.assertEqual(len(packed),geo['maskBytes'])

if __name__=='__main__': unittest.main()
