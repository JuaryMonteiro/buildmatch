const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Middleware to ensure user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') return next();
  return res.status(403).json({ error: 'Acesso negado: administrador requerido' });
};

router.use(authMiddleware, adminOnly);

// ---- Portfolios ----
router.get('/portfolios/pending', async (req, res) => {
  try {
    const pending = await prisma.portfolio.findMany({ where: { featured: false } });
    res.json(pending);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter portfólios pendentes' });
  }
});

router.post('/portfolios/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.portfolio.update({
      where: { id },
      data: { featured: true },
    });
    // Audit log
    await prisma.auditLog.create({
      data: { action: 'PORTFOLIO_APPROVED', userId: req.user.id, details: { portfolioId: id } },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao aprovar portfólio' });
  }
});

// ---- Comments (Reviews) moderation ----
router.get('/comments/pending', async (req, res) => {
  try {
    // Placeholder: implement moderation flag on Review model later
    const pending = await prisma.review.findMany({});
    res.json(pending);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter comentários pendentes' });
  }
});

router.post('/comments/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    // Placeholder: mark review as approved when schema supports it
    const updated = await prisma.review.update({ where: { id }, data: {} });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao aprovar comentário' });
  }
});

router.delete('/comments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.review.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao remover comentário' });
  }
});

// ---- Low rating professionals ----
router.get('/professionals/low-ratings', async (req, res) => {
  try {
    const low = await prisma.professional.findMany({ where: { rating: { lt: 3 } } });
    res.json(low);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter profissionais com baixa classificação' });
  }
});

// ---- Alerts ----
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(alerts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter alertas' });
  }
});

router.post('/alert', async (req, res) => {
  const { title, message, level } = req.body;
  try {
    const alert = await prisma.alert.create({ data: { title, message, level } });
    await prisma.auditLog.create({ data: { action: 'ALERT_CREATED', userId: req.user.id, details: { alertId: alert.id } } });
    res.json(alert);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

// ---- Audit Log ----
router.get('/audit', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(logs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao obter audit log' });
  }
});

module.exports = router;
