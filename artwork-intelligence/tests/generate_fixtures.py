"""Generate explicitly synthetic ART-01 fixtures. Not native Poké5e images."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'fixtures'/'synthetic'
OUT.mkdir(parents=True,exist_ok=True)
records=[]

def write(name,image,types=('water','ice'),note=''):
    target=OUT/(name+'.png')
    image.save(target,format='PNG',optimize=False)
    blob=target.read_bytes()
    records.append({'name':name,'file':f'synthetic/{target.name}',
        'sha256':hashlib.sha256(blob).hexdigest(),'bytes':len(blob),
        'dimensions':list(image.size),'imageMode':image.mode,
        'primary_type':types[0],'secondary_type':types[1],
        'sourceKind':'synthetic','description':note})

def canvas(color=(0,0,0,0)):
    return Image.new('RGBA',(64,64),color)

im=canvas();ImageDraw.Draw(im).rectangle((14,17,48,46),fill=(45,123,219,255));write('transparent_margins',im,note='Centered subject with fully transparent outer margin')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((9,9,55,55),fill=(60,100,180,22));d.rectangle((12,12,52,52),fill=(60,100,180,140));d.rectangle((16,16,48,48),fill=(60,100,180,255));write('semi_transparent_boundaries',im,note='Alpha values below and above scanner threshold 128')
im=Image.new('RGB',(64,64),'white');ImageDraw.Draw(im).ellipse((10,10,53,53),fill=(205,85,55));write('opaque_corner_consensus',im,('fire','fighting'),note='White border-connected backdrop removed only from color mask')
im=Image.new('RGB',(64,64),(205,85,55));d=ImageDraw.Draw(im);d.rectangle((0,0,14,14),fill=(0,0,0));d.rectangle((49,0,63,14),fill=(255,255,255));d.rectangle((0,49,14,63),fill=(0,210,0));d.rectangle((49,49,63,63),fill=(0,0,255));write('opaque_no_consensus',im,('fire','water'),note='Four incompatible corners: no opaque background removal')
im=canvas();d=ImageDraw.Draw(im);d.ellipse((10,10,53,53),fill=(20,170,95,255));d.ellipse((24,24,39,39),fill=(0,0,0,0));write('interior_hole',im,('grass','poison'),note='Alpha ring and retained transparent hole')
im=canvas();d=ImageDraw.Draw(im);d.ellipse((5,5,23,23),fill=(200,40,160,255));d.ellipse((40,39,58,57),fill=(200,40,160,255));write('disconnected_components',im,('psychic','fairy'),note='Two disconnected visible components preserved')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((19,25,47,54),fill=(160,110,55,255));d.line([(33,3),(33,25)],fill=(160,110,55,255),width=1);d.line([(47,38),(61,38)],fill=(160,110,55,255),width=1);write('one_pixel_extensions',im,('ground','rock'),note='Long 1px horn/extension and disconnected edge behavior')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((9,9,54,54),fill=(70,120,190,255));d.ellipse((24,22,30,28),fill='white');write('incidental_white',im,('water','steel'),note='Small white patch on a colored subject')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((9,9,54,54),fill=(10,12,12,255));d.rectangle((14,14,49,49),fill=(244,130,40,255));write('dark_outline',im,('fighting','dark'),note='Narrow dark border compared to bright interior')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((7,7,55,55),fill=(17,19,20,255));d.rectangle((14,14,48,48),fill=(26,26,28,255));write('dark_interior',im,('dark','steel'),note='Substantial dark interior should survive outline discount')
im=canvas();d=ImageDraw.Draw(im);d.ellipse((8,8,55,55),fill=(70,115,195,255));d.rectangle((10,11,14,16),fill=(255,255,255,255));write('tiny_white_highlight',im,('water','ice'),note='Near-white fraction below 12 percent')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((10,10,53,53),fill=(90,88,144,255));d.rectangle((10,10,30,53),fill=(155,62,89,255));write('dual_color_tie_case',im,('ghost','psychic'),note='Two large RGB-bin clusters; decision fixture, not assured tie')
im=canvas();d=ImageDraw.Draw(im);d.rectangle((18,18,45,45),fill=(130,80,190,255));d.rectangle((12,12,51,51),outline=(130,80,190,1),width=1);write('nearly_invisible_alpha',im,('psychic','ghost'),note='Alpha=1 outskirts count for silhouette, not scanner color mask')
im=Image.new('RGB',(64,64),(88,125,160));write('opaque_full_canvas',im,('water','steel'),note='Fully opaque: geometry MUST be unreliable')
im=canvas();ImageDraw.Draw(im).rectangle((0,0,3,3),fill=(40,180,90,255));write('insufficient_visible',im,('grass','bug'),note='16 pixels: scanner must reject before clustering')
im=canvas();write('empty_alpha',im,('normal','ghost'),note='No visible pixels: scanner must reject')

p=ROOT/'fixtures'/'synthetic_manifest.json'
p.write_text(json.dumps({'fixtureKind':'synthetic','generator':'tests/generate_fixtures.py',
    'notNativeArtwork':True,'fixtures':records},indent=2)+'\n')
print('generated',len(records),'synthetic PNGs',sum(x['bytes'] for x in records),'total PNG bytes')
