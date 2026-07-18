const prisma = require('./src/lib/prisma');

async function main() {
  const result = await prisma.user.updateMany({
    data: { emailVerified: true },
  });
  console.log(`Atualizados ${result.count} utilizadores.`);
}

main().finally(() => prisma.$disconnect());