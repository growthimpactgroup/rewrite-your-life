#!/bin/bash
# Final push to GitHub and verify deployment

echo "🚀 Pushing code to GitHub..."
git push https://github.com/mmendozafrances-ai/rewrite-your-life.git main

if [ $? -eq 0 ]; then
  echo "✅ Push successful!"
  echo ""
  echo "Vercel auto-deploy should start in a few seconds."
  echo "Monitor at: https://vercel.com/dashboard"
  echo ""
  echo "After ~2-3 minutes, verify endpoints:"
  echo "  curl -I https://ryl.proofovertime.com/results"
  echo "  curl -I https://ryl.proofovertime.com/verify.json"
else
  echo "❌ Push failed. Check your Git credentials."
  exit 1
fi
