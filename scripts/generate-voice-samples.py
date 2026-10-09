"""One-time review samples, explicitly authorized on 2026-10-09.

Sends only the authored text below to Edge TTS. Never used by the website.
Samples stay outside production assets until the user approves a narrator.
"""
import asyncio
import json
from pathlib import Path

import edge_tts

DESTINATION = Path(__file__).resolve().parent.parent / "docs/audio/samples"
TEXT = (
    "أهلًا، أنا شَرارة. هَيّا نكتشف معًا. اختر الجهاز، ثم جرّب تشغيله. "
    "البطّارية تُزوّد سيّارة الألعاب بالكهرباء، فيُحوّل المُحرّك الطاقة إلى حركة. "
    "والآن، تأمّل المِسطرة. ما الصِّفة التي تساعدك على معرفة مادّتها؟ "
    "خذ وقتك في التفكير. يمكنك تدوير النموذج، والنظر إليه من جهة أخرى."
)
CANDIDATES = [
    ("sana-jordan", "ar-JO-SanaNeural", "سَنا — الأردن"),
    ("layla-lebanon", "ar-LB-LaylaNeural", "ليلى — لبنان"),
]


async def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    manifest = {"generatedOn": "2026-10-09", "type": "synthetic-neural",
                "provider": "Microsoft Edge TTS", "purpose": "listening-review-only",
                "approvedForProduction": False, "text": TEXT, "samples": []}
    for name, voice, label in CANDIDATES:
        target = DESTINATION / f"sharara-{name}-v1.mp3"
        if not target.exists() or target.stat().st_size < 1000:
            temporary = target.with_suffix(".part.mp3")
            for attempt in range(2):
                try:
                    await asyncio.wait_for(
                        edge_tts.Communicate(TEXT, voice, rate="+0%", pitch="+0Hz")
                        .save(str(temporary)), timeout=90)
                    if temporary.stat().st_size < 1000:
                        raise RuntimeError("Audio file is too small")
                    temporary.replace(target)
                    break
                except Exception:
                    temporary.unlink(missing_ok=True)
                    if attempt == 1:
                        raise
        manifest["samples"].append({"file": target.name, "voice": voice,
                                    "label": label, "rate": "+0%", "pitch": "+0Hz",
                                    "bytes": target.stat().st_size})
        print(f"Ready: {target.name} ({target.stat().st_size} bytes)", flush=True)
    (DESTINATION / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
