// src/routes/disputes.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// Helper for notifications
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// POST /api/disputes - Open a dispute (Client or Professional)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contractId, milestoneId, description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Descrição da disputa é obrigatória' });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [
          { id: contractId || '' },
          { milestones: { some: { id: milestoneId || '' } } }
        ]
      },
      include: { proposal: { include: { professional: { include: { user: true } } } } }
    });

    if (!contract) return res.status(404).json({ error: 'Contrato associado não encontrado' });

    // Verify if participant
    const isClient = req.user.id === contract.proposal.clientId;
    const isProf = req.user.id === contract.proposal.professional.user.id;

    if (!isClient && !isProf) {
      return res.status(403).json({ error: 'Apenas os participantes do contrato podem abrir disputas' });
    }

    const dispute = await prisma.dispute.create({
      data: {
        contractId: contract.id,
        milestoneId: milestoneId || null,
        raisedById: req.user.id,
        description,
        status: 'OPEN'
      }
    });

    // Notify other user
    const counterpartId = isClient ? contract.proposal.professional.user.id : contract.proposal.clientId;
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Disputa Aberta',
          mensagem: `Uma disputa foi aberta pelo outro participante no contrato do projeto "${contract.proposal.terms.title}".`,
          type: 'DISPUTA',
          status: 'NAO_LIDA',
          userId: counterpartId
        }
      });
      if (_app) _app.get('emitNotification')(counterpartId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    // Notify Admins
    try {
      const admins = await prisma.user.findMany({ where: { type: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Nova Disputa Aberta',
            mensagem: `Disputa aberta pelo utilizador ${req.user.name} no contrato ${contract.id}.`,
            type: 'ADMIN',
            status: 'NAO_LIDA',
            userId: admin.id
          }
        });
      }
    } catch (adminNErr) {
      console.error(adminNErr);
    }

    res.status(201).json(dispute);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao abrir disputa' });
  }
});

// GET /api/disputes/project/:projectId - Get disputes for a project/contract
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: { proposal: { projectId: req.params.projectId } }
    });
    if (!contract) return res.json({ data: [] });

    const disputes = await prisma.dispute.findMany({
      where: { contractId: contract.id },
      include: {
        raisedBy: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: disputes });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter disputas' });
  }
});

// PUT /api/disputes/:id/resolve - Resolve a dispute (Admin only)
router.put('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { resolution, status } = req.body; // status: RESOLVED or REJECTED

    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores podem resolver disputas' });
    }

    if (!resolution || !status) {
      return res.status(400).json({ error: 'Resolução e status final são obrigatórios' });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: req.params.id },
      include: {
        contract: {
          include: {
            proposal: {
              include: {
                professional: { include: { user: true } }
              }
            }
          }
        }
      }
    });

    if (!dispute) return res.status(404).json({ error: 'Disputa não encontrada' });

    const updated = await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status,
        resolution,
        resolvedAt: new Date()
      }
    });

    // Notify both users
    const clientId = dispute.contract.proposal.clientId;
    const profUserId = dispute.contract.proposal.professional.user.id;

    const notifData = {
      titulo: 'Disputa Resolvida',
      mensagem: `A disputa no contrato do projeto "${dispute.contract.proposal.terms.title || ''}" foi resolvida pelo administrador. Resolução: "${resolution}".`,
      type: 'DISPUTA',
      status: 'NAO_LIDA'
    };

    try {
      const clientNotif = await prisma.notificacao.create({ data: { ...notifData, userId: clientId } });
      const profNotif = await prisma.notificacao.create({ data: { ...notifData, userId: profUserId } });
      if (_app) {
        _app.get('emitNotification')(clientId, clientNotif);
        _app.get('emitNotification')(profUserId, profNotif);
      }
    } catch (nErr) {
      console.error(nErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao resolver disputa' });
  }
});

module.exports = router;
