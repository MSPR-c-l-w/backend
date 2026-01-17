import { Exercise } from '@prisma/client';

export interface IExerciceController {
    getExercices(): Promise<Exercise[]>;
    getExerciceById(id: number): Promise<Exercise>;
}
export interface IExerciceService {
    getExercices(): Promise<Exercise[]>;
    getExerciceById(id: number): Promise<Exercise>;
}