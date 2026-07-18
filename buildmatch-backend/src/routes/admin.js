const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Middleware para garantir que o utilizador é administrador
const adminOnly = (req, res, next) => {
  if (req.user && req.user.type === 'ADMIN') return next();
  return res.status(403).json({ error: 'Acesso negado: administrador requerido' });
};

router.use(authMiddleware, adminOnly);

// ══════════════════════════════════════════════════════════
// ESTATÍSTICAS
// ══════════════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalClients, totalProfessionals,
      totalProjects, activeProjects, completedProjects,
      totalReviews, unverifiedEmails, completedWithAmount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { type: 'CLIENT' } }),
      prisma.user.count({ where: { type: 'PROFESSIONAL' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
      prisma.review.count(),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.project.findMany({ where: { status: 'COMPLETED' }, select: { amount: true } }),
    ]);

    const totalRevenue = completedWithAmount.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      totalUsers, totalClients, totalProfessionals,
      totalProjects, activeProjects, completedProjects,
      totalReviews, unverifiedEmails, totalRevenue,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// ══════════════════════════════════════════════════════════
// UTILIZADORES
// ══════════════════════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', type = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;

    const where = {
      ...(type ? { type } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, type: true,
          emailVerified: true, active: true, createdAt: true,
        },
      }),
    ]);

    res.json({ data: users, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter utilizadores' });
  }
});

router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { active: !!active },
    });
    await prisma.auditLog.create({
      data: {
        action: active ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
        userId: req.user.id,
        details: { targetUserId: id },
      },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao actualizar estado do utilizador' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { professional: true } });
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

    const professionalId = user.professional?.id;

    await prisma.$transaction(async (tx) => {
      const clientProjects = await tx.project.findMany({ where: { clientId: id }, select: { id: true } });
      let profProjectIds = [];
      if (professionalId) {
        const profProjects = await tx.project.findMany({ where: { professionalId }, select: { id: true } });
        profProjectIds = profProjects.map(p => p.id);
      }
      const allProjectIds = [...new Set([...clientProjects.map(p => p.id), ...profProjectIds])];

      if (allProjectIds.length > 0) {
        await tx.message.deleteMany({ where: { projectId: { in: allProjectIds } } });
        await tx.review.deleteMany({ where: { projectId: { in: allProjectIds } } });
        await tx.project.deleteMany({ where: { id: { in: allProjectIds } } });
      }

      await tx.message.deleteMany({ where: { senderId: id } });
      await tx.review.deleteMany({ where: { authorId: id } });
      await tx.notificacao.deleteMany({ where: { userId: id } });
      await tx.address.deleteMany({ where: { userId: id } });

      if (professionalId) {
        await tx.schedule.deleteMany({ where: { professionalId } });
        await tx.review.deleteMany({ where: { professionalId } });
        await tx.portfolio.deleteMany({ where: { professionalId } });
        await tx.professional.delete({ where: { id: professionalId } });
      }

      await tx.user.delete({ where: { id } });
    });

    await prisma.auditLog.create({
      data: { action: 'USER_DELETED', userId: req.user.id, details: { deletedUserId: id } },
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
});

// POST /api/admin/users — Criar novo utilizador
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, type, specialty, emailVerified = true } = req.body;

    if (!name || !email || !password || !type) {
      return res.status(400).json({ error: 'Nome, email, password e tipo são obrigatórios' });
    }

    if (!['CLIENT', 'PROFESSIONAL', 'ADMIN'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido. Use CLIENT, PROFESSIONAL ou ADMIN' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Este email já está registado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        type,
        // Admin cria o utilizador com email pré-verificado por omissão
        emailVerified: Boolean(emailVerified),
        professional: type === 'PROFESSIONAL' ? {
          create: {
            specialty: specialty || '',
            experience: 0,
            location: '',
            radius: 10,
          },
        } : undefined,
      },
      include: { professional: true },
      select: {
        id: true, name: true, email: true, type: true,
        emailVerified: true, active: true, createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED_BY_ADMIN',
        userId: req.user.id,
        details: { createdUserId: user.id, type, email },
      },
    });

    res.status(201).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
});

