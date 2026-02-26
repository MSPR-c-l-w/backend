import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL manquant (vérifie ton fichier .env)');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
});

async function main() {
  const usersData = Array.from({ length: 1000 }).map((_, i) => ({
    email: `fakeuser${i + 1}@test.fr`,
    password_hash: 'hash', // ou un vrai hash si besoin
    first_name: `Fake${i + 1}`,
    last_name: 'User',
  }));

  await prisma.user.deleteMany({}); // optionnel, si tu veux repartir à zéro

  await prisma.user.createMany({
    data: usersData,
  });

  console.log(`Seeded ${usersData.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });