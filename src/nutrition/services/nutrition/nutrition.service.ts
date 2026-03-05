/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Nutrition, Prisma } from '@prisma/client';
import { INutritionService } from 'src/nutrition/interfaces/nutrition/nutrition.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { EtlService } from 'src/etl/services/etl/etl.service';
import { lastValueFrom } from 'rxjs';
import * as Papa from 'papaparse';
import { translate } from 'google-translate-api-x';
const AdmZipModule = require('adm-zip');
const AdmZip = AdmZipModule.default ?? AdmZipModule;

const KAGGLE_DATASET_OWNER = 'adilshamim8';
const KAGGLE_DATASET_SLUG = 'daily-food-and-nutrition-dataset';
const KAGGLE_FILE_NAME = 'daily_food_nutrition_dataset.csv';
const KAGGLE_DATASET_DOWNLOAD_URL = `https://www.kaggle.com/api/v1/datasets/download/${KAGGLE_DATASET_OWNER}/${KAGGLE_DATASET_SLUG}`;

interface KaggleNutritionRow {
  [key: string]: string | number | undefined;
}

function toFloat(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function toString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

@Injectable()
export class NutritionService implements INutritionService {
  private readonly logger = new Logger(NutritionService.name);
  private readonly kaggleUser = process.env.KAGGLE_USER ?? '';
  private readonly kaggleKey = process.env.KAGGLE_KEY ?? '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly etl: EtlService,
  ) {}

  async getNutritions(): Promise<Nutrition[]> {
    const nutritions = await this.prisma.nutrition.findMany();
    if (nutritions.length === 0) {
      throw new NotFoundException('NO_NUTRITIONS_FOUND');
    }
    return nutritions;
  }

  async getNutritionById(id: string): Promise<Nutrition> {
    const nutrition = await this.prisma.nutrition.findUnique({
      where: { id: parseInt(id) },
    });
    if (!nutrition) {
      throw new Error(`Nutrition with id ${id} not found`);
    }
    return nutrition;
  }

  private mapRowToNutrition(row: KaggleNutritionRow): {
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
    picture_url: string | null;
  } {
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return undefined;
    };

    const name = toString(
      get('Food_Item', 'name', 'Name', 'food_name', 'Food Name', 'food'),
    );
    const category = toString(
      get('Category', 'category', 'food_group', 'Food Group', 'type'),
    );
    const calories_kcal = toFloat(
      get(
        'Calories (kcal)',
        'calories',
        'Calories',
        'calories_kcal',
        'Energy (kcal)',
      ),
    );
    const protein_g = toFloat(
      get('Protein (g)', 'protein_g', 'protein', 'Protein'),
    );
    const carbohydrates_g = toFloat(
      get(
        'Carbohydrates (g)',
        'carbohydrates_g',
        'Carbs (g)',
        'Total Carbohydrate (g)',
      ),
    );
    const fat_g = toFloat(get('Fat (g)', 'fat_g', 'Total Fat (g)'));
    const fiber_g = toFloat(get('Fiber (g)', 'fiber_g', 'Dietary Fiber (g)'));
    const sugar_g = toFloat(
      get('Sugars (g)', 'sugar_g', 'Sugar (g)', 'Total Sugars (g)'),
    );
    const sodium_mg = toFloat(get('Sodium (mg)', 'sodium_mg', 'sodium'));
    const cholesterol_mg = toFloat(
      get('Cholesterol (mg)', 'cholesterol_mg', 'cholesterol'),
    );
    const meal_type_name = toString(
      get('Meal_Type', 'meal_type_name', 'Meal Type'),
    );
    const water_intake_ml = toFloat(
      get('Water_Intake (ml)', 'water_intake_ml', 'Water_Intake (mL)'),
    );
    const pictureUrl = get('picture_url', 'image', 'Image', 'photo') as
      | string
      | undefined;
    const picture_url =
      pictureUrl && toString(pictureUrl).length > 0
        ? toString(pictureUrl)
        : null;

    return {
      name,
      category,
      calories_kcal,
      protein_g,
      carbohydrates_g,
      fat_g,
      fiber_g,
      sugar_g,
      sodium_mg,
      cholesterol_mg,
      meal_type_name: meal_type_name || 'Other',
      water_intake_ml,
      picture_url,
    };
  }

  private getCsvContentFromResponse(response: {
    data: Buffer | ArrayBuffer | string;
  }): string {
    const raw = response.data;
    const buffer =
      typeof raw === 'string'
        ? Buffer.from(raw, 'utf-8')
        : Buffer.isBuffer(raw)
          ? raw
          : Buffer.from(raw);
    const isZip =
      buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;

    if (isZip) {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const csvEntry =
        entries.find(
          (e) =>
            e.entryName === KAGGLE_FILE_NAME ||
            e.entryName.endsWith('/' + KAGGLE_FILE_NAME),
        ) ?? entries.find((e) => e.entryName.endsWith('.csv'));
      if (csvEntry && !csvEntry?.isDirectory) {
        return zip.readAsText(csvEntry);
      }
      throw new Error(
        `Aucun fichier .csv trouvé dans le ZIP Kaggle. Fichiers: ${entries.map((e) => e.entryName).join(', ')}`,
      );
    }
    return typeof raw === 'string' ? raw : raw.toString('utf-8');
  }

  async runImportPipeline(): Promise<number> {
    if (!this.kaggleUser || !this.kaggleKey) {
      const msg =
        "KAGGLE_USER et KAGGLE_KEY doivent être définis pour l'import.";
      this.logger.error(msg);
      this.etl.emit('nutrition', 'ERROR', msg);
      throw new Error(
        "Variables d'environnement KAGGLE_USER et KAGGLE_KEY requises.",
      );
    }

    const startMsg = '--- Début pipeline ETL Nutrition (Kaggle) ---';
    this.logger.log(startMsg);
    this.etl.emit('nutrition', 'INFO', startMsg);

    const auth = Buffer.from(`${this.kaggleUser}:${this.kaggleKey}`).toString(
      'base64',
    );

    const response = await lastValueFrom(
      this.httpService.get(KAGGLE_DATASET_DOWNLOAD_URL, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/octet-stream',
        },
        responseType: 'arraybuffer',
      }),
    );

    const csvText = this.getCsvContentFromResponse({
      data: response.data as Buffer,
    });

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const rows = (parsed.data ?? []) as unknown as KaggleNutritionRow[];

    if (rows.length === 0) {
      this.logger.warn('Aucune ligne dans le CSV Kaggle.');
      this.etl.emit('nutrition', 'WARNING', 'Aucune ligne dans le CSV Kaggle.');
      return 0;
    }

    const items = rows
      .map((row) => ({ raw: row, cleaned: this.mapRowToNutrition(row) }))
      .filter((x) => x.cleaned.name.length > 0);
    if (items.length === 0) {
      const warnMsg = `Aucune ligne avec un nom valide après mapping. Vérifiez les colonnes (ex. name/category). Premier enregistrement brut: ${JSON.stringify(rows[0])}`;
      this.logger.warn(warnMsg);
      this.etl.emit('nutrition', 'WARNING', warnMsg);
      return 0;
    }
    const linesMsg = `${items.length}/${rows.length} lignes à enregistrer en staging.`;
    this.logger.log(linesMsg);
    this.etl.emit('nutrition', 'INFO', linesMsg);

    const BATCH_SIZE = 50;
    const TRANSLATION_SEP = ' ||| ';
    let successCount = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const stringsToTranslate = batch.map(
        (d) =>
          `${d.cleaned.name}${TRANSLATION_SEP}${d.cleaned.category}${TRANSLATION_SEP}${d.cleaned.meal_type_name}`,
      );

      let translatedBatch: string[] = [];
      try {
        const res = await translate(stringsToTranslate, { to: 'fr' });
        translatedBatch = Array.isArray(res)
          ? (res as { text: string }[]).map((r) => r.text)
          : [(res as { text: string }).text];
      } catch (err) {
        const warnMsg = `Traduction batch ${i / BATCH_SIZE + 1} échouée, conservation du texte original: ${(err as Error).message}`;
        this.logger.warn(warnMsg);
        this.etl.emit('nutrition', 'WARNING', warnMsg);
        translatedBatch = stringsToTranslate;
      }

      const stagingPromises = batch.map(async (item, j) => {
        const data = item.cleaned;
        const parts = (translatedBatch[j] ?? stringsToTranslate[j]).split(
          TRANSLATION_SEP,
        );
        const name = (parts[0] ?? data.name).trim();
        const category = (parts[1] ?? data.category).trim();
        const meal_type_name = (parts[2] ?? data.meal_type_name).trim();
        const cleanedData = {
          name,
          category,
          calories_kcal: data.calories_kcal,
          protein_g: data.protein_g,
          carbohydrates_g: data.carbohydrates_g,
          fat_g: data.fat_g,
          fiber_g: data.fiber_g,
          sugar_g: data.sugar_g,
          sodium_mg: data.sodium_mg,
          cholesterol_mg: data.cholesterol_mg,
          meal_type_name: meal_type_name || 'Autre',
          water_intake_ml: data.water_intake_ml,
          picture_url: data.picture_url,
        };

        const anomalies: Prisma.JsonArray = [];

        const existing = await this.prisma.nutritionStaging.findFirst({
          where: {
            AND: [
              {
                cleaned_data: {
                  path: '$.name',
                  equals: cleanedData.name,
                },
              },
              {
                cleaned_data: {
                  path: '$.category',
                  equals: cleanedData.category,
                },
              },
            ],
          },
        });

        if (existing) {
          await this.prisma.nutritionStaging.update({
            where: { id: existing.id },
            data: {
              cleaned_data: cleanedData,
              anomalies,
              status:
                existing.status === 'REJECTED' || existing.status === 'APPROVED'
                  ? 'PENDING'
                  : existing.status,
            },
          });
        } else {
          await this.prisma.nutritionStaging.create({
            data: {
              cleaned_data: cleanedData,
              anomalies,
              status: 'PENDING',
            },
          });
        }
      });

      await Promise.all(stagingPromises);
      successCount += batch.length;

      const stagingMsg = `Staging : ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} enregistrements.`;
      this.logger.log(stagingMsg);
      this.etl.emit('nutrition', 'INFO', stagingMsg);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    const endMsg = `--- Fin pipeline ETL Nutrition : ${successCount} enregistrements en staging (PENDING). ---`;
    this.logger.log(endMsg);
    this.etl.emit('nutrition', 'SUCCESS', endMsg);
    return successCount;
  }
}
