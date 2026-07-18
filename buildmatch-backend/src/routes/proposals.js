// src/routes/proposals.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// Helper for notifications
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// POST /api/proposals - Professional submits a proposal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, proposedAmount, proposedDeadline, coverLetter } = req.body;

    if (!projectId || !proposedAmount) {
      return res.status(400).json({ error: 'Projeto e valor proposto são obrigatórios' });
    }

    // Verify if user is a professional
    const professional = await prisma.professional.findUnique({
      where: { userId: req.user.id }
    });
    if (!professional) {
      return res.status(403).json({ error: 'Apenas profissionais podem enviar propostas' });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        professionalId: professional.id,
        clientId: project.clientId,
        proposedAmount: parseFloat(proposedAmount),
        proposedDeadline: proposedDeadline ? new Date(proposedDeadline) : null,
        coverLetter,
        status: 'PENDING'
      },
      include: {
        project: true,
        professional: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    // Notify Client
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Nova Proposta Recebida',
          mensagem: `O profissional ${proposal.professional.user.name} enviou uma proposta de ${proposedAmount} $00 para "${project.title}".`,
          type: 'PROPOSTA',
          status: 'NAO_LIDA',
          userId: project.clientId
        }
      });
      if (_app) _app.get('emitNotification')(project.clientId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.status(201).json(proposal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar proposta' });
  }
});

// GET /api/proposals/project/:projectId - List proposals for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { projectId: req.params.projectId },
      include: {
        professional: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: proposals });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar propostas' });
  }
});

// GET /api/proposals/my - List proposals sent by professional or received by client
router.get('/my', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.type === 'CLIENT') {
      where.clientId = req.user.id;
    } else {
      const professional = await prisma.professional.findUnique({
        where: { userId: req.user.id }
      });
      if (!professional) return res.status(403).json({ error: 'Profissional não encontrado' });
      where.professionalId = professional.id;
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        project: true,
        professional: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: proposals });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter propostas' });
  }
});

// PUT /api/proposals/:id/accept - Accept a proposal
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true, professional: { include: { user: true } } }
    });

    if (!proposal) return res.status(404).json({ error: 'Proposta não encontrada' });
    if (proposal.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o cliente pode aceitar a proposta' });
    }

    // Update proposal status
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'ACCEPTED' }
    });

    // Reject other proposals for this project
    await prisma.proposal.updateMany({
      where: { projectId: proposal.projectId, id: { not: proposal.id } },
      data: { status: 'REJECTED' }
    });

    // Update project with accepted details and professionalId
    await prisma.project.update({
      where: { id: proposal.projectId },
      data: {
        professionalId: proposal.professionalId,
        amount: proposal.proposedAmount,
        budgetDeadline: proposal.proposedDeadline,
        status: 'PENDING' // Remains pending until contract and payment are approved
      }
    });

    // Create Draft Contract
    const contract = await prisma.contract.create({
      data: {
        proposalId: proposal.id,
        status: 'DRAFT',
        terms: {
          title: proposal.project.title,
          description: proposal.project.description,
          proposedAmount: proposal.proposedAmount,
          deadline: proposal.proposedDeadline,
          defaultClauses: [
            "O profissional compromete-se a executar o trabalho com zelo profissional.",
            "O pagamento será realizado após a aceitação do comprovativo enviado pelo cliente.",
            "Disputas insolúveis serão arbitradas pela gerência do BuildMatch."
          ]
        }
      }
    });

    // Notify Professional
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Proposta Aceite',
          mensagem: `A sua proposta para o projeto "${proposal.project.title}" foi aceite. O contrato foi gerado em rascunho.`,
          type: 'PROPOSTA',
          status: 'NAO_LIDA',
          userId: proposal.professional.user.id
        }
      });
      if (_app) _app.get('emitNotification')(proposal.professional.user.id, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json({ message: 'Proposta aceite com sucesso. Contrato gerado.', contract });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aceitar proposta' });
  }
});

// PUT /api/proposals/:id/reject - Reject a proposal
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true, professional: { include: { user: true } } }
    });

    if (!proposal) return res.status(404).json({ error: 'Proposta não encontrada' });
    if (proposal.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o cliente pode rejeitar a proposta' });
    }

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'REJECTED' }
    });

    // Notify Professional
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Proposta Recusada',
          mensagem: `A sua proposta para o projeto "${proposal.project.title}" foi recusada.`,
          type: 'PROPOSTA',
          status: 'NAO_LIDA',
          userId: proposal.professional.user.id
        }
      });
      if (_app) _app.get('emitNotification')(proposal.professional.user.id, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao rejeitar proposta' });
  }
});

// PUT /api/proposals/:id/counter - Counter offer
router.put('/:id/counter', authMiddleware, async (req, res) => {
  try {
    const { proposedAmount, proposedDeadline, coverLetter } = req.body;
    if (!proposedAmount) return res.status(400).json({ error: 'Valor da contraproposta é obrigatório' });

    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true, professional: { include: { user: true } } }
    });

    if (!proposal) return res.status(404).json({ error: 'Proposta não encontrada' });

    // Client counters professional OR Professional counters client's counter?
    // Let's allow updating the proposal with COUNTERED status.
    const targetUserId = req.user.id === proposal.clientId ? proposal.professional.user.id : proposal.clientId;

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        proposedAmount: parseFloat(proposedAmount),
        proposedDeadline: proposedDeadline ? new Date(proposedDeadline) : proposal.proposedDeadline,
        coverLetter: coverLetter || proposal.coverLetter,
        status: 'COUNTERED'
      }
    });

    // Notify counterpart
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Contraproposta Recebida',
          mensagem: `Foi enviada uma contraproposta de ${proposedAmount} $00 para o projeto "${proposal.project.title}".`,
          type: 'PROPOSTA',
          status: 'NAO_LIDA',
          userId: targetUserId
        }
      });
      if (_app) _app.get('emitNotification')(targetUserId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar contraproposta' });
  }
});

module.exports = router;
