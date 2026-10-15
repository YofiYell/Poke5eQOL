"""ART-01-R02: exact alpha evidence versus dependable subject silhouette.

All pathological RGBA cases below are deterministic, explicitly SYNTHETIC
and constructed in memory; original R01 PNGs and frozen outputs are unchanged.
"""
import sys, pathlib, unittest
import numpy as np
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'reference'))
from geometry_reference import inspect_rgba, unpack_mask, recommend_corner


def rgba(w=64,h=64,fill=(90,90,90,255)):
    return Image.new('RGBA',(w,h),fill)


class TransparencyReliabilityTests(unittest.TestCase):
    def test_fully_opaque_has_exact_raw_occupancy_but_no_subject_silhouette(self):
        result=inspect_rgba(rgba())
        self.assertEqual(result['status'],'unavailable_opaque')
        self.assertFalse(result['reliable'])
        self.assertEqual(result['observedOccupancy']['occupiedPixels'],4096)
        self.assertEqual(result['observedOccupancy']['bounds'],(0,0,64,64))
        self.assertEqual(result['alphaZeroPixels'],0)
        self.assertNotIn('packedMask',result)
        self.assertEqual(int(unpack_mask(result['observedPackedMask'],64,64).sum()),4096)

    def test_one_transparent_corner_pixel_not_reliable(self):
        im=rgba(); im.putpixel((0,0),(0,0,0,0))
        result=inspect_rgba(im)
        self.assertEqual(result['status'],'unavailable_alpha_ambiguous')
        self.assertFalse(result['reliable'])
        self.assertEqual(result['observedOccupancy']['occupiedPixels'],4095)
        self.assertEqual(result['backgroundEvidence']['exteriorPixels'],1)
        self.assertEqual(set(result['backgroundEvidence']['exteriorBorderSides']),{'top','left'})
        exact=unpack_mask(result['observedPackedMask'],64,64)
        self.assertFalse(exact[0,0]);self.assertTrue(exact[0,1])

    def test_small_interior_transparent_hole_not_exterior_background(self):
        im=rgba(); ar=np.asarray(im).copy();ar[27:30,31:34,3]=0
        result=inspect_rgba(Image.fromarray(ar,'RGBA'))
        self.assertEqual(result['status'],'unavailable_alpha_ambiguous')
        self.assertEqual(result['backgroundEvidence']['reliabilityReason'],'no_border_connected_transparency')
        self.assertEqual(result['observedOccupancy']['occupiedPixels'],4096-9)
        self.assertNotIn('packedMask',result)

    def test_one_pixel_exterior_frame_is_insufficient_separation(self):
        im=rgba();a=np.asarray(im).copy();a[0,:,3]=0;a[-1,:,3]=0;a[:,0,3]=0;a[:,-1,3]=0
        result=inspect_rgba(Image.fromarray(a,'RGBA'))
        self.assertEqual(result['status'],'unavailable_alpha_ambiguous')
        self.assertEqual(result['backgroundEvidence']['exteriorPixels'],252)
        self.assertEqual(result['backgroundEvidence']['onePixelPerimeterPixels'],252)

    def test_meaningful_exterior_transparency_supports_geometry(self):
        a=np.zeros((64,64,4),dtype=np.uint8);a[15:49,13:53]=[80,140,190,255]
        result=inspect_rgba(Image.fromarray(a,'RGBA'))
        self.assertEqual(result['status'],'ready')
        self.assertTrue(result['reliable'])
        self.assertEqual(result['bounds'],(13,15,53,49))
        self.assertEqual(result['backgroundEvidence']['exteriorBorderSides'],['top','right','bottom','left'])

    def test_transparent_margins_preserve_one_pixel_extensions(self):
        a=np.zeros((64,64,4),dtype=np.uint8);a[15:49,15:49]=[150,200,100,255]
        a[1:16,32]=[120,180,90,255];a[32,48:63]=[120,180,90,255]
        result=inspect_rgba(Image.fromarray(a,'RGBA'))
        self.assertEqual(result['status'],'ready')
        self.assertEqual(result['bounds'],(15,1,63,49))
        mask=unpack_mask(result['packedMask'],64,64)
        self.assertTrue(mask[1,32]);self.assertTrue(mask[32,62])
        self.assertTrue(np.array_equal(mask,unpack_mask(result['observedPackedMask'],64,64)))

    def test_faint_alpha_one_pixel_expands_exact_bounds_but_not_diagnostic_visual(self):
        a=np.zeros((64,64,4),dtype=np.uint8);a[15:50,15:50]=[100,100,100,255]
        a[0,33]=[200,200,200,1];a[48,63]=[200,200,200,1]
        result=inspect_rgba(Image.fromarray(a,'RGBA'))
        self.assertEqual(result['status'],'ready')
        self.assertEqual(result['bounds'],(15,0,64,50))
        self.assertEqual(result['visualBoundsAlpha128'],(15,15,50,50))
        mask=unpack_mask(result['packedMask'],64,64)
        self.assertTrue(mask[0,33]);self.assertTrue(mask[48,63])
        # The first automatic corner pass remains anchored to exact bounds.
        corner=recommend_corner(mask,result['bounds'],5,5)
        self.assertEqual(corner['originalBounds'],result['bounds'])

    def test_actual_rock_steel_alpha_evidence_and_bounds(self):
        from PIL import Image
        with Image.open(ROOT/'fixtures/real/BWMC6BSH0WZDR_normal.png') as im:
            result=inspect_rgba(im)
        self.assertEqual(result['status'],'ready')
        self.assertTrue(result['reliable'])
        self.assertEqual(result['bounds'],(3,0,722,690))
        self.assertEqual(result['visualBoundsAlpha128'],(8,0,718,685))
        self.assertEqual(result['occupiedPixels'],306042)
        self.assertEqual(result['backgroundEvidence']['exteriorPixels'],214900)
        self.assertEqual(result['backgroundEvidence']['exteriorBorderSides'],['top','right','bottom','left'])
        self.assertEqual(result['alphaZeroPixels'],215242)
        self.assertEqual(result['backgroundEvidence']['transparentEdgePixelCounts'],
                         {'top':699,'right':654,'bottom':722,'left':722})
        self.assertEqual(result['maskSha256'],'3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1')

if __name__=='__main__': unittest.main()
