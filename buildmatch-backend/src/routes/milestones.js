// src/routes/milestones.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// Helper for notifications
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// POST /api/milestones - Create milestones for a contract
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contractId, title, amount, dueDate } = req.body;

    if (!contractId || !title || !amount) {
      return res.status(400).json({ error: 'Contrato, título e valor são obrigatórios' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { proposal: true }
    });

    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

    // Only the professional can define milestones
    const professional = await prisma.professional.findUnique({
      where: { userId: req.user.id }
    });
    if (!professional || contract.proposal.professionalId !== professional.id) {
      return res.status(403).json({ error: 'Apenas o profissional contratado pode criar marcos' });
    }

    const milestone = await prisma.milestone.create({
      data: {
        contractId,
        title,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING'
      }
    });

    // Notify Client
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Novo Marco Adicionado',
          mensagem: `Foi adicionado o marco "${title}" de ${amount} $00 ao contrato.`,
          type: 'MARCO',
          status: 'NAO_LIDA',
          userId: contract.proposal.clientId
        }
      });
      if (_app) _app.get('emitNotification')(contract.proposal.clientId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar marco' });
  }
});

// GET /api/milestones/contract/:contractId - List milestones for a contract
router.get('/contract/:contractId', authMiddleware, async (req, res) => {
  try {
    const milestones = await prisma.milestone.findMany({
      where: { contractId: req.params.contractId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ data: milestones });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter marcos' });
  }
});

// PUT /api/milestones/:id/complete - Professional marks a milestone as completed/submitted
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: { contract: { include: { proposal: true } } }
    });

    if (!milestone) return res.status(404).json({ error: 'Marco não encontrado' });

    const professional = await prisma.professional.findUnique({
      where: { userId: req.user.id }
    });
    if (!professional || milestone.contract.proposal.professionalId !== professional.id) {
      return res.status(403).json({ error: 'Apenas o profissional contratado pode marcar o marco como concluído' });
    }

    const updated = await prisma.milestone.update({
      where: { id: req.params.id },
      data: { status: 'RELEASED' } // Submetido para libertação de pagamento
    });

    // Notify Client
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Marco Concluído pelo Profissional',
          mensagem: `O profissional marcou o marco "${milestone.title}" como concluído e aguarda o pagamento/validação.`,
          type: 'MARCO',
          status: 'NAO_LIDA',
          userId: milestone.contract.proposal.clientId
        }
      });
      if (_app) _app.get('emitNotification')(milestone.contract.proposal.clientId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao completar marco' });
  }
});

// PUT /api/milestones/:id/release - Client approves and releases/pays milestone
router.put('/:id/release', authMiddleware, async (req, res) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: { contract: { include: { proposal: { include: { professional: { include: { user: true } } } } } } }
    });

    if (!milestone) return res.status(404).json({ error: 'Marco não encontrado' });

    if (milestone.contract.proposal.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o cliente pode libertar o pagamento do marco' });
    }

    const updated = await prisma.milestone.update({
      where: { id: req.params.id },
      data: { status: 'PAID' }
    });

    // Notify Professional
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Pagamento de Marco Libertado',
          mensagem: `O cliente libertou o pagamento para o marco "${milestone.title}".`,
          type: 'MARCO',
          status: 'NAO_LIDA',
          userId: milestone.contract.proposal.professional.user.id
        }
      });
      if (_app) _app.get('emitNotification')(milestone.contract.proposal.professional.user.id, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao libertar marco' });
  }
});

module.exports = router;
