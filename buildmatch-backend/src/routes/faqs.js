const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// GET /api/faqs - List faqs
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // optional: "CLIENT", "PROFESSIONAL", or "BOTH"
    const where = type ? {
      OR: [
        { type: type },
        { type: "BOTH" }
      ]
    } : {};
    
    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });
    res.json({ data: faqs });
  } catch (err) {
    console.error('Error fetching FAQs:', err);
    res.status(500).json({ error: 'Erro ao listar FAQs' });
  }
});

// POST /api/faqs - Create FAQ (Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    const { question, answer, type } = req.body;
    if (!question || !answer || !type) return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

    const faq = await prisma.fAQ.create({
      data: { question, answer, type }
    });
    res.json({ success: true, data: faq });
  } catch (err) {
    console.error('Error creating FAQ:', err);
    res.status(500).json({ error: 'Erro ao criar FAQ' });
  }
});

// PUT /api/faqs/:id - Update FAQ (Admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    const { question, answer, type } = req.body;
    const faq = await prisma.fAQ.update({
      where: { id: req.params.id },
      data: { question, answer, type }
    });
    res.json({ success: true, data: faq });
  } catch (err) {
    console.error('Error updating FAQ:', err);
    res.status(500).json({ error: 'Erro ao atualizar FAQ' });
  }
});

// DELETE /api/faqs/:id - Delete FAQ (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    await prisma.fAQ.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting FAQ:', err);
    res.status(500).json({ error: 'Erro ao apagar FAQ' });
  }
});

module.exports = router;
