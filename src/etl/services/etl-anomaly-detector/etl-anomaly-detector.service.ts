import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PipelineId } from '../etl/etl.service';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

interface AnomalyPayload {
  field: string;
  code: string;
  message: string;
  severity: Severity;
  detected_value?: unknown;
}

@Injectable()
export class EtlAnomalyDetectorService {
  detectForPipeline(
    pipeline: PipelineId,
    cleanedData: Record<string, unknown>,
  ): Prisma.JsonArray {
    if (pipeline === 'nutrition') {
      return this.detectNutritionAnomalies(cleanedData);
    }
    if (pipeline === 'exercise') {
      return this.detectExerciseAnomalies(cleanedData);
    }
    return this.detectHealthProfileAnomalies(cleanedData);
  }

  private detectNutritionAnomalies(
    data: Record<string, unknown>,
  ): Prisma.JsonArray {
    const anomalies: AnomalyPayload[] = [];
    this.assertRequiredString(data, anomalies, 'name', 'NAME_REQUIRED');
    this.assertRequiredString(data, anomalies, 'category', 'CATEGORY_REQUIRED');
    this.assertNonNegativeNumber(
      data,
      anomalies,
      'calories_kcal',
      'CALORIES_INVALID',
    );
    this.assertNonNegativeNumber(
      data,
      anomalies,
      'protein_g',
      'PROTEIN_INVALID',
    );
    this.assertNonNegativeNumber(
      data,
      anomalies,
      'carbohydrates_g',
      'CARBOHYDRATES_INVALID',
    );
    this.assertNonNegativeNumber(data, anomalies, 'fat_g', 'FAT_INVALID');
    this.assertNonNegativeNumber(data, anomalies, 'fiber_g', 'FIBER_INVALID');
    this.assertNonNegativeNumber(data, anomalies, 'sugar_g', 'SUGAR_INVALID');
    this.assertNonNegativeNumber(
      data,
      anomalies,
      'sodium_mg',
      'SODIUM_INVALID',
    );
    this.assertNonNegativeNumber(
      data,
      anomalies,
      'cholesterol_mg',
      'CHOLESTEROL_INVALID',
    );
    this.assertNonNegativeNumber(
      data,
      anomalies,
      'water_intake_ml',
      'WATER_INTAKE_INVALID',
    );
    return anomalies as unknown as Prisma.JsonArray;
  }

  private detectExerciseAnomalies(
    data: Record<string, unknown>,
  ): Prisma.JsonArray {
    const anomalies: AnomalyPayload[] = [];
    this.assertRequiredString(data, anomalies, 'name', 'NAME_REQUIRED');
    this.assertStringArray(
      data,
      anomalies,
      'instructions',
      'INSTRUCTIONS_INVALID',
      true,
    );
    this.assertStringArray(
      data,
      anomalies,
      'primary_muscles',
      'PRIMARY_MUSCLES_INVALID',
      false,
    );
    this.assertStringArray(
      data,
      anomalies,
      'secondary_muscles',
      'SECONDARY_MUSCLES_INVALID',
      false,
    );
    this.assertStringArray(
      data,
      anomalies,
      'image_urls',
      'IMAGE_URLS_INVALID',
      false,
    );
    return anomalies as unknown as Prisma.JsonArray;
  }

  private detectHealthProfileAnomalies(
    data: Record<string, unknown>,
  ): Prisma.JsonArray {
    const anomalies: AnomalyPayload[] = [];
    this.assertPositiveInt(data, anomalies, 'user_id', 'USER_ID_INVALID');
    this.assertNumberInRange(
      data,
      anomalies,
      'bmi',
      'BMI_OUT_OF_RANGE',
      10,
      50,
    );
    this.assertNumberInRange(
      data,
      anomalies,
      'weight',
      'WEIGHT_OUT_OF_RANGE',
      20,
      400,
    );
    this.assertNumberInRange(
      data,
      anomalies,
      'daily_calories_target',
      'DAILY_CALORIES_OUT_OF_RANGE',
      500,
      10000,
    );
    return anomalies as unknown as Prisma.JsonArray;
  }

  private assertRequiredString(
    data: Record<string, unknown>,
    anomalies: AnomalyPayload[],
    field: string,
    code: string,
  ): void {
    const value = data[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      anomalies.push({
        field,
        code,
        message: `Le champ ${field} est obligatoire et doit être une chaîne non vide.`,
        severity: 'HIGH',
        detected_value: value ?? null,
      });
    }
  }

  private assertNonNegativeNumber(
    data: Record<string, unknown>,
    anomalies: AnomalyPayload[],
    field: string,
    code: string,
  ): void {
    const value = data[field];
    if (!this.isFiniteNumber(value) || Number(value) < 0) {
      anomalies.push({
        field,
        code,
        message: `Le champ ${field} doit être un nombre positif ou nul.`,
        severity: 'MEDIUM',
        detected_value: value ?? null,
      });
    }
  }

  private assertStringArray(
    data: Record<string, unknown>,
    anomalies: AnomalyPayload[],
    field: string,
    code: string,
    nonEmpty: boolean,
  ): void {
    const value = data[field];
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== 'string')
    ) {
      anomalies.push({
        field,
        code,
        message: `Le champ ${field} doit être un tableau de chaînes.`,
        severity: 'HIGH',
        detected_value: value ?? null,
      });
      return;
    }

    if (nonEmpty && value.length === 0) {
      anomalies.push({
        field,
        code: `${code}_EMPTY`,
        message: `Le champ ${field} ne peut pas être vide.`,
        severity: 'MEDIUM',
        detected_value: value,
      });
    }
  }

  private assertPositiveInt(
    data: Record<string, unknown>,
    anomalies: AnomalyPayload[],
    field: string,
    code: string,
  ): void {
    const value = data[field];
    if (
      !this.isFiniteNumber(value) ||
      !Number.isInteger(Number(value)) ||
      Number(value) <= 0
    ) {
      anomalies.push({
        field,
        code,
        message: `Le champ ${field} doit être un entier strictement positif.`,
        severity: 'HIGH',
        detected_value: value ?? null,
      });
    }
  }

  private assertNumberInRange(
    data: Record<string, unknown>,
    anomalies: AnomalyPayload[],
    field: string,
    code: string,
    min: number,
    max: number,
  ): void {
    const value = data[field];
    if (value == null || value === '') {
      return;
    }
    if (
      !this.isFiniteNumber(value) ||
      Number(value) < min ||
      Number(value) > max
    ) {
      anomalies.push({
        field,
        code,
        message: `Le champ ${field} doit être compris entre ${min} et ${max}.`,
        severity: 'MEDIUM',
        detected_value: value,
      });
    }
  }

  private isFiniteNumber(value: unknown): boolean {
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return Number.isFinite(Number(value));
    }
    return false;
  }
}
