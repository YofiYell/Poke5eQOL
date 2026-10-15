"""Exact mask, components, corner selection and transform tests."""
from pathlib import Path
from PIL import Image
import json, hashlib, sys, unittest
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'reference'))
from geometry_reference import (inspect_rgba,pack_mask,unpack_mask,mask_bounds,connected_counts,
    intersects_rect,recommend_corner,source_to_client_matrix,affine_intersects_ui_rect)
FROZEN=json.loads((ROOT/'fixtures/expected/python_reference_results.json').read_text())

class ExactGeometryTests(unittest.TestCase):
    def test_round_trip_all_synthetic_masks(self):
        for record in FROZEN['results']:
            with self.subTest(name=record['name']):
                with Image.open(ROOT/'fixtures/synthetic'/(record['name']+'.png')) as im:
                    got=inspect_rgba(im)
                    actual=got.get('packedMask')
                # R01's measured snapshot remains frozen; R02 adds confidence
                # evidence and raw occupancy independently of those fields.
                legacy={key:got[key] for key in record['geometry']}
                legacy['bounds']=list(legacy['bounds']) if legacy['bounds'] is not None else None
                self.assertEqual(legacy,record['geometry'])
                if actual is not None:
                    decoded=unpack_mask(actual,got['width'],got['height'])
                    self.assertEqual(int(decoded.sum()),got['occupiedPixels'])
                    self.assertEqual(mask_bounds(decoded),tuple(got['bounds']))
                    self.assertEqual(hashlib.sha256(actual).hexdigest(),got['maskSha256'])

    def test_one_pixel_extensions_and_detached_regions_retained(self):
        with Image.open(ROOT/'fixtures/synthetic/one_pixel_extensions.png') as im:
            result=inspect_rgba(im)
        mask=unpack_mask(result['packedMask'],64,64)
        self.assertTrue(mask[3,33]);self.assertTrue(mask[38,61])
        self.assertEqual(result['bounds'],(19,3,62,55))
        with Image.open(ROOT/'fixtures/synthetic/disconnected_components.png') as im:
            result=inspect_rgba(im)
        self.assertEqual(result['components'],2)
        with Image.open(ROOT/'fixtures/synthetic/interior_hole.png') as im:
            result=inspect_rgba(im)
        self.assertEqual(result['holes'],1)

    def test_alpha_thresholds_are_explicitly_independent(self):
        with Image.open(ROOT/'fixtures/synthetic/nearly_invisible_alpha.png') as im:
            mask=inspect_rgba(im)
        self.assertEqual(mask['alphaThreshold'],1)
        self.assertTrue(mask['occupiedPixels']>0)
        with Image.open(ROOT/'fixtures/synthetic/opaque_full_canvas.png') as im:
            mask=inspect_rgba(im)
        self.assertEqual(mask['status'],'unavailable_opaque')
        self.assertFalse(mask['reliable'])
        # Alpha across EVERY canvas pixel means there is no dependable
        # transparent/background separation even when none reaches 255.
        semitransparent=Image.new('RGBA',(8,8),(50,40,30,254))
        self.assertEqual(inspect_rgba(semitransparent)['status'],'unavailable_opaque')

    def test_packbits_convention_non_multiple_of_8_and_padding(self):
        mask=np.array([[True,False,True,False,True,False,True,False,True]],dtype=bool)
        data=pack_mask(mask)
        self.assertEqual(data,bytes([0b10101010,0b10000000]))
        np.testing.assert_array_equal(unpack_mask(data,9,1),mask)
        with self.assertRaises(ValueError):unpack_mask(data,17,1)
        with self.assertRaisesRegex(ValueError,'nonzero row-padding'):
            unpack_mask(bytes([0b10101010,0b10000001]),9,1)

    def test_first_pass_corner_free_no_expansion(self):
        m=np.zeros((32,32),bool)
        m[10:27,4:10]=True;m[23:27,4:27]=True
        b=mask_bounds(m)
        choice=recommend_corner(m,b,6,6)
        self.assertEqual(choice['corner'],'tr')
        self.assertFalse(choice['expanded'])
        self.assertEqual(choice['effectiveBounds'],b)
        self.assertEqual(len(choice['candidates']),4)

    def test_all_blocked_then_exact_symmetric_expansion(self):
        m=np.zeros((38,38),bool);m[6:32,6:32]=True
        b=mask_bounds(m)
        choice=recommend_corner(m,b,8,6,clearance=1)
        self.assertTrue(choice['expanded'])
        self.assertEqual(choice['effectiveBounds'],(-2,-2,40,40))
        self.assertEqual(choice['expansionPerSide'],8)
        self.assertEqual(choice['corner'],'tr')
        self.assertEqual(len(choice['candidates']),8)
        self.assertFalse(any(c['collision']==False for c in choice['candidates'][:4]))

    def test_source_pixel_cell_intersections_and_affine(self):
        m=np.zeros((4,4),bool);m[1,1]=True
        self.assertTrue(intersects_rect(m,(1.99,1.99,2.01,2.01)))
        self.assertFalse(intersects_rect(m,(2,2,3,3)))
        transform=source_to_client_matrix(4,4,100,200,40,40)
        self.assertEqual(transform,(10,0,0,10,100,200))
        self.assertTrue(affine_intersects_ui_rect(m,transform,(110,210,115,215)))
        self.assertFalse(affine_intersects_ui_rect(m,transform,(120,220,130,230)))
        rotated=(0,10,-10,0,140,200)
        self.assertTrue(affine_intersects_ui_rect(m,rotated,(120,210,130,220)))
        self.assertFalse(affine_intersects_ui_rect(m,rotated,(101,201,109,209)))

    def test_measured_722_packed_sizes(self):
        w=h=722
        self.assertEqual(((w+7)//8)*h,65702)
        self.assertEqual(w*h*4,2085136)

if __name__=='__main__': unittest.main()
