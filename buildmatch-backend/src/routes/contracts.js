// src/routes/contracts.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');
const PDFDocument = require('pdfkit');

// Helper for notifications
let _app = null;
router.use((req, res, next) => { if (!_app) _app = req.app; next(); });

// GET /api/contracts/project/:projectId - Get contract for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: { proposals: { where: { status: 'ACCEPTED' } } }
    });

    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const acceptedProposal = project.proposals[0];
    if (!acceptedProposal) return res.status(404).json({ error: 'Nenhuma proposta aceite para este projeto' });

    const contract = await prisma.contract.findUnique({
      where: { proposalId: acceptedProposal.id },
      include: {
        proposal: {
          include: {
            project: {
              include: {
                client: { select: { id: true, name: true, email: true } },
                professional: { include: { user: { select: { id: true, name: true, email: true } } } }
              }
            }
          }
        },
        milestones: true
      }
    });

    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });
    res.json(contract);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar contrato' });
  }
});

// PUT /api/contracts/:id/sign - Sign a contract
router.put('/:id/sign', authMiddleware, async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        proposal: {
          include: {
            project: true,
            professional: { include: { user: true } }
          }
        }
      }
    });

    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

    let terms = contract.terms || {};
    if (typeof terms === 'string') terms = JSON.parse(terms);

    const isClient = req.user.id === contract.proposal.clientId;
    const isProf = req.user.id === contract.proposal.professional.user.id;

    if (!isClient && !isProf) {
      return res.status(403).json({ error: 'Sem permissão para assinar este contrato' });
    }

    if (isClient) {
      terms.clientSignedAt = new Date().toISOString();
    }
    if (isProf) {
      terms.professionalSignedAt = new Date().toISOString();
    }

    let status = contract.status;
    let signedAt = contract.signedAt;
    let projectStatus = contract.proposal.project.status;

    // If both signed
    if (terms.clientSignedAt && terms.professionalSignedAt) {
      status = 'ACTIVE';
      signedAt = new Date();
      projectStatus = 'ACTIVE'; // Make project active since both signed the contract!
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        terms,
        status,
        signedAt
      }
    });

    // Update project status if contract is now active
    if (status === 'ACTIVE') {
      await prisma.project.update({
        where: { id: contract.proposal.projectId },
        data: { status: 'ACTIVE' }
      });
    }

    // Notify counterpart
    const targetUserId = isClient ? contract.proposal.professional.user.id : contract.proposal.clientId;
    try {
      const notif = await prisma.notificacao.create({
        data: {
          titulo: 'Contrato Assinado',
          mensagem: `O contrato do projeto "${contract.proposal.project.title}" foi assinado por ${req.user.name}. Status atual: ${status}.`,
          type: 'CONTRATO',
          status: 'NAO_LIDA',
          userId: targetUserId
        }
      });
      if (_app) _app.get('emitNotification')(targetUserId, notif);
    } catch (nErr) {
      console.error(nErr);
    }

    res.json({ message: 'Contrato assinado com sucesso', contract: updatedContract });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao assinar contrato' });
  }
});

// GET /api/contracts/:id/pdf - Generate PDF of contract
router.get('/:id/pdf', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        proposal: {
          include: {
            project: {
              include: {
                client: { select: { name: true, email: true } },
                professional: { include: { user: { select: { name: true } } } }
              }
            }
          }
        }
      }
    });

    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

    let terms = contract.terms || {};
    if (typeof terms === 'string') terms = JSON.parse(terms);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contrato-${contract.id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', { align: 'center' });
    doc.moveDown();

    // Parties
    doc.fontSize(12).text(`Contratante (Cliente): ${contract.proposal.project.client.name}`);
    doc.text(`Contratado (Profissional): ${contract.proposal.project.professional.user.name}`);
    doc.text(`Projeto: ${contract.proposal.project.title}`);
    doc.text(`Valor Acordado: ${contract.proposal.proposedAmount} $00`);
    doc.moveDown();

    // Clauses
    doc.fontSize(14).text('CLÁUSULAS E CONDIÇÕES:', { underline: true });
    doc.moveDown();

    const clauses = terms.defaultClauses || [];
    clauses.forEach((clause, idx) => {
      doc.fontSize(10).text(`${idx + 1}. ${clause}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(14).text('ASSINATURAS:', { underline: true });
    doc.moveDown();

    doc.fontSize(10).text(`Cliente: ${contract.proposal.project.client.name} ${terms.clientSignedAt ? `(Assinado digitalmente em ${new Date(terms.clientSignedAt).toLocaleString()})` : '(Pendente)'}`);
    doc.text(`Profissional: ${contract.proposal.project.professional.user.name} ${terms.professionalSignedAt ? `(Assinado digitalmente em ${new Date(terms.professionalSignedAt).toLocaleString()})` : '(Pendente)'}`);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

module.exports = router;
