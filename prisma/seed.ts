import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { faker } from '@faker-js/faker/locale/fr';
import { hashPassword } from '../src/utils/security/password';
import { DEFAULT_ROLE_NAMES } from '../src/roles/interfaces/role.interface';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL manquant (vérifie ton fichier .env)');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
});

/** Mot de passe commun pour tous les comptes seedés (connexion possible) */
const SEED_PASSWORD = 'SeedPassword123!';

/** Comptes spéciaux à créer (5 coach + 5 admin) avec identifiants à afficher */
const SPECIAL_COACH_COUNT = 5;
const SPECIAL_ADMIN_COUNT = 5;
const TOTAL_SPECIAL = SPECIAL_COACH_COUNT + SPECIAL_ADMIN_COUNT;
const TOTAL_USERS = 1000;

/** Nombre d'utilisateurs Faker à rattacher à une organisation (répartis entre les salles) */
const USERS_WITH_ORGANIZATION = 200;

/**
 * Plans payants — offres d'abonnement type salle de sport.
 */
const PAID_PLANS: Array<{ name: string; price: number; features: string[] }> = [
  {
    name: 'Essentiel',
    price: 9.99,
    features: [
      'Accès salle 24h/24 et 7j/7',
      'Vestiaires et douches',
      'Espace musculation',
      'Espace cardio',
    ],
  },
  {
    name: 'Standard',
    price: 19.99,
    features: [
      'Tout Essentiel',
      'Cours collectifs illimités',
      'Suivi d’activité basique',
      'Application mobile',
    ],
  },
  {
    name: 'Premium',
    price: 29.99,
    features: [
      'Tout Standard',
      '1 séance coaching personnel / mois',
      'Programme d’entraînement sur mesure',
      'Conseils nutritionnels',
    ],
  },
  {
    name: 'Famille',
    price: 39.99,
    features: [
      'Tout Premium',
      '2 adultes + 2 enfants inclus',
      'Accès multi-clubs',
      'Réduction sur stages',
    ],
  },
];

/**
 * Salles de sport réelles — noms, type et branding (couleurs + logo).
 * Couleurs issues des identités de marque officielles.
 * Logos : Wikimedia Commons (Basic-Fit) ou service Google Favicon (icône du site officiel).
 */
const REAL_GYMS: Array<{
  name: string;
  type: string;
  branding_config: {
    primaryColor: string;
    secondaryColor?: string;
    logoUrl: string;
  };
}> = [
  {
    name: 'Basic-Fit',
    type: 'salle_de_sport',
    branding_config: {
      primaryColor: '#f37121',
      secondaryColor: '#000000',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/a/a3/Basic-Fit_logo.png',
    },
  },
  {
    name: 'Fitness Park',
    type: 'salle_de_sport',
    branding_config: {
      primaryColor: '#FFC72C',
      secondaryColor: '#003366',
      logoUrl:
        'https://www.google.com/s2/favicons?domain=fitnesspark.fr&sz=128',
    },
  },
  {
    name: 'Keep Cool',
    type: 'salle_de_sport',
    branding_config: {
      primaryColor: '#00A86B',
      secondaryColor: '#1a1a1a',
      logoUrl: 'https://www.google.com/s2/favicons?domain=keepcool.fr&sz=128',
    },
  },
  {
    name: 'Neoness',
    type: 'salle_de_sport',
    branding_config: {
      primaryColor: '#E30613',
      secondaryColor: '#2D2D2D',
      logoUrl: 'https://www.google.com/s2/favicons?domain=neoness.fr&sz=128',
    },
  },
  {
    name: "L'Appart Fitness",
    type: 'salle_de_sport',
    branding_config: {
      primaryColor: '#E31837',
      secondaryColor: '#111827',
      logoUrl:
        'https://www.google.com/s2/favicons?domain=lappartfitness.com&sz=128',
    },
  },
];

