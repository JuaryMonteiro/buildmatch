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

// GET /api/schedules/mine/client — Ver os próprios agendamentos feitos como cliente
router.get('/mine/client', authMiddleware, async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { clientId: req.user.id },
      orderBy: { date: 'asc' },
      include: { professional: { include: { user: { select: { name: true } } } } },
    });
    res.json({ data: schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter os seus agendamentos' });
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
// O horário fica PENDENTE até o profissional aceitar; só depois de
// aceite passa a trabalho ATIVO, e mantém-se assim até ser concluído.
router.put('/book/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Horário não encontrado' });
    if (!slot.available) return res.status(409).json({ error: 'Este horário já não está disponível' });

    const updated = await prisma.schedule.update({
      where: { id },
      data: { available: false, status: 'PENDING', clientId: req.user.id },
    });

    // ── Notificar o profissional: novo pedido de agendamento aguarda a sua confirmação ──
    try {
      const professional = await prisma.professional.findUnique({
        where: { id: slot.professionalId },
        select: { userId: true },
      });
      if (professional) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Novo Pedido de Agendamento',
            mensagem: `Pedido de agendamento para ${new Date(slot.date).toLocaleDateString('pt-PT')} das ${slot.startTime} às ${slot.endTime}. Aceite ou recuse na sua Agenda.`,
            type: 'AGENDAMENTO',
            status: 'NAO_LIDA',
            userId: professional.userId,
            referenceType: 'SCHEDULE',
            referenceId: slot.id,
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

// PUT /api/schedules/:id/accept — Profissional aceita um agendamento pendente
// Só depois desta aceitação o agendamento passa a trabalho ATIVO.
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await prisma.professional.findUnique({ where: { userId: req.user.id } });
    if (!professional) return res.status(404).json({ error: 'Perfil de profissional não encontrado' });

    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Agendamento não encontrado' });
    if (slot.professionalId !== professional.id) return res.status(403).json({ error: 'Sem permissão para aceitar este agendamento' });
    if (slot.status !== 'PENDING') return res.status(409).json({ error: 'Este agendamento já não está pendente' });

    const updated = await prisma.schedule.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // ── Notificar o cliente: agendamento aceite, trabalho passa a ativo ──
    try {
      if (slot.clientId) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Agendamento Aceite',
            mensagem: `O profissional aceitou o seu agendamento para ${new Date(slot.date).toLocaleDateString('pt-PT')} das ${slot.startTime} às ${slot.endTime}.`,
            type: 'AGENDAMENTO',
            status: 'NAO_LIDA',
            userId: slot.clientId,
            referenceType: 'SCHEDULE',
            referenceId: slot.id,
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao criar notificação de aceitação:', notifErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aceitar agendamento' });
  }
});

// PUT /api/schedules/:id/reject — Profissional recusa um agendamento pendente
// O horário volta a ficar livre para outros clientes reservarem.
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await prisma.professional.findUnique({ where: { userId: req.user.id } });
    if (!professional) return res.status(404).json({ error: 'Perfil de profissional não encontrado' });

    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Agendamento não encontrado' });
    if (slot.professionalId !== professional.id) return res.status(403).json({ error: 'Sem permissão para recusar este agendamento' });
    if (slot.status !== 'PENDING') return res.status(409).json({ error: 'Este agendamento já não está pendente' });

    const clientId = slot.clientId;

    const updated = await prisma.schedule.update({
      where: { id },
      data: { available: true, status: null, clientId: null },
    });

    // ── Notificar o cliente: agendamento recusado ──
    try {
      if (clientId) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Agendamento Recusado',
            mensagem: `O profissional não pôde aceitar o agendamento para ${new Date(slot.date).toLocaleDateString('pt-PT')} das ${slot.startTime} às ${slot.endTime}. Tente outro horário.`,
            type: 'AGENDAMENTO',
            status: 'NAO_LIDA',
            userId: clientId,
            // Depois de recusado o horário fica de novo livre e disponível para
            // outros clientes reservarem — já não há um agendamento específico
            // para onde levar o cliente, por isso não define referenceId aqui.
            referenceType: 'SCHEDULE_REJECTED',
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao criar notificação de recusa:', notifErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao recusar agendamento' });
  }
});

// PUT /api/schedules/:id/complete — Marca um agendamento ativo como concluído
// Pode ser accionado pelo profissional ou pelo cliente que reservou.
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const professional = await prisma.professional.findUnique({ where: { userId: req.user.id } });
    const isOwnerProfessional = professional && slot.professionalId === professional.id;
    const isBookingClient = slot.clientId === req.user.id;
    if (!isOwnerProfessional && !isBookingClient) {
      return res.status(403).json({ error: 'Sem permissão para concluir este agendamento' });
    }
    if (slot.status !== 'ACTIVE') return res.status(409).json({ error: 'Só é possível concluir um agendamento ativo' });

    const updated = await prisma.schedule.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    // ── Notificar a outra parte sobre a conclusão ──
    try {
      const notifyUserId = isOwnerProfessional ? slot.clientId : (await prisma.professional.findUnique({ where: { id: slot.professionalId }, select: { userId: true } }))?.userId;
      if (notifyUserId) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Agendamento Concluído',
            mensagem: `O agendamento de ${new Date(slot.date).toLocaleDateString('pt-PT')} das ${slot.startTime} às ${slot.endTime} foi marcado como concluído.`,
            type: 'AGENDAMENTO',
            status: 'NAO_LIDA',
            userId: notifyUserId,
            referenceType: 'SCHEDULE',
            referenceId: slot.id,
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao criar notificação de conclusão:', notifErr);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao concluir agendamento' });
  }
});

// DELETE /api/schedules/:id — Cancelar/remover horário
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.schedule.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Horário não encontrado' });

    // Trabalho já aceite (ATIVO) ou CONCLUÍDO não pode ser removido por aqui —
    // use /:id/reject (antes de aceitar) ou /:id/complete (para concluir).
    if (slot.status === 'ACTIVE' || slot.status === 'COMPLETED') {
      return res.status(409).json({ error: 'Não é possível remover um agendamento já aceite ou concluído' });
    }

    // Se estiver reservado (pendente), volta a estar disponível, senão apaga-se totalmente
    if (!slot.available) {
      await prisma.schedule.update({ where: { id }, data: { available: true, status: null, clientId: null } });
    } else {
      await prisma.schedule.delete({ where: { id } });
    }
    res.json({ message: 'Agendamento cancelado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
});

module.exports = router;