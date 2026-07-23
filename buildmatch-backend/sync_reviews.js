const prisma = require('./src/lib/prisma');

async function syncReviews() {
  console.log('Sincronizando reviewCount e rating de todos os profissionais...');
  
  const professionals = await prisma.professional.findMany({
    include: { reviews: true }
  });

  for (const prof of professionals) {
    const count = prof.reviews.length;
    const rating = count > 0 
      ? Math.round((prof.reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 
      : 0;

    if (prof.reviewCount !== count || prof.rating !== rating) {
      console.log(`Atualizando Profissional ${prof.id}: ${prof.reviewCount} -> ${count} avaliações, rating ${prof.rating} -> ${rating}`);
      await prisma.professional.update({
        where: { id: prof.id },
        data: {
          reviewCount: count,
          rating: rating
        }
      });
    }
  }

  console.log('Sincronização concluída com sucesso!');
  await prisma.$disconnect();
}

syncReviews().catch(e => {
  console.error(e);
  process.exit(1);
});
