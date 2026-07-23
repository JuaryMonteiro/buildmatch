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
    const isAdmin = req.user.type === 'ADMIN';
    const where = isAdmin
      ? {}
      : {
          OR: [
            { clientId: req.user.id },
            { professional: { userId: req.user.id } },
          ],
        };

    const projects = await prisma.project.findMany({
      where,
      include: {
        client:       { select: { id: true, name: true, avatar: true, email: true } },
        professional: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by unique Client-Professional user pair
    const map = new Map();
    for (const p of projects) {
      if (!p.client || !p.professional) continue;
      const pairKey = `${p.clientId}_${p.professional.id}`;
      if (!map.has(pairKey)) {
        map.set(pairKey, p);
      } else {
        const existing = map.get(pairKey);
        const existingMsgDate = existing.messages[0]?.createdAt ? new Date(existing.messages[0].createdAt).getTime() : 0;
        const newMsgDate = p.messages[0]?.createdAt ? new Date(p.messages[0].createdAt).getTime() : 0;
        if (newMsgDate > existingMsgDate) {
          map.set(pairKey, p);
        }
      }
    }

    res.json({ data: Array.from(map.values()) });
  } catch (err) {
    console.error('Erro ao listar conversas:', err);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// GET /api/messages/project/:projectId
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const targetProject = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: { professional: true }
    });

    let projectIds = [req.params.projectId];

    if (targetProject) {
      // Find all projects between the same client and professional to unify message history
      const relatedProjects = await prisma.project.findMany({
        where: {
          clientId: targetProject.clientId,
          professionalId: targetProject.professionalId,
        },
        select: { id: true }
      });
      projectIds = relatedProjects.map(p => p.id);
    }

    const messages = await prisma.message.findMany({
      where: { projectId: { in: projectIds } },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Marcar como lidas
    await prisma.message.updateMany({
      where: { projectId: { in: projectIds }, senderId: { not: req.user.id }, read: false },
      data: { read: true },
    });

    res.json({ data: messages });
  } catch (err) {
    console.error('Erro ao obter mensagens:', err);
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