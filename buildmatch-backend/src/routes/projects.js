// src/routes/projects.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
    const { title, description, professionalId, amount, startDate, address } = req.body;

    if (!title || !professionalId) {
      return res.status(400).json({ error: 'Título e profissional são obrigatórios' });
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
      },
      include: {
        client:       { select: { id: true, name: true } },
        professional: { include: { user: { select: { id: true, name: true } } } },
      },
    });

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

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title, description, status, address,
        amount:    amount    ? parseFloat(amount)    : undefined,
        startDate: startDate ? new Date(startDate)   : undefined,
        endDate:   endDate   ? new Date(endDate)     : undefined,
      },
    });

    res.json(project);
  } catch (err) {
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

module.exports = router;