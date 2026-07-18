const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');

// Mock o mailer para evitar envio de emails reais e erros de SMTP
jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

describe('BuildMatch API - Testes de Cenários de Integração', () => {
  const clientEmail = `cliente.teste.${Date.now()}@example.com`;
  const profEmail = `prof.teste.${Date.now()}@example.com`;
  const testPassword = 'password123';

  let clientToken = null;
  let clientUser = null;
  let profToken = null;
  let profUser = null;
  let projectId = null;

  // Cleanup após todos os testes
  afterAll(async () => {
    const testEmails = [clientEmail, profEmail];
    
    // Procurar IDs dos utilizadores criados para teste
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      // 1. Remover notificações associadas a estes utilizadores
      await prisma.notificacao.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Procurar perfis de profissionais
      const professionals = await prisma.professional.findMany({
        where: { userId: { in: userIds } },
      });
      const profIds = professionals.map((p) => p.id);

      if (profIds.length > 0) {
        // 2. Remover avaliações (reviews) dos profissionais
        await prisma.review.deleteMany({
          where: { professionalId: { in: profIds } },
        });

        // 3. Remover agendas (schedules)
        await prisma.schedule.deleteMany({
          where: { professionalId: { in: profIds } },
        });

        // 4. Remover portfolios
        await prisma.portfolio.deleteMany({
          where: { professionalId: { in: profIds } },
        });
      }

      // 5. Remover projetos onde o cliente é um dos utilizadores de teste ou o profissional é um dos de teste
      await prisma.project.deleteMany({
        where: {
          OR: [
            { clientId: { in: userIds } },
            { professionalId: { in: profIds } },
          ],
        },
      });

      // 6. Remover registo de Professional
      await prisma.professional.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 7. Remover endereços
      await prisma.address.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 8. Remover Users
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    // Desconectar o cliente Prisma para fechar todas as ligações da base de dados e permitir que o Jest termine limpo
    await prisma.$disconnect();
  });

  describe('Cenário 1: Fluxo de Autenticação e Verificação de Email', () => {
    it('deve registar com sucesso um cliente e um profissional', async () => {
      // 1. Registar cliente
      const clientRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Cliente Teste Scenario',
          email: clientEmail,
          password: testPassword,
          type: 'CLIENT',
        });
      
      expect(clientRes.status).toBe(201);
      expect(clientRes.body).toHaveProperty('token');
      expect(clientRes.body.user.email).toBe(clientEmail);
      expect(clientRes.body.user.emailVerified).toBe(false);
      clientUser = clientRes.body.user;

      // 2. Registar profissional
      const profRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profissional Teste Scenario',
          email: profEmail,
          password: testPassword,
          type: 'PROFESSIONAL',
          specialty: 'Pedreiro',
        });

      expect(profRes.status).toBe(201);
      expect(profRes.body).toHaveProperty('token');
      expect(profRes.body.user.email).toBe(profEmail);
      expect(profRes.body.user.emailVerified).toBe(false);
      expect(profRes.body.user.professional).toBeDefined();
      expect(profRes.body.user.professional.specialty).toBe('Pedreiro');
      profUser = profRes.body.user;
    });

    it('deve impedir o login se o email não estiver verificado', async () => {
      // Tentar login com cliente
      const clientLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: clientEmail,
          password: testPassword,
        });

      expect(clientLoginRes.status).toBe(403);
      expect(clientLoginRes.body.error).toContain('Email não verificado');
      expect(clientLoginRes.body.emailVerified).toBe(false);

      // Tentar login com profissional
      const profLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: profEmail,
          password: testPassword,
        });

      expect(profLoginRes.status).toBe(403);
      expect(profLoginRes.body.error).toContain('Email não verificado');
      expect(profLoginRes.body.emailVerified).toBe(false);
    });

    it('deve permitir verificar os emails com o token correto do base de dados', async () => {
      // 1. Obter token de verificação do cliente da BD
      const clientDb = await prisma.user.findUnique({
        where: { email: clientEmail },
      });
      expect(clientDb.verificationToken).toBeDefined();

      // Verificar email do cliente
      const verifyClientRes = await request(app)
        .get(`/api/auth/verify-email?token=${clientDb.verificationToken}`);
      
      expect(verifyClientRes.status).toBe(200);
      expect(verifyClientRes.body.message).toContain('Email verificado com sucesso');
      expect(verifyClientRes.body).toHaveProperty('token');
      expect(verifyClientRes.body.user.emailVerified).toBe(true);
      clientToken = verifyClientRes.body.token;

      // 2. Obter token de verificação do profissional da BD
      const profDb = await prisma.user.findUnique({
        where: { email: profEmail },
      });
      expect(profDb.verificationToken).toBeDefined();

      // Verificar email do profissional
      const verifyProfRes = await request(app)
        .get(`/api/auth/verify-email?token=${profDb.verificationToken}`);

      expect(verifyProfRes.status).toBe(200);
      expect(verifyProfRes.body.message).toContain('Email verificado com sucesso');
      expect(verifyProfRes.body).toHaveProperty('token');
      expect(verifyProfRes.body.user.emailVerified).toBe(true);
      profToken = verifyProfRes.body.token;
    });

    it('deve permitir login bem sucedido depois de verificado', async () => {
      // Login cliente
      const clientLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: clientEmail,
          password: testPassword,
        });

      expect(clientLoginRes.status).toBe(200);
      expect(clientLoginRes.body).toHaveProperty('token');
      clientToken = clientLoginRes.body.token;

      // Login profissional
      const profLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: profEmail,
          password: testPassword,
        });

      expect(profLoginRes.status).toBe(200);
      expect(profLoginRes.body).toHaveProperty('token');
      profToken = profLoginRes.body.token;
    });
  });

  describe('Cenário 2: Ciclo de Vida do Projeto e Avaliação', () => {
    it('deve permitir que o cliente crie um projeto pendente direcionado ao profissional', async () => {
      const projectData = {
        title: 'Projecto de Reforma de Banheiro Scenario',
        description: 'Troca de loiça sanitária e torneiras',
        professionalId: profUser.professional.id,
        amount: 25000,
        startDate: new Date().toISOString(),
        address: 'Praia, Cabo Verde',
      };

      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(projectData);

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe(projectData.title);
      expect(createRes.body.status).toBe('PENDING');
      expect(createRes.body.clientId).toBe(clientUser.id);
      expect(createRes.body.professionalId).toBe(profUser.professional.id);
      
      projectId = createRes.body.id;
    });

    it('deve listar o projeto pendente na lista de projetos do profissional', async () => {
      const listRes = await request(app)
        .get('/api/projects?status=PENDING')
        .set('Authorization', `Bearer ${profToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveProperty('data');
      
      const projectFound = listRes.body.data.find((p) => p.id === projectId);
      expect(projectFound).toBeDefined();
      expect(projectFound.title).toBe('Projecto de Reforma de Banheiro Scenario');
    });

    it('deve permitir que o profissional ative (aceite) o projeto', async () => {
      const updateRes = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'ACTIVE' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe('ACTIVE');
    });

    it('deve permitir que o profissional conclua (complete) o projeto', async () => {
      const updateRes = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'COMPLETED' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe('COMPLETED');
    });

    it('deve permitir que o cliente faça uma avaliação (review) de 5 estrelas do projeto concluído', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Excelente profissional, cumpriu com tudo perfeitamente!',
        professionalId: profUser.professional.id,
        projectId: projectId,
      };

      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reviewData);

      expect(reviewRes.status).toBe(201);
      expect(reviewRes.body.rating).toBe(5);
      expect(reviewRes.body.comment).toBe(reviewData.comment);
      expect(reviewRes.body.authorId).toBe(clientUser.id);
    });

    it('deve atualizar o rating médio e a contagem de avaliações do profissional', async () => {
      const getProfRes = await request(app)
        .get(`/api/professionals/${profUser.professional.id}`);

      expect(getProfRes.status).toBe(200);
      // O rating médio deve ser 5 (pois é a única avaliação) e contagem deve ser 1
      expect(getProfRes.body.rating).toBe(5);
      expect(getProfRes.body.reviewCount).toBe(1);
    });
  });
});
