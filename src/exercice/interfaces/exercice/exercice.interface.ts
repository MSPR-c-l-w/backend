import { Exercise } from '@prisma/client';
import type { GetExercisesFilterDto } from 'src/exercice/dtos/et-exercises-filter.dto';
import type { UpdateExerciceDto } from 'src/exercice/dtos/update-exercice.dto';

export interface IExerciceService {
  findByFilters(filters: GetExercisesFilterDto): Promise<Exercise[]>;
  getExercices(page?: number, limit?: number): Promise<Exercise[]>;
  getExerciceById(id: number): Promise<Exercise>;
  updateExercice(id: number, exercice: UpdateExerciceDto): Promise<Exercise>;
  deleteExercice(id: number): Promise<Exercise>;
  runImportPipeline(): Promise<number>;
}

export interface IExerciceController {
  getExercices(page?: number, limit?: number): Promise<Exercise[]>;
  getExerciceById(id: number): Promise<Exercise>;
  updateExercice(id: number, exercice: UpdateExerciceDto): Promise<Exercise>;
  deleteExercice(id: number): Promise<Exercise>;
  triggerImport(): Promise<{ message: string; count: number }>;
}
