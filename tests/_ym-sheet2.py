# (v472 YM) the studio sheets (tests/_ym-studio.js: each monster's 2D drawing | its GPU model in every mode, facing, frame and the hit
# flash) stacked into one: python3 tests/_ym-sheet2.py [dir shots/v472-YM]
import sys, os
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v472-YM')
T = ['sparkmite', 'hullwing', 'coilsentry', 'chargecell', 'warmech', 'mechhound', 'mechegg', 'eggling']
ims = [Image.open(os.path.join(D, f'studio-{t}.png')).convert('RGB') for t in T if os.path.exists(os.path.join(D, f'studio-{t}.png'))]
W = max(i.size[0] for i in ims); H = sum(i.size[1] for i in ims)
S = Image.new('RGB', (W, H), (16, 14, 22)); y = 0
for i in ims: S.paste(i, (0, y)); y += i.size[1]
out = os.path.join(D, 'studio-all.png'); S.save(out); print(out, S.size)
