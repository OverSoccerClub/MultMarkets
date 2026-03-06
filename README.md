# MultMarkets 🔮

**Plataforma de Mercados de Previsão** — Full Stack (Web + Mobile + Backend + Bots)

---

## 🚀 Quick Start

### Pré-requisitos
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com)

### 1. Setup do projeto

```bash
# Clone ou abra na pasta do projeto
cd MultMarkets

# Instale as dependências (todos os packages)
npm install

# Configure o ambiente
cp .env.example .env
# ⚠️ Edite .env com suas configurações
```

### 2. Subir serviços (PostgreSQL + Redis)

```bash
# Inicia o banco de dados e Redis
docker compose up postgres redis -d

# Verificar se estão rodando
docker compose ps
```

### 3. Banco de dados

```bash
# Gera o Prisma Client
cd packages/database
npx prisma generate

# Roda as migrations
npx prisma migrate dev --name init

# Popula com dados iniciais
npx ts-node prisma/seed.ts
```

### 4. Iniciar os apps

```bash
# Da raiz do projeto — inicia API + Web juntos
npm run dev

# Ou individualmente:
cd apps/api && npm run dev    # API na porta 3001
cd apps/web && npm run dev    # Web na porta 3000
cd apps/mobile && npm run dev # Expo
```

---

## 🏗️ Estrutura do Projeto

```
multmarkets/
├── apps/
│   ├── api/          ← NestJS Backend (porta 3001)
│   ├── web/          ← Next.js 14 Web App (porta 3000)
│   └── mobile/       ← Expo React Native
├── packages/
│   ├── database/     ← Prisma schema + migrations + seed
│   └── shared/       ← Types, Zod schemas, constantes
├── docker-compose.yml
├── .env.example
└── turbo.json
```

---

## 🔑 Credenciais de Demo

Após rodar o seed:

| Usuário | Email | Senha | Saldo |
|--|--|--|--|
| Admin | `admin@multmarkets.com` | `Admin@123456` | R$ 10.000 |
| Demo | `demo@multmarkets.com` | `Demo@123456` | R$ 500 |

---

## 📡 API Docs (Swagger)

Disponível em [`http://localhost:3001/api/docs`](http://localhost:3001/api/docs) em modo `development`.

---

## 🤖 Sistema de Bots

Os bots descobrem automaticamente tópicos em alta a cada 30 minutos.

Para acionar manualmente:
```bash
# POST /api/v1/bot/run  (requer token ADMIN)
curl -X POST http://localhost:3001/api/v1/bot/run \
  -H "Authorization: Bearer <seu-token>"
```

Para revisar os rascunhos, acesse o painel admin em `/admin`.

---

## 🔐 Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|--|--|
| `DATABASE_URL` | Conexão PostgreSQL |
| `JWT_SECRET` | Segredo do access token |
| `JWT_REFRESH_SECRET` | Segredo do refresh token |
| `OPENAI_API_KEY` | Para geração IA de mercados (opcional) |
| `NEWS_API_KEY` | Para descoberta de notícias (opcional) |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--|--|
| Backend | NestJS + Prisma + PostgreSQL + Redis |
| Web | Next.js 14 + TanStack Query + Zustand |
| Mobile | Expo SDK 52 + NativeWind |
| Real-time | Socket.io WebSockets |
| Autenticação | JWT + 2FA TOTP |
| Preços | LMSR AMM (Automated Market Maker) |
| Bots | Bull + Redis + OpenAI/Gemini |
| UI | Design System personalizado (ver `tailwind.config.js`) |
