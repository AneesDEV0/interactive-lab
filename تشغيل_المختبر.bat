@echo off
chcp 65001 >nul
title مختبر شرارة
echo جاري تشغيل المختبر...
start http://127.0.0.1:4173
node scripts\server.mjs
