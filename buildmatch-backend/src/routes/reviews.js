// src/routes/reviews.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { reply },
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao responder à avaliação' });
  }
});

module.exports = router;