import { Injectable } from '@nestjs/common';
import { Exercise, Prisma } from '@prisma/client';
import { IExerciceService } from 'src/exercice/interfaces/exercice/exercice.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

@Injectable()
export class ExerciceService implements IExerciceService {

    constructor(private readonly prisma: PrismaService) { }
    
    async getExercices(): Promise<Exercise[]> {
        const exercices = await this.prisma.exercise.findMany();
        if (exercices.length === 0) {
            throw new Error('No exercices found');
        }
        return exercices;
    }

    async getExerciceById(id: number): Promise<Exercise> {
        const exercice = await this.prisma.exercise.findUnique({
            where: { id }
        });
        if (!exercice) {
            throw new Error(`Exercice with id ${id} not found`);
        }
        return exercice;    
    }

}
