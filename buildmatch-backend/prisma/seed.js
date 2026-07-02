// prisma/seed.js
const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

async function main() {
  console.log('A popular a base de dados com dados de exemplo...');

  // Criar clientes
  const client1 = await prisma.user.upsert({
    where: { email: 'hugo@exemplo.com' },
    update: {},
    create: {
      name: 'Hugo Monteiro',
      email: 'hugo@exemplo.com',
      password: await bcrypt.hash('123456', 12),
      type: 'CLIENT',
      phone: '+238 991 0001',
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'ana@exemplo.com' },
    update: {},
    create: {
      name: 'Ana Silva',
      email: 'ana@exemplo.com',
      password: await bcrypt.hash('123456', 12),
      type: 'CLIENT',
      phone: '+238 991 0002',
    },
  });

  // Criar profissionais
  const prof1User = await prisma.user.upsert({
    where: { email: 'joao.pedreiro@exemplo.com' },
    update: {},
    create: {
      name: 'João Pereira',
      email: 'joao.pedreiro@exemplo.com',
      password: await bcrypt.hash('123456', 12),
      type: 'PROFESSIONAL',
      phone: '+238 991 0003',
      professional: {
        create: {
          specialty: 'Pedreiro',
          experience: 12,
          location: 'Assomada, Santiago',
          latitude: 15.1,
          longitude: -23.6,
          radius: 20,
          rating: 4.8,
          reviewCount: 124,
          verified: true,
          available: true,
          priceMin: 500,
          priceMax: 800,
          about: 'Especialista em construção civil com mais de 12 anos de experiência em obras residenciais e comerciais.',
          tags: 'Obra residencial,Restauro,Fundações',
        },
      },
    },
    include: { professional: true },
  });

  const prof2User = await prisma.user.upsert({
    where: { email: 'maria.eletricista@exemplo.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'maria.eletricista@exemplo.com',
      password: await bcrypt.hash('123456', 12),
      type: 'PROFESSIONAL',
      phone: '+238 991 0004',
      professional: {
        create: {
          specialty: 'Eletricista',
          experience: 8,
          location: 'Praia, Santiago',
          latitude: 14.93,
          longitude: -23.51,
          radius: 15,
          rating: 4.9,
          reviewCount: 89,
          verified: true,
          available: true,
          priceMin: 600,
          priceMax: 900,
          about: 'Eletricista certificada com especialização em instalações industriais e domésticas.',
          tags: 'Instalações,Painel solar,Industrial',
        },
      },
    },
    include: { professional: true },
  });

  const prof3User = await prisma.user.upsert({
    where: { email: 'carlos.canalizador@exemplo.com' },
    update: {},
    create: {
      name: 'Carlos Fonseca',
      email: 'carlos.canalizador@exemplo.com',
      password: await bcrypt.hash('123456', 12),
      type: 'PROFESSIONAL',
      phone: '+238 991 0005',
      professional: {
        create: {
          specialty: 'Canalizador',
          experience: 6,
          location: 'São Domingos, Santiago',
          latitude: 15.0,
          longitude: -23.55,
          radius: 25,
          rating: 4.7,
          reviewCount: 67,
          verified: false,
          available: false,
          priceMin: 400,
          priceMax: 700,
          about: 'Canalizador com experiência em sistemas de abastecimento de água e esgotos.',
          tags: 'Canalização,Rega,Saneamento',
        },
      },
    },
    include: { professional: true },
  });

  // Criar projecto de exemplo
  if (prof1User.professional) {
    const project = await prisma.project.create({
      data: {
        title: 'Construção de muro',
        description: 'Muro de vedação com 20 metros de comprimento',
        status: 'COMPLETED',
        clientId: client1.id,
        professionalId: prof1User.professional.id,
        amount: 45000,
        address: 'Assomada, Santiago',
      },
    });

    // Criar avaliação
    await prisma.review.create({
      data: {
        rating: 5,
        comment: 'Excelente trabalho! Muito profissional e cumpriu os prazos.',
        authorId: client1.id,
        professionalId: prof1User.professional.id,
        projectId: project.id,
      },
    });

    // Criar 10 publicações de portfólio
    const portfolioItems = [
      {
        title: 'Moradia T3 em Assomada',
        description: 'Construção completa de moradia T3 com garagem',
        category: 'Residencial',
        featured: true,
      },
      {
        title: 'Muro de Vedação em Bloco',
        description: 'Muro de vedação de 30 metros em bloco de cimento com acabamento rebocado',
        category: 'Residencial',
        featured: false,
      },
      {
        title: 'Fundações de Edifício Comercial',
        description: 'Execução de fundações e estrutura para edifício comercial de 3 pisos',
        category: 'Comercial',
        featured: true,
      },
      {
        title: 'Ampliação de Cozinha',
        description: 'Ampliação e remodelação de cozinha com nova estrutura em bloco',
        category: 'Residencial',
        featured: false,
      },
      {
        title: 'Restauro de Fachada Antiga',
        description: 'Restauro completo de fachada em casa histórica no centro de Assomada',
        category: 'Restauro',
        featured: true,
      },
      {
        title: 'Construção de Garagem',
        description: 'Construção de garagem para dois carros com portão automático',
        category: 'Residencial',
        featured: false,
      },
      {
        title: 'Reforço Estrutural de Terraço',
        description: 'Reforço de laje e impermeabilização de terraço',
        category: 'Residencial',
        featured: false,
      },
      {
        title: 'Construção de Escadaria Exterior',
        description: 'Escadaria em betão armado com acabamento em pedra',
        category: 'Residencial',
        featured: false,
      },
      {
        title: 'Obra de Ampliação Comercial',
        description: 'Ampliação de armazém comercial com nova estrutura em bloco e cobertura',
        category: 'Comercial',
        featured: true,
      },
      {
        title: 'Construção de Piscina',
        description: 'Construção de piscina residencial com estrutura em betão armado',
        category: 'Residencial',
        featured: false,
      },
    ];

    for (const item of portfolioItems) {
      await prisma.portfolio.create({
        data: {
          professionalId: prof1User.professional.id,
          title: item.title,
          description: item.description,
          imageUrls: '',
          category: item.category,
          featured: item.featured,
        },
      });
    }
  }

  console.log('✅ Base de dados populada com sucesso!');
  console.log('');
  console.log('Contas de teste:');
  console.log('  Cliente:      hugo@exemplo.com       / 123456');
  console.log('  Cliente:      ana@exemplo.com        / 123456');
  console.log('  Profissional: joao.pedreiro@exemplo.com / 123456');
  console.log('  Profissional: maria.eletricista@exemplo.com / 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });