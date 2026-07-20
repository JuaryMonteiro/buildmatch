// src/routes/professionals.js
const express = require('express');
const authMiddleware   = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// ── Fórmula de Haversine (distância entre dois pontos GPS em km) ───────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/professionals — Listar com filtros
router.get('/', async (req, res) => {
  console.log(req.query);
  try {
    const {
      specialty, location, minRating,
      available, page = 1, limit = 10,
      sortBy = 'rating', order = 'desc',
      lat, lng, radius,
    } = req.query;

    const where = {};
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (location)  where.location  = { contains: location,  mode: 'insensitive' };
    if (minRating) where.rating    = { gte: parseFloat(minRating) };
    if (available !== undefined) where.available = available === 'true';

    // Se pesquisa por raio: buscar todos os candidatos e filtrar por distância
    const useGeo = lat && lng && radius;
    const geoLat = parseFloat(lat);
    const geoLng = parseFloat(lng);
    const geoRadius = parseFloat(radius);

    const validSortFields = ['rating', 'experience', 'reviewCount', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'rating';

    if (useGeo) {
      // Buscar sem paginação para filtrar por distância em JS
      const allProfs = await prisma.professional.findMany({
        where: { ...where, latitude: { not: null }, longitude: { not: null } },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
          portfolio: { take: 3, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { [sortField]: order },
      });

      const filtered = allProfs
        .map(p => ({ ...p, distanceKm: haversineKm(geoLat, geoLng, p.latitude, p.longitude) }))
        .filter(p => p.distanceKm <= geoRadius)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        data: paginated,
        meta: { total: filtered.length, page: pageNum, limit: limitNum, pages: Math.ceil(filtered.length / limitNum) },
      });
    }

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
      address, city, island, postalCode,
      latitude, longitude,
    } = req.body;

    // Verificar se o profissional existe e pertence ao utilizador logado
    const prof = await prisma.professional.findUnique({ where: { id: req.params.id } });
    if (!prof) return res.status(404).json({ error: 'Profissional não encontrado' });
    if (prof.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para alterar este perfil' });
    }

    const professional = await prisma.professional.update({
      where: { id: req.params.id },
      data: {
        specialty, experience, location, radius,
        priceMin:   priceMin   ? parseFloat(priceMin)   : null,
        priceMax:   priceMax   ? parseFloat(priceMax)   : null,
        experience: experience ? parseInt(experience)   : 0,
        about, tags, available,
        address, city, island, postalCode,
        latitude:  latitude  !== undefined ? parseFloat(latitude)  : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      },
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

// POST /api/professionals/verification-doc — Upload do documento de verificação
router.post('/verification-doc', authMiddleware, async (req, res) => {
  try {
    const { document } = req.body;
    if (!document) {
      return res.status(400).json({ error: 'O documento em base64 é obrigatório' });
    }

    const prof = await prisma.professional.findUnique({
      where: { userId: req.user.id }
    });

    if (!prof) {
      return res.status(404).json({ error: 'Perfil profissional não encontrado' });
    }

    const updated = await prisma.professional.update({
      where: { id: prof.id },
      data: { verificationDoc: document },
    });

    res.json({ success: true, professional: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer upload do documento de verificação' });
  }
});

module.exports = router;
