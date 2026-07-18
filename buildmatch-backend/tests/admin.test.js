const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');
const bcrypt = require('bcrypt');

jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.setTimeout(30000);

describe('BuildMatch API - Gestão Administrativa', () => {
  const adminEmail = `admin.test.${Date.now()}@example.com`;
  const clientEmail = `client.under.admin.${Date.now()}@example.com`;
  const password = 'Senha@2026';

  let adminToken = null;
  let adminUser = null;
  let clientToken = null;
  let clientUser = null;
  let alertId = null;
  let portfolioItemId = null;
  let projectId = null;

  beforeAll(async () => {
    // 1. Criar um administrador direto na BD para simular conta admin ativa
    const hashedAdminPassword = await bcrypt.hash(password, 12);
    adminUser = await prisma.user.create({
      data: {
        name: 'Administrador BuildMatch',
        email: adminEmail,
        password: hashedAdminPassword,
        type: 'ADMIN',
        emailVerified: true,
      },
    });

    // 2. Registar e verificar um utilizador regular para testes de moderação e acesso negado
    const cReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Cliente Sob Admin',
        email: clientEmail,
        password,
        type: 'CLIENT',
      });
    clientUser = cReg.body.user;

    await prisma.user.update({
      where: { id: clientUser.id },
      data: { emailVerified: true },
    });

    // 3. Logins
    const aLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password });
    const cLogin = await request(app).post('/api/auth/login').send({ email: clientEmail, password });

    adminToken = aLogin.body.token;
    clientToken = cLogin.body.token;

    // 4. Criar entidades de teste adicionais (portfolio e projeto) para a moderação administrativa
    // Precisamos de um profissional para anexar portfólio
    const tempProfUser = await prisma.user.create({
      data: {
        name: 'Profissional Admin Test',
        email: `prof.admin.${Date.now()}@example.com`,
        password: hashedAdminPassword,
        type: 'PROFESSIONAL',
        emailVerified: true,
        professional: {
          create: { specialty: 'Serralharia', experience: 5, location: 'Sal', radius: 10 },
        },
      },
      include: { professional: true },
    });

    const portfolio = await prisma.portfolio.create({
      data: {
        professionalId: tempProfUser.professional.id,
        title: 'Portfólio para Moderação',
        description: 'Testar aprovação administrativa',
        imageUrls: '[]',
      },
    });
    portfolioItemId = portfolio.id;

    const project = await prisma.project.create({
      data: {
        title: 'Projeto para Deleção Admin',
        clientId: clientUser.id,
        professionalId: tempProfUser.professional.id,
        status: 'PENDING',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Limpar utilizadores criados para os testes de admin
    const testEmails = [adminEmail, clientEmail];
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.notificacao.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    // Limpar profissional temporário
    const tempProf = await prisma.user.findFirst({ where: { email: { startsWith: 'prof.admin.' } } });
    if (tempProf) {
      await prisma.project.deleteMany({ where: { id: projectId } });
      await prisma.portfolio.deleteMany({ where: { id: portfolioItemId } });
      await prisma.professional.deleteMany({ where: { userId: tempProf.id } });
      await prisma.user.delete({ where: { id: tempProf.id } });
    }

    // Limpar Alertas e Logs
    if (alertId) {
      await prisma.alert.deleteMany({ where: { id: alertId } });
    }
    await prisma.auditLog.deleteMany({
      where: {
        userId: adminUser.id,
      },
    });

    await prisma.$disconnect();
  });

  describe('CT-ADMIN-005: Acesso negado para não-administradores', () => {
    it('deve retornar 403 Forbidden ao tentar aceder a rotas admin com JWT de cliente', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acesso negado');
    });
  });

  describe('CT-ADMIN-001: Painel com estatísticas globais', () => {
    it('deve retornar as estatísticas do sistema com sucesso', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalProjects');
      expect(res.body).toHaveProperty('totalRevenue');
    });
  });

  describe('CT-ADMIN-002: Gestão de utilizadores (pesquisa, suspensão e exclusão)', () => {
    it('deve permitir listar, suspender e reativar utilizadores', async () => {
      // 1. Listar/Pesquisar
      const listRes = await request(app)
        .get(`/api/admin/users?search=${clientUser.name}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      // 2. Suspender utilizador
      const suspendRes = await request(app)
        .put(`/api/admin/users/${clientUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.active).toBe(false);

      // 3. Reativar utilizador
      const reactivateRes = await request(app)
        .put(`/api/admin/users/${clientUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: true });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.active).toBe(true);
    });
  });

  describe('CT-ADMIN-003: Gestão administrativa de projetos', () => {
    it('deve listar e permitir apagar projetos administrativamente', async () => {
      // Listar
      const listRes = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      // Eliminar
      const delRes = await request(app)
        .delete(`/api/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  describe('CT-ADMIN-004: Painéis de portfólios, alertas e auditoria', () => {
    it('deve aprovar/rejeitar portfólio, criar/resolver alertas e obter logs de auditoria', async () => {
      // 1. Aprovar portfólio
      const appPortRes = await request(app)
        .post(`/api/admin/portfolios/${portfolioItemId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(appPortRes.status).toBe(200);
      expect(appPortRes.body.featured).toBe(true);

      // 2. Rejeitar portfólio
      const rejPortRes = await request(app)
        .post(`/api/admin/portfolios/${portfolioItemId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(rejPortRes.status).toBe(200);
      expect(rejPortRes.body.featured).toBe(false);

      // 3. Criar Alerta global
      const alertRes = await request(app)
        .post('/api/admin/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Manutenção do Servidor',
          message: 'O servidor backend entrará em manutenção às 23:00.',
          level: 'warning',
        });

      expect(alertRes.status).toBe(201);
      expect(alertRes.body.resolved).toBe(false);
      alertId = alertRes.body.id;

      // 4. Resolver Alerta
      const resAlertRes = await request(app)
        .put(`/api/admin/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resAlertRes.status).toBe(200);
      expect(resAlertRes.body.resolved).toBe(true);

      // 5. Inspecionar AuditLogs
      const auditRes = await request(app)
        .get('/api/admin/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.length).toBeGreaterThan(0);

      // Deve listar as acções executadas pelo administrador neste ficheiro de teste
      const hasAlertAction = auditRes.body.data.some(log => log.action === 'ALERT_CREATED' && log.userId === adminUser.id);
      expect(hasAlertAction).toBe(true);
    });
  });
});