/** Exercices de musculation / fitness (créés si table vide). */
const SEED_EXERCISES: Array<{
  name: string;
  primary_muscles?: string[];
  level?: string;
  equipment?: string;
  category?: string;
}> = [
  {
    name: 'Développé couché',
    primary_muscles: ['pectoraux'],
    level: 'débutant',
    equipment: 'barre',
    category: 'force',
  },
  {
    name: 'Squat barre',
    primary_muscles: ['quadriceps', 'fessiers'],
    level: 'intermédiaire',
    equipment: 'barre',
    category: 'force',
  },
  {
    name: 'Traction barre fixe',
    primary_muscles: ['dorsaux'],
    level: 'intermédiaire',
    equipment: 'poids du corps',
    category: 'force',
  },
  {
    name: 'Soulevé de terre',
    primary_muscles: ['lombaires', 'ischio-jambiers'],
    level: 'intermédiaire',
    equipment: 'barre',
    category: 'force',
  },
  {
    name: 'Développé militaire',
    primary_muscles: ['épaules'],
    level: 'débutant',
    equipment: 'haltères',
    category: 'force',
  },
  {
    name: 'Curl biceps',
    primary_muscles: ['biceps'],
    level: 'débutant',
    equipment: 'haltères',
    category: 'force',
  },
  {
    name: 'Extensions triceps poulie',
    primary_muscles: ['triceps'],
    level: 'débutant',
    equipment: 'poulie',
    category: 'force',
  },
  {
    name: 'Gainage abdominal',
    primary_muscles: ['abdominaux'],
    level: 'débutant',
    equipment: 'poids du corps',
    category: 'force',
  },
  {
    name: 'Fentes marchées',
    primary_muscles: ['quadriceps', 'fessiers'],
    level: 'débutant',
    equipment: 'haltères',
    category: 'force',
  },
  {
    name: 'Rowing barre',
    primary_muscles: ['dorsaux'],
    level: 'intermédiaire',
    equipment: 'barre',
    category: 'force',
  },
  {
    name: 'Course sur tapis',
    primary_muscles: [],
    level: 'débutant',
    equipment: 'machine',
    category: 'cardio',
  },
  {
    name: 'Vélo elliptique',
    primary_muscles: [],
    level: 'débutant',
    equipment: 'machine',
    category: 'cardio',
  },
];

/** Aliments / repas (créés si table vide). Nutrition requiert name, category, calories, macros, etc. */
const SEED_NUTRITION: Array<{
  name: string;
  category: string;
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  meal_type_name: string;
  water_intake_ml: number;
}> = [
  {
    name: 'Poulet grillé 100g',
    category: 'Viande',
    calories_kcal: 165,
    protein_g: 31,
    carbohydrates_g: 0,
    fat_g: 3.6,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 82,
    cholesterol_mg: 85,
    meal_type_name: 'Déjeuner',
    water_intake_ml: 0,
  },
  {
    name: 'Riz basmati cuit 100g',
    category: 'Féculents',
    calories_kcal: 130,
    protein_g: 2.7,
    carbohydrates_g: 28,
    fat_g: 0.3,
    fiber_g: 0.4,
    sugar_g: 0,
    sodium_mg: 1,
    cholesterol_mg: 0,
    meal_type_name: 'Déjeuner',
    water_intake_ml: 0,
  },
  {
    name: 'Brocolis vapeur 100g',
    category: 'Légumes',
    calories_kcal: 35,
    protein_g: 2.4,
    carbohydrates_g: 7,
    fat_g: 0.4,
    fiber_g: 2.6,
    sugar_g: 1.4,
    sodium_mg: 33,
    cholesterol_mg: 0,
    meal_type_name: 'Déjeuner',
    water_intake_ml: 0,
  },
  {
    name: 'Oeufs brouillés x2',
    category: 'Oeufs',
    calories_kcal: 196,
    protein_g: 14,
    carbohydrates_g: 1.5,
    fat_g: 15,
    fiber_g: 0,
    sugar_g: 1.5,
    sodium_mg: 210,
    cholesterol_mg: 370,
    meal_type_name: 'Petit-déjeuner',
    water_intake_ml: 0,
  },
  {
    name: "Flocons d'avoine 50g",
    category: 'Céréales',
    calories_kcal: 190,
    protein_g: 6.7,
    carbohydrates_g: 33,
    fat_g: 3.2,
    fiber_g: 4.5,
    sugar_g: 0.6,
    sodium_mg: 1,
    cholesterol_mg: 0,
    meal_type_name: 'Petit-déjeuner',
    water_intake_ml: 0,
  },
  {
    name: 'Banane',
    category: 'Fruits',
    calories_kcal: 89,
    protein_g: 1.1,
    carbohydrates_g: 23,
    fat_g: 0.3,
    fiber_g: 2.6,
    sugar_g: 12,
    sodium_mg: 1,
    cholesterol_mg: 0,
    meal_type_name: 'Collation',
    water_intake_ml: 0,
  },
  {
    name: 'Saumon grillé 100g',
    category: 'Poisson',
    calories_kcal: 208,
    protein_g: 20,
    carbohydrates_g: 0,
    fat_g: 13,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 59,
    cholesterol_mg: 55,
    meal_type_name: 'Dîner',
    water_intake_ml: 0,
  },
  {
    name: 'Salade verte 100g',
    category: 'Légumes',
    calories_kcal: 15,
    protein_g: 1.4,
    carbohydrates_g: 2.9,
    fat_g: 0.2,
    fiber_g: 1.3,
    sugar_g: 0.8,
    sodium_mg: 28,
    cholesterol_mg: 0,
    meal_type_name: 'Dîner',
    water_intake_ml: 0,
  },
  {
    name: 'Fromage blanc 0% 100g',
    category: 'Produits laitiers',
    calories_kcal: 45,
    protein_g: 7.8,
    carbohydrates_g: 4,
    fat_g: 0.1,
    fiber_g: 0,
    sugar_g: 4,
    sodium_mg: 40,
    cholesterol_mg: 3,
    meal_type_name: 'Collation',
    water_intake_ml: 0,
  },
  {
    name: 'Pomme',
    category: 'Fruits',
    calories_kcal: 52,
    protein_g: 0.3,
    carbohydrates_g: 14,
    fat_g: 0.2,
    fiber_g: 2.4,
    sugar_g: 10,
    sodium_mg: 1,
    cholesterol_mg: 0,
    meal_type_name: 'Collation',
    water_intake_ml: 0,
  },
];

/** Nombre d'abonnements à créer. */
const SEED_SUBSCRIPTION_COUNT = 150;
/** Nombre de sessions (entraînements) à créer. */
const SEED_SESSION_COUNT = 500;
/** Nombre d'utilisateurs ayant des repas, et repas par utilisateur. */
const SEED_MEAL_USERS = 100;
const SEED_MEALS_PER_USER = 10;

interface SpecialAccountCredential {
  email: string;
  password: string;
  role: 'COACH' | 'ADMIN';
  firstName: string;
  lastName: string;
}

/** Normalise une chaîne pour une adresse email (minuscules, sans accents, sans espaces). */
function normalizeForEmail(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Génère une adresse prenom.nom@example.com unique.
 * En cas de doublon, ajoute un suffixe numérique (prenom.nom2@example.com, etc.).
 */
function makeUniqueEmail(
  firstName: string,
  lastName: string,
  usedEmails: Set<string>,
): string {
  const prenom = normalizeForEmail(firstName);
  const nom = normalizeForEmail(lastName);
  let email = `${prenom}.${nom}@example.com`;
  if (usedEmails.has(email)) {
    let n = 2;
    do {
      email = `${prenom}.${nom}${n}@example.com`;
      n++;
    } while (usedEmails.has(email));
  }
  usedEmails.add(email);
  return email;
}

function logSection(title: string, emoji: string): void {
  console.log('');
  console.log(`${emoji}  ${'═'.repeat(56)}`);
  console.log(`${emoji}  ${title}`);
  console.log(`${emoji}  ${'═'.repeat(56)}`);
}

function logCredentials(credentials: SpecialAccountCredential[]): void {
  const coaches = credentials.filter((c) => c.role === 'COACH');
  const admins = credentials.filter((c) => c.role === 'ADMIN');

  console.log('');
  console.log('  📋  IDENTIFIANTS DE CONNEXION — Comptes spéciaux');
  console.log('  ─────────────────────────────────────────────────');
  console.log('');
  console.log('  🏋️  COACHS (5 comptes)');
  console.log('  ─────────────────────────────────────────────────');
  coaches.forEach((c, i) => {
    console.log(`     ${i + 1}. ${c.email}`);
    console.log(`        Mot de passe : ${c.password}`);
    console.log(`        Nom : ${c.firstName} ${c.lastName}`);
    console.log('');
  });
  console.log('  👑  ADMINS (5 comptes)');
  console.log('  ─────────────────────────────────────────────────');
  admins.forEach((c, i) => {
    console.log(`     ${i + 1}. ${c.email}`);
    console.log(`        Mot de passe : ${c.password}`);
    console.log(`        Nom : ${c.firstName} ${c.lastName}`);
    console.log('');
  });
  console.log('  ═══════════════════════════════════════════════════');
  console.log('  💡  Les 990 autres utilisateurs ont le même mot de passe :');
  console.log(`      ${SEED_PASSWORD}`);
  console.log('      (emails du type prenom.nom@example.com)');
  console.log('  ═══════════════════════════════════════════════════');
}

async function seedPlans(): Promise<{
  planIds: number[];
  createdCount: number;
}> {
  const existing = await prisma.plan.count();
  if (existing > 0) {
    const plans = await prisma.plan.findMany({ select: { id: true } });
    return {
      planIds: plans.map((p) => p.id),
      createdCount: 0,
    };
  }
  const ids: number[] = [];
  for (const plan of PAID_PLANS) {
    const created = await prisma.plan.create({
      data: {
        name: plan.name,
        price: plan.price,
        features: plan.features as object,
      },
      select: { id: true },
    });
    ids.push(created.id);
  }
  return { planIds: ids, createdCount: ids.length };
}

function logPlans(planIds: number[]): void {
  console.log('');
  PAID_PLANS.forEach((plan, i) => {
    const id = planIds[i];
    console.log(
      `     ${i + 1}. ${plan.name} (id ${id}) — ${plan.price} €/mois`,
    );
    plan.features.forEach((f) => console.log(`        • ${f}`));
    console.log('');
  });
}

async function seedOrganizations(): Promise<number[]> {
  const ids: number[] = [];
  for (const gym of REAL_GYMS) {
    const created = await prisma.organization.upsert({
      where: { name: gym.name },
      create: {
        name: gym.name,
        type: gym.type,
        branding_config: gym.branding_config as object,
        is_active: true,
        is_deleted: false,
      },
      update: {
        type: gym.type,
        branding_config: gym.branding_config as object,
        is_active: true,
      },
      select: { id: true },
    });
    ids.push(created.id);
  }
  return ids;
}

function logOrganizations(orgIds: number[]): void {
  console.log('');
  REAL_GYMS.forEach((gym, i) => {
    const id = orgIds[i];
    const c = gym.branding_config;
    console.log(`     ${i + 1}. ${gym.name} (id ${id})`);
    console.log(`        Couleur principale : ${c.primaryColor}`);
    if (c.secondaryColor) {
      console.log(`        Couleur secondaire : ${c.secondaryColor}`);
    }
    console.log(`        Logo : ${c.logoUrl}`);
    console.log('');
  });
}

async function ensureRoles(): Promise<{ adminId: number; coachId: number }> {
  await prisma.role.createMany({
    data: DEFAULT_ROLE_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });
  const roles = await prisma.role.findMany({
    where: { name: { in: ['ADMIN', 'COACH'] } },
    select: { id: true, name: true },
  });
  const adminId = roles.find((r) => r.name === 'ADMIN')?.id;
  const coachId = roles.find((r) => r.name === 'COACH')?.id;
  if (adminId == null || coachId == null) {
    throw new Error('Rôles ADMIN ou COACH introuvables après seed');
  }
  return { adminId, coachId };
}

async function createSpecialAccounts(
  adminId: number,
  coachId: number,
  passwordHash: string,
  usedEmails: Set<string>,
  organizationIds: number[],
): Promise<SpecialAccountCredential[]> {
  const credentials: SpecialAccountCredential[] = [];
  const now = new Date();

  for (let i = 1; i <= SPECIAL_COACH_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = makeUniqueEmail(firstName, lastName, usedEmails);
    const orgId =
      organizationIds.length > 0
        ? organizationIds[(i - 1) % organizationIds.length]
        : undefined;
    await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: faker.date.birthdate({ min: 22, max: 55, mode: 'age' }),
        gender: faker.helpers.arrayElement(['Homme', 'Femme', 'Non spécifié']),
        height: faker.number.float({ min: 160, max: 195, fractionDigits: 1 }),
        role_id: coachId,
        organization_id: orgId,
        is_active: true,
        is_deleted: false,
        email_verified_at: now,
      },
    });
    credentials.push({
      email,
      password: SEED_PASSWORD,
      role: 'COACH',
      firstName,
      lastName,
    });
  }

  for (let i = 1; i <= SPECIAL_ADMIN_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = makeUniqueEmail(firstName, lastName, usedEmails);
    const orgId =
      organizationIds.length > 0
        ? organizationIds[(i - 1) % organizationIds.length]
        : undefined;
    await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
        gender: faker.helpers.arrayElement(['Homme', 'Femme', 'Non spécifié']),
        height: faker.number.float({ min: 160, max: 195, fractionDigits: 1 }),
        role_id: adminId,
        organization_id: orgId,
        is_active: true,
        is_deleted: false,
        email_verified_at: now,
      },
    });
    credentials.push({
      email,
      password: SEED_PASSWORD,
      role: 'ADMIN',
      firstName,
      lastName,
    });
  }

  return credentials;
}

