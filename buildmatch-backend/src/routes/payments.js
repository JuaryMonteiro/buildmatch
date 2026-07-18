// src/routes/payments.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// Helper for notifications
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// POST /api/payments - Client submits a payment receipt (proof)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, milestoneId, amount, proof } = req.body;

    if (!projectId || !amount || !proof) {
      return res.status(400).json({ error: 'Projeto, valor e comprovativo (Base64) são obrigatórios' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { professional: { include: { user: true } } }
    });

    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (project.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o cliente pode submeter comprovativos de pagamento' });
    }

    const payment = await prisma.payment.create({
      data: {
        projectId,
        milestoneId: milestoneId || null,
        clientId: req.user.id,
        amount: parseFloat(amount),
        status: 'PENDING',
        proof // Base64 proof string
      }
    });

    // Notify Professional
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Comprovativo de Pagamento Submetido',
          mensagem: `O cliente submeteu o comprovativo de ${amount} $00 para validação no projeto "${project.title}".`,
          type: 'PAGAMENTO',
          status: 'NAO_LIDA',
          userId: project.professional.user.id
        }
      });
      if (_app) _app.get('emitNotification')(project.professional.user.id, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar comprovativo de pagamento' });
  }
});

// GET /api/payments/project/:projectId - List payments for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { projectId: req.params.projectId },
      include: {
        client: { select: { id: true, name: true } },
        milestone: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: payments });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

// PUT /api/payments/:id/approve - Professional approves the payment proof
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          include: {
            professional: { include: { user: true } }
          }
        }
      }
    });

    if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });

    // Verify user is the professional of this project
    if (payment.project.professional.user.id !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o profissional contratado pode aprovar o pagamento' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });

    // If payment is linked to a milestone, mark the milestone as PAID
    if (payment.milestoneId) {
      await prisma.milestone.update({
        where: { id: payment.milestoneId },
        data: { status: 'PAID' }
      });
    }

    // Notify Client
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Comprovativo de Pagamento Aceite',
          mensagem: `O seu comprovativo de ${payment.amount} $00 foi aceite pelo profissional no projeto "${payment.project.title}".`,
          type: 'PAGAMENTO',
          status: 'NAO_LIDA',
          userId: payment.clientId
        }
      });
      if (_app) _app.get('emitNotification')(payment.clientId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json({ message: 'Comprovativo aprovado com sucesso', payment: updatedPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aprovar comprovativo' });
  }
});

// PUT /api/payments/:id/reject - Professional rejects the payment proof
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          include: {
            professional: { include: { user: true } }
          }
        }
      }
    });

    if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });

    // Verify user is the professional of this project
    if (payment.project.professional.user.id !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o profissional contratado pode rejeitar o pagamento' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REJECTED' }
    });

    // Notify Client
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Comprovativo de Pagamento Recusado',
          mensagem: `O seu comprovativo de ${payment.amount} $00 foi recusado pelo profissional no projeto "${payment.project.title}". Verifique se enviou o arquivo correto.`,
          type: 'PAGAMENTO',
          status: 'NAO_LIDA',
          userId: payment.clientId
        }
      });
      if (_app) _app.get('emitNotification')(payment.clientId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json({ message: 'Comprovativo recusado', payment: updatedPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao recusar comprovativo' });
  }
});

module.exports = router;
