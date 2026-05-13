# Guide de Tests

## Stack de test

- **Framework** : Jest v30 + ts-jest
- **HTTP** : Supertest v7 (tests e2e)
- **Config unit** : `package.json` → section `jest`
- **Config e2e** : `test/jest-e2e.json`
- **Pattern** : fichiers `*.spec.ts` dans `src/`

## Commandes

```bash
npm run test              # Tous les tests unitaires
npm run test:watch        # Mode watch
npm run test:cov          # Avec rapport de couverture (→ coverage/)
npm run test:e2e          # Tests e2e (test/app.e2e-spec.ts)
npm run test -- --testPathPattern=auth   # Un module spécifique
npm run test -- --testNamePattern="login" # Un test spécifique
```

---

## Règle fondamentale

**Aucun appel réseau ou base de données réel dans les tests unitaires.**  
`PrismaService` et `HttpService` sont toujours mockés.

---

## Pattern de mock PrismaService

```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Ajouter les modèles utilisés par le service testé
};

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MonService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  service = module.get<MonService>(MonService);
  prisma = module.get<PrismaService>(PrismaService);
});

afterEach(() => jest.clearAllMocks());
```

---

## Pattern de test de Service

```typescript
// src/users/services/users/users.service.spec.ts
describe('UsersService', () => {
  describe('getUserById', () => {
    it('retourne l\'utilisateur si trouvé', async () => {
      const mockUser = { id: 1, email: 'test@test.com', first_name: 'Jean' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, is_deleted: false },
        include: expect.any(Object),
      });
    });

    it('lève une NotFoundException si l\'utilisateur n\'existe pas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Pattern de test de Controller

```typescript
// src/users/controllers/users/users.controller.spec.ts
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: SERVICES.USERS,
          useValue: {
            getUserById: jest.fn(),
            getUsers: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(SERVICES.USERS);
  });

  it('GET /users/:id — délègue au service et retourne le résultat', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    service.getUserById.mockResolvedValue(mockUser as any);

    const result = await controller.getUserById(1);

    expect(service.getUserById).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockUser);
  });
});
```

---

## Pattern de mock HttpService (pipelines ETL)

```typescript
const mockHttpService = {
  get: jest.fn().mockReturnValue(of({ data: '...' })),
};

providers: [
  { provide: HttpService, useValue: mockHttpService },
]
```

---

## Tests requis par module

Chaque module **doit** avoir les tests unitaires suivants :

### AuthModule
- `AuthService` :
  - `register()` : succès, email déjà pris, organisation invalide
  - `login()` : succès, email inconnu, mauvais mot de passe, compte inactif
  - `refresh()` : succès, token invalide/expiré
  - `logout()` : succès, token déjà révoqué
  - `confirmPasswordReset()` : succès, token expiré
  - `confirmAccountVerification()` : succès, token invalide

### UsersModule
- `UsersService` :
  - `getUsers()` : pagination, filtre search, filtre plan (Premium, Freemium, B2B)
  - `getUserById()` : trouvé, non trouvé (NotFoundException)
  - `createUser()` : succès, email dupliqué
  - `updateUser()` : succès, utilisateur inexistant
  - `deleteUser()` : soft delete (is_deleted: true, deleted_at défini)
  - `getUsersStats()` : vérifier les comptages

### OrganizationModule
- `OrganizationService` :
  - `getOrganizations()` : retourne uniquement is_deleted: false
  - `createOrganization()` : succès, nom dupliqué
  - `deleteOrganization()` : soft delete

### NutritionModule
- `NutritionService` :
  - `getNutritions()` : pagination correcte
  - `updateNutrition()` : succès, id inexistant
  - `deleteNutrition()` : succès

### ExerciceModule
- `ExerciceService` :
  - `findByFilters()` : filtre muscle, filtre level, filtre equipment
  - `getExerciceById()` : trouvé, non trouvé

### SessionModule
- `SessionService` :
  - `getUserLevel()` : Débutant (<2000 cal), Actif (2000-10000), Athlète (10000-50000), Légende (>50000)
  - `getTodaySummary()` : résumé correct pour aujourd'hui
  - `getSessions()` : filtre par date (YYYY-MM-DD et YYYY-MM)

### EtlModule
- `EtlStagingService` :
  - `findPendingWithoutAnomalies()` : retourne uniquement status=PENDING + anomalies vides
  - `findPendingWithAnomalies()` : retourne uniquement status=PENDING + anomalies non vides
  - `updateStatus()` : APPROVED et REJECTED

### PostModule
- `PostService` :
  - `deletePost()` : auteur peut supprimer, ADMIN peut supprimer, autre utilisateur → ForbiddenException

### PlanModule
- `PlanService` :
  - CRUD complet (create, read, update, delete)

---

## Tests e2e

Fichier : `test/app.e2e-spec.ts`

Les tests e2e utilisent Supertest contre l'application NestJS complète. Ils requièrent une base de données de test configurée via `DATABASE_URL`.

```typescript
// test/app.e2e-spec.ts
describe('Auth (e2e)', () => {
  it('POST /auth/login — 200 avec credentials valides', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'motdepasse123' })
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
      });
  });
});
```

---

## Couverture minimale attendue

| Métrique | Seuil |
|---|---|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

Le rapport de couverture est généré dans `coverage/` par `npm run test:cov`.
