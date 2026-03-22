const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const { password, ...rest } = user;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    // Verificar se o utilizador existe
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Utilizador não encontrado' });

    // Verificar se é o próprio utilizador
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este perfil' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name  ? { name }   : {}),
        ...(phone ? { phone }  : {}),
        ...(avatar ? { avatar } : {}),
      },
    });

    const { password, ...rest } = updated;
    res.json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao actualizar utilizador' });
  }
});

module.exports = router;