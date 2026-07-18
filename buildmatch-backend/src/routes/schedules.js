// src/routes/schedules.js
const express = require('express');
const authMiddleware   = require('../middleware/auth');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/schedules/mine — Ver todos os horários do próprio profissional
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.user.id },
    });
    if (!professional) {
      return res.status(404).json({ error: 'Perfil de profissional não encontrado' });
    }
    const schedules = await prisma.schedule.findMany({
      where: { professionalId: professional.id },
      orderBy: { date: 'asc' },
    });
    res.json({ data: schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter agenda' });
  }
});

// GET /api/schedules/professional/:id — Clientes listam horários livres
router.get('/professional/:id', async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { professionalId: req.params.id, available: true, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });
    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter agendamentos' });
  }
});

// POST /api/schedules — Criar horário disponível
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: req.user.id },
    });
    if (!professional) {
      return res.status(404).json({ error: 'Perfil de profissional não encontrado' });
    }

    const schedule = await prisma.schedule.create({
      data: { professionalId: professional.id, date: new Date(date), startTime, endTime, available: true },
    });

    res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// PUT /api/schedules/book/:id — Reservar horário (cliente)
router.put('/book/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Horário não encontrado' });
    if (!slot.available) return res.status(409).json({ error: 'Este horário já não está disponível' });

    const updated = await prisma.schedule.update({
      where: { id },
      data: { available: false },
    });

    // ── Notificar o profissional sobre o agendamento ──
    try {
      const professional = await prisma.professional.findUnique({
        where: { id: slot.professionalId },
        select: { userId: true },
      });
      if (professional) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Novo Agendamento',
            mensagem: `Novo agendamento marcado para ${new Date(slot.date).toLocaleDateString('pt-PT')} das ${slot.startTime} às ${slot.endTime}.`,
            type: 'AGENDAMENTO',
            status: 'NAO_LIDA',
            userId: professional.userId,
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao criar notificação de agendamento:', notifErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reservar horário' });
  }
});

// DELETE /api/schedules/:id — Cancelar/remover horário
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Horário não encontrado' });

    // Se estiver reservado, volta a estar disponível, senão apaga-se totalmente
    if (!slot.available) {
      await prisma.schedule.update({ where: { id }, data: { available: true } });
    } else {
      await prisma.schedule.delete({ where: { id } });
    }
    res.json({ message: 'Agendamento cancelado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
});

module.exports = router;