<div align="center">

# 🏗️ BuildMatch

### Sistema de Intermediação para Serviços de Construção Civil

**Plataforma digital que conecta clientes e profissionais da construção civil em Cabo Verde**

![Versão](https://img.shields.io/badge/versão-1.0.0-1F4E8C?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)
![Licença](https://img.shields.io/badge/licença-MIT-F57C00?style=for-the-badge)

---

*Hugo Felipe Pereira Monteiro — Universidade de Santiago — DCSAT — 2026*

</div>

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Funcionalidades](#2-funcionalidades)
3. [Arquitectura Técnica](#3-arquitectura-técnica)
4. [Base de Dados](#4-base-de-dados-postgresql)
5. [Instalação e Configuração](#5-instalação-e-configuração)
6. [Código do Backend](#6-código-do-backend)
7. [Endpoints da API REST](#7-endpoints-da-api-rest)
8. [Paleta de Cores Oficial](#8-paleta-de-cores-oficial)
9. [Segurança e Autenticação](#9-segurança-e-autenticação)
10. [Scripts Disponíveis](#10-scripts-disponíveis)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Deploy em Produção](#12-deploy-em-produção)
13. [Resolução de Problemas](#13-resolução-de-problemas-comuns)
14. [Como Contribuir](#14-como-contribuir)
15. [Licença e Créditos](#15-licença-e-créditos)

---

## 1. Visão Geral

**BuildMatch** é uma plataforma digital desenvolvida com **React.js + Node.js + PostgreSQL** que facilita a conexão entre **clientes** e **profissionais da construção civil** em Cabo Verde, promovendo transparência, confiança e eficiência no processo de contratação de serviços.

> **Projecto Académico** — TCC | Universidade de Santiago | Departamento de Ciências da Saúde, Ambiente e Tecnologias | Assomada, 2026

### Resumo do Projecto

| Campo | Detalhe |
|---|---|
| **Nome** | BuildMatch |
| **Versão** | 1.0.0 |
| **Autor** | Hugo Felipe Pereira Monteiro |
| **Instituição** | Universidade de Santiago — CSAT |
| **Linguagem principal** | JavaScript (React + Node.js) |
| **Base de dados** | PostgreSQL 15+ |
| **ORM** | Prisma |
| **Licença** | MIT |
| **Ano** | 2026 |

---

## 2. Funcionalidades

### 2.1 Para Clientes

- 🔍 **Pesquisa avançada** — buscar profissionais por especialidade, localização e avaliação
- 🤖 **Sistema de recomendação** — sugestões baseadas no tipo de obra e trabalhos semelhantes
- 🖼️ **Visualização de portfólios** — fotos e vídeos de obras concluídas
- 💬 **Chat em tempo real** — comunicação directa com envio de fotos, vídeos e documentos
- 📅 **Agendamento de serviços** — selecção de data, hora e local da obra
- 📋 **Histórico de projectos** — serviços concluídos, em andamento e agendados
- ⭐ **Avaliações verificadas** — apenas clientes que contrataram podem avaliar

### 2.2 Para Profissionais

- 👷 **Perfil profissional detalhado** — especialidades, certificações, área de actuação e raio de atendimento
- 🗂️ **Portfólio digital** — imagens antes/depois, vídeos, organização por álbuns e categorias
- 📆 **Calendário de disponibilidade** — gestão de agenda em tempo real com sincronização Google Calendar
- 💰 **Gestão de orçamentos** — propostas organizadas por pacotes, custo de mão de obra + materiais
- 📊 **Dashboard de métricas** — visualizações de perfil, conversões e estatísticas de avaliação
- 💬 **Chat integrado** — histórico de conversas por projecto com suporte a multimédia

### 2.3 Telas do Aplicativo

| Ecrã | Descrição | Estado |
|---|---|---|
| 🚀 **Onboarding** | 3 slides de apresentação da app com animações | ✅ Implementado |
| 🔐 **Login / Registo** | Autenticação por tipo de conta (Cliente ou Profissional) | ✅ Implementado |
| 🏠 **Home** | Pesquisa, categorias com ícones e profissionais recomendados | ✅ Implementado |
| 🔍 **Busca** | Filtros avançados, ordenação por avaliação/distância | ✅ Implementado |
| 👷 **Perfil Profissional** | Portfólio, avaliações, preços e botões de acção | ✅ Implementado |
| 💬 **Chat** | Mensagens em tempo real com histórico por projecto | ✅ Implementado |
| 📅 **Agendamento** | Selecção de data, horário e descrição do serviço | ✅ Implementado |
| 📋 **Projectos** | Histórico com estados: concluído, em andamento, agendado | ✅ Implementado |
| 👤 **Perfil do Utilizador** | Editar dados, notificações, endereços e avaliações feitas | ✅ Implementado |

---

## 3. Arquitectura Técnica

### 3.1 Stack de Tecnologias

| Camada | Tecnologia | Versão | Função |
|---|---|---|---|
| **Frontend** | React.js + Vite | 18 / 5 | Interface do utilizador |
| **Backend** | Node.js + Express | 20 / 4 | API REST |
| **Base de Dados** | PostgreSQL | 15+ | Persistência de dados |
| **ORM** | Prisma | 5+ | Mapeamento objeto-relacional |
| **Autenticação** | JWT + bcrypt | — | Segurança e sessões |
| **Upload de Ficheiros** | Multer + AWS S3 | — | Armazenamento de multimédia |
| **Tempo Real** | Socket.IO | 4+ | Chat e notificações em tempo real |
| **Mapas** | Google Maps API | — | Geolocalização e distâncias |

### 3.2 Estrutura de Pastas

```
buildmatch/
├── buildmatch-frontend/              # React + Vite
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/               # Componentes reutilizáveis
│   │   │   ├── Avatar.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── StarRating.jsx
│   │   ├── screens/                  # Ecrãs principais da aplicação
│   │   │   ├── HomeScreen.jsx
│   │   │   ├── SearchScreen.jsx
│   │   │   ├── ProfessionalProfile.jsx
│   │   │   ├── ChatScreen.jsx
│   │   │   ├── ScheduleScreen.jsx
│   │   │   ├── ProjectsScreen.jsx
│   │   │   ├── MessagesScreen.jsx
│   │   │   ├── ProfileScreen.jsx
│   │   │   ├── LoginScreen.jsx
│   │   │   └── OnboardingScreen.jsx
│   │   ├── services/                 # Chamadas à API backend
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── professionals.js
│   │   │   ├── projects.js
│   │   │   └── messages.js
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── useSocket.js
│   │   ├── App.jsx                   # Componente raiz e roteamento
│   │   └── main.jsx
│   ├── .env                          # Variáveis de ambiente frontend
│   ├── vite.config.js
│   └── package.json
│
└── buildmatch-backend/               # Node.js + Express + PostgreSQL
    ├── prisma/
    │   ├── schema.prisma             # Modelos da base de dados
    │   ├── seed.js                   # Dados de exemplo
    │   └── migrations/               # Histórico de migrações
    ├── src/
    │   ├── routes/                   # Definição das rotas da API
    │   │   ├── auth.js
    │   │   ├── users.js
    │   │   ├── professionals.js
    │   │   ├── projects.js
    │   │   ├── messages.js
    │   │   ├── schedules.js
    │   │   ├── reviews.js
    │   │   └── portfolio.js
    │   ├── controllers/              # Lógica de negócio
    │   │   ├── authController.js
    │   │   ├── professionalsController.js
    │   │   └── projectsController.js
    │   ├── middleware/               # Middlewares Express
    │   │   ├── auth.js               # Verificação JWT
    │   │   ├── upload.js             # Configuração Multer
    │   │   └── rateLimit.js
    │   └── utils/
    │       ├── geocoding.js
    │       └── notifications.js
    ├── server.js                     # Ponto de entrada do servidor
    ├── .env                          # Variáveis de ambiente backend
    └── package.json
```

### 3.3 Diagrama de Fluxo

```
Cliente (Browser)
       │
       ▼
┌─────────────────┐
│  React Frontend  │  ← localhost:5173
│  (Vite + JSX)   │
└────────┬────────┘
         │ HTTP / WebSocket
         ▼
┌─────────────────┐
│  Express API     │  ← localhost:3001
│  (Node.js)       │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   PostgreSQL     │  ← localhost:5432
│   (Base de dados)│
└─────────────────┘
         │
    AWS S3 (media)
    Google Maps API
```

---

## 4. Base de Dados (PostgreSQL)

### 4.1 Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ──────────────────────────────────────────

enum UserType {
  CLIENT
  PROFESSIONAL
}

enum ProjectStatus {
  PENDING
  ACTIVE
  COMPLETED
  CANCELLED
}

// ── Modelos ────────────────────────────────────────

model User {
  id          String    @id @default(uuid())
  name        String
  email       String    @unique
  password    String
  type        UserType
  avatar      String?
  phone       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  professional    Professional?
  projectsClient  Project[]     @relation("ClientProjects")
  reviewsGiven    Review[]      @relation("ReviewsGiven")
  messagesSent    Message[]     @relation("MessagesSent")
}

model Professional {
  id           String   @id @default(uuid())
  userId       String   @unique
  specialty    String
  experience   Int                      // anos de experiência
  location     String
  latitude     Float?
  longitude    Float?
  radius       Float                    // raio de atendimento em km
  rating       Float    @default(0)
  reviewCount  Int      @default(0)
  verified     Boolean  @default(false)
  available    Boolean  @default(true)
  priceMin     Float?
  priceMax     Float?
  about        String?
  tags         String[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  portfolio  Portfolio[]
  projects   Project[]
  reviews    Review[]
  schedules  Schedule[]
}

model Project {
  id             String        @id @default(uuid())
  title          String
  description    String?
  status         ProjectStatus @default(PENDING)
  clientId       String
  professionalId String
  amount         Float?
  startDate      DateTime?
  endDate        DateTime?
  address        String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  client       User         @relation("ClientProjects", fields: [clientId], references: [id])
  professional Professional @relation(fields: [professionalId], references: [id])
  messages     Message[]
  review       Review?
}

model Review {
  id             String   @id @default(uuid())
  rating         Int                        // 1 a 5
  comment        String
  reply          String?                    // resposta do profissional
  authorId       String
  professionalId String
  projectId      String   @unique
  createdAt      DateTime @default(now())

  author       User         @relation("ReviewsGiven", fields: [authorId], references: [id])
  professional Professional @relation(fields: [professionalId], references: [id])
  project      Project      @relation(fields: [projectId], references: [id])
}

model Message {
  id        String   @id @default(uuid())
  content   String
  senderId  String
  projectId String
  mediaUrl  String?
  mediaType String?  // image | video | document
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  sender  User    @relation("MessagesSent", fields: [senderId], references: [id])
  project Project @relation(fields: [projectId], references: [id])
}

model Schedule {
  id             String   @id @default(uuid())
  professionalId String
  date           DateTime
  startTime      String
  endTime        String
  available      Boolean  @default(true)
  createdAt      DateTime @default(now())

  professional Professional @relation(fields: [professionalId], references: [id])
}

model Portfolio {
  id             String   @id @default(uuid())
  professionalId String
  title          String
  description    String?
  imageUrls      String[]
  videoUrl       String?
  category       String?
  featured       Boolean  @default(false)
  createdAt      DateTime @default(now())

  professional Professional @relation(fields: [professionalId], references: [id])
}
```

### 4.2 Tabelas Resumo

| Tabela | Registos Principais | Relações |
|---|---|---|
| `User` | id, name, email, password, type | 1:1 Professional, 1:N Projects, 1:N Reviews |
| `Professional` | specialty, rating, verified, available | 1:N Portfolio, 1:N Schedule, 1:N Review |
| `Project` | title, status, amount, dates | N:1 Client, N:1 Professional, 1:N Messages |
| `Review` | rating (1-5), comment, reply | N:1 Author, N:1 Professional, 1:1 Project |
| `Message` | content, mediaUrl, read | N:1 Sender, N:1 Project |
| `Schedule` | date, startTime, available | N:1 Professional |
| `Portfolio` | title, imageUrls, category | N:1 Professional |

---

## 5. Instalação e Configuração

### 5.1 Pré-requisitos

| Ferramenta | Versão Mínima | Download |
|---|---|---|
| Node.js | v20+ | [nodejs.org](https://nodejs.org) |
| npm | v10+ | Incluído no Node.js |
| PostgreSQL | v15+ | [postgresql.org](https://www.postgresql.org) |
| Git | v2.40+ | [git-scm.com](https://git-scm.com) |
| VS Code *(recomendado)* | Qualquer | [code.visualstudio.com](https://code.visualstudio.com) |

**Extensões VS Code recomendadas:** `ESLint`, `Prisma`, `REST Client`, `GitLens`

---

### 5.2 Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/buildmatch.git
cd buildmatch
```

---

### 5.3 Configurar o Frontend

**Passo 1** — Instalar dependências:

```bash
cd buildmatch-frontend
npm install
```

**Passo 2** — Criar ficheiro de variáveis de ambiente:

```bash
# buildmatch-frontend/.env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_MAPS_KEY=sua_chave_google_maps
```

**Passo 3** — Iniciar o servidor de desenvolvimento:

```bash
npm run dev
# ✅ Aplicativo disponível em: http://localhost:5173
```

---

### 5.4 Configurar o Backend

**Passo 1** — Instalar dependências:

```bash
cd buildmatch-backend
npm install
```

**Passo 2** — Criar ficheiro `.env`:

```bash
# buildmatch-backend/.env

# ── Base de dados ──────────────────────────────────
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/buildmatch"

# ── Servidor ───────────────────────────────────────
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Autenticação JWT ───────────────────────────────
JWT_SECRET=buildmatch_jwt_secret_super_seguro_2026
JWT_EXPIRES_IN=7d

# ── AWS S3 (upload de imagens) ─────────────────────
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_BUCKET_NAME=buildmatch-media
AWS_REGION=eu-west-1

# ── Google Maps ────────────────────────────────────
GOOGLE_MAPS_API_KEY=sua_chave_google_maps
```

**Passo 3** — Criar a base de dados PostgreSQL:

```bash
# Aceder ao PostgreSQL
psql -U postgres

# Dentro do psql, criar a BD
CREATE DATABASE buildmatch;
\q
```

**Passo 4** — Inicializar o Prisma e aplicar migrações:

```bash
npx prisma generate
npx prisma migrate dev --name init

# Opcional: popular com dados de exemplo
npx prisma db seed
```

**Passo 5** — Iniciar o servidor:

```bash
npm run dev
# ✅ API disponível em: http://localhost:3001
```

---

### 5.5 Verificar Instalação

Com ambos os servidores a correr, abra o browser e aceda a:

| Serviço | URL | Esperado |
|---|---|---|
| Frontend | http://localhost:5173 | Ecrã de Onboarding do BuildMatch |
| API Health | http://localhost:3001/api/health | `{ "status": "ok" }` |
| Prisma Studio | http://localhost:5555 | Interface gráfica da BD |

```bash
# Para abrir o Prisma Studio (gestor visual da BD)
npx prisma studio
```

---

## 6. Código do Backend

### 6.1 server.js — Ponto de Entrada

```javascript
// buildmatch-backend/server.js

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ── Middlewares ────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ───────────────────────────────────
app.use('/api/auth',          require('./src/routes/auth'));
app.use('/api/users',         require('./src/routes/users'));
app.use('/api/professionals', require('./src/routes/professionals'));
app.use('/api/projects',      require('./src/routes/projects'));
app.use('/api/messages',      require('./src/routes/messages'));
app.use('/api/schedules',     require('./src/routes/schedules'));
app.use('/api/reviews',       require('./src/routes/reviews'));
app.use('/api/portfolio',     require('./src/routes/portfolio'));

// ── Socket.IO — Chat em tempo real ────────────────
io.on('connection', (socket) => {
  console.log('Utilizador conectado:', socket.id);

  // Entrar numa sala de projecto
  socket.on('join_room', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} entrou na sala: ${projectId}`);
  });

  // Enviar mensagem para a sala
  socket.on('send_message', (data) => {
    io.to(data.projectId).emit('receive_message', data);
  });

  // Indicador de digitação
  socket.on('typing', (data) => {
    socket.to(data.projectId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('Utilizador desconectado:', socket.id);
  });
});

// ── Iniciar servidor ───────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 BuildMatch API a correr em http://localhost:${PORT}`);
});
```

### 6.2 Middleware de Autenticação JWT

```javascript
// src/middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação necessário' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

### 6.3 Rota de Autenticação

```javascript
// src/routes/auth.js

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, type, specialty } = req.body;

    // Verificar se email já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email já registado' });
    }

    // Hash da palavra-passe
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Criar utilizador
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        type,
        // Se for profissional, criar perfil imediatamente
        professional: type === 'PROFESSIONAL' ? {
          create: { specialty: specialty || '', experience: 0, location: '', radius: 10 }
        } : undefined,
      },
      include: { professional: true },
    });

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, type: user.type },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { professional: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id, name: user.name,
        email: user.email, type: user.type,
        professional: user.professional,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { professional: true },
      omit: { password: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
```

### 6.4 Rota de Profissionais

```javascript
// src/routes/professionals.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/professionals — Listar com filtros
router.get('/', async (req, res) => {
  try {
    const {
      specialty, location, minRating,
      available, page = 1, limit = 10,
      sortBy = 'rating', order = 'desc',
    } = req.query;

    const where = {};
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (location)  where.location  = { contains: location,  mode: 'insensitive' };
    if (minRating) where.rating    = { gte: parseFloat(minRating) };
    if (available) where.available = available === 'true';

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        include: { user: { omit: { password: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.professional.count({ where }),
    ]);

    res.json({
      data: professionals,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar profissionais' });
  }
});

// GET /api/professionals/:id — Perfil completo
router.get('/:id', async (req, res) => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: req.params.id },
      include: {
        user:      { omit: { password: true } },
        portfolio: { orderBy: { createdAt: 'desc' } },
        reviews:   { include: { author: { omit: { password: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(professional);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter profissional' });
  }
});

// PUT /api/professionals/:id — Actualizar perfil
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { specialty, experience, location, radius, priceMin, priceMax, about, tags, available } = req.body;

    const professional = await prisma.professional.update({
      where: { id: req.params.id },
      data: { specialty, experience, location, radius, priceMin, priceMax, about, tags, available },
    });

    res.json(professional);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao actualizar profissional' });
  }
});

module.exports = router;
```

### 6.5 package.json do Backend

```json
{
  "name": "buildmatch-backend",
  "version": "1.0.0",
  "description": "API REST para o aplicativo BuildMatch",
  "main": "server.js",
  "scripts": {
    "dev":   "nodemon server.js",
    "start": "node server.js",
    "seed":  "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcrypt":         "^5.1.1",
    "cors":           "^2.8.5",
    "dotenv":         "^16.3.1",
    "express":        "^4.18.2",
    "jsonwebtoken":   "^9.0.2",
    "multer":         "^1.4.5",
    "socket.io":      "^4.6.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "prisma":  "^5.0.0"
  }
}
```

---

## 7. Endpoints da API REST

> Todos os endpoints protegidos requerem o header: `Authorization: Bearer <token>`

### 7.1 Autenticação — `/api/auth`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registar novo utilizador (cliente ou profissional) | ❌ |
| `POST` | `/api/auth/login` | Autenticar e obter token JWT | ❌ |
| `GET` | `/api/auth/me` | Dados do utilizador autenticado | ✅ |
| `PUT` | `/api/auth/change-password` | Alterar palavra-passe | ✅ |
| `POST` | `/api/auth/logout` | Invalidar sessão | ✅ |

**Exemplo — Registo:**
```json
// POST /api/auth/register
{
  "name":      "João Pereira",
  "email":     "joao@exemplo.com",
  "password":  "senha_segura_123",
  "type":      "PROFESSIONAL",
  "specialty": "Pedreiro"
}

// Resposta 201
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user":  { "id": "uuid", "name": "João Pereira", "type": "PROFESSIONAL" }
}
```

---

### 7.2 Profissionais — `/api/professionals`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/professionals` | Listar com filtros e paginação | ❌ |
| `GET` | `/api/professionals/:id` | Perfil completo (portfólio + avaliações) | ❌ |
| `PUT` | `/api/professionals/:id` | Actualizar perfil | ✅ |
| `GET` | `/api/professionals/search` | Pesquisa por texto livre | ❌ |
| `GET` | `/api/professionals/:id/availability` | Ver disponibilidade de datas | ❌ |

**Query params para listagem:**
```
GET /api/professionals?specialty=Pedreiro&location=Praia&minRating=4&available=true&page=1&limit=10&sortBy=rating&order=desc
```

---

### 7.3 Projectos — `/api/projects`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/projects` | Listar projectos do utilizador | ✅ |
| `POST` | `/api/projects` | Criar novo projecto / solicitar serviço | ✅ |
| `GET` | `/api/projects/:id` | Detalhe de um projecto | ✅ |
| `PUT` | `/api/projects/:id` | Actualizar estado ou dados | ✅ |
| `DELETE` | `/api/projects/:id` | Cancelar projecto | ✅ |

**Exemplo — Criar projecto:**
```json
// POST /api/projects
{
  "title":          "Pintura da sala e dois quartos",
  "description":    "Sala de 25m² e dois quartos de 12m² cada. Tinta fornecida pelo cliente.",
  "professionalId": "uuid-do-profissional",
  "amount":         18000,
  "startDate":      "2026-04-01T09:00:00Z",
  "address":        "Rua de Achada Santo António, Praia"
}
```

---

### 7.4 Mensagens — `/api/messages`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | Listar todas as conversas | ✅ |
| `GET` | `/api/messages/project/:projectId` | Histórico de mensagens de um projecto | ✅ |
| `POST` | `/api/messages/project/:projectId` | Enviar mensagem (texto ou ficheiro) | ✅ |

> **Nota:** O chat em tempo real funciona via **Socket.IO** (WebSocket). A API REST serve apenas para carregar o histórico inicial.

---

### 7.5 Avaliações — `/api/reviews`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/reviews/professional/:id` | Ver avaliações de um profissional | ❌ |
| `POST` | `/api/reviews` | Submeter avaliação (só após projecto concluído) | ✅ |
| `PUT` | `/api/reviews/:id/reply` | Profissional responde à avaliação | ✅ |

**Regras de negócio das avaliações:**
- Apenas clientes que contrataram podem avaliar
- Avaliação disponível apenas após conclusão do projecto
- Prazo máximo de 30 dias para submeter avaliação
- Uma resposta única por profissional por avaliação
- Avaliações são permanentes (não removíveis)
- A nota média é recalculada automaticamente após cada avaliação

---

### 7.6 Agendamentos — `/api/schedules`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/schedules/professional/:id` | Ver disponibilidade do profissional | ❌ |
| `POST` | `/api/schedules` | Criar agendamento | ✅ |
| `PUT` | `/api/schedules/:id` | Confirmar ou reagendar | ✅ |
| `DELETE` | `/api/schedules/:id` | Cancelar agendamento | ✅ |

---

### 7.7 Portfólio — `/api/portfolio`

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/portfolio/professional/:id` | Ver portfólio do profissional | ❌ |
| `POST` | `/api/portfolio` | Adicionar item ao portfólio | ✅ |
| `PUT` | `/api/portfolio/:id` | Actualizar item | ✅ |
| `DELETE` | `/api/portfolio/:id` | Remover item | ✅ |

---

## 8. Paleta de Cores Oficial

A paleta deriva directamente do logotipo BuildMatch para garantir consistência visual total.

### 8.1 Cores Principais

| Cor | Hex | Uso | Significado |
|---|---|---|---|
| 🔵 **Azul Principal** | `#1F4E8C` | Cabeçalhos, botões, navbar, ícones activos | Confiança, tecnologia, estabilidade |
| 🟠 **Laranja Destaque** | `#F57C00` | Botões CTA, indicadores de estado, elementos interactivos | Actividade, construção, energia |
| ⚫ **Cinza Escuro** | `#2E2E2E` | Texto principal | Seriedade, profissionalismo |
| ⬜ **Cinza Claro** | `#F5F5F5` | Fundo das páginas | Leveza, espaço |
| ⬜ **Branco** | `#FFFFFF` | Cards, áreas de conteúdo | Clareza, limpeza |

### 8.2 Hierarquia Visual Recomendada

```
Fundo geral      →  Cinza claro  (#F5F5F5)
Cards / cartões  →  Branco       (#FFFFFF)  + sombra suave
Botões principais→  Azul         (#1F4E8C)
Acções (CTA)     →  Laranja      (#F57C00)
Texto principal  →  Cinza escuro (#2E2E2E)
Texto secundário →  #6B7280
Bordas           →  #E5E7EB
```

### 8.3 Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| Título principal | DM Sans | Bold 700 | 24–28px |
| Subtítulo | DM Sans | SemiBold 600 | 18–20px |
| Texto normal | DM Sans | Regular 400 | 14–16px |
| Botões | DM Sans | Medium 500 | 14px |
| Legendas / Labels | DM Sans | Regular 400 | 11–12px |

```html
<!-- Importar no index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 8.4 Variáveis CSS

```css
:root {
  --color-primary:      #1F4E8C;
  --color-primary-dark: #163a6b;
  --color-accent:       #F57C00;
  --color-accent-dark:  #c96800;
  --color-dark:         #2E2E2E;
  --color-gray:         #6B7280;
  --color-light-gray:   #F5F5F5;
  --color-white:        #FFFFFF;
  --color-success:      #22C55E;
  --color-border:       #E5E7EB;
  --font-main:          'DM Sans', sans-serif;
  --radius-sm:          8px;
  --radius-md:          12px;
  --radius-lg:          16px;
  --shadow-card:        0 2px 12px rgba(0, 0, 0, 0.07);
}
```

---

## 9. Segurança e Autenticação

### 9.1 Fluxo de Autenticação JWT

```
1. Cliente envia email + password  →  POST /api/auth/login
2. Servidor valida credenciais     →  bcrypt.compare()
3. Servidor gera token JWT         →  jwt.sign({ id, email, type }, SECRET, { expiresIn: '7d' })
4. Cliente recebe token            →  Guardado em memória (ou localStorage)
5. Requisições seguintes           →  Authorization: Bearer <token>
6. Servidor verifica token         →  jwt.verify(token, SECRET)
```

### 9.2 Boas Práticas Implementadas

| Medida | Implementação | Detalhe |
|---|---|---|
| **Hash de passwords** | bcrypt | Salt rounds = 12 |
| **Tokens JWT** | jsonwebtoken | Expiração: 7 dias |
| **CORS** | cors package | Apenas origens autorizadas |
| **Rate limiting** | express-rate-limit | 100 req/min por IP |
| **Validação de inputs** | Manual + Prisma | Antes de qualquer operação na BD |
| **Protecção SQL injection** | Prisma ORM | Queries parametrizadas automáticas |
| **Upload de ficheiros** | Multer | Validação de tipo MIME e tamanho máximo (10MB) |
| **HTTPS** | Configurado no deploy | Obrigatório em produção |

---

## 10. Scripts Disponíveis

### 10.1 Frontend

```bash
# Iniciar servidor de desenvolvimento com hot-reload
npm run dev

# Compilar para produção (output em dist/)
npm run build

# Pré-visualizar build de produção localmente
npm run preview

# Verificar qualidade do código (ESLint)
npm run lint

# Corrigir erros de linting automaticamente
npm run lint:fix
```

### 10.2 Backend

```bash
# Iniciar com nodemon (hot-reload em desenvolvimento)
npm run dev

# Iniciar em modo produção
npm start

# Abrir interface visual da base de dados (Prisma Studio)
npx prisma studio

# Criar e aplicar nova migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção (sem criar ficheiros)
npx prisma migrate deploy

# Resetar base de dados (APAGA TODOS OS DADOS)
npx prisma migrate reset

# Popular base de dados com dados de exemplo
npx prisma db seed

# Regenerar cliente Prisma após alterar schema
npx prisma generate

# Verificar estado das migrações
npx prisma migrate status

# Formatar ficheiro schema.prisma
npx prisma format
```

---

## 11. Variáveis de Ambiente

### 11.1 Frontend — `buildmatch-frontend/.env`

| Variável | Exemplo | Obrigatória | Descrição |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | ✅ Sim | URL base da API backend |
| `VITE_SOCKET_URL` | `http://localhost:3001` | ✅ Sim | URL do servidor Socket.IO |
| `VITE_GOOGLE_MAPS_KEY` | `AIzaSy...` | ❌ Não | Chave Google Maps API |

### 11.2 Backend — `buildmatch-backend/.env`

| Variável | Exemplo | Obrigatória | Descrição |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://user:pwd@host:5432/db` | ✅ Sim | URL de conexão PostgreSQL |
| `PORT` | `3001` | ❌ Não | Porta do servidor (padrão: 3001) |
| `NODE_ENV` | `development` | ❌ Não | Ambiente de execução |
| `FRONTEND_URL` | `http://localhost:5173` | ✅ Sim | URL do frontend (CORS) |
| `JWT_SECRET` | `chave_secreta_longa_aleatoria` | ✅ Sim | Chave para assinar tokens JWT |
| `JWT_EXPIRES_IN` | `7d` | ❌ Não | Expiração do token (padrão: 7d) |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | ❌ Não | Credencial AWS para S3 |
| `AWS_SECRET_ACCESS_KEY` | `abc123...` | ❌ Não | Credencial secreta AWS |
| `AWS_BUCKET_NAME` | `buildmatch-media` | ❌ Não | Nome do bucket S3 |
| `AWS_REGION` | `eu-west-1` | ❌ Não | Região AWS |
| `GOOGLE_MAPS_API_KEY` | `AIzaSy...` | ❌ Não | Chave Google Maps (backend) |

> ⚠️ **Nunca faça commit dos ficheiros `.env` no Git.** Garanta que `.env` está listado no `.gitignore`.

---

## 12. Deploy em Produção

### 12.1 Frontend — Vercel *(Recomendado)*

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login na Vercel
vercel login

# Build e deploy
cd buildmatch-frontend
npm run build
vercel --prod
```

No painel Vercel → **Settings → Environment Variables**, adicione todas as variáveis do `.env`.

### 12.2 Backend — Railway *(Recomendado)*

1. Aceder a [railway.app](https://railway.app) e criar conta
2. Criar novo projecto → **Deploy from GitHub repo**
3. Seleccionar o repositório `buildmatch-backend`
4. Adicionar **Plugin PostgreSQL** ao projecto (Railway configura `DATABASE_URL` automaticamente)
5. Configurar todas as variáveis de ambiente em **Variables**
6. O deploy é automático a cada `git push`

### 12.3 Alternativas de Alojamento

| Serviço | Frontend | Backend | BD PostgreSQL | Plano Gratuito |
|---|---|---|---|---|
| **Vercel** | ✅ Excelente | ⚠️ Limitado | ❌ | ✅ Sim |
| **Railway** | ✅ Bom | ✅ Excelente | ✅ Integrado | ✅ 5$/mês crédito |
| **Render** | ✅ Bom | ✅ Bom | ✅ 90 dias grátis | ✅ Sim |
| **Supabase** | ❌ | ❌ | ✅ Excelente | ✅ 500MB grátis |
| **Neon** | ❌ | ❌ | ✅ Serverless | ✅ 3GB grátis |

### 12.4 Checklist de Deploy

```
✅ Obrigatório antes de lançar em produção:
   [ ] NODE_ENV=production configurado no servidor
   [ ] Todas as variáveis de ambiente configuradas
   [ ] npx prisma migrate deploy (em vez de migrate dev)
   [ ] CORS configurado com URL real do frontend
   [ ] JWT_SECRET com valor longo e aleatório (mín. 32 caracteres)
   [ ] HTTPS / SSL activo no domínio

📌 Recomendado:
   [ ] Backup automático da base de dados configurado
   [ ] Monitorização de erros (ex: Sentry)
   [ ] Logs centralizados (ex: Logtail, Papertrail)
   [ ] Health check endpoint a responder

🔧 Opcional mas útil:
   [ ] CDN para assets estáticos (ex: Cloudflare)
   [ ] Cache de respostas da API (ex: Redis)
   [ ] Rate limiting mais granular por utilizador
```

---

## 13. Resolução de Problemas Comuns

| Problema | Causa Provável | Solução |
|---|---|---|
| `Cannot connect to database` | URL da BD incorrecta ou PostgreSQL não iniciado | Verificar `DATABASE_URL` no `.env` e confirmar que o PostgreSQL está a correr |
| `P1001: Can't reach database server` | PostgreSQL não iniciado | Linux: `sudo service postgresql start` \| Windows: iniciar via pgAdmin ou Services |
| `CORS error no browser` | `FRONTEND_URL` não configurado | Adicionar `FRONTEND_URL=http://localhost:5173` no `.env` do backend |
| `Token JWT inválido` | `JWT_SECRET` inconsistente | Garantir que `JWT_SECRET` não muda entre reinícios do servidor |
| `Porta 3001 já em uso` | Outro processo na mesma porta | Alterar `PORT=3002` no `.env` ou: `kill $(lsof -ti:3001)` |
| `npm install` falha | Versão do Node.js incompatível | Usar Node.js v20+: `nvm install 20 && nvm use 20` |
| `prisma migrate dev` falha | Utilizador sem permissões | Garantir que o utilizador PostgreSQL tem `CREATEDB` |
| `Module not found` | Dependência não instalada | Correr `npm install` na pasta correcta (frontend ou backend) |
| Imagens não carregam | AWS S3 não configurado | Verificar credenciais AWS no `.env` ou usar armazenamento local em desenvolvimento |
| Socket.IO não conecta | URL errada no frontend | Verificar `VITE_SOCKET_URL` no `.env` do frontend |

---

## 14. Como Contribuir

### 14.1 Fluxo de Trabalho

```bash
# 1. Fork do repositório no GitHub

# 2. Clonar o seu fork
git clone https://github.com/SEU-USUARIO/buildmatch.git
cd buildmatch

# 3. Criar branch para a nova funcionalidade
git checkout -b feature/nome-da-feature

# 4. Fazer as alterações e commit
git add .
git commit -m "feat: descrição clara da funcionalidade"

# 5. Push para o seu fork
git push origin feature/nome-da-feature

# 6. Abrir Pull Request no GitHub com descrição detalhada
```

### 14.2 Convenção de Commits

| Prefixo | Quando usar | Exemplo |
|---|---|---|
| `feat:` | Nova funcionalidade | `feat: adicionar sistema de avaliações` |
| `fix:` | Correcção de bug | `fix: corrigir erro no login de profissional` |
| `docs:` | Documentação | `docs: actualizar README com novos endpoints` |
| `style:` | Formatação (sem lógica) | `style: corrigir indentação nos components` |
| `refactor:` | Refactorização | `refactor: simplificar lógica de autenticação` |
| `test:` | Testes | `test: adicionar testes para rota /api/auth` |
| `chore:` | Dependências / configuração | `chore: actualizar prisma para v5.5` |

### 14.3 Padrão de Pull Request

```markdown
## Descrição
Breve descrição do que foi alterado.

## Tipo de alteração
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Alteração de funcionalidade existente
- [ ] Documentação

## Como testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Screenshots (se aplicável)
```

---

## 15. Licença e Créditos

### Licença MIT

```
MIT License

Copyright (c) 2026 Hugo Felipe Pereira Monteiro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

### Autor

| Campo | Informação |
|---|---|
| **Nome** | Hugo Felipe Pereira Monteiro |
| **Instituição** | Universidade de Santiago — Departamento de CSAT |
| **Curso** | Engenharia Informática |
| **Ano** | 2026 |
| **Cidade** | Assomada, Cabo Verde |

### Tecnologias de Terceiros

| Tecnologia | Licença | Site |
|---|---|---|
| React.js | MIT | [react.dev](https://react.dev) |
| Vite | MIT | [vitejs.dev](https://vitejs.dev) |
| Express.js | MIT | [expressjs.com](https://expressjs.com) |
| Prisma ORM | Apache 2.0 | [prisma.io](https://prisma.io) |
| PostgreSQL | PostgreSQL License | [postgresql.org](https://www.postgresql.org) |
| Socket.IO | MIT | [socket.io](https://socket.io) |
| JSON Web Token | MIT | [github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) |
| bcrypt | MIT | [github.com/kelektiv/node.bcrypt.js](https://github.com/kelektiv/node.bcrypt.js) |
| DM Sans Font | OFL | [Google Fonts](https://fonts.google.com/specimen/DM+Sans) |

---

<div align="center">

**BuildMatch** © 2026 — Hugo Monteiro — Universidade de Santiago

*Sistema de Intermediação para Serviços de Construção Civil em Cabo Verde*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma)](https://prisma.io)

</div>
