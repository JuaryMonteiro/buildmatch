const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');

jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.setTimeout(30000);

describe('BuildMatch API - Gestão de Avaliações (Reviews)', () => {
  const client1Email = `review.client1.${Date.now()}@example.com`;
  const client2Email = `review.client2.${Date.now()}@example.com`;
  const profEmail = `review.prof.${Date.now()}@example.com`;
  const password = 'Senha@2026';

  let client1Token = null;
  let client1User = null;
  let client2Token = null;
  let client2User = null;
  let profToken = null;
  let profUser = null;
  let projectId = null;
  let reviewId = null;

  beforeAll(async () => {
    // 1. Registar utilizadores
    const c1 = await request(app).post('/api/auth/register').send({ name: 'Cliente Principal', email: client1Email, password, type: 'CLIENT' });
    const c2 = await request(app).post('/api/auth/register').send({ name: 'Cliente Invasor', email: client2Email, password, type: 'CLIENT' });
    const p = await request(app).post('/api/auth/register').send({ name: 'Pintor Avaliado', email: profEmail, password, type: 'PROFESSIONAL', specialty: 'Pintura' });

    client1User = c1.body.user;
    client2User = c2.body.user;
    profUser = p.body.user;

    // 2. Verificar emails
    await prisma.user.updateMany({
      where: { email: { in: [client1Email, client2Email, profEmail] } },
      data: { emailVerified: true },
    });

    // 3. Logins
    const l1 = await request(app).post('/api/auth/login').send({ email: client1Email, password });
    const l2 = await request(app).post('/api/auth/login').send({ email: client2Email, password });
    const lp = await request(app).post('/api/auth/login').send({ email: profEmail, password });

    client1Token = l1.body.token;
    client2Token = l2.body.token;
    profToken = lp.body.token;

    // 4. Criar projeto concluído para permitir avaliações
    const project = await prisma.project.create({
      data: {
        title: 'Projecto Concluído para Avaliar',
        clientId: client1User.id,
        professionalId: profUser.professional.id,
        status: 'COMPLETED',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    const testEmails = [client1Email, client2Email, profEmail];
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

  describe('CT-REV-002: Tentativa de avaliação por cliente não contratante', () => {
    it('deve retornar 403 Forbidden ao tentar avaliar um projeto que não pertence ao utilizador', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          rating: 4,
          comment: 'Tentativa de invasão',
          professionalId: profUser.professional.id,
          projectId: projectId,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Sem permissão');
    });
  });

  describe('CT-REV-001: Avaliação pós-projeto por cliente contratante', () => {
    it('deve registar com sucesso a avaliação e recalcular o rating do profissional', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          rating: 5,
          comment: 'Serviço cinco estrelas! Excelente!',
          professionalId: profUser.professional.id,
          projectId: projectId,
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
      reviewId = res.body.id;

      // Inspecionar se o profissional teve o rating recalculado
      const profDb = await prisma.professional.findUnique({ where: { id: profUser.professional.id } });
      expect(profDb.rating).toBe(5);
      expect(profDb.reviewCount).toBe(1);
    });
  });

  describe('CT-REV-003: Avaliação única por projeto', () => {
    it('deve retornar 400 Bad Request ao tentar enviar uma segunda avaliação para o mesmo projeto', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          rating: 3,
          comment: 'Segunda avaliação',
          professionalId: profUser.professional.id,
          projectId: projectId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Já avaliou este projecto');
    });
  });

  describe('CT-REV-004: Resposta do profissional à avaliação', () => {
    it('deve permitir que o profissional avaliado responda ao comentário do cliente', async () => {
      const res = await request(app)
        .put(`/api/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          reply: 'Muito obrigado pela preferência, João!',
        });

      expect(res.status).toBe(200);
      expect(res.body.reply).toContain('Muito obrigado');
    });
  });
});
