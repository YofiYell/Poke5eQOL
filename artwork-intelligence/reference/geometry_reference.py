"""ART-01 non-production pixel-exact geometry and corner contract reference.

This is NEW reference code. It is not part of the unchanged color scanner.
Coordinates use 0-based source pixels, half-open rectangles and top-left origin.
"""
from __future__ import annotations
from dataclasses import dataclass
from io import BytesIO
from math import ceil, floor
from pathlib import Path
from typing import Optional
import hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import label, generate_binary_structure

ALPHA_OCCUPIED_THRESHOLD = 1
MASK_FORMAT = "packed-msb-row-v1"
TIE_ORDER = ("tr", "tl", "br", "bl")


def pack_mask(occupied: np.ndarray) -> bytes:
    if occupied.ndim != 2:
        raise ValueError("mask must be 2-dimensional")
    return np.packbits(occupied.astype(np.uint8), axis=1, bitorder="big").tobytes()


def unpack_mask(data: bytes, width: int, height: int) -> np.ndarray:
    if width < 1 or height < 1:
        raise ValueError("invalid mask dimensions")
    stride = (width + 7) // 8
    if len(data) != stride * height:
        raise ValueError("mask byte length mismatch")
    arr = np.frombuffer(data, dtype=np.uint8).reshape((height, stride))
    remainder=width % 8
    if remainder and np.any(arr[:, -1] & ((1 << (8-remainder))-1)):
        raise ValueError("nonzero row-padding bits")
    return np.unpackbits(arr, axis=1, bitorder="big")[:, :width].astype(bool)


def mask_bounds(mask: np.ndarray) -> Optional[tuple[int, int, int, int]]:
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return None
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def connected_counts(mask: np.ndarray) -> tuple[int, int]:
    """8-connectivity subject; 4-connectivity holes inside the image domain."""
    if not mask.any():
        return (0, 0)
    _, components = label(mask, generate_binary_structure(2, 2))
    inv = ~mask
    holes_labels, count = label(inv, generate_binary_structure(2, 1))
    exterior = set(np.unique(np.r_[holes_labels[0, :], holes_labels[-1, :], holes_labels[:, 0], holes_labels[:, -1]]))
    return int(components), int(sum(k not in exterior for k in range(1, count + 1)))


def inspect_rgba(image: Image.Image) -> dict:
    rgba = np.asarray(image.convert('RGBA'), dtype=np.uint8)
    height, width = rgba.shape[:2]
    alpha = rgba[:, :, 3]
    if bool(np.all(alpha >= 1)):
        return dict(status="unavailable_opaque",reliable=False,width=width,height=height,
                    alphaThreshold=ALPHA_OCCUPIED_THRESHOLD,occupiedPixels=None,
                    bounds=None,components=None,holes=None,maskBytes=None)
    occupied = alpha >= ALPHA_OCCUPIED_THRESHOLD
    if not occupied.any():
        return dict(status="unavailable_empty",reliable=False,width=width,height=height,
                    alphaThreshold=ALPHA_OCCUPIED_THRESHOLD,occupiedPixels=0,
                    bounds=None,components=0,holes=0,maskBytes=None)
    packed = pack_mask(occupied)
    comps, holes = connected_counts(occupied)
    return dict(status="ready",reliable=True,width=width,height=height,
                alphaThreshold=ALPHA_OCCUPIED_THRESHOLD,
                occupiedPixels=int(occupied.sum()),bounds=mask_bounds(occupied),
                components=comps,holes=holes,
                maskFormat=MASK_FORMAT,maskStrideBytes=(width+7)//8,
                maskBytes=len(packed),maskSha256=hashlib.sha256(packed).hexdigest(),
                packedMask=packed)


def intersects_rect(mask: np.ndarray, rect: tuple[float,float,float,float]) -> bool:
    """Test source pixel CELLS (not just centers) against half-open rect."""
    x0,y0,x1,y1=rect
    if x1<=x0 or y1<=y0:
        return False
    h,w=mask.shape
    xa=max(0, min(w, floor(x0)))
    xb=max(0, min(w, ceil(x1)))
    ya=max(0, min(h, floor(y0)))
    yb=max(0, min(h, ceil(y1)))
    return xa<xb and ya<yb and bool(mask[ya:yb,xa:xb].any())


def corner_box(box: tuple[float,float,float,float], corner: str, width:float, height:float):
    x0,y0,x1,y1=box
    if corner[1]=='r': x=x1-width
    else: x=x0
    if corner[0]=='b': y=y1-height
    else: y=y0
    return (x,y,x+width,y+height)


def grow_rect(rect, clearance):
    x0,y0,x1,y1=rect
    return (x0-clearance,y0-clearance,x1+clearance,y1+clearance)


