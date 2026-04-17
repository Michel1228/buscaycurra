# 🚀 Busca y Curra - Smart Job Search App

**Automatiza tu búsqueda de empleo con IA**

## ¿Qué hace?
- **CV Adaptativo**: Tu CV se adapta automáticamente a cada sector
- **IA Integrada**: Mejora tu perfil, habilidades y carta de presentación  
- **Búsqueda Automática**: Encuentra empresas cerca de ti
- **Envío Automatizado**: Envía CVs todos los días sin esfuerzo
- **Generación PDF**: CVs profesionales de 2 columnas

## 🌐 Live Demo
- **Web App**: [buscaycurra.es/app](https://buscaycurra.es/app)
- **Landing**: [buscaycurra.es](https://buscaycurra.es) 
- **API**: [api.buscaycurra.es](https://api.buscaycurra.es/api/health)

## 🛠️ Tech Stack
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React Native + Expo (iOS/Android/Web)
- **AI**: Groq (Llama 3.3 70B)
- **Deploy**: Docker + Traefik + Let's Encrypt
- **Payments**: Stripe (próximamente)

## 📦 Auto-Deploy Setup

### 1. GitHub to Hostinger
Cada push a `main` actualiza automáticamente:
```bash
# En tu servidor (187.124.37.183)
cd /root/.openclaw/workspace/busca-y-curra
git pull origin main
# Containers se actualizan automáticamente
```

### 2. Manual Deploy
```bash
git clone https://github.com/Michel1228/buscaycurra.git
cd buscaycurra
# Crear .env con tus credenciales
cp .env.example .env
# Levantar servicios
docker-compose up -d
```

## 📁 Estructura
```
busca-y-curra/
├── backend/          # Node.js API
├── frontend-app/     # React Native (mobile/web)  
├── frontend/         # Landing pages
├── docs/            # Documentación
├── .env.example     # Template credenciales
└── docker-compose.yml
```

## 🔑 Próximos pasos
- [x] **GitHub subido** - Código completo disponible
- [x] **Auto-deploy básico** - Pull automático en servidor
- [ ] **Stripe integration** - Pagos profesionales
- [ ] **APK build** - Google Play Store
- [ ] **Job scraper** - Automatización completa

---
**Made with ❤️ by Michel Batista González**  
**Deployed on Hostinger VPS - buscaycurra.es**