# usage: python3 tests/_ld-sheet.py KEY beat1,beat2,... [x0,y0,x1,y1]  -> shots/ld-KEY/sheet.png (2D on top, GPU below)
import sys
from PIL import Image
key=sys.argv[1]; beats=sys.argv[2].split(','); box=tuple(map(int,sys.argv[3].split(','))) if len(sys.argv)>3 else (0,90,390,610)
w=box[2]-box[0]; h=box[3]-box[1]; k=2 if w<=200 else 1
im=Image.new('RGB',(w*k*len(beats),h*k*2))
for i,b in enumerate(beats):
    for j,m in enumerate(['2d','gpu']):
        try: im.paste(Image.open(f'shots/ld-{key}/{m}-{float(b):.2f}.png').crop(box).resize((w*k,h*k),Image.LANCZOS),(i*w*k,j*h*k))
        except Exception as e: print(e)
im.save(f'shots/ld-{key}/sheet.png')