async function createFakeUsers(
  count: number,
  passwordHash: string,
  organizationIds: number[],
  usedEmails: Set<string>,
): Promise<void> {
  const now = new Date();
  faker.seed(42);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = makeUniqueEmail(firstName, lastName, usedEmails);
    const assignToOrg =
      organizationIds.length > 0 && i < USERS_WITH_ORGANIZATION
        ? organizationIds[i % organizationIds.length]
        : undefined;
    await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        gender: faker.helpers.arrayElement(['Homme', 'Femme', 'Non spécifié']),
        height: faker.number.float({ min: 150, max: 200, fractionDigits: 1 }),
        organization_id: assignToOrg ?? undefined,
        is_active: true,
        is_deleted: false,
        email_verified_at: now,
      },
    });
  }
}

async function seedExercises(): Promise<number[]> {
  const existing = await prisma.exercise.count();
  if (existing > 0) {
    const rows = await prisma.exercise.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.id);
  }
  const ids: number[] = [];
  for (const ex of SEED_EXERCISES) {
    const created = await prisma.exercise.create({
      data: {
        name: ex.name,
        primary_muscles: ex.primary_muscles as object | undefined,
        level: ex.level,
        equipment: ex.equipment,
        category: ex.category,
      },
      select: { id: true },
    });
    ids.push(created.id);
  }
  return ids;
}

