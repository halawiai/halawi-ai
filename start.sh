#!/bin/bash

# سكريبت لتشغيل تطبيق Halawi AI على localhost

cd "$(dirname "$0")"

echo "🚀 بدء تشغيل Halawi AI..."

# إيقاف الخادم القديم إذا كان يعمل
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⏹️  إيقاف الخادم القديم..."
    pkill -f "vite dev" 2>/dev/null
    sleep 2
fi

# التحقق من وجود node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت الحزم..."
    npm install
fi

# تشغيل الخادم
echo "✅ تشغيل الخادم على http://localhost:5173"
npm run dev

