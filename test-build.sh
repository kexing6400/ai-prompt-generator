#!/bin/bash

echo "🔍 检查TypeScript错误..."
npx tsc --noEmit 2>&1 | head -20

echo ""
echo "🔍 检查ESLint错误..."
npx eslint . --ext .ts,.tsx 2>&1 | head -20

echo ""
echo "🔍 检查Next.js构建..."
npx next build 2>&1 | head -50