async function seedNutrition(): Promise<number[]> {
  const existing = await prisma.nutrition.count();
  if (existing > 0) {
    const rows = await prisma.nutrition.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.id);
  }
  const ids: number[] = [];
  for (const n of SEED_NUTRITION) {
    const created = await prisma.nutrition.create({
      data: {
        name: n.name,
        category: n.category,
        calories_kcal: n.calories_kcal,
        protein_g: n.protein_g,
        carbohydrates_g: n.carbohydrates_g,
        fat_g: n.fat_g,
        fiber_g: n.fiber_g,
        sugar_g: n.sugar_g,
        sodium_mg: n.sodium_mg,
        cholesterol_mg: n.cholesterol_mg,
        meal_type_name: n.meal_type_name,
        water_intake_ml: n.water_intake_ml,
      },
      select: { id: true },
    });
    ids.push(created.id);
  }
  return ids;
}

async function seedSubscriptions(
  userIds: number[],
  planIds: number[],
): Promise<number> {
  if (planIds.length === 0) return 0;
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  faker.seed(44);
  const pool = userIds;
  const toUse =
    pool.length >= SEED_SUBSCRIPTION_COUNT
      ? faker.helpers.arrayElements(pool, SEED_SUBSCRIPTION_COUNT)
      : pool;
  let created = 0;
  for (const userId of toUse) {
    const planId = faker.helpers.arrayElement(planIds);
    await prisma.subscription.create({
      data: {
        user_id: userId,
        plan_id: planId,
        start_date: start,
        end_date: end,
        status: 'ACTIVE',
      },
    });
    created++;
  }
  return created;
}

