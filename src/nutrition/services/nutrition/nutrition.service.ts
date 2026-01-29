import { Injectable, NotFoundException } from '@nestjs/common';
import { Nutrition } from '@prisma/client';
import { INutritionService } from 'src/nutrition/interfaces/nutrition/nutrition.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

@Injectable()
export class NutritionService implements INutritionService {
  constructor(private readonly prisma: PrismaService) {}

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
}
