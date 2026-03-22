// src/routes/addresses.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/addresses — listar endereços do utilizador
router.get('/', authMiddleware, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ default: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ data: addresses });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar endereços' });
  }
});

// POST /api/addresses — criar endereço
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { label, address, default: isDefault } = req.body;

    if (!label || !address) {
      return res.status(400).json({ error: 'Label e endereço são obrigatórios' });
    }

    // Se for definido como principal, retirar principal dos outros
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { default: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: { userId: req.user.id, label, address, default: isDefault || false },
    });

    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
});

// PUT /api/addresses/:id — actualizar / definir como principal
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { label, address, default: isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { default: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: { label, address, default: isDefault },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao actualizar endereço' });
  }
});

// DELETE /api/addresses/:id — remover endereço
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Endereço removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover endereço' });
  }
});

module.exports = router;