async function seedSessions(userIds: number[]): Promise<number[]> {
  faker.seed(45);
  const sessionIds: number[] = [];
  for (let i = 0; i < SEED_SESSION_COUNT; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const daysAgo = faker.number.int({ min: 0, max: 59 });
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    const created = await prisma.session.create({
      data: {
        user_id: userId,
        duration_h: faker.number.float({ min: 0.5, max: 2, fractionDigits: 2 }),
        calories_total: faker.number.int({ min: 200, max: 800 }),
        avg_bpm: faker.number.int({ min: 120, max: 160 }),
        max_bpm: faker.number.int({ min: 150, max: 185 }),
        resting_bpm: faker.number.int({ min: 55, max: 75 }),
        created_at: createdAt,
      },
      select: { id: true },
    });
    sessionIds.push(created.id);
  }
  return sessionIds;
}

async function seedSessionExercises(
  sessionIds: number[],
  exerciseIds: number[],
): Promise<number> {
  if (exerciseIds.length === 0) return 0;
  faker.seed(46);
  let created = 0;
  for (const sessionId of sessionIds) {
    const count = faker.number.int({
      min: 2,
      max: Math.min(5, exerciseIds.length),
    });
    const chosen = faker.helpers.arrayElements(exerciseIds, count);
    for (const exerciseId of chosen) {
      await prisma.sessionExercise.create({
        data: { session_id: sessionId, exercise_id: exerciseId },
      });
      created++;
    }
  }
  return created;
}

async function seedMeals(
  userIds: number[],
  nutritionIds: number[],
): Promise<number> {
  if (nutritionIds.length === 0) return 0;
  faker.seed(47);
  const pool = userIds.slice(0, Math.min(SEED_MEAL_USERS, userIds.length));
  const toUse = faker.helpers.arrayElements(
    pool,
    Math.min(SEED_MEAL_USERS, pool.length),
  );
  let created = 0;
  for (const userId of toUse) {
    for (let m = 0; m < SEED_MEALS_PER_USER; m++) {
      const nutritionId = faker.helpers.arrayElement(nutritionIds);
      const daysAgo = faker.number.int({ min: 0, max: 59 });
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      await prisma.meal.create({
        data: {
          user_id: userId,
          nutrition_id: nutritionId,
          created_at: createdAt,
        },
      });
      created++;
    }
  }
  return created;
}

