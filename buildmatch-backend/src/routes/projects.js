// src/routes/projects.js
const express = require('express');
const authMiddleware   = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// Helper para emitir notificações em tempo real (acedido via app)
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// GET /api/projects — Listar projectos do utilizador
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.type === 'CLIENT') {
      where.clientId = req.user.id;
    } else {
      const professional = await prisma.professional.findUnique({ where: { userId: req.user.id } });
      if (professional) where.professionalId = professional.id;
    }

    if (status) where.status = status;

    const projects = await prisma.project.findMany({
      where,
      include: {
        client:       { select: { id: true, name: true, avatar: true } },
        professional: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar projectos' });
  }
});

// POST /api/projects — Criar projecto
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, professionalId, amount, startDate, address, portfolioItemId } = req.body;

    if (!title || !professionalId) {
      return res.status(400).json({ error: 'Título e profissional são obrigatórios' });
    }

    // If a portfolio item is provided, fetch its price and estimatedDuration
    let budgetAmount = amount ? parseFloat(amount) : null;
    let budgetDeadline = startDate ? new Date(startDate) : null;
    if (portfolioItemId) {
      const portfolioItem = await prisma.portfolio.findUnique({
          where: { id: portfolioItemId },
          select: { price: true, estimatedDuration: true },
        });
      if (portfolioItem) {
        if (portfolioItem.price) budgetAmount = portfolioItem.price;
        if (portfolioItem.estimatedDuration && budgetDeadline) {
          // add estimatedDuration (days) to deadline
          const deadline = new Date(budgetDeadline);
          deadline.setDate(deadline.getDate() + portfolioItem.estimatedDuration);
          budgetDeadline = deadline;
        }
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        clientId: req.user.id,
        professionalId,
        amount: amount ? parseFloat(amount) : null,
        startDate: startDate ? new Date(startDate) : null,
        address,
        // new fields
        budgetAmount,
        budgetDeadline,
        portfolioItemId: portfolioItemId || null,
      },
      include: {
        client:       { select: { id: true, name: true } },
        professional: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // ── Notificar o profissional sobre o novo projecto ──
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Novo Projecto',
          mensagem: `O cliente ${project.client.name} criou o projecto "${project.title}".`,
          type: 'PROJETO',
          status: 'NAO_LIDA',
          userId: project.professional.user.id,
        },
      });
      // Emitir em tempo real via Socket.IO
      if (_app) _app.get('emitNotification')(project.professional.user.id, notif);
    } catch (notifErr) {
      console.error('Erro ao criar notificação de projecto:', notifErr);
    }

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projecto' });
  }
});

// GET /api/projects/:id — Detalhe
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client:       { select: { id: true, name: true, avatar: true, phone: true } },
        professional: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: {
          include: { sender: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        review: true,
      },
    });

    if (!project) return res.status(404).json({ error: 'Projecto não encontrado' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter projecto' });
  }
});

// PUT /api/projects/:id — Actualizar
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, amount, startDate, endDate, address } = req.body;
    const existingProject = await prisma.project.findUnique({ where: { id: req.params.id } });

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title, description, status, address,
        amount:    amount    ? parseFloat(amount)    : undefined,
        startDate: startDate ? new Date(startDate)   : undefined,
        endDate:   endDate   ? new Date(endDate)     : undefined,
      },
      include: {
        client:       { select: { id: true, name: true } },
        professional: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // If project just got completed, add a portfolio entry for the professional
    if (status === 'COMPLETED' && existingProject.status !== 'COMPLETED') {
      await prisma.portfolio.create({
        data: {
          professionalId: project.professionalId,
          title: project.title,
          description: project.description,
          price: project.budgetAmount,
          estimatedDuration: (project.budgetDeadline && project.startDate) ? Math.round((new Date(project.budgetDeadline) - new Date(project.startDate)) / (1000 * 60 * 60 * 24)) : null,
          featured: false,
        },
      });
    }

    const statusLabels = {
      PENDING: 'Pendente',
      ACTIVE: 'Ativo',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
    };
    const label = statusLabels[status] || status;

    // Notificar a outra parte (se quem atualizou for o cliente, notifica o profissional e vice-versa)
    const targetUserId = req.user.id === project.clientId
      ? project.professional.user.id
      : project.clientId;

    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Atualização de Projecto',
          mensagem: `O projecto "${project.title}" foi atualizado para: ${label}.`,
          type: 'PROJETO',
          status: 'NAO_LIDA',
          userId: targetUserId,
        },
      });
      // Emitir em tempo real via Socket.IO
      if (_app) _app.get('emitNotification')(targetUserId, notif);
    } catch (notifErr) {
      console.error('Erro ao criar notificação de status:', notifErr);
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao actualizar projecto' });
  }
});

