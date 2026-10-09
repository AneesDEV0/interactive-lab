"""Build-time only: sends authored guide text (no child data) to Edge TTS."""
import asyncio,json
from pathlib import Path
import edge_tts
root=Path(__file__).resolve().parent.parent/'assets/audio/electricity'
lines=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
async def main():
    limit=asyncio.Semaphore(4)
    async def generate(key,text):
        async with limit:
            dest=root/(key+'.mp3')
            if dest.exists() and dest.stat().st_size>1000:return
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text,'ar-JO-SanaNeural',rate='+0%').save(str(dest))
                    return
                except Exception as e:
                    if attempt==2:print('FAILED',key,str(e));raise
                    await asyncio.sleep(1)
    await asyncio.gather(*(generate(k,t) for k,t in lines.items()))
    print('Generated',len(lines),'local Arabic recordings')
asyncio.run(main())
