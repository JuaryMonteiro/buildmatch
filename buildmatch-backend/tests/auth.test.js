const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');

// Mock o mailer para evitar envio de emails reais e erros de SMTP
jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

jest.setTimeout(30000);

describe('BuildMatch API - Autenticação e Verificação de Email', () => {
  const email = `auth.test.${Date.now()}@example.com`;
  const password = 'Senha@2026';
  const newPassword = 'NovaSenha@2026';
  let token = null;
  let user = null;

  afterAll(async () => {
    // Limpar utilizadores criados neste teste
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (dbUser) {
      await prisma.notificacao.deleteMany({ where: { userId: dbUser.id } });
      await prisma.address.deleteMany({ where: { userId: dbUser.id } });
      await prisma.user.delete({ where: { id: dbUser.id } });
    }
    await prisma.$disconnect();
  });

  describe('CT-AUTH-001: Registo bem-sucedido de cliente', () => {
    it('deve registar o cliente com emailVerified = false e gerar token de verificação', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Pereira Teste',
          email,
          password,
          type: 'CLIENT',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.emailVerified).toBe(false);
      user = res.body.user;
    });
  });

  describe('CT-AUTH-007 / Rota Bloqueada: Login recusado para email não verificado', () => {
    it('deve retornar 403 Forbidden no login se o email não estiver verificado', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Email não verificado');
    });
  });

  describe('CT-VERIF-005: Verificação de email com token inválido', () => {
    it('deve retornar 400 Bad Request ao tentar verificar com token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email?token=token_inexistente_ou_invalido');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Token inválido ou expirado');
    });
  });

  describe('CT-VERIF-002: Reenvio de email de verificação', () => {
    it('deve reenviar com sucesso o email gerando um novo token', async () => {
      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Link de confirmação enviado');
    });
  });

  describe('CT-VERIF-001: Confirmação de email via link', () => {
    it('deve verificar o email do utilizador com o token gerado', async () => {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      expect(dbUser.verificationToken).toBeDefined();

      const res = await request(app)
        .get(`/api/auth/verify-email?token=${dbUser.verificationToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('verificado com sucesso');
      expect(res.body.user.emailVerified).toBe(true);
      token = res.body.token; // Guardar token para testes autenticados
    });
  });

  describe('CT-VERIF-003: Reenvio de email recusado para conta já verificada', () => {
    it('deve retornar 400 Bad Request ao tentar reenviar verificação para email já verificado', async () => {
      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('já está verificado');
    });
  });

  describe('CT-AUTH-002: Login com credenciais válidas', () => {
    it('deve fazer login com sucesso após a verificação do email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });
  });

  describe('CT-AUTH-003: Login com password incorreta', () => {
    it('deve retornar 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'SenhaIncorreta' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Credenciais inválidas');
    });
  });

  describe('CT-AUTH-005: Acesso a rota protegida sem token JWT', () => {
    it('deve rejeitar com 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Token de autenticação necessário');
    });
  });

  describe('CT-AUTH-004: Alteração de password', () => {
    it('deve alterar a password do utilizador autenticado com sucesso', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: password,
          newPassword: newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('sucesso');

      // Testar login com a nova password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: newPassword });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
    });
  });
});