async function main() {
  logSection('Démarrage du seed — Base de données', '🌱');

  console.log('');
  console.log('  📌  Étapes :');
  console.log('      1. S’assurer que les rôles ADMIN et COACH existent');
  console.log('      2. Créer les plans payants (si aucun plan existant)');
  console.log('      3. Créer les organisations (salles de sport réelles)');
  console.log('      4. Créer les comptes spéciaux (5 coach + 5 admin)');
  console.log(
    '      5. Créer 990 utilisateurs avec Faker (dont certains rattachés aux salles)',
  );
  console.log(
    '      6. Créer exercices, nutrition, abonnements, sessions, repas',
  );
  console.log('');

  const passwordHash = await hashPassword(SEED_PASSWORD);

  logSection('Rôles', '🔐');
  const { adminId, coachId } = await ensureRoles();
  console.log(
    `  ✅  Rôles prêts — ADMIN (id ${adminId}), COACH (id ${coachId})`,
  );

  logSection('Plans payants', '💳');
  const { planIds, createdCount } = await seedPlans();
  if (createdCount > 0) {
    console.log(
      `  ✅  ${createdCount} plans créés (Essentiel, Standard, Premium, Famille)`,
    );
    logPlans(planIds);
  } else {
    console.log('  ℹ️  Des plans existent déjà — aucun nouveau plan créé');
    console.log(`      ${planIds.length} plan(s) en base`);
  }

  console.log('');
  console.log('  🗑️  Suppression des utilisateurs existants…');
  await prisma.user.deleteMany({});
  console.log('  ✅  Table user vidée');

  logSection('Organisations — Salles de sport réelles', '🏢');
  console.log(
    '  📍  Création / mise à jour des enseignes (branding officiel : couleurs, logo)',
  );
  console.log('');
  const organizationIds = await seedOrganizations();
  console.log(
    `  ✅  ${organizationIds.length} organisations créées ou mises à jour`,
  );
  logOrganizations(organizationIds);

  logSection('Comptes spéciaux (5 coach + 5 admin)', '⭐');
  const usedEmails = new Set<string>();
  const specialCredentials = await createSpecialAccounts(
    adminId,
    coachId,
    passwordHash,
    usedEmails,
    organizationIds,
  );
  console.log(
    `  ✅  ${TOTAL_SPECIAL} comptes spéciaux créés (emails prenom.nom@example.com)`,
  );
  console.log(
    '  📎  Chaque coach et chaque admin est rattaché à une salle (1 par organisation)',
  );

  logSection('Utilisateurs Faker (990 comptes)', '👥');
  console.log(
    '  ⏳  Création en cours (noms français, dates de naissance, genre, taille)…',
  );
  await createFakeUsers(
    TOTAL_USERS - TOTAL_SPECIAL,
    passwordHash,
    organizationIds,
    usedEmails,
  );
  console.log(`  ✅  ${TOTAL_USERS - TOTAL_SPECIAL} utilisateurs créés`);
  console.log(
    `  📎  ${USERS_WITH_ORGANIZATION} utilisateurs (adhérents) rattachés à une salle`,
  );
  console.log(
    `      Répartition : ~${Math.round(USERS_WITH_ORGANIZATION / organizationIds.length)} adhérents par organisation`,
  );

  const userIds = (
    await prisma.user.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    })
  ).map((u) => u.id);

  logSection('Exercices (si table vide)', '💪');
  const exerciseIds = await seedExercises();
  console.log(`  ✅  ${exerciseIds.length} exercice(s) en base`);

  logSection('Nutrition (si table vide)', '🥗');
  const nutritionIds = await seedNutrition();
  console.log(`  ✅  ${nutritionIds.length} aliment(s) en base`);

  logSection('Abonnements, sessions, repas', '📦');
  const subCreated = await seedSubscriptions(userIds, planIds);
  console.log(`  ✅  ${subCreated} abonnements créés`);
  const sessionIds = await seedSessions(userIds);
  console.log(`  ✅  ${sessionIds.length} sessions (entraînements) créées`);
  const sessionExCreated = await seedSessionExercises(sessionIds, exerciseIds);
  console.log(`  ✅  ${sessionExCreated} liaisons session-exercice créées`);
  const mealsCreated = await seedMeals(userIds, nutritionIds);
  console.log(`  ✅  ${mealsCreated} repas créés`);

  logSection('Résumé', '📊');
  console.log(`  📈  Total : ${TOTAL_USERS} utilisateurs`);
  console.log(`  💳  Plans payants : ${planIds.length} offres`);
  console.log(
    `  🏢  Organisations : ${organizationIds.length} salles de sport`,
  );
  console.log(`  💪  Exercices : ${exerciseIds.length}`);
  console.log(`  🥗  Aliments (nutrition) : ${nutritionIds.length}`);
  console.log(`  📄  Abonnements : ${subCreated} créés`);
  console.log(`  🏃  Sessions : ${sessionIds.length}`);
  console.log(`  🍽️  Repas : ${mealsCreated}`);
  console.log(`  🏋️  Coaches : ${SPECIAL_COACH_COUNT}`);
  console.log(`  👑  Admins : ${SPECIAL_ADMIN_COUNT}`);
  console.log(
    `  👤  Utilisateurs classiques : ${TOTAL_USERS - TOTAL_SPECIAL} (dont ${USERS_WITH_ORGANIZATION} adhérents en salle)`,
  );
  console.log(
    `  📎  Au total : ${TOTAL_SPECIAL + USERS_WITH_ORGANIZATION} utilisateurs rattachés à une organisation`,
  );

  logSection('Identifiants de connexion — À conserver', '🔑');
  logCredentials(specialCredentials);

  console.log('');
  console.log('  ✨  Seed terminé avec succès.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('');
    console.error('  ❌  Erreur pendant le seed :', e);
    console.error('');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
