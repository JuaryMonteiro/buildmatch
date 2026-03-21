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

// ── Middlewares ────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ── Socket.IO — Chat em tempo real ────────────────
io.on('connection', (socket) => {
  console.log('Utilizador conectado:', socket.id);

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
  });
});

// ── Iniciar servidor ───────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 BuildMatch API a correr em http://localhost:${PORT}`);
  console.log(`📊 Prisma Studio: npx prisma studio`);
});