// src/routes/schedules.js
const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const authMiddleware   = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/schedules/professional/:id
router.get('/professional/:id', async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { professionalId: req.params.id, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });
    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter agendamentos' });
  }
});

// POST /api/schedules
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { professionalId, date, startTime, endTime } = req.body;

    if (!professionalId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const schedule = await prisma.schedule.create({
      data: { professionalId, date: new Date(date), startTime, endTime, available: false },
    });

    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.schedule.update({ where: { id: req.params.id }, data: { available: true } });
    res.json({ message: 'Agendamento cancelado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
});

module.exports = router;