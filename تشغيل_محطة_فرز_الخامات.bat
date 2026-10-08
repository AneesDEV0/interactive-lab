@echo off
chcp 65001 >nul
title محطة فرز وتصنيف خامات البيئة
echo جاري فتح محطة فرز خامات البيئة مع الخبير...
start http://127.0.0.1:4173/materials.html
node scripts\server.mjs
