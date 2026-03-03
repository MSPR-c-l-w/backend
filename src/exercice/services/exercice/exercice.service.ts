/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Exercise } from '@prisma/client';
import { IExerciceService } from 'src/exercice/interfaces/exercice/exercice.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { EtlService } from 'src/etl/services/etl/etl.service';
import { lastValueFrom } from 'rxjs';
import { translate } from 'google-translate-api-x';
import { GetExercisesFilterDto } from 'src/exercice/dtos/et-exercises-filter.dto';

@Injectable()
export class ExerciceService implements IExerciceService {
  private readonly logger = new Logger(ExerciceService.name);

  private readonly SOURCE_URL =
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
  private readonly IMG_BASE_URL =
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

  private readonly dictionary = {
    abdominals: 'abdominaux',
    hamstrings: 'ischio-jambiers',
    adductors: 'adducteurs',
    quadriceps: 'quadriceps',
    biceps: 'biceps',
    shoulders: 'épaules',
    chest: 'pectoraux',
    'middle back': 'milieu du dos',
    'lower back': 'lombaires',
    lats: 'dorsaux',
    triceps: 'triceps',
    traps: 'trapèzes',
    forearms: 'avant-bras',
    glutes: 'fessiers',
    calves: 'mollets',
    neck: 'cou',
    abductors: 'abducteurs',
    'body only': 'poids du corps',
    dumbbell: 'haltères',
    barbell: 'barre',
    cable: 'poulie',
    machine: 'machine',
    kettlebells: 'kettlebells',
    beginner: 'débutant',
    intermediate: 'intermédiaire',
    expert: 'expert',
    pull: 'tirage',
    push: 'poussée',
    static: 'statique',
    compound: 'polyarticulaire',
    isolation: 'isolation',
    strength: 'force',
    stretching: 'étirement',
    cardio: 'cardio',
    other: 'autres',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly etl: EtlService,
  ) {}

  private translateTerm(term: string | null): string | null {
    if (!term) return null;
    return this.dictionary[term.toLowerCase()] || term;
  }

  async getExercices(
    page: number = 1,
    limit: number = 20,
  ): Promise<Exercise[]> {
    const skip = (page - 1) * limit;

    const exercices = await this.prisma.exercise.findMany({
      skip: skip,
      take: limit,
      orderBy: { name: 'asc' },
    });

    if (exercices.length === 0)
      throw new NotFoundException('Aucun exercice trouvé');
    return exercices;
  }

  async getExerciceById(id: number): Promise<Exercise> {
    const exercice = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercice) throw new NotFoundException(`Exercice ${id} introuvable`);
    return exercice;
  }

  async runImportPipeline(): Promise<number> {
    try {
      const startMsg = '--- DÉBUT PIPELINE ETL (UPSERT & BATCH) ---';
      this.logger.log(startMsg);
      this.etl.emit('exercise', 'INFO', startMsg);
      const response = await lastValueFrom(
        this.httpService.get(this.SOURCE_URL),
      );
      const rawData = response.data;
      if (!Array.isArray(rawData)) return 0;

      let successCount = 0;
      const BATCH_SIZE = 15;

      for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
        const batch = rawData.slice(i, i + BATCH_SIZE);
        const allInstructionsStrings = batch.map((item) =>
          (item.instructions || []).join(' ||| '),
        );

        let translatedBatch: string[] = [];
        try {
          const res: any = await translate(allInstructionsStrings, {
            to: 'fr',
          });
          translatedBatch = Array.isArray(res)
            ? res.map((r: any) => r.text)
            : [res.text];
        } catch (err) {
          translatedBatch = allInstructionsStrings;
        }

        const stagingPromises = batch.map(
          (item: Record<string, unknown>, index: number) => {
            const fullImageUrls = Array.isArray(item.images)
              ? (item.images as string[]).map(
                  (path: string) => `${this.IMG_BASE_URL}${path}`,
                )
              : [];
            const translatedInstructions =
              translatedBatch[index].split(' ||| ');
            const forceValue = this.translateTerm(item.force as string | null);
            const primaryMuscles = Array.isArray(item.primaryMuscles)
              ? (item.primaryMuscles as string[])
              : [];
            const secondaryMuscles = Array.isArray(item.secondaryMuscles)
              ? (item.secondaryMuscles as string[])
              : [];
            const cleanedData = {
              name: item.name as string,
              primary_muscles: primaryMuscles.map((m: string) =>
                this.translateTerm(m),
              ),
              secondary_muscles: secondaryMuscles.map((m: string) =>
                this.translateTerm(m),
              ),
              level: this.translateTerm(item.level as string | null),
              mechanic: this.translateTerm(item.mechanic as string | null),
              equipment: this.translateTerm(item.equipment as string | null),
              category: this.translateTerm(item.category as string | null),
              instructions: translatedInstructions,
              image_urls: fullImageUrls,
              exercise_type: forceValue,
            };
            return this.prisma.exerciseStaging.create({
              data: {
                cleaned_data: cleanedData,
                anomalies: [],
              },
            });
          },
        );

        await Promise.all(stagingPromises);
        successCount += batch.length;
        const statusMsg = `Statut : ${successCount}/${rawData.length} synchronisés.`;
        this.logger.log(statusMsg);
        this.etl.emit('exercise', 'INFO', statusMsg);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      const endMsg = `--- Fin pipeline ETL Exercice : ${successCount} enregistrements en staging (PENDING). ---`;
      this.etl.emit('exercise', 'SUCCESS', endMsg);
      return successCount;
    } catch (error) {
      const errMsg = `ERREUR ETL : ${(error as Error).message}`;
      this.logger.error(errMsg);
      this.etl.emit('exercise', 'ERROR', errMsg);
      throw error;
    }
  }

  async findByFilters(filters: GetExercisesFilterDto): Promise<Exercise[]> {
    const {
      muscle,
      level,
      equipment,
      category,
      page = 1,
      limit = 20,
    } = filters;
    const skip = (page - 1) * limit;

    return await this.prisma.exercise.findMany({
      where: {
        level: level ? { contains: level } : undefined,
        equipment: equipment ? { contains: equipment } : undefined,
        category: category ? { contains: category } : undefined,
        OR: muscle
          ? [
              { primary_muscles: { path: '$', array_contains: muscle } },
              { secondary_muscles: { path: '$', array_contains: muscle } },
            ]
          : undefined,
      },
      skip: skip,
      take: limit,
      orderBy: { name: 'asc' },
    });
  }
}
