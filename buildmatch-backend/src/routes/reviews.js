// src/routes/reviews.js
const express = require('express');


const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/reviews/professional/:id
router.get('/professional/:id', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { professionalId: req.params.id },
      include: { author: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: reviews });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter avaliações' });
  }
});

// POST /api/reviews
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, professionalId, projectId } = req.body;

    if (!rating || !comment || !professionalId || !projectId) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }

    // Verificar se projecto existe e está concluído
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Só pode avaliar projectos concluídos' });
    }

    if (project.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para avaliar este projecto' });
    }

    const review = await prisma.review.create({
      data: { rating: parseInt(rating), comment, authorId: req.user.id, professionalId, projectId },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    // Actualizar média de avaliação do profissional
    const allReviews = await prisma.review.findMany({ where: { professionalId } });
    const avgRating  = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.professional.update({
      where: { id: professionalId },
      data: { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length },
    });

    // ── Notificar o profissional sobre a nova avaliação ──
    try {
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
        select: { userId: true },
      });
      if (professional) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Nova Avaliação',
            mensagem: `Recebeu uma avaliação de ${rating} estrela(s): "${comment}".`,
            type: 'AVALIACAO',
            status: 'NAO_LIDA',
            userId: professional.userId,
            referenceType: 'REVIEW',
            referenceId: review.id,
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao criar notificação de avaliação:', notifErr);
    }

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Já avaliou este projecto' });
    }
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// PUT /api/reviews/:id/reply — Profissional responde
router.put('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;

    // Verificar se a avaliação existe e se o profissional avaliado pertence ao utilizador logado
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: { professional: true },
    });
    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });
    if (review.professional.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para responder a esta avaliação' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: req.params.id },
      data: { reply },
    });
    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao responder à avaliação' });
  }
});

// GET /api/reviews/client/:id
router.get('/client/:id', async (req, res) => {
  try {
    const reviews = await prisma.clientReview.findMany({
      where: { clientId: req.params.id },
      include: { author: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: reviews });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter avaliações do cliente' });
  }
});

// POST /api/reviews/client
router.post('/client', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, clientId, projectId } = req.body;

    if (!rating || !comment || !clientId || !projectId) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }

    // Verify project exists and is completed
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Só pode avaliar projetos concluídos' });
    }

    const professional = await prisma.professional.findUnique({ where: { userId: req.user.id } });
    if (!professional || project.professionalId !== professional.id) {
      return res.status(403).json({ error: 'Sem permissão para avaliar este projeto' });
    }

    const review = await prisma.clientReview.create({
      data: { rating: parseInt(rating), comment, authorId: req.user.id, clientId, projectId },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    // Notify client
    try {
      await prisma.notificacao.create({
        data: {
          titulo: 'Nova Avaliação de Cliente',
          mensagem: `Recebeu uma avaliação de ${rating} estrela(s) do profissional: "${comment}".`,
          type: 'AVALIACAO',
          status: 'NAO_LIDA',
          userId: clientId,
          referenceType: 'REVIEW',
          referenceId: review.id,
        },
      });
    } catch (notifErr) {
      console.error('Erro ao criar notificação de avaliação de cliente:', notifErr);
    }

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Já avaliou este cliente para este projeto' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar avaliação do cliente' });
  }
});

// PUT /api/reviews/client/:id/reply - Client replies to review
router.put('/client/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;

    const review = await prisma.clientReview.findUnique({
      where: { id: req.params.id },
    });
    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });
    if (review.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para responder a esta avaliação' });
    }

    const updatedReview = await prisma.clientReview.update({
      where: { id: req.params.id },
      data: { reply },
    });
    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao responder à avaliação' });
  }
});

module.exports = router;