// DELETE /api/projects/:id — Cancelar
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Projecto cancelado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar projecto' });
  }
});


// POST /api/projects/:id/accept - Professional accepts the project directly (with client's budget/details)
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Verify if user is a professional
    const professional = await prisma.professional.findUnique({
      where: { userId: req.user.id }
    });
    if (!professional) {
      return res.status(403).json({ error: 'Apenas profissionais podem aceitar projetos' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true }
    });

    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (project.professionalId !== professional.id) {
      return res.status(403).json({ error: 'Este projeto não foi direcionado a si' });
    }

    // Determine the amount to use (default to budgetAmount or 0 if not specified)
    const finalAmount = project.amount || project.budgetAmount || 0;
    const finalDeadline = project.startDate || project.budgetDeadline || null;

    let proposal;
    let contract;

    // Check if an accepted proposal already exists for this project
    const existingAcceptedProposal = await prisma.proposal.findFirst({
      where: {
        projectId,
        professionalId: professional.id,
        status: 'ACCEPTED'
      }
    });

    if (existingAcceptedProposal) {
      proposal = existingAcceptedProposal;
      // Find existing contract
      const existingContract = await prisma.contract.findUnique({
        where: { proposalId: proposal.id }
      });

      if (existingContract) {
        let terms = existingContract.terms || {};
        if (typeof terms === 'string') terms = JSON.parse(terms);
        terms.clientSignedAt = terms.clientSignedAt || new Date().toISOString();
        terms.professionalSignedAt = new Date().toISOString();

        contract = await prisma.contract.update({
          where: { id: existingContract.id },
          data: {
            status: 'ACTIVE',
            signedAt: new Date(),
            terms
          }
        });
      } else {
        // Create active contract if not found
        contract = await prisma.contract.create({
          data: {
            proposalId: proposal.id,
            status: 'ACTIVE',
            signedAt: new Date(),
            terms: {
              title: project.title,
              description: project.description || '',
              proposedAmount: finalAmount,
              deadline: finalDeadline,
              clientSignedAt: new Date().toISOString(),
              professionalSignedAt: new Date().toISOString(),
              defaultClauses: [
                "O profissional compromete-se a executar o trabalho com zelo profissional.",
                "O pagamento será realizado após a aceitação do comprovativo enviado pelo cliente.",
                "Disputas insolúveis serão arbitradas pela gerência do BuildMatch."
              ]
            }
          }
        });
      }
    } else {
      // 1. Create an automatically accepted proposal (direct hire flow)
      proposal = await prisma.proposal.create({
        data: {
          projectId,
          professionalId: professional.id,
          clientId: project.clientId,
          proposedAmount: finalAmount,
          proposedDeadline: finalDeadline,
          coverLetter: 'Aceite direto do pedido de orçamento pelo profissional.',
          status: 'ACCEPTED'
        }
      });

      // 2. Reject other proposals for this project (just in case)
      await prisma.proposal.updateMany({
        where: { projectId, id: { not: proposal.id } },
        data: { status: 'REJECTED' }
      });

      // 3. Create Draft/Active Contract
      contract = await prisma.contract.create({
        data: {
          proposalId: proposal.id,
          status: 'ACTIVE',
          signedAt: new Date(),
          terms: {
            title: project.title,
            description: project.description || '',
            proposedAmount: finalAmount,
            deadline: finalDeadline,
            clientSignedAt: new Date().toISOString(),
            professionalSignedAt: new Date().toISOString(),
            defaultClauses: [
              "O profissional compromete-se a executar o trabalho com zelo profissional.",
              "O pagamento será realizado após a aceitação do comprovativo enviado pelo cliente.",
              "Disputas insolúveis serão arbitradas pela gerência do BuildMatch."
            ]
          }
        }
      });
    }

    // 4. Update project to ACTIVE
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ACTIVE',
        amount: finalAmount,
      },
      include: {
        client: { select: { id: true, name: true } },
        professional: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    // Notify Client
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Trabalho Aceite',
          mensagem: `O profissional ${updatedProject.professional.user.name} aceitou o seu pedido para o projeto "${updatedProject.title}". O trabalho iniciou!`,
          type: 'PROJETO',
          status: 'NAO_LIDA',
          userId: project.clientId
        }
      });
      if (_app) _app.get('emitNotification')(project.clientId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json({ message: 'Projeto aceite e iniciado', project: updatedProject, contract });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aceitar projeto' });
  }
});

module.exports = router;