// ══════════════════════════════════════════════════════════
// PROJECTOS
// ══════════════════════════════════════════════════════════
router.get('/projects', async (req, res) => {
  try {
    const { page = 1, limit = 15, status = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const where = status ? { status } : {};

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          professional: { include: { user: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    res.json({ data: projects, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter projectos' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { title, description, portfolioItemId } = req.body;
    if (!title || !portfolioItemId) {
      return res.status(400).json({ error: 'Título e item de portfólio são obrigatórios' });
    }

    const portfolioItem = await prisma.portfolio.findUnique({ where: { id: portfolioItemId } });
    if (!portfolioItem) {
      return res.status(404).json({ error: 'Item de portfólio não encontrado' });
    }

    const budgetDeadline = portfolioItem.estimatedDuration
      ? new Date(Date.now() + portfolioItem.estimatedDuration * 24 * 60 * 60 * 1000)
      : null;

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        clientId: req.user.id,
        professionalId: portfolioItem.professionalId,
        portfolioItemId: portfolioItem.id,
        budgetAmount: portfolioItem.price || null,
        budgetDeadline,
      },
    });

    await prisma.auditLog.create({
      data: { action: 'PROJECT_CREATED_BY_ADMIN', userId: req.user.id, details: { projectId: project.id } },
    });

    res.status(201).json(project);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar projecto' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({ where: { projectId: id } });
      await tx.review.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });
    await prisma.auditLog.create({
      data: { action: 'PROJECT_DELETED', userId: req.user.id, details: { projectId: id } },
    });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao eliminar projecto' });
  }
});

// ══════════════════════════════════════════════════════════
// AVALIAÇÕES
// ══════════════════════════════════════════════════════════
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 15, rating = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const where = rating ? { rating: parseInt(rating, 10) } : {};

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          professional: { select: { id: true, specialty: true, user: { select: { name: true } } } },
        },
      }),
    ]);

    res.json({ data: reviews, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter avaliações' });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });

    await prisma.review.delete({ where: { id } });

    const remaining = await prisma.review.findMany({ where: { professionalId: review.professionalId } });
    const reviewCount = remaining.length;
    const rating = reviewCount > 0 ? remaining.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;

    await prisma.professional.update({
      where: { id: review.professionalId },
      data: { rating, reviewCount },
    });

    await prisma.auditLog.create({
      data: { action: 'REVIEW_DELETED', userId: req.user.id, details: { reviewId: id } },
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao eliminar avaliação' });
  }
});

// ══════════════════════════════════════════════════════════
// COMENTÁRIOS (alias de reviews — moderação)
// ══════════════════════════════════════════════════════════
router.get('/comments', async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', rating = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;

    const where = {
      ...(rating ? { rating: parseInt(rating, 10) } : {}),
      ...(search ? {
        OR: [
          { comment: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    };

    const [total, comments] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          professional: { select: { id: true, specialty: true, user: { select: { name: true } } } },
        },
      }),
    ]);

    res.json({ data: comments, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter comentários' });
  }
});

router.delete('/comments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Comentário não encontrado' });

    await prisma.review.delete({ where: { id } });

    // Recalcular rating do profissional
    const remaining = await prisma.review.findMany({ where: { professionalId: review.professionalId } });
    const reviewCount = remaining.length;
    const rating = reviewCount > 0 ? remaining.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
    await prisma.professional.update({
      where: { id: review.professionalId },
      data: { rating, reviewCount },
    });

    await prisma.auditLog.create({
      data: { action: 'COMMENT_DELETED', userId: req.user.id, details: { reviewId: id } },
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao remover comentário' });
  }
});

// ══════════════════════════════════════════════════════════
// PORTFOLIOS
// ══════════════════════════════════════════════════════════
router.get('/portfolios', async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', status = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;

    // status: '' = todos | 'approved' = featured:true | 'pending' = featured:false
    const featuredFilter = status === 'approved' ? { featured: true }
      : status === 'pending' ? { featured: false }
      : {};

    const where = {
      ...featuredFilter,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [total, portfolios] = await Promise.all([
      prisma.portfolio.count({ where }),
      prisma.portfolio.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          professional: { select: { id: true, specialty: true, user: { select: { name: true } } } },
        },
      }),
    ]);

    res.json({ data: portfolios, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter portfólios' });
  }
});

router.post('/portfolios/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.portfolio.update({
      where: { id },
      data: { featured: true },
    });
    await prisma.auditLog.create({
      data: { action: 'PORTFOLIO_APPROVED', userId: req.user.id, details: { portfolioId: id } },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao aprovar portfólio' });
  }
});

router.post('/portfolios/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.portfolio.update({
      where: { id },
      data: { featured: false },
    });
    await prisma.auditLog.create({
      data: { action: 'PORTFOLIO_REJECTED', userId: req.user.id, details: { portfolioId: id } },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao rejeitar portfólio' });
  }
});

router.delete('/portfolios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Desvincular projectos deste portfolio antes de eliminar
    await prisma.project.updateMany({
      where: { portfolioItemId: id },
      data: { portfolioItemId: null },
    });
    await prisma.portfolio.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: 'PORTFOLIO_DELETED', userId: req.user.id, details: { portfolioId: id } },
    });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao eliminar portfólio' });
  }
});

// ══════════════════════════════════════════════════════════
// PROFISSIONAIS COM BAIXA CLASSIFICAÇÃO
// ══════════════════════════════════════════════════════════
router.get('/professionals/low-ratings', async (req, res) => {
  try {
    const { page = 1, limit = 15, threshold = 3 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const thresholdNum = parseFloat(threshold) || 3;

    const where = {
      rating: { lt: thresholdNum },
      reviewCount: { gt: 0 }, // apenas profissionais com pelo menos 1 avaliação
    };

    const [total, professionals] = await Promise.all([
      prisma.professional.count({ where }),
      prisma.professional.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { rating: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, active: true } },
        },
      }),
    ]);

    res.json({ data: professionals, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter profissionais com baixa classificação' });
  }
});

// ══════════════════════════════════════════════════════════
// ALERTAS
// ══════════════════════════════════════════════════════════
router.get('/alerts', async (req, res) => {
  try {
    const { page = 1, limit = 20, resolved = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const where = resolved === 'true' ? { resolved: true }
      : resolved === 'false' ? { resolved: false }
      : {};

    const [total, alerts] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ data: alerts, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter alertas' });
  }
});

router.post('/alerts', async (req, res) => {
  const { title, message, level } = req.body;
  if (!title || !message || !level) {
    return res.status(400).json({ error: 'Título, mensagem e nível são obrigatórios' });
  }
  try {
    const alert = await prisma.alert.create({ data: { title, message, level } });
    await prisma.auditLog.create({
      data: { action: 'ALERT_CREATED', userId: req.user.id, details: { alertId: alert.id } },
    });
    res.status(201).json(alert);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

router.put('/alerts/:id/resolve', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.alert.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date(), resolvedBy: req.user.id },
    });
    await prisma.auditLog.create({
      data: { action: 'ALERT_RESOLVED', userId: req.user.id, details: { alertId: id } },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao resolver alerta' });
  }
});

router.delete('/alerts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.alert.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: 'ALERT_DELETED', userId: req.user.id, details: { alertId: id } },
    });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao eliminar alerta' });
  }
});

// ══════════════════════════════════════════════════════════
// AUDITORIA
// ══════════════════════════════════════════════════════════
router.get('/audit', async (req, res) => {
  try {
    const { page = 1, limit = 20, action = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const where = action ? { action: { contains: action, mode: 'insensitive' } } : {};

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Enriquecer com dados do utilizador (userId pode ser null)
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      usersMap = Object.fromEntries(users.map(u => [u.id, u]));
    }

    const enriched = logs.map(l => ({
      ...l,
      user: l.userId ? (usersMap[l.userId] || null) : null,
    }));

    res.json({ data: enriched, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter registo de auditoria' });
  }
});

// ══════════════════════════════════════════════════════════
// VERIFICAÇÃO DE PROFISSIONAIS
// ══════════════════════════════════════════════════════════
router.get('/professionals/pending', async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;

    const where = {
      verified: false,
      verificationDoc: { not: null },
    };

    const [total, professionals] = await Promise.all([
      prisma.professional.count({ where }),
      prisma.professional.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
    ]);

    res.json({ data: professionals, total, pages: Math.ceil(total / limitNum) || 1, page: pageNum });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter profissionais pendentes' });
  }
});

router.post('/professionals/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });

    const updated = await prisma.professional.update({
      where: { id },
      data: { verified: true },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PROFESSIONAL_APPROVED',
        userId: req.user.id,
        details: { targetUserId: professional.userId, professionalId: id },
      },
    });

    // Create a system notification to the professional
    await prisma.notificacao.create({
      data: {
        userId: professional.userId,
        titulo: 'Conta Verificada ✅',
        mensagem: 'A sua conta profissional foi aprovada e verificada pelo administrador! Já pode utilizar todas as funcionalidades da plataforma.',
        type: 'SISTEMA',
        status: 'NAO_LIDA',
      },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao aprovar profissional' });
  }
});

router.post('/professionals/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });

    const updated = await prisma.professional.update({
      where: { id },
      data: { verificationDoc: null }, // Reset to allow re-upload
    });

    await prisma.auditLog.create({
      data: {
        action: 'PROFESSIONAL_REJECTED',
        userId: req.user.id,
        details: { targetUserId: professional.userId, professionalId: id },
      },
    });

    // Create a system notification to the professional
    await prisma.notificacao.create({
      data: {
        userId: professional.userId,
        titulo: 'Documento Rejeitado ❌',
        mensagem: 'O documento de comprovação profissional enviado foi rejeitado. Por favor, envie um novo documento válido para receber aprovação.',
        type: 'SISTEMA',
        status: 'NAO_LIDA',
      },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao rejeitar profissional' });
  }
});

module.exports = router;
