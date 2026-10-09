#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/generate-all-sana-audio.py — مولد صوت سَنا (الأردن) المعتمد لكامل منصة مختبر شرارة
ينتج جميع الملفات الصوتية محلياً عبر ar-JO-SanaNeural بمعدل +0% وطبقة +0Hz
مما يجعل المنصة تعمل بدون اتصال بالإنترنت في وقت التشغيل بصوت موحد ومعتمد.
"""

import os
import sys
import json
import asyncio
from pathlib import Path
import edge_tts

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parent.parent
VOICE = "ar-JO-SanaNeural"
RATE = "+0%"
PITCH = "+0Hz"

async def _stream_one(cleaned: str) -> bytes:
    comm = edge_tts.Communicate(cleaned, VOICE, rate=RATE, pitch=PITCH)
    chunks = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)

async def fetch_tts_bytes(text: str, sem: asyncio.Semaphore, cache: dict) -> bytes:
    cleaned = text.strip()
    if cleaned in cache:
        return cache[cleaned]
    
    for attempt in range(6):
        try:
            async with sem:
                audio_bytes = await asyncio.wait_for(_stream_one(cleaned), timeout=25.0)
                if len(audio_bytes) < 500:
                    raise ValueError(f"Audio file too small: {len(audio_bytes)} bytes")
                cache[cleaned] = audio_bytes
                return audio_bytes
        except Exception as e:
            if attempt == 5:
                print(f"[ERROR] فشل توليد: {cleaned[:35]}... ({e})", flush=True)
                raise
            await asyncio.sleep(2.0 * (attempt + 1))
    raise RuntimeError("Unreachable")

async def save_audio_file(dest_path: Path, text: str, sem: asyncio.Semaphore, cache: dict, force: bool = False):
    if not force and dest_path.exists() and dest_path.stat().st_size > 1000:
        return True
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = dest_path.with_suffix(".part.mp3")
    try:
        data = await fetch_tts_bytes(text, sem, cache)
        temp_path.write_bytes(data)
        temp_path.replace(dest_path)
        return True
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        raise e

async def main():
    print(f"🎙️ بدء اعتماد وتوليد صوت (سَنا — الأردن: {VOICE}) لكامل المنصة...", flush=True)
    sem = asyncio.Semaphore(5)
    cache = {}

    # ─────────────────────────────────────────────────────────────
    # 1. قائمة تسجيلات الأنشطة الأربعة (assets/audio/narration/)
    # ─────────────────────────────────────────────────────────────
    narration_script_path = ROOT / "docs/audio/recording-script.json"
    narration_data = json.loads(narration_script_path.read_text(encoding="utf-8"))
    recordings = narration_data.get("recordings", [])
    narration_dir = ROOT / "assets/audio/narration"
    narration_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[1/3] جاري فحص وتوليد تسجيلات الأنشطة الـ 4 ({len(recordings)} ملف)...", flush=True)
    
    async def process_narration_item(idx, r):
        target = narration_dir / r["file"]
        await save_audio_file(target, r["text"], sem, cache, force=False)
        if (idx + 1) % 50 == 0 or idx + 1 == len(recordings):
            print(f"  ✓ أنجز {idx + 1}/{len(recordings)} في assets/audio/narration/", flush=True)

    await asyncio.gather(*(process_narration_item(i, r) for i, r in enumerate(recordings)))

    # حفظ فهرس narration معتمد بصوت سنا
    narration_manifest = {
        "version": 1,
        "voice": "سَنا — الأردن",
        "voiceId": VOICE,
        "provider": "Microsoft Edge TTS",
        "generatedOn": "2026-10-09",
        "rate": RATE,
        "pitch": PITCH,
        "recordings": [
            {
                "id": r["id"],
                "file": r["file"],
                "text": r["text"]
            }
            for r in recordings
        ]
    }
    (narration_dir / "manifest.json").write_text(
        json.dumps(narration_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print("  ✅ تم حفظ assets/audio/narration/manifest.json بنجاح!", flush=True)

    # ─────────────────────────────────────────────────────────────
    # 2. قائمة رسائل نشاط الكهرباء (assets/audio/electricity/)
    # ─────────────────────────────────────────────────────────────
    elec_manifest_path = ROOT / "assets/audio/electricity/manifest.json"
    elec_lines = json.loads(elec_manifest_path.read_text(encoding="utf-8"))
    elec_dir = ROOT / "assets/audio/electricity"
    elec_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[2/3] جاري فحص وتوليد رسائل الكهرباء ({len(elec_lines)} ملف)...", flush=True)
    
    elec_items = list(elec_lines.items())
    async def process_elec_item(idx, key, text):
        target = elec_dir / f"{key}.mp3"
        await save_audio_file(target, text, sem, cache, force=False)
        if (idx + 1) % 50 == 0 or idx + 1 == len(elec_items):
            print(f"  ✓ أنجز {idx + 1}/{len(elec_items)} في assets/audio/electricity/", flush=True)

    await asyncio.gather(*(process_elec_item(i, k, t) for i, (k, t) in enumerate(elec_items)))
    print("  ✅ تم تحديث جميع ملفات assets/audio/electricity/ بنجاح!", flush=True)

    # ─────────────────────────────────────────────────────────────
    # 3. بنك الصوت العام والـ AR (public/audio/ar/ و audio/ar/)
    # ─────────────────────────────────────────────────────────────
    sys.path.insert(0, str(ROOT / "scripts"))
    import generate_audio
    ar_entries = list(generate_audio.AUDIO_ENTRIES.items())
    public_ar_dir = ROOT / "public/audio/ar"
    root_ar_dir = ROOT / "audio/ar"
    public_ar_dir.mkdir(parents=True, exist_ok=True)
    root_ar_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[3/3] جاري فحص وتوليد بنك الصوت العام والواقع المعزز ({len(ar_entries)} ملف)...", flush=True)
    
    async def process_ar_item(idx, key, text):
        t1 = public_ar_dir / f"{key}.mp3"
        t2 = root_ar_dir / f"{key}.mp3"
        if t1.exists() and t1.stat().st_size > 1000 and t2.exists() and t2.stat().st_size > 1000:
            return
        data = await fetch_tts_bytes(text, sem, cache)
        t1.write_bytes(data)
        t2.write_bytes(data)
        if (idx + 1) % 25 == 0 or idx + 1 == len(ar_entries):
            print(f"  ✓ أنجز {idx + 1}/{len(ar_entries)} في audio/ar/", flush=True)

    await asyncio.gather(*(process_ar_item(i, k, t) for i, (k, t) in enumerate(ar_entries)))
    
    manifest_ar = {
        k: {
            "key": k,
            "file": f"./audio/ar/{k}.mp3",
            "text": t
        }
        for k, t in ar_entries
    }
    manifest_ar_json = json.dumps(manifest_ar, ensure_ascii=False, indent=2) + "\n"
    (public_ar_dir / "manifest.json").write_text(manifest_ar_json, encoding="utf-8")
    (root_ar_dir / "manifest.json").write_text(manifest_ar_json, encoding="utf-8")
    print("  ✅ تم تحديث manifest.json للبنك العام!", flush=True)

    print("\n🎉 تم توليد واعتماد صوت سَنا — الأردن بنجاح تام لكافة أجزاء المنصة!", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
