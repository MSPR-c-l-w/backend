# Guide des tests unitaires — HealthAI Coach Backend

## Principes généraux

Les tests unitaires du projet utilisent **Jest** avec le module de test NestJS (`@nestjs/testing`). Chaque service est testé en isolation : les dépendances externes (base de données, HTTP, métriques) sont **toujours mockées**.

---

## Structure d'un fichier `.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MonService } from './mon.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MetricsService } from 'src/metrics/metrics.service';

describe('MonService', () => {
  let service: MonService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonService,
        {
          provide: PrismaService,
          useValue: {
            maTable: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: MetricsService,
          useValue: {
            observerDureeETL: jest.fn(),
            enregistrerRequeteHttp: jest.fn(),
            enregistrerAppelIA: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MonService>(MonService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Mock de PrismaService

Le `PrismaService` est un wrapper autour du client Prisma. Dans les tests, il faut simuler chaque modèle Prisma utilisé par le service testé.

### Pattern de base

```typescript
{
  provide: PrismaService,
  useValue: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    nutrition: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    // ... autres modèles selon les besoins
  },
}
```

### Configurer la valeur de retour dans un test

```typescript
it('should return users', async () => {
  const mockUsers = [{ id: '1', email: 'test@example.com' }];
  (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

  const result = await service.findAll();
  expect(result).toEqual(mockUsers);
});
```

### Vérifier les appels

```typescript
expect(prisma.user.create).toHaveBeenCalledWith({
  data: { email: 'test@test.com', name: 'Test' },
});
expect(prisma.user.create).toHaveBeenCalledTimes(1);
```

---

## Mock de MetricsService

**Tout service qui injecte `MetricsService` doit le mocker.** Si le mock est absent, `createTestingModule` lève une erreur `Nest can't resolve dependencies`.

### Mock minimal (couvre tous les cas actuels)

```typescript
{
  provide: MetricsService,
  useValue: {
    observerDureeETL: jest.fn(),
    enregistrerRequeteHttp: jest.fn(),
    enregistrerAppelIA: jest.fn(),
  },
}
```

### Services concernés (au 2025-01-01)

| Service                  | Méthode MetricsService utilisée                              |
|--------------------------|--------------------------------------------------------------|
| `NutritionService`       | `observerDureeETL`                                           |
| `ExerciceService`        | `observerDureeETL`                                           |
| `HealthProfileService`   | `observerDureeETL`                                           |
| `AiWorkoutService`       | `enregistrerAppelIA`                                         |

### Cas NutritionService — plusieurs `createTestingModule`

`NutritionService` a 4 `createTestingModule` séparés dans son spec (1 dans `beforeEach` + 3 inline pour tester les cas d'erreur ETL). **Chacun doit inclure le mock MetricsService** :

```typescript
// Test inline avec module dédié
const module = await Test.createTestingModule({
  providers: [
    NutritionService,
    { provide: PrismaService, useValue: mockPrisma },
    { provide: HttpService, useValue: mockHttp },
    {
      provide: MetricsService,
      useValue: { observerDureeETL: jest.fn(), enregistrerRequeteHttp: jest.fn(), enregistrerAppelIA: jest.fn() },
    },
  ],
}).compile();
```

---

## Mock de HttpService

Les services ETL font des appels HTTP vers Kaggle ou d'autres APIs. `HttpService` (du module `@nestjs/axios`) doit être mocké pour retourner des données simulées.

```typescript
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

const mockHttpService = {
  get: jest.fn().mockReturnValue(
    of({
      data: 'col1,col2\nval1,val2\n',
      status: 200,
      headers: {},
      config: {},
      statusText: 'OK',
    } as AxiosResponse),
  ),
};

// Dans le provider :
{ provide: HttpService, useValue: mockHttpService }
```

---

## Tester les cas d'erreur

```typescript
it('should throw NotFoundException when user not found', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
});

it('should handle database error', async () => {
  (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB connexion perdue'));

  await expect(service.create(dto)).rejects.toThrow('DB connexion perdue');
});
```

---

## Commandes de test

```bash
# Tous les tests unitaires
npm run test

# Mode watch (relance à chaque modification)
npm run test:watch

# Avec coverage (rapport HTML dans coverage/)
npm run test:cov

# Un seul fichier spec
npm run test -- --testPathPattern="nutrition.service"

# Tests E2E (nécessite la DB)
npm run test:e2e
```

---

## Checklist avant de merger

- [ ] `npm run test` — 0 test en échec
- [ ] Tout service injectant `MetricsService` : mock présent dans **tous** les `createTestingModule` du spec
- [ ] Tout service injectant `PrismaService` : tous les modèles utilisés sont mockés
- [ ] Tout service injectant `HttpService` : mock RxJS `of()` utilisé, pas d'appel réseau réel
- [ ] Les cas d'erreur (NotFound, Forbidden, DB error) sont couverts
- [ ] `npm run lint` — pas d'erreurs TypeScript dans les specs
