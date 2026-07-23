# BuildMatch — Documentação Completa & Relatório Tecnológico de Handoff

> **Plataforma Web & Mobile-First** para conectar clientes a profissionais da construção civil em Cabo Verde.
> Este documento fornece uma visão arquitetural completa, manual de instalação/arranque, especificação da API REST, modelo de dados e análise de maturidade da aplicação (TCC).

---

## ÍNDICE

1. [Visão Geral e Propósito](#1-visão-geral-e-propósito)
2. [Arquitetura do Sistema e Stack Tecnológica](#2-arquitetura-do-sistema-e-stack-tecnológica)
3. [Estrutura de Ficheiros do Projeto](#3-estrutura-de-ficheiros-do-projeto)
4. [Configuração e Arranque Local](#4-configuração-e-arranque-local)
5. [Modelo de Dados (Prisma & PostgreSQL)](#5-modelo-de-dados-prisma--postgresql)
6. [API REST — Rotas e Endpoints](#6-api-rest--rotas-e-endpoints)
7. [Ciclo de Vida do Projeto & Fluxo de Trabalho](#7-ciclo-de-vida-do-projeto--fluxo-de-trabalho)
8. [Chat em Tempo Real & Notificações](#8-chat-em-tempo-real--notificações)
9. [Painel de Administração e Moderação](#9-painel-de-administração-e-moderação)
10. [Análise de Maturidade, Qualidade e Cobertura de Testes](#10-análise-de-maturidade-qualidade-e-cobertura-de-testes)
11. [Recomendações e Próximos Passos (TCC / Produção)](#11-recomendações-e-próximos-passos-tcc--produção)

---

## 1. VISÃO GERAL E PROPÓSITO

O **BuildMatch** é uma solução tecnológica desenvolvida para transformar e formalizar a contratação de serviços na construção civil em Cabo Verde. A plataforma aborda a assimetria de informação entre contratantes e prestadores de serviços, oferecendo:

- **Transparência e Confiança**: Perfil detalhado de profissionais (pedreiros, eletricistas, canalizadores, pintores, engenheiros, etc.), avaliações mútuas, portfólio verificado e agenda de disponibilidade.
- **Segurança Contratual e Transacional**: Orçamentação transparente, contrapropostas, geração automática de contratos em PDF, divisão em marcos (*milestones*), submissão de comprovativos de pagamento e sistema de disputas arbitrárias.
- **Acompanhamento de Obras**: Fluxo de estados rastreável com linha do tempo (*PENDING* $\rightarrow$ *ACTIVE* $\rightarrow$ *COMPLETED* / *CANCELLED*), notificações em tempo real e chat integrado via WebSockets.

---

## 2. ARQUITETURA DO SISTEMA E STACK TECNOLÓGICA

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|   React 19 (SPA) + Vite 8 + FontAwesome 7 + WebSockets (Socket.io)      |
|   Alojamento / Build: Mobile-first responsive (GH-Pages / Vercel)       |
+-------------------------------------------------------------------------+
                                    |
                                HTTP / WS
                                    v
+-------------------------------------------------------------------------+
|                              BACKEND                                    |
|   Node.js v24 + Express v4 + Socket.io Server                           |
|   Autenticação: JWT + Bcrypt | E-mails: Nodemailer (SMTP)                |
+-------------------------------------------------------------------------+
                                    |
                                Prisma ORM
                                    v
+-------------------------------------------------------------------------+
|                            BASE DE DADOS                                |
|   PostgreSQL >= 14 (Schema 'public', JSON native support)                |
+-------------------------------------------------------------------------+
```

### Backend
- **Runtime & Server**: Node.js v24 + Express 4.18
- **ORM & DB**: Prisma ORM 7.8 com PostgreSQL 14+
- **Comunicação em Tempo Real**: Socket.IO 4.6 (salas por projeto, avisos de digitação, eventos instantâneos)
- **Segurança**: Bcrypt (salt rounds 12) + JWT (jsonwebtoken) com renovação via tokens de verificação
- **Utilitários de PDF e Mailer**: PDFKit para geração dinâmica de contratos PDF e Nodemailer para e-mails translacionais

### Frontend
- **Framework & Build**: React 19.2 + Vite 8.0 (bundling rápido e HMR)
- **Estilização**: Modern Vanilla CSS (`index.css`) com tokens de design flexíveis (modo claro e escuro dinâmico via `body.dark-mode`), layouts fluidos e micro-animações
- **Gestão de Estado**: Estado nativo reativo (`useState`, `useEffect`, `useRef`) sem overhead de Redux/Zustand

---

## 3. ESTRUTURA DE FICHEIROS DO PROJETO

```
BM/
├── buildmatch-backend/
│   ├── server.js                  # Ponto de entrada Express + Socket.IO Server
│   ├── prisma/
│   │   ├── schema.prisma          # Schema relacional atualizado (Prisma 7.8)
│   │   └── seed.js                # População inicial com utilizadores e projetos de teste
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.js          # Instância singleton do PrismaClient
│   │   │   └── mailer.js          # Utilitário de envio de e-mails (SMTP/Nodemailer)
│   │   ├── middleware/
│   │   │   └── auth.js            # Middleware de validação JWT e controlo de acesso
│   │   └── routes/                # Controladores / Endpoints REST
│   │       ├── auth.js            # Registo, login, verificação de e-mail e password
│   │       ├── users.js           # Gestão de perfis de utilizadores
│   │       ├── professionals.js   # Filtros, pesquisa e detalhe de profissionais
│   │       ├── projects.js        # Fluxo de projetos, transições de estado, aceitação e cancelamento
│   │       ├── proposals.js       # Envio, aceitação e contrapropostas
│   │       ├── contracts.js       # Assinatura digital e exportação de PDF
│   │       ├── milestones.js      # Marcos e fases de pagamento
│   │       ├── payments.js        # Comprovativos de pagamento e aprovação
│   │       ├── reviews.js         # Avaliações mútuas (Cliente <-> Profissional)
│   │       ├── messages.js        # Histórico e envio de mensagens no chat
│   │       ├── schedules.js       # Agendamento e gestão de vagas
│   │       ├── notifications.js   # Notificações in-app (leitura e contagem)
│   │       ├── portfolio.js       # Itens do portfólio de trabalhos
│   │       ├── addresses.js       # Endereços guardados do utilizador
│   │       ├── disputes.js        # Mediação de disputas e litígios
│   │       └── admin.js           # Painel de moderação e auditoria
│   ├── tests/                     # Testes integrados Jest + Supertest (48 testes)
│   │   ├── projects.test.js
│   │   ├── admin.test.js
│   │   ├── auth.test.js
│   │   ├── chat_schedules_notif.test.js
│   │   ├── professionals.test.js
│   │   ├── reviews.test.js
│   │   └── scenarios.test.js
│   └── package.json
│
└── buildmatch-frontend/
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── main.jsx               # Ponto de montagem React
    │   ├── App.jsx                # Componente principal, ecrãs do utilizador e fluxo SPA
    │   ├── AdminDashboard.jsx     # Painel de Administração e Moderação
    │   ├── index.css              # Sistema de Design, Variáveis e Modo Escuro
    │   ├── components/
    │   │   └── AppHeader.jsx      # Cabeçalho global com notificações e alternador de tema
    │   └── services/
    │       └── api.js             # Cliente de comunicação HTTP (fetch)
    └── package.json
```

---

## 4. CONFIGURAÇÃO E ARRANQUE LOCAL

### Pré-requisitos
- **Node.js**: `v18.x` ou superior (`v24` recomendado)
- **PostgreSQL**: `v14.x` ou superior a correr na porta `5432`

### 1. Configuração do Backend
```bash
cd buildmatch-backend

# 1. Instalar dependências
npm install

# 2. Assegurar ficheiro .env com as credenciais da base de dados:
# DATABASE_URL="postgresql://postgres:qwerty@localhost:5432/buildmatch?schema=public"
# JWT_SECRET="buildmatch_jwt_secret_key_2026"
# PORT=3001

# 3. Sincronizar o Schema com a Base de Dados e Gerar o Prisma Client
npx prisma db push --accept-data-loss
npx prisma generate

# 4. Popular a base de dados com dados de exemplo (Seed)
npm run seed

# 5. Iniciar o servidor de desenvolvimento
npm run dev
# -> API em execução em http://localhost:3001
```

### 2. Configuração do Frontend
```bash
cd buildmatch-frontend

# 1. Instalar dependências
npm install

# 2. Iniciar o servidor Vite
npm run dev
# -> Aplicação disponível em http://localhost:5173/buildmatch/
```

### 3. Execução dos Testes Automatizados
```bash
cd buildmatch-backend
npm test
```

---

## 5. MODELO DE DADOS (PRISMA & POSTGRESQL)

O modelo de dados suporta o ciclo de vida completo do utilizador, propostas, contratos, histórico e avaliações.

```prisma
enum UserType {
  ADMIN
  CLIENT
  PROFESSIONAL
}

enum ProjectStatus {
  PENDING
  ACTIVE
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REJECTED
  REFUNDED
}

model User {
  id                        String        @id @default(uuid())
  name                      String
  email                     String        @unique
  password                  String
  type                      UserType
  avatar                    String?
  phone                     String?
  active                    Boolean       @default(true)
  emailVerified             Boolean       @default(false)
  verificationToken         String?       @unique
  verificationTokenExpires  DateTime?
  resetPasswordToken        String?       @unique
  resetPasswordTokenExpires DateTime?
  createdAt                 DateTime      @default(now())
  updatedAt                 DateTime      @updatedAt

  addresses                 Address[]
  professional              Professional?
  projectsClient            Project[]     @relation("ClientProjects")
  reviewsGiven              Review[]      @relation("ReviewsGiven")
  clientReviewsReceived     ClientReview[] @relation("ClientReviewsReceived")
  clientReviewsGiven        ClientReview[] @relation("ClientReviewsGiven")
  messagesSent              Message[]     @relation("MessagesSent")
  notificacoes              Notificacao[]
  proposals                 Proposal[]
  payments                  Payment[]
  disputesRaised            Dispute[]     @relation("UserDisputesRaised")
}

model Professional {
  id           String      @id @default(uuid())
  userId       String      @unique
  specialty    String
  experience   Int
  location     String
  latitude     Float?
  longitude    Float?
  address      String?
  city         String?
  island       String?
  postalCode   String?
  radius       Float       @default(10)
  rating       Float       @default(0)
  reviewCount  Int         @default(0)
  verified     Boolean     @default(false)
  verificationDoc String?
  available    Boolean     @default(true)
  priceMin     Float?
  priceMax     Float?
  about        String?
  tags         String?
  coverPhoto   String?

  user         User        @relation(fields: [userId], references: [id])
  portfolio    Portfolio[]
  projects     Project[]
  reviews      Review[]
  schedules    Schedule[]
  proposals    Proposal[]
}

model Project {
  id              String        @id @default(uuid())
  title           String
  description     String?
  status          ProjectStatus @default(PENDING)
  clientId        String
  professionalId  String
  budgetAmount    Float?
  budgetDeadline  DateTime?
  portfolioItemId String?
  amount          Float?
  startDate       DateTime?
  endDate         DateTime?
  address         String?
  statusHistory   Json?         // Array estruturado: [{ status, changedAt, changedBy, changedByName, reason }]
  cancelReason    String?       // Justificativa quando status == CANCELLED
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  client          User          @relation("ClientProjects", fields: [clientId], references: [id])
  professional    Professional  @relation(fields: [professionalId], references: [id])
  messages        Message[]
  reviews         Review[]
  proposals       Proposal[]
  contract        Contract?
}

model Portfolio {
  id                String       @id @default(uuid())
  professionalId   String
  title             String
  description       String?
  imageUrls         Json?        // Armazena array de imagens
  videoUrl          String?
  category          String?
  featured          Boolean      @default(false)
  price             Float?
  estimatedDuration Int?
  createdAt         DateTime     @default(now())

  professional      Professional @relation(fields: [professionalId], references: [id])
}

model Notificacao {
  id            Int      @id @default(autoincrement())
  titulo        String
  mensagem      String
  type          String   // PROJETO, AGENDAMENTO, AVALIACAO, SISTEMA
  status        String   // NAO_LIDA, LIDA
  userId        String
  referenceType String?  // PROJECT, SCHEDULE, etc.
  referenceId   String?
  data_criacao  DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id])
}
```

---

## 6. API REST — ROTAS E ENDPOINTS

### Autenticação (`/api/auth`)
- `POST /register`: Cria conta de Cliente ou Profissional. Gera token de e-mail e envia e-mail SMTP.
- `POST /login`: Valida credenciais e verifica estado de `emailVerified`. Retorna JWT.
- `GET /me`: Dados do utilizador logado.
- `GET /verify-email?token=...`: Valida token, ativa a conta (`emailVerified = true`) e devolve novo JWT.
- `POST /resend-verification`: Reenvia o e-mail de confirmação.

### Profissionais (`/api/professionals`)
- `GET /`: Lista profissionais com paginação, ordenação (`rating`, `experience`) e filtros (`specialty`, `location`, `minRating`, `available`).
- `GET /search?q=...`: Pesquisa textual abrangente em nome, especialidade e tags.
- `GET /:id`: Perfil completo com avaliações, portfólio e agenda.
- `PUT /:id`: Atualiza dados do perfil profissional.

### Projetos (`/api/projects`)
- `GET /`: Lista projetos do utilizador logado.
- `POST /`: Cria novo projeto/pedido de orçamento.
- `GET /:id`: Detalhes do projeto, propostas e histórico.
- `PUT /:id`: Atualiza dados/estado do projeto. Regista entrada no `statusHistory`. Ao passar para `COMPLETED`, gera automaticamente um item no portfólio do profissional e notifica o cliente.
- `POST /:id/accept`: Aceita o projeto e inicia o trabalho (transição de `PENDING` para `ACTIVE`).
- `DELETE /:id`: Cancela o projeto com registo obrigatório de motivo em `cancelReason` e entrada em `statusHistory`.

---

## 7. CICLO DE VIDA DO PROJETO & FLUXO DE TRABALHO

```
 +--------------------------------------------------------------------------+
 | 1. CRIAÇÃO                                                               |
 | Cliente submete pedido ou contrata a partir do Portfólio (Status: PENDING)|
 +--------------------------------------------------------------------------+
                                      |
                                      v
 +--------------------------------------------------------------------------+
 | 2. INÍCIO DO TRABALHO                                                    |
 | Profissional aceita o projeto:                                           |
 | - Altera estado para ACTIVE                                               |
 | - Regista evento no statusHistory                                         |
 | - Notifica o Cliente                                                     |
 +--------------------------------------------------------------------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
 +-------------------------------+       +----------------------------------+
 | 3a. CONCLUSÃO                 |       | 3b. CANCELAMENTO                 |
 | Profissional clica em         |       | Qualquer das partes solicita:    |
 | "Marcar como Concluído":      |       | - Exige motivo justificado       |
 | - Status -> COMPLETED         |       | - Status -> CANCELLED            |
 | - Cria item no Portfólio      |       | - Salva motivo em cancelReason   |
 | - Notifica Cliente            |       | - Regista entrada no             |
 | - Ativa Avaliação Mútua       |       |   statusHistory                  |
 +-------------------------------+       +----------------------------------+
```

---

## 8. CHAT EM TEMPO REAL & NOTIFICAÇÕES

- **WebSockets (Socket.IO)**:
  - Salas isoladas por ID de projeto (`join_room`).
  - Eventos de digitação instantânea (`user_typing`).
  - Atualização síncrona do chat sem necessidade de recarregar a página.
- **Notificações In-App**:
  - Emissão dinâmica no Socket.IO + registo no banco via modelo `Notificacao`.
  - Polling suave e atualização instantânea do contador no cabeçalho.
  - Links diretos com `referenceType` e `referenceId` para navegação contextual.

---

## 9. PAINEL DE ADMINISTRAÇÃO E MODERAÇÃO

Acessível a utilizadores com o tipo `ADMIN` no ficheiro [`AdminDashboard.jsx`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/AdminDashboard.jsx):
1. **Visão Geral**: Métricas operacionais, contagem total de utilizadores, projetos e receita consolidada.
2. **Utilizadores**: Pesquisa, ativação/desativação e banimento de contas.
3. **Projetos**: Monitorização global e cancelamento administrativo de litígios.
4. **Moderação de Conteúdo**: Aprovação de itens em destaque no Portfólio e remoção de comentários impróprios.
5. **Painel de Auditoria**: Registo transparente de todas as intervenções administrativas executadas no sistema.

---

## 10. ANÁLISE DE MATURIDADE, QUALIDADE E COBERTURA DE TESTES

### Testes Automatizados (Backend)
A suíte de testes de integração foi executada com sucesso usando **Jest** e **Supertest**:

```text
PASS tests/projects.test.js
PASS tests/scenarios.test.js
PASS tests/chat_schedules_notif.test.js
PASS tests/auth.test.js
PASS tests/reviews.test.js
PASS tests/admin.test.js
PASS tests/professionals.test.js

Test Suites: 7 passed, 7 total
Tests:       48 passed, 48 total
Snapshots:   0 total
Time:        21.043 s
Ran all test suites.
```

### Pontos Fortes da Aplicação
1. **Cobrança e Contratos Completo**: Integração funcional de propostas, contrapropostas, PDF de contratos, marcos (*milestones*) e comprovativos de pagamento.
2. **Fluxo do Projeto Robusto**: Histórico estruturado em formato JSON (`statusHistory`), permitindo rastreabilidade total de alterações.
3. **Resiliência de Dados**: Sincronização do schema da base de dados e migração completa de campos de imagens.
4. **Interface Atraente e Responsiva**: Design moderno, intuitivo e com suporte a tema escuro/claro nativo.

---

## 11. RECOMENDAÇÕES E PRÓXIMOS PASSOS (TCC / PRODUÇÃO)

1. **Upload Cloud Real**: Transitar o armazenamento em Base64 para AWS S3 ou Cloudinary usando o suporte `multer` já integrado.
2. **Geolocalização Avançada**: Ativar a ordenação por proximidade geográfica usando os campos `latitude`, `longitude` e `radius`.
3. **Push Notifications**: Integrar Web Push (VAPID) ou Firebase Cloud Messaging para notificações em dispositivos móveis.

---
*Documentação atualizada em Julho de 2026 — BuildMatch v1.1.0*
