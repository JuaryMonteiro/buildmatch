// src/routes/messages.js
const express = require('express');


const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = require('../lib/prisma');

// Helper para emitir notificações em tempo real (acedido via app)
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// GET /api/messages/conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { clientId: req.user.id },
          { professional: { userId: req.user.id } },
        ],
      },
      include: {
        client:       { select: { id: true, name: true, avatar: true } },
        professional: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// GET /api/messages/project/:projectId
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { projectId: req.params.projectId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Marcar como lidas
    await prisma.message.updateMany({
      where: { projectId: req.params.projectId, senderId: { not: req.user.id }, read: false },
      data: { read: true },
    });

    res.json({ data: messages });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter mensagens' });
  }
});

// POST /api/messages/project/:projectId
router.post('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({ error: 'Conteúdo ou ficheiro são obrigatórios' });
    }

    const message = await prisma.message.create({
      data: {
        content: content || '',
        senderId: req.user.id,
        projectId: req.params.projectId,
        mediaUrl,
        mediaType,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    // ── Notificar a outra parte da conversa sobre a nova mensagem ──
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.projectId },
        include: { client: true, professional: { include: { user: true } } },
      });
      if (project) {
        const recipientId = req.user.id === project.clientId
          ? project.professional.user.id
          : project.clientId;
        // Não notificar quem enviou a mensagem a si próprio
        if (recipientId && recipientId !== req.user.id) {
          const notif = await prisma.notificacao.create({
            data: {
              titulo: `Nova mensagem de ${message.sender.name}`,
              mensagem: content ? content.slice(0, 120) : 'Enviou um ficheiro.',
              type: 'MENSAGEM',
              status: 'NAO_LIDA',
              userId: recipientId,
              referenceType: 'PROJECT',
              referenceId: project.id,
            },
          });
          if (_app) _app.get('emitNotification')(recipientId, notif);
        }
      }
    } catch (notifErr) {
      console.error('Erro ao criar notificação de mensagem:', notifErr);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;