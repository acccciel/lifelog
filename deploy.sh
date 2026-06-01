#!/bin/bash
# LifeLog 部署脚本 - 发布到 Cloudflare Pages
# 使用方法：
#   1. 设置环境变量：
#      export CLOUDFLARE_ACCOUNT_ID="你的AccountID"
#      export CLOUDFLARE_API_TOKEN="你的APIToken"
#   2. 运行：sh deploy.sh

cd "$(dirname "$0")"

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ 请先设置环境变量："
  echo "   export CLOUDFLARE_ACCOUNT_ID=\"你的AccountID\""
  echo "   export CLOUDFLARE_API_TOKEN=\"你的APIToken\""
  exit 1
fi

echo "🏗️ 构建中..."
npm run build

echo "🚀 部署中..."
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
npx wrangler pages deploy docs --project-name lifelog

echo "✅ 部署完成！"