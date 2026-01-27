import { Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseLog } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

@Injectable()
export class Exercise_LogService {
  constructor(private readonly prisma: PrismaService) {}

  async getExerciseLogs(): Promise<ExerciseLog[]> {
    const logs = await this.prisma.exerciseLog.findMany();
    if (logs.length === 0) {
      throw new NotFoundException('NO_EXERCISE_LOGS_FOUND');
    }
    return logs;
  }

  async getExerciseLogById(id: string): Promise<ExerciseLog> {
    const log = await this.prisma.exerciseLog.findUnique({
      where: { id: parseInt(id) },
    });
    if (!log) {
      throw new NotFoundException(`Exercise log with id ${id} not found`);
    }
    return log;
  }
}
