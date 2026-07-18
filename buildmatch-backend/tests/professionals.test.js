const request = require('supertest');
const { app } = require('../server');
const prisma = require('../src/lib/prisma');

jest.mock('../src/lib/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

describe('BuildMatch API - Gestão de Profissionais e Descoberta', () => {
  const email = `prof.profile.test.${Date.now()}@example.com`;
  const password = 'Senha@2026';
  let token = null;
  let user = null;
  let professionalId = null;

  beforeAll(async () => {
    // 1. Registar profissional
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Carpinteiro',
        email,
        password,
        type: 'PROFESSIONAL',
        specialty: 'Carpintaria',
      });
    expect(regRes.status).toBe(201);
    user = regRes.body.user;
    professionalId = user.professional.id;

    // 2. Verificar email na BD para permitir login/pedidos
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // 3. Login para obter token JWT
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    token = loginRes.body.token;
  });

  afterAll(async () => {
    // Limpar utilizadores criados neste teste
    if (user) {
      await prisma.portfolio.deleteMany({ where: { professionalId } });
      await prisma.schedule.deleteMany({ where: { professionalId } });
      await prisma.project.deleteMany({ where: { professionalId } });
      await prisma.review.deleteMany({ where: { professionalId } });
      await prisma.professional.deleteMany({ where: { userId: user.id } });
      await prisma.address.deleteMany({ where: { userId: user.id } });
      await prisma.notificacao.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  describe('CT-PROF-001 / CT-PROF-006: Edição de perfil profissional e geolocalização', () => {
    it('deve atualizar com sucesso especialidade, experiência, preços, sobre e coordenadas GPS', async () => {
      const updateData = {
        specialty: 'Eletricista Sénior',
        experience: 12,
        location: 'Mindelo, Cabo Verde',
        latitude: 16.8901,
        longitude: -24.9882,
        radius: 20,
        about: 'Eletricista certificado com vasta experiência em instalações comerciais.',
        priceMin: 500,
        priceMax: 1500,
      };

      const res = await request(app)
        .put(`/api/professionals/${professionalId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.specialty).toBe(updateData.specialty);
      expect(res.body.experience).toBe(updateData.experience);
      expect(res.body.latitude).toBe(updateData.latitude);
      expect(res.body.longitude).toBe(updateData.longitude);
      expect(res.body.priceMin).toBe(updateData.priceMin);
    });
  });

  describe('CT-PROF-002: Upload de avatar de perfil (base64)', () => {
    it('deve permitir atualizar a foto de perfil do utilizador logado', async () => {
      const base64Avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          avatar: base64Avatar,
        });

      expect(res.status).toBe(200);
      expect(res.body.avatar).toBe(base64Avatar);
    });
  });

  describe('CT-PROF-003: Alternar disponibilidade', () => {
    it('deve alterar a disponibilidade para falso e remover das pesquisas padrão de disponíveis', async () => {
      // 1. Definir available para false
      await request(app)
        .put(`/api/professionals/${professionalId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ available: false });

      // 2. Procurar na rota pública filtrando por disponíveis
      const listRes = await request(app)
        .get('/api/professionals?available=true');

      const found = listRes.body.data.find(p => p.id === professionalId);
      expect(found).toBeUndefined();

      // 3. Restaurar para true
      await request(app)
        .put(`/api/professionals/${professionalId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ available: true });
    });
  });

  describe('CT-SEARCH-001: Pesquisa por especialidade, localização e texto livre', () => {
    it('deve encontrar o profissional através de filtros específicos e pesquisa full-text', async () => {
      // Por filtros específicos
      const filterRes = await request(app)
        .get('/api/professionals?specialty=Eletricista&location=Mindelo');
      
      expect(filterRes.status).toBe(200);
      const foundByFilter = filterRes.body.data.find(p => p.id === professionalId);
      expect(foundByFilter).toBeDefined();

      // Por pesquisa livre (search)
      const searchRes = await request(app)
        .get('/api/professionals/search?q=comerciais');

      expect(searchRes.status).toBe(200);
      const foundBySearch = searchRes.body.data.find(p => p.id === professionalId);
      expect(foundBySearch).toBeDefined();
    });
  });

  describe('CT-SEARCH-002: Ordenação por rating e experiência', () => {
    it('deve listar profissionais ordenados por experiência', async () => {
      const res = await request(app)
        .get('/api/professionals?sortBy=experience&order=desc');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].experience).toBeGreaterThanOrEqual(res.body.data[res.body.data.length - 1].experience);
    });
  });

  describe('CT-PROF-007 / RF18: Filtro geográfico por raio de atendimento', () => {
    it('deve encontrar o profissional se estiver dentro do raio e ocultar se estiver longe', async () => {
      // Coordenadas do profissional: lat: 16.8901, lng: -24.9882
      
      // Caso 1: Próximo (a menos de 10km de 16.89, -24.99)
      const closeRes = await request(app)
        .get('/api/professionals?lat=16.8900&lng=-24.9900&radius=10');

      expect(closeRes.status).toBe(200);
      const foundClose = closeRes.body.data.find(p => p.id === professionalId);
      expect(foundClose).toBeDefined();

      // Caso 2: Distante (cerca de 200km de distância - ex: Cidade da Praia lat: 14.9, lng: -23.5)
      const farRes = await request(app)
        .get('/api/professionals?lat=14.9000&lng=-23.5000&radius=10');

      expect(farRes.status).toBe(200);
      const foundFar = farRes.body.data.find(p => p.id === professionalId);
      expect(foundFar).toBeUndefined();
    });
  });
});
