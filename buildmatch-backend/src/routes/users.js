// src/routes/users.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { professional: true },
    });
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
});

// PUT /api/users/:id — Actualizar perfil
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, phone, avatar },
    });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao actualizar utilizador' });
  }
});

module.exports = router;