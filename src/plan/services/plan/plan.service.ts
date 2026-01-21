import { Injectable, NotFoundException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { IPlanService } from 'src/plan/interfaces/plan.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

@Injectable()
export class PlanService implements IPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans(): Promise<Plan[]> {
    const plans = await this.prisma.plan.findMany();
    if (plans.length === 0) {
      throw new NotFoundException('NO_PLANS_FOUND');
    }
    return plans;
  }

  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: parseInt(id) },
    });
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }
}

