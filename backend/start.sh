#!/bin/bash
# Production environment variables
export DATABASE_URL="postgresql://buscaycurra:ByCurra2026Secure!@localhost:5433/buscaycurra"
export JWT_SECRET="ByCurra-JWT-2026-SuperSecretKey!"
export GROQ_API_KEY="your-groq-api-key-here"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT=587
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password-here"
export IMGBB_API_KEY="your-imgbb-key-here"
export PORT=3001
cd /root/.openclaw/workspace/busca-y-curra/backend
node src/index.js