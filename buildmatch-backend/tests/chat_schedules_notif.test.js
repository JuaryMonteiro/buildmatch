const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');

jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.setTimeout(30000);

describe('BuildMatch API - Chat, Agendamentos e Notificações', () => {
  const clientEmail = `chat.client.${Date.now()}@example.com`;
  const profEmail = `chat.prof.${Date.now()}@example.com`;
  const password = 'Senha@2026';

  let clientToken = null;
  let clientUser = null;
  let profToken = null;
  let profUser = null;
  let projectId = null;
  let scheduleId = null;
  let notificationId = null;

  beforeAll(async () => {
    // 1. Registar utilizadores
    const c = await request(app).post('/api/auth/register').send({ name: 'Cláudio Chat', email: clientEmail, password, type: 'CLIENT' });
    const p = await request(app).post('/api/auth/register').send({ name: 'Paulo Prof', email: profEmail, password, type: 'PROFESSIONAL', specialty: 'Canalização' });

    clientUser = c.body.user;
    profUser = p.body.user;

    // 2. Confirmar emails na BD
    await prisma.user.updateMany({
      where: { email: { in: [clientEmail, profEmail] } },
      data: { emailVerified: true },
    });

    // 3. Login
    const cl = await request(app).post('/api/auth/login').send({ email: clientEmail, password });
    const pl = await request(app).post('/api/auth/login').send({ email: profEmail, password });

    clientToken = cl.body.token;
    profToken = pl.body.token;

    // 4. Criar projeto de teste para chat
    const project = await prisma.project.create({
      data: {
        title: 'Projecto Canalização Chat',
        clientId: clientUser.id,
        professionalId: profUser.professional.id,
        status: 'ACTIVE',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    const testEmails = [clientEmail, profEmail];
    const users = await prisma.user.findMany({ where: { email: { in: testEmails } } });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.notificacao.deleteMany({ where: { userId: { in: userIds } } });
      const professionals = await prisma.professional.findMany({ where: { userId: { in: userIds } } });
      const profIds = professionals.map((p) => p.id);

      if (profIds.length > 0) {
        await prisma.review.deleteMany({ where: { professionalId: { in: profIds } } });
        await prisma.schedule.deleteMany({ where: { professionalId: { in: profIds } } });
        await prisma.portfolio.deleteMany({ where: { professionalId: { in: profIds } } });
      }

      await prisma.message.deleteMany({ where: { projectId } });
      await prisma.project.deleteMany({
        where: {
          OR: [
            { clientId: { in: userIds } },
            { professionalId: { in: profIds } },
          ],
        },
      });

      await prisma.professional.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  describe('CT-CHAT-001 / CT-CHAT-003: Troca de mensagens de chat e leitura automática', () => {
    it('deve permitir enviar mensagem, marcá-la como lida ao listar o histórico', async () => {
      // 1. Enviar mensagem
      const sendRes = await request(app)
        .post(`/api/messages/project/${projectId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ content: 'Olá, quando pode iniciar a canalização?' });

      expect(sendRes.status).toBe(201);
      expect(sendRes.body.content).toContain('quando pode iniciar');
      expect(sendRes.body.read).toBe(false);

      // 2. Listar mensagens do projeto (lógica do backend marca como lida pós-query)
      await request(app)
        .get(`/api/messages/project/${projectId}`)
        .set('Authorization', `Bearer ${profToken}`);

      // Obter novamente para receber o estado atualizado da base de dados
      const listRes = await request(app)
        .get(`/api/messages/project/${projectId}`)
        .set('Authorization', `Bearer ${profToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);
      
      const msg = listRes.body.data.find(m => m.id === sendRes.body.id);
      expect(msg).toBeDefined();
      expect(msg.read).toBe(true); // Lida automaticamente
    });
  });

  describe('CT-CHAT-004: Envio de ficheiro multimédia no chat', () => {
    it('deve enviar com sucesso uma mensagem contendo mediaUrl e mediaType', async () => {
      const res = await request(app)
        .post(`/api/messages/project/${projectId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          content: 'Foto dos tubos de água',
          mediaUrl: 'http://example.com/tubo.jpg',
          mediaType: 'image',
        });

      expect(res.status).toBe(201);
      expect(res.body.mediaUrl).toBe('http://example.com/tubo.jpg');
      expect(res.body.mediaType).toBe('image');
    });
  });

  describe('CT-SCHED-001: Definição de slots de disponibilidade', () => {
    it('deve permitir que o profissional crie um slot disponível', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          date: tomorrow.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '12:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.available).toBe(true);
      scheduleId = res.body.id;
    });
  });

  describe('CT-SCHED-002: Reserva de slot disponível pelo cliente', () => {
    it('deve reservar o slot tornando available=false e gerar notificação de agendamento', async () => {
      const res = await request(app)
        .put(`/api/schedules/book/${scheduleId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);

      // Inspecionar se gerou notificação para o Paulo Prof
      const notifs = await prisma.notificacao.findMany({ where: { userId: profUser.id } });
      const schedNotif = notifs.find(n => n.type === 'AGENDAMENTO');
      expect(schedNotif).toBeDefined();
      notificationId = schedNotif.id;
    });
  });

  describe('CT-SCHED-003: Cancelamento de agendamento', () => {
    it('deve cancelar o agendamento reservado voltando o slot a ficar disponível', async () => {
      const res = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cancelado');

      const slot = await prisma.schedule.findUnique({ where: { id: scheduleId } });
      expect(slot.available).toBe(true);
    });
  });

  describe('CT-NOTIF-002: Contagem de não lidas', () => {
    it('deve retornar a quantidade correta de notificações não lidas', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${profToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CT-NOTIF-003: Marcar notificação como lida e apagar', () => {
    it('deve marcar como lida, marcar todas como lidas e permitir apagar a notificação', async () => {
      // 1. Marcar uma como lida
      const readRes = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${profToken}`);
      
      expect(readRes.status).toBe(200);
      expect(readRes.body.status).toBe('LIDA');

      // 2. Marcar todas como lidas
      const readAllRes = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${profToken}`);
      expect(readAllRes.status).toBe(200);

      // 3. Eliminar notificação
      const delRes = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${profToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.message).toContain('apagada com sucesso');
    });
  });
});
