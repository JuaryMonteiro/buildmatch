// src/routes/portfolio.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/portfolio/professional/:id
router.get('/professional/:id', async (req, res) => {
  try {
    const portfolio = await prisma.portfolio.findMany({
      where: { professionalId: req.params.id },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ data: portfolio });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter portfólio' });
  }
});

// POST /api/portfolio
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { professionalId, title, description, imageUrls, videoUrl, category, featured } = req.body;

    const item = await prisma.portfolio.create({
      data: { professionalId, title, description, imageUrls: imageUrls || [], videoUrl, category, featured: featured || false },
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar ao portfólio' });
  }
});

// PUT /api/portfolio/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, imageUrls, videoUrl, category, featured } = req.body;
    const item = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: { title, description, imageUrls, videoUrl, category, featured },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao actualizar portfólio' });
  }
});

// DELETE /api/portfolio/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.portfolio.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item removido do portfólio' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover do portfólio' });
  }
});

module.exports = router;