const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');

jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.setTimeout(30000);

describe('BuildMatch API - Gestão de Projetos e Endereços', () => {
  const clientEmail = `project.client.${Date.now()}@example.com`;
  const profEmail = `project.prof.${Date.now()}@example.com`;
  const password = 'Senha@2026';

  let clientToken = null;
  let clientUser = null;
  let profToken = null;
  let profUser = null;
  let portfolioItemId = null;
  let projectId = null;
  let addressId = null;

  beforeAll(async () => {
    // 1. Registar cliente e profissional
    const cReg = await request(app).post('/api/auth/register').send({ name: 'Maria Cliente', email: clientEmail, password, type: 'CLIENT' });
    const pReg = await request(app).post('/api/auth/register').send({ name: 'Vasco Prof', email: profEmail, password, type: 'PROFESSIONAL', specialty: 'Pintura' });

    clientUser = cReg.body.user;
    profUser = pReg.body.user;

    // 2. Verificar emails
    await prisma.user.updateMany({
      where: { email: { in: [clientEmail, profEmail] } },
      data: { emailVerified: true },
    });

    // 3. Logins
    const cLogin = await request(app).post('/api/auth/login').send({ email: clientEmail, password });
    const pLogin = await request(app).post('/api/auth/login').send({ email: profEmail, password });

    clientToken = cLogin.body.token;
    profToken = pLogin.body.token;

    // 4. Criar item no portfólio para testar orçamento pré-preenchido
    const portfolioItem = await prisma.portfolio.create({
      data: {
        professionalId: profUser.professional.id,
        title: 'Serviço de Teste Orçamento',
        description: 'Descrição de teste',
        price: 18500,
        estimatedDuration: 4,
        imageUrls: '[]',
      },
    });
    portfolioItemId = portfolioItem.id;
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

      await prisma.project.deleteMany({
        where: {
          OR: [
            { clientId: { in: userIds } },
            { professionalId: { in: profIds } },
          ],
        },
      });

      await prisma.professional.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  describe('CT-PROJ-001: Criação de projeto associado a profissional', () => {
    it('deve criar um projeto com status PENDING', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Obra de Pintura Residencial',
          description: 'Pintar sala de estar e cozinha',
          professionalId: profUser.professional.id,
          amount: 12000,
          startDate: new Date().toISOString(),
          address: 'Mindelo, São Vicente',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.title).toContain('Obra de Pintura');
      projectId = res.body.id;
    });
  });

  describe('CT-PROJ-002: Pré-preenchimento a partir de item de portfólio', () => {
    it('deve preencher budgetAmount e budgetDeadline automaticamente baseados no portfólio', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Obra Pré-preenchida',
          professionalId: profUser.professional.id,
          portfolioItemId: portfolioItemId,
          startDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.budgetAmount).toBe(18500); // Preço do portfólio
      expect(res.body.budgetDeadline).toBeDefined(); // Data calculada
    });
  });

  describe('CT-PROJ-003: Transição de estado PENDING -> ACTIVE', () => {
    it('deve alterar o status para ACTIVE e notificar a outra parte', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ACTIVE');

      // Verificar que uma notificação foi gerada para o cliente
      const notifs = await prisma.notificacao.findMany({ where: { userId: clientUser.id } });
      const projNotif = notifs.find(n => n.type === 'PROJETO');
      expect(projNotif).toBeDefined();
    });
  });

  describe('CT-PROJ-004: Conclusão de projeto cria item de portfólio', () => {
    it('deve alterar o status para COMPLETED e gerar automaticamente um item no portfólio', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');

      // Verificar que foi criado um item no portfólio do Vasco Prof com o título do projeto
      const portfolios = await prisma.portfolio.findMany({ where: { professionalId: profUser.professional.id } });
      const generatedItem = portfolios.find(p => p.title === 'Obra de Pintura Residencial');
      expect(generatedItem).toBeDefined();
    });
  });

  describe('CT-PROJ-005: Cancelamento de projeto (soft-delete)', () => {
    it('deve alterar o status para CANCELLED', async () => {
      // Criar projeto rápido para cancelar
      const tempProj = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Projeto Temporário',
          professionalId: profUser.professional.id,
        });

      const res = await request(app)
        .delete(`/api/projects/${tempProj.body.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);

      // Inspecionar na base de dados
      const dbProj = await prisma.project.findUnique({ where: { id: tempProj.body.id } });
      expect(dbProj.status).toBe('CANCELLED');
    });
  });

  describe('CT-ADDR-001: Guardar múltiplos endereços e definir principal', () => {
    it('deve gerir endereços e garantir que apenas um está marcado como principal (default)', async () => {
      // 1. Criar primeiro endereço (default: false)
      const addr1Res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ label: 'Casa', address: 'Rua Principal, 10' });

      expect(addr1Res.status).toBe(201);
      expect(addr1Res.body.default).toBe(false);

      // 2. Criar segundo endereço (default: true)
      const addr2Res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ label: 'Trabalho', address: 'Avenida Comercial, 120', default: true });

      expect(addr2Res.status).toBe(201);
      expect(addr2Res.body.default).toBe(true);
      addressId = addr2Res.body.id;

      // 3. Verificar que o primeiro endereço foi automaticamente definido para default: false
      const addr1Db = await prisma.address.findUnique({ where: { id: addr1Res.body.id } });
      expect(addr1Db.default).toBe(false);

      // 4. Actualizar primeiro endereço para ser o principal
      const updateRes = await request(app)
        .put(`/api/addresses/${addr1Res.body.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ label: 'Casa Renovada', address: 'Rua Principal, 10', default: true });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.default).toBe(true);

      // 5. Verificar que o segundo endereço foi atualizado para default: false
      const addr2Db = await prisma.address.findUnique({ where: { id: addressId } });
      expect(addr2Db.default).toBe(false);
    });
  });
});
