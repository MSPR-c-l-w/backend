import { Exercise } from '@prisma/client';

export interface IExerciceService {
    findByFilters(arg0: { muscle: string | undefined; level: string | undefined; equipment: string | undefined; category: string | undefined; }): unknown;
    getExercices(): Promise<Exercise[]>;
    getExerciceById(id: number): Promise<Exercise>;
    runImportPipeline(): Promise<number>; 
}

export interface IExerciceController {
    getExercices(): Promise<Exercise[]>;
    getExerciceById(id: number): Promise<Exercise>;
    triggerImport(): Promise<{ message: string; count: number }>;
}