def recommend_corner(mask:np.ndarray,bounds:tuple[int,int,int,int], icon_width:float,
                     icon_height:float,clearance:float=0,obstacles=()):
    """Strict two-pass algorithm: original bbox, then +/- exactly icon WIDTH each side.

    Pixel intersection is exact for axis-aligned image-source boxes. Obstacles are
    source-coordinate rectangles. A non-axis-aligned CSS transform requires ART-02's
    documented polygon/cell test before this scorer is used in production.
    """
    if icon_width<=0 or icon_height<=0 or clearance<0:
        raise ValueError("invalid icon geometry")
    x0,y0,x1,y1=bounds
    if x1<=x0 or y1<=y0:
        raise ValueError("invalid subject bounds")
    candidates=[]
    for expansion,box in ((0,bounds),(icon_width,(x0-icon_width,y0-icon_width,x1+icon_width,y1+icon_width))):
        valid=[]
        for corner in TIE_ORDER:
            rect=corner_box(box,corner,icon_width,icon_height)
            # Footprint MUST fit inside effective bbox, with clearance as a
            # collision margin, not as extra space demanded inside the box.
            fits=rect[0]>=box[0]-1e-7 and rect[1]>=box[1]-1e-7 and rect[2]<=box[2]+1e-7 and rect[3]<=box[3]+1e-7
            checked=grow_rect(rect,clearance)
            blocked=intersects_rect(mask,checked) or any(rects_intersect(checked,r) for r in obstacles)
            candidates.append({'pass':'original' if not expansion else 'expanded','corner':corner,'fits':fits,'collision':bool(blocked)})
            if fits and not blocked:valid.append((corner,rect))
        if valid:
            corner,rect=valid[0]
            return {'status':'ready','corner':corner,'expanded':bool(expansion),
                    'originalBounds':bounds,'effectiveBounds':box,'iconRect':rect,
                    'expansionPerSide':expansion,'candidates':candidates}
    return {'status':'unavailable','corner':None,'expanded':True,
            'originalBounds':bounds,'effectiveBounds':(x0-icon_width,y0-icon_width,x1+icon_width,y1+icon_width),
            'iconRect':None,'expansionPerSide':icon_width,'candidates':candidates}


def rects_intersect(a,b):
    return a[0]<b[2] and b[0]<a[2] and a[1]<b[3] and b[1]<a[3]


def source_to_client_matrix(image_width,image_height,content_left,content_top,content_width,content_height,object_fit='contain'):
    """Axis-aligned no-CSS-transform image content placement in viewport CSS px.

    The caller must add visual-viewport offsets/scrolling and CSS DOMMatrix as
    appropriate. For object-fit contain/cover; no object-position customization.
    """
    if object_fit not in ('contain','cover'):
        raise ValueError("object-fit unsupported by reference")
    scale=min(content_width/image_width,content_height/image_height) if object_fit=='contain' else max(content_width/image_width,content_height/image_height)
    tx=content_left+(content_width-image_width*scale)/2
    ty=content_top+(content_height-image_height*scale)/2
    return (scale,0.0,0.0,scale,tx,ty)


def _clip_polygon(poly, rect):
    """Sutherland-Hodgman clip against axis-aligned CSS rectangle."""
    x0,y0,x1,y1=rect
    clips=[(lambda p:p[0]>=x0,lambda a,b: (x0,a[1]+(b[1]-a[1])*(x0-a[0])/(b[0]-a[0]))),
           (lambda p:p[0]<=x1,lambda a,b: (x1,a[1]+(b[1]-a[1])*(x1-a[0])/(b[0]-a[0]))),
           (lambda p:p[1]>=y0,lambda a,b: (a[0]+(b[0]-a[0])*(y0-a[1])/(b[1]-a[1]),y0)),
           (lambda p:p[1]<=y1,lambda a,b: (a[0]+(b[0]-a[0])*(y1-a[1])/(b[1]-a[1]),y1))]
    for inside,intersect in clips:
        if not poly:return []
        output=[];prev=poly[-1]
        for curr in poly:
            pi,ci=inside(prev),inside(curr)
            if pi!=ci: output.append(intersect(prev,curr))
            if ci: output.append(curr)
            prev=curr
        poly=output
    return poly


def _area(poly):
    if len(poly)<3:return 0
    return abs(sum(poly[i][0]*poly[(i+1)%len(poly)][1]-poly[(i+1)%len(poly)][0]*poly[i][1] for i in range(len(poly))))/2


def affine_intersects_ui_rect(mask, matrix, ui_rect):
    """Exact overlap of occupied square pixel CELLS and CSS rect for affine mapping.
    Full-resolution reference implementation, not an ART-02 optimized hot path.
    """
    a,b,c,d,e,f=matrix
    if abs(a*d-b*c)<1e-12:
        raise ValueError("noninvertible transform")
    y_indices,x_indices=np.nonzero(mask)
    for y,x in zip(y_indices,x_indices):
        pts=[(x,y),(x+1,y),(x+1,y+1),(x,y+1)]
        transformed=[(a*px+c*py+e,b*px+d*py+f) for px,py in pts]
        clipped=_clip_polygon(transformed,ui_rect)
        if _area(clipped)>1e-10:return True
    return False
