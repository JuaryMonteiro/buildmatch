const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// GET /api/categories - List categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ data: categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// POST /api/categories - Create category (Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    const { name, img, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const category = await prisma.category.create({
      data: { name, img, icon }
    });
    res.json({ success: true, data: category });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// PUT /api/categories/:id - Update category (Admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    const { name, img, icon } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, img, icon }
    });
    res.json({ success: true, data: category });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// DELETE /api/categories/:id - Delete category (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Erro ao apagar categoria' });
  }
});

module.exports = router;
