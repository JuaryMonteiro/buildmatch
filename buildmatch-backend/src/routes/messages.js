// src/routes/messages.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;