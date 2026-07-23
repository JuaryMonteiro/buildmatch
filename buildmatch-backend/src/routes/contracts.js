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

    if (!req.body.document) {
      return res.status(400).json({ error: 'Documento assinado é obrigatório' });
    }

    if (isClient) {
      terms.clientSignedAt = new Date().toISOString();
      terms.clientSignedDocument = req.body.document;
    }
    if (isProf) {
      terms.professionalSignedAt = new Date().toISOString();
      terms.professionalSignedDocument = req.body.document;
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
                professional: { include: { user: { select: { name: true, email: true } } } }
              }
            }
          }
        }
      }
    });

    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

    let terms = contract.terms || {};
    if (typeof terms === 'string') terms = JSON.parse(terms);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contrato-${contract.id}.pdf`);
    doc.pipe(res);

    const clientName = contract.proposal.project.client.name;
    const profName = contract.proposal.project.professional.user.name;
    const projectTitle = contract.proposal.project.title;
    const amount = contract.proposal.proposedAmount;

    // Header
    doc.font('Helvetica-Bold').fontSize(14).text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', { align: 'center' });
    doc.moveDown(2);

    // Qualificação das Partes
    doc.font('Helvetica-Bold').fontSize(11).text(`CONTRATANTE: `, { continued: true, align: 'justify', lineGap: 4 });
    doc.font('Helvetica').text(`${clientName}, doravante denominado simplesmente CONTRATANTE.`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text(`CONTRATADO: `, { continued: true, align: 'justify', lineGap: 4 });
    doc.font('Helvetica').text(`${profName}, atuando na área de ${contract.proposal.project.professional.specialty}, doravante denominado simplesmente CONTRATADO.`);
    doc.moveDown(1.5);

    doc.text('CONTRATANTE e CONTRATADO, acima nomeados e qualificados, têm entre si justo e acordado o seguinte:', { align: 'justify', lineGap: 4 });
    doc.moveDown();

    doc.text(`O CONTRATANTE, como principal responsável, está iniciando a realização da obra/projeto previamente intitulada "${projectTitle}", doravante denominada simplesmente OBRA.`, { align: 'justify', lineGap: 4 });
    doc.moveDown(2);

    // Cláusulas
    doc.font('Helvetica-Bold').text('CLÁUSULA PRIMEIRA - DO OBJETO E DAS OBRIGAÇÕES', { align: 'justify', lineGap: 4 });
    doc.font('Helvetica').text(`Tendo em vista a concepção do mencionado projeto, o CONTRATANTE contrata o CONTRATADO para prestar-lhe os serviços especializados na sua área de atuação.`, { align: 'justify', lineGap: 4 });
    doc.text(`1.1 A fim de garantir a boa execução do trabalho, o CONTRATADO compromete-se, por este ato, a observar e cumprir o cronograma de atividades da referida OBRA.`, { align: 'justify', lineGap: 4 });
    doc.text(`1.2 O CONTRATADO assume as responsabilidades inerentes à sua função na OBRA e se dispõe a realizá-la de acordo com os padrões exigidos.`, { align: 'justify', lineGap: 4 });
    doc.moveDown();

    doc.font('Helvetica-Bold').text('CLÁUSULA SEGUNDA – DA REMUNERAÇÃO', { align: 'justify', lineGap: 4 });
    doc.font('Helvetica').text(`2.1 O CONTRATANTE pagará ao CONTRATADO pelo trabalho a remuneração de ${amount} $00, de acordo com os marcos definidos na plataforma BuildMatch.`, { align: 'justify', lineGap: 4 });
    doc.moveDown();

    doc.font('Helvetica-Bold').text('CLÁUSULA TERCEIRA – DA RESOLUÇÃO', { align: 'justify', lineGap: 4 });
    doc.font('Helvetica').text(`3.1 Em caso de extinção do presente contrato, em qualquer uma das formas, os trabalhos já realizados pelo CONTRATADO deverão ser devidamente remunerados, ressalvados os direitos acordados na plataforma.`, { align: 'justify', lineGap: 4 });
    doc.moveDown();

    doc.font('Helvetica-Bold').text('CLÁUSULA QUARTA – CONVENÇÃO DAS PARTES', { align: 'justify', lineGap: 4 });
    doc.font('Helvetica').text(`4.1 Este contrato terá vigência a partir de sua assinatura até a finalização da OBRA.`, { align: 'justify', lineGap: 4 });
    doc.text(`4.2 As partes concordam que este instrumento contém a totalidade dos entendimentos entre as partes. Quaisquer cláusulas adicionais definidas na plataforma:`, { align: 'justify', lineGap: 4 });
    
    const clauses = terms.defaultClauses || [];
    if (clauses.length > 0) {
      doc.moveDown(0.5);
      clauses.forEach((clause, idx) => {
        doc.text(`- ${clause}`, { align: 'justify', lineGap: 4 });
      });
    }
    
    doc.moveDown(1.5);
    doc.text('E por estarem assim, justos e contratados, geram o presente documento em via digital para os devidos fins.', { align: 'justify', lineGap: 4 });
    doc.moveDown(3);

    // Signatures
    const dateStr = new Date().toLocaleDateString('pt-PT');
    doc.text(`Local, Data: ________________________, ${dateStr}`, { align: 'right' });
    doc.moveDown(3);

    const signLine = '__________________________________________';
    
    // Draw signature placeholders
    doc.text(signLine, { align: 'left', continued: true });
    doc.text(signLine, { align: 'right' });
    
    doc.text(`CONTRATANTE: ${clientName}`, { align: 'left', continued: true });
    doc.text(`CONTRATADO: ${profName}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

module.exports = router;
