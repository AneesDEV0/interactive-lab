"""Crop user-supplied textbook references for local image matching, not remote upload."""
from PIL import Image
from pathlib import Path
import argparse
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description='Prepare reference crops from the three original textbook screenshots, in attachment order.')
parser.add_argument('pages',nargs=3,type=Path)
files=parser.parse_args().pages
crops=[{'washer':(132,85,226,212),'tv':(330,87,477,218),'fridge':(565,90,640,224),'hairDryer':(137,280,257,387),'fan':(363,265,436,384),'iron':(539,281,667,385)}, {'console':(141,94,290,209),'car':(548,128,694,217),'solarCar':(148,267,286,398),'wind':(348,266,484,386),'bicycle':(549,268,679,383)}, {'electricHeater':(142,61,250,179),'calculator':(310,60,403,178),'street':(446,55,592,181),'tablet':(129,328,272,458),'radio':(285,335,429,454),'watch':(474,331,553,458)}]
out=root/'assets/book';out.mkdir(exist_ok=True)
for file,regions in zip(files,crops):
    im=Image.open(file).convert('RGB')
    for name,rect in regions.items():
        im.crop(rect).save(out/(name+'.jpg'),quality=94)
print('Prepared',sum(map(len,crops)),'book reference crops')
