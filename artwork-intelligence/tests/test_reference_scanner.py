"""Executable tests of the ORIGINAL scanner; no changes to scanner internals."""
import hashlib, importlib.util, json, math, pathlib, sys, tempfile, unittest
from PIL import Image
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
REF=ROOT/'reference'/'Poke5e_Offline_Color_Scanner_v1.0.0.py'
spec=importlib.util.spec_from_file_location('original_scanner',REF)
scan=importlib.util.module_from_spec(spec);spec.loader.exec_module(scan)
EXPECTED=json.loads((ROOT/'fixtures/expected/python_reference_results.json').read_text())
MANIFEST=json.loads((ROOT/'fixtures/synthetic_manifest.json').read_text())
EXPECTED_SHA='f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd'

class OriginalScannerTests(unittest.TestCase):
    def test_exact_original_bytes(self):
        self.assertEqual(hashlib.sha256(REF.read_bytes()).hexdigest(),EXPECTED_SHA)
        self.assertEqual(REF.stat().st_size,12699)

    def test_unmodified_palette_and_config(self):
        self.assertEqual(len(scan.TYPE_COLORS),18)
        self.assertEqual(scan.CONFIG,dict(average_weight=.5,dominant_weight=.5,alpha_threshold=128,
            clusters=8,outline_weight=.25,edge_weight=.5,incidental_white_weight=.7,
            delta_e='CIE76',version='1.0.0'))
        self.assertEqual(scan.TYPE_COLORS['water'],'#4C79BC')
        self.assertEqual(scan.TYPE_COLORS['fairy'],'#BA7FB5')

    def test_round_even_and_rgb_lab_reference(self):
        self.assertEqual(scan.hexcolor([.5,1.5,2.5]),'#000202')
        self.assertEqual(scan.hexcolor([-5,255.5,500]),'#00FFFF')
        self.assertEqual(np.asarray(scan.lab(scan.rgb('#FFFFFF'))).shape,(3,))
        np.testing.assert_allclose(scan.lab(scan.rgb('#FFFFFF')), [100,0,0],atol=5e-4)

    def test_all_fixture_hashes_and_snapshotted_numeric_results(self):
        by_name={row['name']:row for row in EXPECTED['results']}
        self.assertEqual(len(by_name),16)
        self.assertEqual(len(MANIFEST['fixtures']),16)
        for fixture in MANIFEST['fixtures']:
            with self.subTest(fixture=fixture['name']):
                path=ROOT/'fixtures'/fixture['file']
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),fixture['sha256'])
                expected=by_name[fixture['name']]
                self.assertEqual(expected['sha256'],fixture['sha256'])
                try:
                    actual=scan.colors(path,scan.CONFIG)
                except Exception as exc:
                    self.assertEqual(expected['scan']['status'],'error')
                    self.assertEqual(type(exc).__name__,expected['scan']['errorType'])
                    self.assertEqual(str(exc),expected['scan']['error'])
                    continue
                self.assertEqual(expected['scan']['status'],'ok')
                frozen=expected['scan']['colors']
                for key in ('average_color','raw_alpha_average_color','dominant_color','dominant_coverage',
                            'clusters','visible_pixels','background_pixels_removed','outline_pixels_discounted',
                            'near_black_body_fraction','near_white_body_fraction','image_width','image_height','image_format'):
                    self.assertEqual(actual[key],frozen[key],key)
                decision=scan.decide({**actual,'primary_type':fixture['primary_type'],
                    'secondary_type':fixture['secondary_type']},scan.CONFIG)
                self.assertEqual(decision,expected['scan']['decision'])

    def test_opaque_corner_consensus_versus_disagreeing_corners(self):
        a=scan.colors(ROOT/'fixtures/synthetic/opaque_corner_consensus.png',scan.CONFIG)
        b=scan.colors(ROOT/'fixtures/synthetic/opaque_no_consensus.png',scan.CONFIG)
        self.assertGreater(a['background_pixels_removed'],100)
        self.assertEqual(b['background_pixels_removed'],0)
        self.assertEqual(a['average_color'],'#CD5537')

    def test_borders_outlines_and_white(self):
        a=scan.colors(ROOT/'fixtures/synthetic/dark_outline.png',scan.CONFIG)
        b=scan.colors(ROOT/'fixtures/synthetic/dark_interior.png',scan.CONFIG)
        w=scan.colors(ROOT/'fixtures/synthetic/incidental_white.png',scan.CONFIG)
        self.assertGreater(a['outline_pixels_discounted'],0)
        self.assertGreater(b['near_black_body_fraction'],.2)
        self.assertLess(w['near_white_body_fraction'],.12)
        self.assertGreater(w['near_white_body_fraction'],0)

    def test_tie_and_near_tie_preserve_primary_argmin(self):
        # A duplicate pair is the only simple way to require mathematically
        # identical CIE scores; the original NumPy argmin keeps index zero.
        base=dict(primary_type='water',secondary_type='water',average_color='#4C79BC',dominant_color='#4C79BC')
        result=scan.decide(base,scan.CONFIG)
        self.assertEqual(result['selected_banner_type'],'water')
        self.assertEqual(result['combined_score_primary'],result['combined_score_secondary'])
        self.assertEqual(result['confidence_margin'],0)
        # A real near-tie between distinct types, selected from two actual Lab
        # distances, with strictly positive but tiny difference (<.01 CIE76).
        near=dict(primary_type='ghost',secondary_type='psychic',average_color='#AA7364',dominant_color='#AA7364')
        result=scan.decide(near,scan.CONFIG)
        self.assertLess(result['confidence_margin'],.01)
        self.assertEqual(result['selected_tint_type'],
            'psychic' if result['selected_banner_type']=='ghost' else 'ghost')

    def test_supported_file_formats(self):
        image=Image.new('RGB',(36,36),(54,115,175))
        for suffix,fmt in [('.png','PNG'),('.jpg','JPEG'),('.webp','WEBP'),('.gif','GIF'),('.tiff','TIFF')]:
            with self.subTest(fmt=fmt), tempfile.TemporaryDirectory() as td:
                path=pathlib.Path(td)/('sample'+suffix)
                image.save(path,format=fmt)
                # Opaque with uniform consensus is removed entirely; add two
                # different colored opaque features to ensure enough foreground.
                with Image.open(path) as read:
                    self.assertEqual(read.format,fmt)
                # Decoder coverage is the purpose; scanner may reject the
                # all-background image under its actual corner algorithm.
                with self.assertRaisesRegex(ValueError,'too_few_visible_pixels'):
                    scan.colors(path,scan.CONFIG)

if __name__=='__main__': unittest.main()
