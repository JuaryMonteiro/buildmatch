// src/routes/notifications.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/notifications — Listar notificações do utilizador autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notificacao.findMany({
      where: { userId: req.user.id },
      orderBy: { data_criacao: 'desc' },
    });

    res.json({ data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
});

// GET /api/notifications/unread-count — Contar notificações não lidas
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.notificacao.count({
      where: { userId: req.user.id, status: 'NAO_LIDA' },
    });

    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
});

// PUT /api/notifications/:id/read — Marcar uma notificação como lida
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Verificar se a notificação pertence ao utilizador
    const notificacao = await prisma.notificacao.findUnique({ where: { id } });
    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    if (notificacao.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para aceder esta notificação' });
    }

    const updated = await prisma.notificacao.update({
      where: { id },
      data: { status: 'LIDA' },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// PUT /api/notifications/read-all — Marcar todas as notificações como lidas
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notificacao.updateMany({
      where: { userId: req.user.id, status: 'NAO_LIDA' },
      data: { status: 'LIDA' },
    });

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
  }
});

// DELETE /api/notifications/:id — Apagar notificação
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Verificar se a notificação pertence ao utilizador
    const notificacao = await prisma.notificacao.findUnique({ where: { id } });
    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    if (notificacao.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para apagar esta notificação' });
    }

    await prisma.notificacao.delete({ where: { id } });

    res.json({ message: 'Notificação apagada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar notificação' });
  }
});

module.exports = router;
