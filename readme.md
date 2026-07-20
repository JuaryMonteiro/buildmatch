# BuildMatch — Documentação Completa de Handoff

> **Aplicação web** para conectar clientes a profissionais da construção civil em Cabo Verde.
> Esta documentação foi gerada para facilitar a transição do projeto para um novo desenvolvedor.

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Estrutura de Ficheiros](#2-estrutura-de-ficheiros)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Configuração e Arranque Local](#4-configuração-e-arranque-local)
5. [Backend — Arquitectura da API](#5-backend--arquitectura-da-api)
6. [Base de Dados — Modelos (Prisma)](#6-base-de-dados--modelos-prisma)
7. [Endpoints da API REST](#7-endpoints-da-api-rest)
8. [Frontend — Arquitectura da App](#8-frontend--arquitectura-da-app)
9. [Componentes e Ecrãs](#9-componentes-e-ecrãs)
10. [Sistema de Notificações](#10-sistema-de-notificações)
11. [Chat em Tempo Real (Socket.IO)](#11-chat-em-tempo-real-socketio)
12. [Sistema de Autenticação](#12-sistema-de-autenticação)
13. [Verificação de Email](#13-verificação-de-email)
14. [Design System e Paleta de Cores](#14-design-system-e-paleta-de-cores)
15. [Tipos de Utilizador e Fluxos](#15-tipos-de-utilizador-e-fluxos)
16. [Funcionalidades Implementadas](#16-funcionalidades-implementadas)
17. [Funcionalidades Em Falta / A Implementar](#17-funcionalidades-em-falta--a-implementar)
18. [Bugs Conhecidos e Resolvidos](#18-bugs-conhecidos-e-resolvidos)
19. [Deploy](#19-deploy)

---

## 1. Visão Geral do Projeto

O **BuildMatch** é uma plataforma mobile-first que conecta:

- **Clientes** que precisam de serviços de construção civil (pedreiros, eletricistas, canalizadores, pintores, carpinteiros, engenheiros, etc.)
- **Profissionais** da área da construção civil que oferecem os seus serviços

O utilizador acede pela web (React SPA) e a lógica de negócio corre no backend (Node.js/Express + PostgreSQL via Prisma).

---

## 2. Estrutura de Ficheiros

```
BM/
├── buildmatch-backend/          # API REST + Socket.IO
│   ├── server.js                # Ponto de entrada; regista rotas e Socket.IO
│   ├── prisma/
│   │   └── schema.prisma        # Schema da base de dados (PostgreSQL)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.js        # Instância singleton do Prisma Client
│   │   │   └── mailer.js        # Envio de emails via nodemailer (verificação de email)
│   │   ├── middleware/
│   │   │   └── auth.js          # Middleware JWT (authMiddleware)
│   │   └── routes/
│   │       ├── auth.js          # Registo, login, /me, alterar password, verificação de email
│   │       ├── users.js         # Ler/actualizar perfil básico do utilizador
│   │       ├── professionals.js # CRUD profissionais, pesquisa, disponibilidade
│   │       ├── projects.js      # CRUD projectos (com notificações)
│   │       ├── messages.js      # Conversas e mensagens por projecto
│   │       ├── schedules.js     # Agenda do profissional
│   │       ├── reviews.js       # Avaliações e respostas
│   │       ├── portfolio.js     # Portfólio de trabalhos
│   │       ├── addresses.js     # Endereços guardados pelo utilizador
│   │       ├── notifications.js # Notificações in-app
│   │       └── admin.js         # Painel de administração
│   ├── .env                     # Variáveis de ambiente (não commit)
│   └── package.json
│
└── buildmatch-frontend/         # React SPA (Vite)
    ├── index.html               # Template HTML
    ├── vite.config.js           # Vite com base '/buildmatch/' para GitHub Pages
    ├── .env                     # Variáveis de ambiente do frontend
    ├── src/
    │   ├── main.jsx             # Ponto de entrada React
    │   ├── App.jsx              # Componente raiz + todos os ecrãs (inclui VerifyEmailScreen, EmailNotVerifiedScreen)
    │   ├── AdminDashboard.jsx   # Painel de administração completo
    │   ├── App.css              # Estilos globais adicionais
    │   ├── index.css            # Design system, tokens CSS, componentes CSS
    │   ├── assets/
    │   │   ├── logo.png         # Logo da aplicação
    │   │   ├── hero.png         # Imagem hero da landing
    │   │   ├── comercial.jpg    # Imagem de exemplo
    │   │   ├── moradia_t3_garagem.jpg
    │   │   └── restauro.jpg
    │   ├── components/
    │   │   └── AppHeader.jsx    # Cabeçalho global (logo, tema, notificações, logout)
    │   └── services/
    │       └── api.js           # Funções de acesso à API REST (fetch)
    └── package.json
```

---

## 3. Stack Tecnológica

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| **Node.js** | v24 | Runtime JavaScript |
| **Express** | ^
 | Framework web REST API |
| **Prisma** | ^7.8 | ORM para PostgreSQL |
| **PostgreSQL** | ≥14 | Base de dados relacional |
| **Socket.IO** | ^4.6 | WebSockets para chat em tempo real |
| **bcrypt** | ^5.1 | Hashing de passwords |
| **jsonwebtoken** | ^9.0 | Autenticação JWT |
| **nodemailer** | ^6.9 | Envio de emails (verificação de conta) |
| **cors** | ^2.8 | Cross-Origin Resource Sharing |
| **dotenv** | ^16 | Variáveis de ambiente |
| **multer** | ^2.1 | Upload de ficheiros (preparado) |
| **nodemon** | ^3 | Hot-reload em desenvolvimento |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| **React** | ^19.2 | Framework UI |
| **Vite** | ^8.0 | Bundler e dev server |
| **socket.io-client** | ^4.8 | Cliente WebSockets |
| **FontAwesome** | ^7.2 | Ícones SVG |
| **Tailwind CSS** | ^4.2 | CSS utilitário (instalado, uso mínimo) |
| **gh-pages** | ^6.3 | Deploy para GitHub Pages |

### Base de Dados
- **PostgreSQL** — relacional, alojada localmente ou em serviço cloud (ex: Supabase, Railway, Render)

---

## 4. Configuração e Arranque Local

### Pré-requisitos
- Node.js ≥ 18
- PostgreSQL ≥ 14 em execução
- npm ou yarn
- Conta Gmail com **App Password** gerada (necessária para o envio de emails de verificação — ver secção 13)

### Backend
```bash
# 1. Entrar na pasta do backend
cd buildmatch-backend

# 2. Instalar dependências
npm install

# 3. Criar a base de dados (já existente em .env)
# .env já contém: DATABASE_URL="postgresql://postgres:qwerty@localhost:5432/buildmatch"

# 4. Gerar o Prisma Client e aplicar migrações
npx prisma generate
npx prisma db push

# 5. (Opcional) Seed de dados iniciais
npm run seed

# 6. Iniciar em modo desenvolvimento
npm run dev
# → API disponível em http://localhost:3001
```

> **Importante:** sempre que o `schema.prisma` for alterado, é obrigatório correr `npx prisma db push` seguido de `npx prisma generate` antes de reiniciar o servidor. Esquecer este passo é a causa mais comum de `PrismaClientValidationError` em runtime.

### Frontend
```bash
# 1. Entrar na pasta do frontend
cd buildmatch-frontend

# 2. Instalar dependências
npm install

# 3. Iniciar em modo desenvolvimento
npm run dev
# → App disponível em http://localhost:5173/buildmatch/
#   (ou 5174 se a 5173 estiver ocupada)
```

### Ficheiros de Ambiente



> **Nota sobre `EMAIL_PASS`:** contas Gmail com autenticação em dois fatores não aceitam a password normal da conta para SMTP. É obrigatório gerar uma **App Password** em `https://myaccount.google.com/apppasswords` e usar esse valor. Usar a password normal falha silenciosamente na autenticação SMTP e é capturado pelo `try/catch` em `mailer.js`, resultando em erro 500 na rota `resend-verification`.

**`buildmatch-frontend/.env`**
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

## 5. Backend — Arquitectura da API

O servidor Express em [`server.js`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-backend/server.js) regista:

1. Middlewares globais: `cors`, `express.json` (limite 50mb), `express.urlencoded`
2. Health check: `GET /api/health` e `GET /health`
3. Todas as rotas API (ver secção 7)
4. Servidor Socket.IO para chat (ver secção 11)

### Middleware de Autenticação
O ficheiro `src/middleware/auth.js` extrai o token JWT do header `Authorization: Bearer <token>` e injeta `req.user` com `{ id, email, type }`.

### Envio de Email
O ficheiro `src/lib/mailer.js` centraliza o envio de emails via `nodemailer`, usando o transporte `gmail` configurado com `EMAIL_USER` e `EMAIL_PASS`. Actualmente expõe apenas `sendVerificationEmail(to, token)`, usada no registo e no reenvio de verificação. Erros de envio são capturados internamente e relançados como `Error` genérico, para não derrubar o processo Node em caso de falha de autenticação SMTP.

---

## 6. Base de Dados — Modelos (Prisma)

Schema em [`prisma/schema.prisma`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-backend/prisma/schema.prisma).

### Enums

| Enum | Valores |
|---|---|
| `UserType` | `CLIENT`, `PROFESSIONAL` |
| `ProjectStatus` | `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED` |

> **Nota:** O tipo `ADMIN` é controlado pela lógica do backend (verificação de `req.user.role === 'ADMIN'`) mas não existe como valor do enum `UserType` no schema. Esta é uma inconsistência a resolver futuramente.

### Modelos

#### `User`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (UUID) | Chave primária |
| `name` | String | Nome completo |
| `email` | String (unique) | Email (login) |
| `password` | String | Hash bcrypt |
| `type` | UserType | `CLIENT` ou `PROFESSIONAL` |
| `avatar` | String? | URL da foto de perfil (base64 ou URL) |
| `phone` | String? | Telefone |
| `emailVerified` | Boolean | Indica se o email foi confirmado. Default `false` |
| `verificationToken` | String? (unique) | Token aleatório de 32 bytes (hex) gerado no registo e no reenvio. Deve ser marcado como `@unique`, exigido pelo Prisma para uso em `findUnique` |
| `verificationTokenExpires` | DateTime? | Expira 24h após a geração |
| `createdAt` | DateTime | Data de criação |
| `addresses` | Address[] | Endereços guardados |
| `professional` | Professional? | Perfil profissional (se aplicável) |

#### `Professional`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (UUID) | Chave primária |
| `userId` | String (unique) | FK → User |
| `specialty` | String | Especialidade (ex: "Pedreiro") |
| `experience` | Int | Anos de experiência |
| `location` | String | Localização textual |
| `latitude`, `longitude` | Float? | Coordenadas GPS |
| `address`, `city`, `island`, `postalCode` | String? | Endereço completo |
| `radius` | Float | Raio de atendimento (km) |
| `rating` | Float | Média das avaliações (0–5) |
| `reviewCount` | Int | Número de avaliações |
| `verified` | Boolean | Verificado pela plataforma |
| `available` | Boolean | Está disponível para novos trabalhos |
| `priceMin`, `priceMax` | Float? | Faixa de preço por hora (CVE) |
| `about` | String? | Descrição/bio |
| `tags` | String | Tags de pesquisa (separadas por vírgula) |

#### `Project`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (UUID) | Chave primária |
| `title` | String | Título do projecto |
| `description` | String? | Descrição |
| `status` | ProjectStatus | Estado actual |
| `clientId` | String | FK → User (cliente) |
| `professionalId` | String | FK → Professional |
| `portfolioItemId` | String? | FK → Portfolio (item que originou o projecto) |
| `budgetAmount` | Float? | Orçamento estimado (do portfólio) |
| `budgetDeadline` | DateTime? | Prazo calculado |
| `amount` | Float? | Valor acordado |
| `startDate`, `endDate` | DateTime? | Datas de início/fim |
| `address` | String? | Morada do serviço |

#### `Review`
| Campo | Tipo | Descrição |
|---|---|---|
| `rating` | Int | 1 a 5 estrelas |
| `comment` | String | Texto da avaliação |
| `reply` | String? | Resposta do profissional |
| `authorId` | String | FK → User (quem avaliou) |
| `professionalId` | String | FK → Professional |
| `projectId` | String (unique) | FK → Project (uma avaliação por projecto) |

#### `Message`
| Campo | Tipo | Descrição |
|---|---|---|
| `content` | String | Texto da mensagem |
| `senderId` | String | FK → User |
| `projectId` | String | FK → Project (contexto do chat) |
| `mediaUrl` | String? | URL de ficheiro anexado |
| `mediaType` | String? | `image`, `video` ou `document` |
| `read` | Boolean | Lida ou não |

#### `Schedule`
| Campo | Tipo | Descrição |
|---|---|---|
| `professionalId` | String | FK → Professional |
| `date` | DateTime | Data do slot |
| `startTime` | String | Hora de início (ex: "09:00") |
| `endTime` | String | Hora de fim (ex: "11:00") |
| `available` | Boolean | Slot disponível ou já reservado |

#### `Portfolio`
| Campo | Tipo | Descrição |
|---|---|---|
| `professionalId` | String | FK → Professional |
| `title` | String | Título do trabalho |
| `description` | String? | Descrição |
| `imag$00ls` | Json | Array de URLs de imagens |
| `videoUrl` | String? | URL de vídeo |
| `category` | String? | Categoria |
| `featured` | Boolean | Destaque na galeria |
| `price` | Float? | Preço estimado do serviço |
| `estimatedDuration` | Int? | Duração estimada em dias |

#### `Address`
Endereços guardados por utilizador, com campo `default` para morada principal.

#### `Notificacao`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Int (auto-increment) | PK |
| `titulo` | String | Título da notificação |
| `mensagem` | String | Corpo da mensagem |
| `type` | String | `PROJETO`, `AGENDAMENTO`, `AVALIACAO`, `SISTEMA` |
| `status` | String | `NAO_LIDA` ou `LIDA` |
| `userId` | String | FK → User |
| `data_criacao` | DateTime | Timestamp |

#### `Alert` e `AuditLog`
Modelos de administração para alertas do sistema e registo de auditoria.

---

## 7. Endpoints da API REST

Base URL: `http://localhost:3001/api`

### Autenticação (`/api/auth`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| POST | `/register` | ❌ | Registar utilizador (CLIENT ou PROFESSIONAL); gera token de verificação e envia email |
| POST | `/login` | ❌ | Login → retorna JWT + dados do utilizador |
| GET | `/me` | ✅ | Devolver dados do utilizador autenticado |
| PUT | `/change-password` | ✅ | Alterar password |
| POST | `/resend-verification` | ❌ | Gera novo token e reenvia o email de verificação para o email indicado |
| GET | `/verify-email?token=` | ❌ | Confirma o email, marca `emailVerified: true`, invalida o token e devolve um novo JWT + dados do utilizador para autenticação automática |

> **Nota de implementação:** `verify-email` é GET porque é acedido directamente pelo link enviado por email (o browser faz sempre GET ao seguir um link). A resposta já inclui token JWT para que o frontend autentique o utilizador imediatamente, sem exigir novo login.

### Utilizadores (`/api/users`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/:id` | ✅ | Obter perfil básico |
| PUT | `/:id` | ✅ | Actualizar nome, telefone, avatar (só o próprio) |

### Profissionais (`/api/professionals`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/` | ❌ | Listar com filtros: specialty, location, minRating, available, page, limit, sortBy, order |
| GET | `/search?q=` | ❌ | Pesquisa full-text |
| GET | `/:id` | ❌ | Perfil completo com portfólio, avaliações e agenda |
| PUT | `/:id` | ✅ | Actualizar perfil profissional (só o próprio) |
| GET | `/:id/availability` | ❌ | Slots de disponibilidade por mês |
| POST | `/verification-doc` | ✅ | Enviar documento de credencial em Base64 |

### Projectos (`/api/projects`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/` | ✅ | Listar projectos do utilizador autenticado |
| POST | `/` | ✅ | Criar projecto; aceita `portfolioItemId` para pré-preencher orçamento |
| GET | `/:id` | ✅ | Detalhe com mensagens e review |
| PUT | `/:id` | ✅ | Actualizar estado/dados; ao concluir, cria entrada no portfólio |
| DELETE | `/:id` | ✅ | Cancelar projecto (soft-delete: muda status para CANCELLED) |

### Mensagens (`/api/messages`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/conversations` | ✅ | Listar todas as conversas (projectos com última mensagem) |
| GET | `/project/:projectId` | ✅ | Histórico de mensagens; marca como lidas automaticamente |
| POST | `/project/:projectId` | ✅ | Enviar mensagem (texto e/ou ficheiro) |

### Avaliações (`/api/reviews`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/professional/:id` | ❌ | Listar avaliações de um profissional |
| POST | `/` | ✅ | Criar avaliação (só para projectos COMPLETED); actualiza média |
| PUT | `/:id/reply` | ✅ | Profissional responde à avaliação |

### Agendamentos (`/api/schedules`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/professional/:id` | ❌ | Listar slots futuros disponíveis |
| POST | `/` | ✅ | Criar/reservar slot; notifica o profissional |
| DELETE | `/:id` | ✅ | Cancelar agendamento (marca `available: true`) |

### Portfólio (`/api/portfolio`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/` | ❌ | Listar todos os itens (ordenado por `featured`) |
| GET | `/professional/:id` | ❌ | Portfólio de um profissional específico |
| POST | `/` | ✅ | Adicionar item ao portfólio |
| PUT | `/:id` | ✅ | Actualizar item |
| DELETE | `/:id` | ✅ | Remover item |

### Endereços (`/api/addresses`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/` | ✅ | Listar endereços do utilizador |
| POST | `/` | ✅ | Criar endereço; aceita `default: true` |
| PUT | `/:id` | ✅ | Actualizar; pode definir como principal |
| DELETE | `/:id` | ✅ | Remover endereço |

### Notificações (`/api/notifications`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/` | ✅ | Listar notificações do utilizador |
| GET | `/unread-count` | ✅ | Contar não lidas |
| PUT | `/:id/read` | ✅ | Marcar uma como lida |
| PUT | `/read-all` | ✅ | Marcar todas como lidas |
| DELETE | `/:id` | ✅ | Apagar notificação |

### Propostas (`/api/proposals`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| POST | `/` | ✅ | Enviar proposta pelo profissional |
| GET | `/project/:projectId` | ✅ | Listar propostas de um projeto |
| GET | `/my` | ✅ | Listar propostas do utilizador (enviadas/recebidas) |
| PUT | `/:id/accept` | ✅ | Aceitar proposta (gera contrato rascunho, rejeita restantes) |
| PUT | `/:id/reject` | ✅ | Rejeitar proposta |
| PUT | `/:id/counter` | ✅ | Enviar contraproposta (atualiza valor/prazo) |

### Contratos (`/api/contracts`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/project/:projectId` | ✅ | Obter contrato do projeto |
| PUT | `/:id/sign` | ✅ | Assinar digitalmente (cliente/profissional) |
| GET | `/:id/pdf` | ❌ | Descarregar PDF do contrato |

### Marcos/Milestones (`/api/milestones`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| POST | `/` | ✅ | Criar marco no contrato (apenas profissional) |
| GET | `/contract/:contractId` | ✅ | Listar marcos do contrato |
| PUT | `/:id/complete` | ✅ | Profissional marca como concluído |
| PUT | `/:id/release` | ✅ | Cliente liberta/aprova pagamento do marco |

### Pagamentos/Comprovativos (`/api/payments`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| POST | `/` | ✅ | Cliente envia comprovativo de pagamento (Base64) |
| GET | `/project/:projectId` | ✅ | Listar pagamentos do projeto |
| PUT | `/:id/approve` | ✅ | Profissional aprova o comprovativo (milestone/projeto) |
| PUT | `/:id/reject` | ✅ | Profissional rejeita o comprovativo |

### Disputas (`/api/disputes`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| POST | `/` | ✅ | Abrir disputa no contrato |
| GET | `/project/:projectId` | ✅ | Listar disputas do projeto |
| PUT | `/:id/resolve` | ✅ | Admin resolve a disputa com parecer |

### Avaliações de Clientes (`/api/reviews/client`)
| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| GET | `/client/:id` | ❌ | Listar avaliações recebidas pelo cliente |
| POST | `/client` | ✅ | Profissional avalia cliente (apenas projetos COMPLETED) |
| PUT | `/client/:id/reply` | ✅ | Cliente responde à avaliação do profissional |

### Administração (`/api/admin`)
> **Nota de implementação:** Acesso devidamente protegido por `authMiddleware + adminOnly` (que valida `req.user.type === 'ADMIN'`).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/portfolios/pending` | Portfólios não aprovados (featured=false) |
| POST | `/portfolios/:id/approve` | Aprovar portfólio (featured=true) + audit log |
| GET | `/comments/pending` | Avaliações pendentes de moderação |
| POST | `/comments/:id/approve` | Aprovar avaliação (placeholder) |
| DELETE | `/comments/:id` | Apagar avaliação |
| GET | `/professionals/low-ratings` | Profissionais com rating < 3 |
| GET | `/professionals/pending` | Listar profissionais com verificação pendente |
| POST | `/professionals/:id/approve` | Aprovar profissional (verified=true) |
| POST | `/professionals/:id/reject` | Rejeitar comprovativo (limpa documento para re-upload) |
| GET | `/alerts` | Listar alertas |
| POST | `/alert` | Criar alerta |
| GET | `/audit` | Ver registo de auditoria (últimos 100) |

---

## 8. Frontend — Arquitectura da App

### Ficheiros Principais

| Ficheiro | Descrição |
|---|---|
| [`src/main.jsx`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/main.jsx) | Monta o `<BuildMatchApp />` no DOM |
| [`src/App.jsx`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/App.jsx) | ~3600 linhas — contém todos os ecrãs e componentes da app |
| [`src/AdminDashboard.jsx`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/AdminDashboard.jsx) | Painel de administração completo e autónomo |
| [`src/components/AppHeader.jsx`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/components/AppHeader.jsx) | Header global (logo, toggle de tema, sino de notificações, botão de logout) |
| [`src/services/api.js`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/services/api.js) | Camada de acesso à API (fetch com JWT automático) |
| [`src/index.css`](file:///c:/Users/arici/OneDrive/Documentos/ENI%204%C2%BA%20ano/TCC/BM/buildmatch-frontend/src/index.css) | Design system com variáveis CSS, estilos globais e componentes de layout |

### Gestão de Estado
A app não usa Redux ou Zustand. O estado é gerido localmente com `useState`/`useEffect` em cada componente. O estado global (utilizador logado, ecrã activo) vive no componente raiz `BuildMatchApp`.

### Variáveis de Sessão (localStorage)
| Chave | Valor |
|---|---|
| `buildmatch_token` | JWT de autenticação |
| `buildmatch_user` | Objecto JSON do utilizador (cache) |
| `buildmatch_open_profile` | Flag temporária ("1"); indica ao arranque da app que deve abrir directamente no separador de perfil, usada após confirmação de email |
| `theme` | `"light"` ou `"dark"` |

### Roteamento
A app **não usa React Router**. A navegação é feita com estado (`useState`) no componente raiz:
- `screen`: `"onboarding"` → `"login"` → `"app"`
- `clientTab`: `"home"`, `"search"`, `"projects"`, `"messages"`, `"profile"`
- `profTab`: `"dashboard"`, `"projects"`, `"messages"`, `"profile"`, `"agenda"`, `"portfolio"`
- `adminTab`: `"dashboard"`, `"users"`, `"projects"`, `"reviews"`, `"profile"`

A excepção é a rota `/verify-email`, servida como path literal do browser (fora do estado interno da SPA), verificada directamente em `window.location.pathname` no arranque de `BuildMatchApp` — ver secção 13.

---

## 9. Componentes e Ecrãs

### Componentes Base (reutilizáveis, em `App.jsx`)

| Componente | Função |
|---|---|
| `Icon` | Wrapper do FontAwesome com prop `icon`, `size`, `color` |
| `Avatar` | Avatar circular com foto ou iniciais coloridas |
| `Stars` | Exibição de 1–5 estrelas de avaliação |
| `Card` | Container branco com sombra e borderRadius |
| `Btn` | Botão com variantes: `primary`, `accent`, `outline`, `ghost`, `danger`, `success` |
| `Input` | Campo de texto com label |
| `Spinner` | Anel de carregamento animado |
| `ErrMsg` | Mensagem de erro vermelha |
| `SuccessModal` | Modal de confirmação de sucesso |
| `StatCard` | Card de estatística com ícone, valor e label |
| `StatusBadge` | Badge colorido do estado do projecto |
| `Toggle` | Toggle switch animado |

### Ecrãs / Páginas

| Componente | Tipo de Utilizador | Descrição |
|---|---|---|
| `Onboarding` | Todos | 3 slides de introdução à app |
| `Login` | Todos | Login + Registo (com selecção de tipo de conta) |
| `EmailNotVerifiedScreen` | Todos | Bloqueia o acesso enquanto `emailVerified` for `false`; permite reenviar o email ou verificar o estado manualmente |
| `VerifyEmailScreen` | Todos | Acedido via link do email (`/verify-email?token=...`); confirma o token no backend, autentica automaticamente e redirecciona para o perfil, sem passo de confirmação manual |
| `ClientHome` | Cliente | Página inicial com categorias, profissionais recomendados e galeria de portfólios |
| `ClientSearch` | Cliente | Pesquisa e filtro de profissionais |
| `ClientProjects` | Cliente | Lista de projectos do cliente com filtro por estado |
| `ClientMessages` | Cliente | Chat split-view (lista de conversas + chat) |
| `ClientProfile` | Cliente | Perfil do cliente com sub-ecrãs: editar perfil, segurança, endereços, notificações, ajuda |
| `ProfDashboard` | Profissional | Dashboard com projectos recentes, estatísticas e acções rápidas |
| `ProfProjects` | Profissional | Gestão de projectos (aceitar, recusar, concluir) |
| `ProfMessages` | Profissional | Chat (igual ao do cliente) |
| `ProfProfile` | Profissional | Perfil com edição completa: dados, especialidade, preços, sobre, disponibilidade, portfólio |
| `ProfPortfolio` | Profissional | Galeria do portfólio com criação/edição de itens |
| `ProfSchedule` | Profissional | Gestão da agenda (slots de disponibilidade) |
| `ProfessionalProfile` | Cliente | Vista pública do perfil de um profissional |
| `ChatScreen` | Todos | Ecrã de chat em tempo real |
| `ScheduleScreen` | Cliente | Ecrã para agendar um slot com o profissional |
| `PinterestGallery` | Cliente | Galeria masonry de portfólios de profissionais |
| `AdminDashboard` | Administrador | Painel completo de administração |
| `AdminProfile` | Administrador | Perfil e definições do administrador |

### Painel de Administração (`AdminDashboard.jsx`)

O painel tem 9 separadores:

| Separador | Descrição |
|---|---|
| **Visão Geral** | Estatísticas globais (total utilizadores, projectos, avaliações, receita) |
| **Utilizadores** | Lista paginada com pesquisa; banir/eliminar utilizadores |
| **Projectos** | Lista paginada com filtro por estado; criar novo projecto; eliminar |
| **Avaliações** | Lista com avaliações e ratings |
| **Portfolios** | Gestão de portfolios (placeholder) |
| **Comentários** | Moderação de avaliações (placeholder) |
| **Avaliação** | Profissionais com classificação baixa (placeholder) |
| **Alertas** | Alertas do sistema (placeholder) |
| **Auditoria** | Registo de auditoria (placeholder) |

---

## 10. Sistema de Notificações

### Como funciona
- Notificações são criadas no backend (`prisma.notificacao.create`) dentro das rotas relevantes
- O frontend faz **polling a cada 30 segundos** no `AppHeader.jsx` usando `notificationsAPI.list()` e `notificationsAPI.unreadCount()`
- O dropdown de notificações abre ao clicar no sino (🔔) no cabeçalho

### Tipos de Notificação
| `type` | Ícone | Quando é criada |
|---|---|---|
| `PROJETO` | 📋 | Criação de projecto, mudança de estado |
| `AGENDAMENTO` | 📅 | Novo agendamento reservado |
| `AVALIACAO` | ⭐ | Nova avaliação recebida |
| `SISTEMA` | 🔔 | Alertas gerais |

### Acções possíveis
- Marcar uma como lida
- Marcar todas como lidas
- Apagar notificação

---

## 11. Chat em Tempo Real (Socket.IO)

### Backend (`server.js`)
```
io.on('connection', socket => {
  socket.on('join_room', projectId)       → socket.join(projectId)
  socket.on('send_message', data)         → io.to(data.projectId).emit('receive_message', data)
  socket.on('typing', data)               → socket.to(data.projectId).emit('user_typing', data)
  socket.on('disconnect')
})
```

### Frontend (`App.jsx` — `ChatScreen`)
- Conecta ao socket em `VITE_SOCKET_URL` (ou `VITE_API_URL`)
- Entra na sala do projecto com `join_room`
- Envia mensagens via `send_message` (e guarda na API REST)
- Escuta `receive_message` para actualizar o chat em tempo real
- Escuta `user_typing` para mostrar "está a escrever..."

---

## 12. Sistema de Autenticação

1. **Registo** — `POST /api/auth/register` — cria utilizador, gera `verificationToken` (24h de validade), envia email de verificação e (se PROFESSIONAL) cria automaticamente o perfil profissional
2. **Login** — `POST /api/auth/login` — valida email/password com bcrypt; retorna JWT com validade de 7 dias
3. **Token** — guardado em `localStorage.buildmatch_token`; enviado em cada pedido no header `Authorization: Bearer <token>`
4. **Refresh automático** — quando a API devolve 401, o frontend limpa o localStorage e recarrega a página
5. **Persistência de sessão** — ao carregar a app, lê `buildmatch_token` e `buildmatch_user` do localStorage e restaura a sessão sem novo pedido

> **Nota sobre ADMIN:** O tipo ADMIN não existe no enum `UserType` do schema Prisma. Para criar um administrador, é necessário alterar directamente a base de dados e adicionar uma lógica de verificação no middleware. Actualmente o painel admin no frontend usa `user?.type === "ADMIN"` mas o JWT nunca terá esse valor.

> **Nota sobre bloqueio de acesso:** o backend actualmente **não** valida `emailVerified` na rota `/login` — um utilizador com email por confirmar consegue autenticar-se normalmente. O bloqueio existente (`EmailNotVerifiedScreen`) é aplicado apenas no frontend, com base no campo `emailVerified` devolvido pela API. Se for necessário impedir o acesso a nível de backend, é preciso adicionar essa validação explicitamente na rota `/login`.

---

## 13. Verificação de Email

### Objectivo
Confirmar que o endereço de email indicado no registo pertence ao utilizador, sem exigir um passo de confirmação manual adicional depois de o link ser aberto.

### Fluxo

1. **Registo** — `POST /api/auth/register` gera `verificationToken` (32 bytes aleatórios, hex) e `verificationTokenExpires` (agora + 24h), guarda-os no utilizador e chama `sendVerificationEmail`, que envia um link no formato:
   ```
   {FRONTEND_URL}/verify-email?token={verificationToken}
   ```
2. **Bloqueio de acesso no frontend** — enquanto `user.emailVerified` for `false`, `BuildMatchApp` renderiza `EmailNotVerifiedScreen` em vez da aplicação, com opções para reenviar o email (`authAPI.resendVerification`) ou verificar o estado actual (`authAPI.me`).
3. **Reenvio** — `POST /api/auth/resend-verification` recebe `{ email }`, gera um novo token e reenvia o email. Recusa reenviar se `emailVerified` já for `true`.
4. **Clique no link** — o browser faz um pedido `GET` directo a `{FRONTEND_URL}/verify-email?token=...`. Este path é servido pelo frontend (Vite/SPA), não pelo backend.
5. **Interceptação da rota no frontend** — `BuildMatchApp` verifica `window.location.pathname` no arranque e, se corresponder a `/verify-email`, renderiza `VerifyEmailScreen` em vez do fluxo normal da app.
6. **Confirmação no backend** — `VerifyEmailScreen` extrai o `token` da query string e chama `GET /api/auth/verify-email?token=...`. O backend valida o token e a expiração, marca `emailVerified: true`, invalida o token (`verificationToken: null`) e devolve um **novo JWT** e os dados actualizados do utilizador.
7. **Autenticação automática** — o frontend guarda o token e o utilizador recebidos em `localStorage`, define `buildmatch_open_profile = "1"` e redirecciona para a raiz da aplicação.
8. **Abertura no perfil** — no arranque seguinte, `BuildMatchApp` detecta a flag `buildmatch_open_profile`, remove-a, e define o separador activo (`profTab`, `clientTab` ou `adminTab`) como `"profile"` consoante o tipo de utilizador, sem qualquer ecrã de confirmação intermédio.

### Pontos de atenção

- `verificationToken` tem de estar marcado como `@unique` no schema Prisma. Sem esse constraint, `prisma.user.findUnique({ where: { verificationToken } })` falha com `PrismaClientValidationError`, porque o Prisma exige que o campo usado em `findUnique` seja único ou parte da chave primária.
- A rota `verify-email` é `GET` com o token na query string, e não `POST` com o token no body — é o formato exigido porque o link é seguido directamente pelo browser a partir do email.
- `mailer.js` deve conter apenas a função `sendVerificationEmail` e a configuração do `transporter`. Não deve conter definições de rotas Express (`router.post(...)`) — essas pertencem exclusivamente a `src/routes/auth.js`.
- Falhas de envio de email (credenciais SMTP inválidas, App Password incorrecta) são capturadas dentro de `sendVerificationEmail` e relançadas como erro genérico, para que o processo Node não termine de forma abrupta.

---

## 14. Design System e Paleta de Cores

### Variáveis CSS (em `index.css`)
```css
:root {
  --color-primary:      #1F4E8C;  /* Azul principal */
  --color-primary-dark: #163a6b;  /* Azul escuro */
  --color-accent:       #F57C00;  /* Laranja de destaque */
  --color-accent-dark:  #c96800;
  --color-dark:         #2E2E2E;  /* Texto principal */
  --color-gray:         #6B7280;  /* Texto secundário */
  --color-light-gray:   #F5F5F5;  /* Fundo */
  --color-white:        #FFFFFF;
  --color-success:      #22C55E;
  --color-error:        #EF4444;
  --color-purple:       #7C3AED;
  --color-border:       #E5E7EB;
}
```

### Modo Escuro (Dark Mode)
Activado com a classe `body.dark-mode` (toggle no `AppHeader`). Substitui as variáveis de cor adaptando fundos e textos.

### Tipografia
- Família: **DM Sans** (carregada do Google Fonts em runtime)
- Pesos: 400, 500, 600, 700, 800

### Layout
- **Mobile-first** com breakpoints em 768px, 1024px, 1280px
- Navegação em bottom nav (fixada no fundo)
- Máxima largura responsiva sem limite fixo (full-width)

---

## 15. Tipos de Utilizador e Fluxos

### Cliente (`type === "CLIENT"`)
```
Onboarding → Login/Registo → (Confirmação de email, se pendente) → Home
  ├── Pesquisa de profissionais (por categoria ou texto livre)
  │     └── Ver perfil do profissional → Contactar / Agendar
  ├── Projectos → Ver estado, Avaliar (se COMPLETED)
  ├── Mensagens → Chat em tempo real por projecto
  └── Perfil → Editar dados, Segurança, Endereços, Notificações
```

### Profissional (`type === "PROFESSIONAL"`)
```
Login/Registo → (Confirmação de email, se pendente) → Dashboard
  ├── Projectos → Aceitar / Recusar / Concluir
  ├── Mensagens → Chat com clientes
  ├── Agenda → Gerir disponibilidade (slots)
  ├── Portfólio → Adicionar/editar trabalhos (com preço e duração)
  └── Perfil → Editar dados, especialidade, preços, sobre, avaliações recebidas
```

### Administrador (`type === "ADMIN"`)
```
Login → Painel Admin
  ├── Visão Geral (estatísticas)
  ├── Utilizadores (gestão)
  ├── Projectos (gestão + criação)
  ├── Avaliações
  ├── Portfolios, Comentários, Avaliação, Alertas, Auditoria (placeholders)
  └── Perfil Admin
```

---

## 16. Funcionalidades Implementadas

### ✅ Autenticação e Contas
- Registo de cliente e profissional
- Login com JWT
- Persistência de sessão (localStorage)
- Alteração de password
- Toggle de tema claro/escuro
- Verificação de email por link, com autenticação automática e abertura directa no perfil (ver secção 13)
- Reenvio de email de verificação

### ✅ Pesquisa e Descoberta
- Pesquisa de profissionais por texto, categoria, especialidade
- Filtros: ordenação (rating, experiência, mais avaliados), preço máximo
- Galeria "Pinterest" de portfólios na página inicial
- Categorias visuais com imagens (com fallback de ícone)
- Placeholder animado na barra de pesquisa

### ✅ Perfil de Profissional
- Edição de todos os campos (especialidade, preços, sobre, localização)
- Upload de foto de perfil (base64)
- Visualização de avaliações recebidas
- Resposta a avaliações
- Gestão do portfólio (criar, editar, apagar itens)
- Gestão de agenda (adicionar/remover slots de disponibilidade)

### ✅ Projectos e Fluxo do Marketplace
- Criação de projecto pelo cliente (com ou sem item de portfólio)
- Pré-preenchimento de orçamento a partir do portfólio
- Fluxo de estados: PENDING → ACTIVE → COMPLETED / CANCELLED
- Ao completar o projecto, cria automaticamente um item no portfólio do profissional
- Avaliação do profissional após conclusão do projecto
- Notificação da outra parte em cada mudança de estado
- **Propostas & Orçamentos**: Criação de orçamentos pelo profissional, com opção de aceitação, rejeição e envio de contrapropostas pelo cliente.
- **Contrato Digital**: Contrato gerado automaticamente ao aceitar proposta, suportando assinatura digital das duas partes e exportação em PDF dinâmica (`pdfkit`).
- **Marcos e Fases (Milestones)**: Criação de metas com prazos e valores, conclusão pelo profissional, e libertação do pagamento pelo cliente.
- **Pagamentos Manuais**: Upload de comprovativos de pagamento em Base64 pelo cliente com visualização de imagem em tempo real, e fluxo de aprovação/rejeição pelo profissional.
- **Disputas & Contestações**: Abertura de disputas nos contratos e parecer/resolução por administradores.
- **Avaliação Mútua**: Avaliação bidirecional com estrelas (1-5) e comentários de feedback (cliente avalia profissional e profissional avalia cliente via `ClientReview`).

### ✅ Mensagens / Chat
- Chat em tempo real com Socket.IO
- Histórico persistido na base de dados
- Lista de conversas agrupadas por profissional
- Indicador "está a escrever..."
- Leitura automática de mensagens ao abrir a conversa

### ✅ Notificações
- Notificações in-app para projectos, agendamentos e avaliações
- Polling a cada 30s
- Dropdown com contagem de não lidas
- Marcar como lida (individual ou em massa)
- Apagar notificação

### ✅ Agendamentos
- Cliente pode ver slots disponíveis do profissional por mês
- Reserva de slot → notifica o profissional
- Profissional gere os slots da sua agenda

### ✅ Endereços
- Utilizador pode guardar múltiplos endereços
- Definir endereço principal

### ✅ Painel de Administração
- Visão geral com estatísticas e receita total consolidada de projectos concluídos.
- Gestão de utilizadores (pesquisa por nome/email, ativação/suspensão de conta, eliminação permanente).
- Gestão de projectos (visualização de estado, filtro por estado, eliminação de projecto e dependências).
- Gestão e moderação de avaliações e comentários (eliminação com recálculo automático da média do profissional).
- Gestão de Portfólios (pesquisa por título, filtro por estado de aprovação, visualização de detalhes com imagens/vídeo, aprovação e rejeição).
- Gestão de Profissionais com baixa classificação (abaixo de limite de estrelas configurável, suspensão rápida).
- Gestão de Alertas globais de sistema (criação com nível info/warning/error, marcação de resolvido, eliminação).
- Painel de Auditoria completo (registos de todas as acções executadas pelos administradores, data, detalhes em JSON expansível).
- Layout profissional em Sidebar responsiva (colapso para ícones em mobile com tooltips, expansão no desktop).
- Integração de Footer global.

---

## 17. Funcionalidades Em Falta / A Implementar

| Funcionalidade | Prioridade | Notas |
|---|---|---|
| **Upload real de imagens** | 🔴 Alta | A infra de AWS S3 está configurada no `.env` mas o upload não está implementado; actualmente usa base64 |
| **Bloqueio de login sem email verificado** | 🟡 Média | O backend não recusa login para `emailVerified: false`; o bloqueio existe apenas no frontend |
| **Geolocalização real** | 🟡 Média | Campos `latitude`/`longitude` existem no schema mas não são usados |
| **Pesquisa por raio (radius)** | 🟡 Média | Campo `radius` existe no schema mas o filtro não está implementado |
| **Upload de vídeo no portfólio** | 🟢 Baixa | Campo `videoUrl` existe mas UI não tem |
| **Notificações push** | 🟢 Baixa | Actualmente apenas polling HTTP |
| **Recuperação de password** | 🟢 Baixa | Fluxo por email não implementado (pode reaproveitar `mailer.js`) |
| **Testes automatizados** | 🟢 Baixa | Configurado ambiente Jest com testes de integração ativos para cenários de fluxo de utilizadores |
| **Sistema de pagamentos** | 🟢 Baixa | Implementado fluxo de envio de comprovativo Base64 pelo cliente e aceitação manual pelo profissional |

---

## 18. Bugs Conhecidos e Resolvidos

### Resolvidos (Julho 2026)
| Bug / Ajuste | Ficheiro | Solução |
|---|---|---|
| Tela branca ao iniciar | `Admin.jsx` (apagado) | Ficheiro corrompido com código solto e exportações duplas foi removido |
| `TypeError: professionalsAPI.getMeta is not a function` | `api.js` | Adicionado método `getMeta()` com retorno vazio de fallback |
| Chamada dupla à API de autenticação | `App.jsx` | Removida chamada duplicada fora do `try/catch` no `submit` |
| `react-hooks/set-state-in-effect` no AdminDashboard | `AdminDashboard.jsx` | Chamadas de estado dentro de `useEffect` encapsuladas em `setTimeout(..., 0)` |
| `NaN` no cálculo de `estimatedDuration` | `projects.js` (backend) | Adicionada verificação de `startDate` antes do cálculo |
| `TypeError: authAPI.resendVerification is not a function` | `api.js` | Método `resendVerification` não existia no objecto `authAPI`; adicionado |
| `ReferenceError: router is not defined` (crash no arranque) | `mailer.js` | Blocos `router.post(...)` reduzidos apenas à função de envio de email |
| Verificação de email exigia confirmação manual e não abria o perfil | `App.jsx`, `auth.js` | Rota `verify-email` alterada de `POST` (body) para `GET` (query string), passou a devolver JWT + utilizador; autenticação automática e redireccionamento via flag |
| `PrismaClientValidationError` em `verify-email` | `schema.prisma` | Campo `verificationToken` marcado como `@unique`, corrigido com `prisma db push` + `prisma generate` |
| Admin nunca autenticado | `admin.js` (backend) | A verificação do middleware `adminOnly` corrigida para usar `req.user.type === 'ADMIN'` |
| Acesso às abas do admin ocultado | `AdminDashboard.jsx`, `App.jsx` | Props de tabulação elevadas para `App.jsx`, abas movidas para Sidebar à esquerda responsiva |
| Formulário de criação de projectos no admin | `AdminDashboard.jsx` | Removido formulário de criação do painel admin, mantendo apenas gestão e listagem |
| Ausência de Footer global | `App.jsx`, `Footer.jsx` | Integrado `<Footer />` estilizado nas vistas principais e uniformizada cor do banner administrativo |

### Bugs Conhecidos e Não Resolvidos
| Bug | Ficheiro | Descrição |
|---|---|---|
| CORS em produção | `server.js` | `FRONTEND_URL` no `.env` só inclui `localhost:5173`, falhará em produção se não actualizado |
| Login não valida `emailVerified` | `auth.js` (backend) | Um utilizador com email por confirmar consegue autenticar-se normalmente; o bloqueio existe apenas no frontend |

---

## 19. Deploy

### Frontend — GitHub Pages
```bash
# Alterar o base no vite.config.js se o repositório mudar de nome:
# base: '/buildmatch/'

# Build e deploy
npm run deploy --prefix buildmatch-frontend
# Equivale a: npm run build && gh-pages -d dist
```
URL de produção: `https://JuaryMonteiro.github.io/buildmatch`

> **Atenção ao deploy do link de verificação:** o email de verificação usa `FRONTEND_URL` do backend para construir o link. Em produção, este valor tem de apontar para o domínio real do frontend (incluindo o path base `/buildmatch/`, se aplicável), caso contrário o link de verificação abre uma rota inexistente.

### Backend — Deploy
O backend não tem configuração de deploy automático. Opções recomendadas:
- **Railway** — suporta Node.js + PostgreSQL, fácil deploy via GitHub
- **Render** — gratuito com limitações, suporta Node.js + PostgreSQL
- **Fly.io** — mais controlo, Docker-based

Passos para deploy do backend:
1. Configurar `DATABASE_URL` apontando para uma base de dados cloud
2. Configurar `FRONTEND_URL` com o URL real do frontend
3. Configurar `EMAIL_USER`, `EMAIL_PASS` (App Password) e `EMAIL_FROM` para o envio de emails de verificação funcionar em produção
4. Executar `npx prisma db push` para criar as tabelas na nova base
5. Iniciar com `npm start`

---

## Comandos Úteis

```bash
# Frontend
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run lint          # Verificar erros de código
npm run deploy        # Deploy para GitHub Pages

# Backend
npm run dev           # Servidor com hot-reload (nodemon)
npm start             # Servidor de produção
npx prisma db seed    #Gerar dados de base de dados


# Prisma
npx prisma studio     # Interface visual da base de dados (localhost:5555)
npx prisma db push    # Aplicar schema sem gerar migração
npx prisma generate   # Re-gerar o Prisma Client
npx prisma migrate dev --name nome_da_migracao  # Criar migração SQL
node prisma/seed.js    # popular a base de dados

# Git (workflow do projecto)
git add .
git commit -m "feat: descrição"
git push
npm run deploy --prefix buildmatch-frontend
```

---

*Documentação feita em Julho de 2026 — BuildMatch v1.0.0*
