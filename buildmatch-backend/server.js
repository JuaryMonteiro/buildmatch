// server.js
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

// ── Mapa userId → socketId para notificações em tempo real ────────────
const userSocketMap = new Map(); // userId → Set<socketId>

// Expor io e helper globalmente para uso nas rotas
app.set('io', io);
app.set('userSocketMap', userSocketMap);

// Helper: emitir notificação em tempo real a um utilizador
app.set('emitNotification', (userId, notification) => {
  const sockets = userSocketMap.get(userId);
  if (sockets) {
    sockets.forEach(socketId => {
      io.to(socketId).emit('new_notification', notification);
    });
  }
});

// ── Middlewares ────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

// ── Health check ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BuildMatch API', timestamp: new Date().toISOString() });
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
app.use('/api/addresses',      require('./src/routes/addresses'));
app.use('/api/notifications',  require('./src/routes/notifications'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/proposals',     require('./src/routes/proposals'));
app.use('/api/contracts',     require('./src/routes/contracts'));
app.use('/api/milestones',    require('./src/routes/milestones'));
app.use('/api/payments',      require('./src/routes/payments'));
app.use('/api/disputes',      require('./src/routes/disputes'));
app.use('/api/categories',    require('./src/routes/categories'));
app.use('/api/faqs',          require('./src/routes/faqs'));

// ── Socket.IO — Chat em tempo real + Notificações ──────────────────
io.on('connection', (socket) => {
  console.log('Utilizador conectado:', socket.id);

  // Associar socket ao utilizador autenticado
  socket.on('authenticate', (userId) => {
    if (userId) {
      if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
      userSocketMap.get(userId).add(socket.id);
      console.log(`Socket ${socket.id} associado ao utilizador ${userId}`);
    }
  });

  socket.on('join_room', (projectId) => {
    socket.join(projectId);
  });

  socket.on('send_message', (data) => {
    io.to(data.projectId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.projectId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('Utilizador desconectado:', socket.id);
    // Remover socket do mapa de utilizadores
    userSocketMap.forEach((sockets, userId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) userSocketMap.delete(userId);
    });
  });
});

// ── Iniciar servidor ───────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`🚀 BuildMatch API a correr em http://localhost:${PORT}`);
    console.log(`📊 Prisma Studio: npx prisma studio`);
  });
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "BuildMatch backend ativo!" });
});

module.exports = { app, server };

