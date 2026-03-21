// src/routes/professionals.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/professionals — Listar com filtros
router.get('/', async (req, res) => {
  try {
    const {
      specialty, location, minRating,
      available, page = 1, limit = 10,
      sortBy = 'rating', order = 'desc',
    } = req.query;

    const where = {};
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (location)  where.location  = { contains: location,  mode: 'insensitive' };
    if (minRating) where.rating    = { gte: parseFloat(minRating) };
    if (available !== undefined) where.available = available === 'true';

    const validSortFields = ['rating', 'experience', 'reviewCount', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'rating';

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
          portfolio: { take: 3, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { [sortField]: order },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.professional.count({ where }),
    ]);

    res.json({
      data: professionals,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar profissionais' });
  }
});

// GET /api/professionals/search — Pesquisa por texto
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) return res.status(400).json({ error: 'Parâmetro q é obrigatório' });

    const professionals = await prisma.professional.findMany({
      where: {
        OR: [
          { specialty: { contains: q, mode: 'insensitive' } },
          { location:  { contains: q, mode: 'insensitive' } },
          { about:     { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { rating: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({ data: professionals });
  } catch (err) {
    res.status(500).json({ error: 'Erro na pesquisa' });
  }
});

// GET /api/professionals/:id — Perfil completo
router.get('/:id', async (req, res) => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: req.params.id },
      include: {
        user:      { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        portfolio: { orderBy: { createdAt: 'desc' } },
        reviews: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        schedules: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(professional);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter profissional' });
  }
});

// PUT /api/professionals/:id — Actualizar perfil
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      specialty, experience, location, radius,
      priceMin, priceMax, about, tags, available,
    } = req.body;

    const professional = await prisma.professional.update({
      where: { id: req.params.id },
      data: { specialty, experience, location, radius, priceMin, priceMax, about, tags, available },
    });

    res.json(professional);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao actualizar profissional' });
  }
});

// GET /api/professionals/:id/availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const endDate   = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0);

    const schedules = await prisma.schedule.findMany({
      where: {
        professionalId: req.params.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter disponibilidade' });
  }
});

module.exports = router;